# 2. Lifecycles & State Machines

## 2.1 Event lifecycle

```
DRAFT → OPEN → FULL → CLOSED → COMPLETED
          ↓       ↓
       (any of the above) → CANCELLED
```

States:

- **DRAFT** — created, not visible to any attendee. Editable freely.
- **OPEN** — published, visible to authorized users, registrations accepted.
- **FULL** — capacity (confirmed + pending) reached. Still visible; registration button
  becomes "Join Waitlist". Automatically reverts to OPEN if a spot frees up
  (cancellation/expiry).
- **CLOSED** — Organizer manually stops new registrations (e.g. day-of cutoff) without
  cancelling. Distinct from FULL: CLOSED is a deliberate organizer action, FULL is
  capacity-driven and auto-reversible. CLOSED is *not* auto-reversible.
- **CANCELLED** — terminal. Reachable from any non-terminal state.
- **COMPLETED** — terminal, auto-set by a scheduled job once `endDateTime` passes and
  status was OPEN/FULL/CLOSED (not DRAFT, not CANCELLED).

Transitions are computed by a domain service (`EventStateMachine`), never by ad-hoc
`prisma.event.update({status: ...})` calls scattered around the codebase — every write
path (registration created, registration cancelled, payment expired, organizer action)
calls `recomputeEventStatus(eventId)` inside the same transaction.

## 2.2 Registration lifecycle

```
                 ┌──────────────────┐
                 │   (approval OFF)  │
                 └─────────┬─────────┘
                            ▼
        (submitted) → PENDING_PAYMENT → CONFIRMED
                            │   ▲
                            │   └─(waitlist slot claimed)
                            ▼
                 CANCELLED / EXPIRED

                 ┌──────────────────┐
                 │   (approval ON)   │
                 └─────────┬─────────┘
                            ▼
        (submitted) → PENDING_APPROVAL → REJECTED
                            │
                            ▼ (organizer approves)
                       APPROVED → PENDING_PAYMENT → CONFIRMED
                            │            │
                            ▼            ▼
                       CANCELLED       EXPIRED

        (submitted) → WAITLISTED → (offered) → PENDING_PAYMENT → CONFIRMED
                            │           │
                            ▼           ▼ (1hr no response)
                       CANCELLED    WAITLISTED (next person offered)
```

Note: there is no separate `DRAFT`/`in-progress` Registration row while a user is still
mid-wizard in the Telegram bot (picking guest count, entering guest names) — that's
**ephemeral Redis session state** (§3.4), not a database row. A Registration row is only
created once the user actually submits, landing directly in `PENDING_APPROVAL`,
`PENDING_PAYMENT`, or `WAITLISTED` depending on `approval_required` and capacity at that
moment. This keeps the state machine's row count meaningful (every row is a real
submitted intent) and avoids having to garbage-collect abandoned "draft" registrations.

**`CHECKED_IN` is deliberately not a Registration status** (see §2.5) — a `CONFIRMED`
registration can have 0, some, or all of its people checked in simultaneously, which a
single top-level status enum cannot represent. Check-in state lives entirely on the
per-person `Ticket.status` field.

Final state set: `{CONFIRMED→CHECKED_IN sub-state, REJECTED, CANCELLED, EXPIRED}` are
terminal-ish; `CHECKED_IN` is tracked per-person (see §2.5), not as the Registration's own
status — a Registration stays `CONFIRMED` at the header level even once people are
checked in.

**Full status enum:**
`PENDING_APPROVAL, REJECTED, APPROVED, PENDING_PAYMENT, CONFIRMED, WAITLISTED, CANCELLED, EXPIRED`

**Valid transition table:**

| From | To | Trigger |
|---|---|---|
| — | PENDING_APPROVAL | User submits request (approval required) |
| — | PENDING_PAYMENT | User submits request (approval not required), capacity available |
| — | WAITLISTED | User submits request, capacity not available |
| PENDING_APPROVAL | APPROVED | Organizer approves |
| PENDING_APPROVAL | REJECTED | Organizer rejects |
| PENDING_APPROVAL | CANCELLED | User cancels before decision |
| APPROVED | PENDING_PAYMENT | System (auto), capacity reserved |
| APPROVED | WAITLISTED | System, capacity no longer available at approval time |
| PENDING_PAYMENT | CONFIRMED | Payment succeeds |
| PENDING_PAYMENT | EXPIRED | 30-min timer elapses |
| PENDING_PAYMENT | CANCELLED | User cancels before paying |
| WAITLISTED | PENDING_PAYMENT | Waitlist slot offered **and claimed** |
| WAITLISTED | CANCELLED | User leaves waitlist |
| CONFIRMED | CANCELLED | User or Organizer cancels post-payment (refund flow, Phase 2) |
| EXPIRED | *(new registration)* | User must submit a new request; the row itself never reopens |

Every transition is a single DB transaction that also calls capacity
reservation/release and writes an `AuditLog` row. See `04-database.md §Concurrency`.

## 2.3 Payment lifecycle

`Payment` is a separate table linked 1:1 to a Registration in `PENDING_PAYMENT`/`CONFIRMED`.

```
CREATED → PROCESSING → SUCCEEDED → (REFUND_REQUESTED → REFUNDED)   [refund = Phase 2]
    │           │
    ▼           ▼
 CANCELLED   FAILED
```

- `CREATED`: payment intent created, registration enters `PENDING_PAYMENT`, 30-min timer starts.
- `PROCESSING`: provider webhook says "processing" (some providers have this state).
- `SUCCEEDED`: registration → `CONFIRMED`, ticket generated.
- `FAILED`: registration stays `PENDING_PAYMENT` until timer expiry (user may retry within window) — or immediately reverts to allow retry, see Payment-1 below.
- `CANCELLED`: user aborted checkout.

> **Open decision (Payment-1):** On `FAILED`, do we let the user retry immediately within
> the same 30-min window, or force them to re-register? Recommendation: **allow retry**,
> capacity stays reserved, only the `Payment` row gets superseded by a new attempt
> (`Payment.attempt_number`). Simpler for users, and capacity was already reserved anyway.

Payment fields: `id, registration_id, amount, currency, provider, provider_transaction_id
(unique, nullable until provider assigns it), status, attempt_number, created_at, paid_at,
failed_at, refund_status, refund_amount, raw_provider_payload (jsonb, for debugging)`.

**Pricing tier resolution (D16).** `amount` on the Payment (and `price_snapshot` on the
Registration, see §2.2) is resolved **once, at the moment the registration is created**
(or approved, for approval-required events — see below), by running the active-tier
query from `04-database.md §PricingTier` against `now()`. It is never re-evaluated later:
a user mid-checkout does not get bumped to a higher tier if the window rolls over while
they're on the payment screen, and an Organizer editing future tiers can't retroactively
change what someone already registered at.

> **Open decision (Payment-2):** for **approval-required** events, is the price locked at
> **request time** or at **approval time**? Request time is friendlier to the attendee
> (protects them from a tier bump while waiting on the organizer) but means an organizer
> who approves days later has honored a stale price. Recommendation: **lock at request
> time** — it's the user's registration intent, and organizers control their own approval
> latency, so it's on them if they sit on a request through a price change. Flag if you'd
> rather lock at approval time instead.

## 2.4 Waitlist lifecycle

```
JOINED → OFFERED → CLAIMED (→ PENDING_PAYMENT registration flow)
   │         │
   ▼         ▼ (1hr no claim)
 LEFT     EXPIRED → next entry auto-OFFERED
```

- Ordering: `WaitlistEntry.position` derived from `created_at ASC` (or explicit integer
  column maintained via transaction — recommended, since `created_at` ties are possible
  under load; use a sequence-backed `position` column).
- When a spot frees (cancellation, expiry, capacity increase), a job picks the lowest
  `position` entry with status `JOINED`, sets it to `OFFERED`, sets `offer_expires_at =
  now() + 1h`, sends notification, and creates a **shadow capacity reservation** so a
  concurrent new registration can't steal the spot during the offer window.
- If unclaimed by `offer_expires_at`, a job sets it `EXPIRED`, releases the shadow
  reservation, and offers the next entry. This must be **idempotent** and safe to run
  concurrently (row-level lock on the WaitlistEntry, `SELECT ... FOR UPDATE SKIP LOCKED`
  pattern when scanning for the next candidate).

## 2.5 Ticket / check-in lifecycle

Tickets are generated per-**person** (primary attendee and each guest each get their own
ticket/QR), not per-registration, to satisfy "each guest independently checkable."

```
ISSUED → CHECKED_IN
   │
   ▼
 VOID  (registration/event cancelled, or guest removed)
```

- `Ticket.status`: `ISSUED | CHECKED_IN | VOID`.
- Re-scanning a `CHECKED_IN` ticket does not error — it returns "Already checked in at
  HH:MM by <organizer>" (idempotent read, not a 409 that blocks the UI).
- Check-in writes a `CheckIn` row (append-only history) even though `Ticket.status` is
  also updated for fast lookups — this gives you the audit trail without needing to derive
  "who/when" from logs.

## 2.6 Location privacy lifecycle

```
HIDDEN → RELEASED (permanent, one-way)
```

- `Event.location_released_at` (nullable timestamp) is the single source of truth. `NULL`
  = hidden. Once set, never cleared (enforced at the service layer: the update DTO simply
  has no field that can unset it, and a DB trigger/check constraint can additionally
  forbid `UPDATE` from non-null back to null as defense in depth).
- Editing the location **after** release does not change `location_released_at` — it stays
  released, content updates, and a `LocationChanged` notification fires to everyone
  currently `CONFIRMED` (+ their guests) at the moment of the edit. People who confirm
  *after* the edit simply receive the current location as part of their normal
  confirmation notification — no special-casing needed.
- Authorization for reading location is **never** "is `location_released_at` set" alone —
  it's `location_released_at IS NOT NULL AND requester_is_confirmed_or_guest_of_confirmed`.
  See `03-architecture.md §Location Privacy Enforcement`.

## 2.7 Voucher / invitation lifecycle

```
CREATED → SENT → ACCEPTED → (User row created/promoted, vouched_by set permanently)
    │        │
    ▼        ▼
 REVOKED   EXPIRED (optional TTL, Phase 2)
```

MVP: no TTL/expiry on invitations (your spec doesn't require it) — `CREATED` and `SENT`
can be collapsed into one `PENDING` status. `Invitation.vouched_by_user_id` is copied onto
`User.vouched_by_user_id` on acceptance and never changes afterward, satisfying the
"permanent relationship for audit" requirement even if the Invitation row is later purged.
