# 1. Executive Summary & Product Requirements

## 1.1 What we're building

A **private, invite-gated event management platform**. Telegram is the primary attendee
surface; a web dashboard is the primary Organizer/Admin surface. Both are thin clients
over one NestJS backend which owns all business logic and is backed by PostgreSQL
(source of truth) and Redis (jobs/cache only).

Core guarantees the architecture must uphold everywhere, not just in the UI:

- **Nothing is visible by default.** Events, locations, and attendee lists are hidden
  unless the backend explicitly authorizes the requester.
- **Capacity is authoritative and race-safe**, including pending payments.
- **Location is a one-way gate**: released → visible to confirmed people only, forever;
  never re-hidden.
- **Every privileged action is audited.**
- **Telegram ID, not username, is identity.**

## 1.2 Roles

| Role | Assigned by | Can create events | Notes |
|---|---|---|---|
| **Admin** | Bootstrapped / other Admins | Yes (implicitly, or via Organizer grant — see decision D1) | Superset of all permissions. Also *is* a Voucher. |
| **Organizer** | Admin | Yes | Scoped to their own events only, except Admin override. |
| **Voucher** | Admin (grant), or implicitly = Admin | No | Can invite Users. Not a "role" stored the same way as Organizer — see D2. |
| **User** | Self, via accepted invitation | No | Default role for everyone once vouched-in. |

> **D1 — Are Admin and Organizer the same underlying capability?**
> Recommendation: **No.** Admin is a distinct role that *implies* Organizer-level
> capability on every event, rather than Admin literally being "an Organizer." This
> avoids weird ownership semantics (an Admin-created event shouldn't need an
> `organizerId` pointing at a pseudo-organizer record). Authorization checks are:
> `isAdmin() OR isOwnerOrganizer(event)`.

> **D2 — Is "Voucher" a role or a capability flag?**
> Your spec says "Voucher" is a role, but also that Admin "is also" a Voucher, and that
> vouching is really about *who is allowed to invite*. Modeling it as a 4th equal role
> creates a combinatorial mess (can a Voucher also be an Organizer? almost certainly yes
> in practice). Recommendation: **model roles as a set, not a hierarchy.**
> A `User` has zero or more of: `{ADMIN, ORGANIZER, VOUCHER}`. Plain "User" isn't a role
> flag at all — it's just the absence of elevated roles. Admin implicitly has voucher
> capability (checked in code, not by inserting a VOUCHER row), but you can also
> explicitly grant VOUCHER to any approved user later without touching this design.
> This directly gives you "invitation limits per voucher later" and "some Users can
> become Vouchers without becoming Organizers" for free.

## 1.3 Permission matrix

| Action | Admin | Organizer (own event) | Organizer (other's event) | Voucher | User |
|---|---|---|---|---|---|
| Manage users (approve/reject/suspend) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Grant/revoke roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| Invite users (vouch) | ✅ | ❌* | ❌* | ✅ | ❌ |
| Create event | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit / cancel event | ✅ | ✅ | ❌ | ❌ | ❌ |
| Release location | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve/reject registration | ✅ | ✅ | ❌ | ❌ | ❌ |
| View attendee list | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manually add attendee/guest | ✅ | ✅ | ❌ | ❌ | ❌ |
| Override capacity | ✅ | ⚠️ approve-only, see D9 | ❌ | ❌ | ❌ |
| Check-in | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create/manage DJ | ✅ | ✅ (any organizer, shared pool) | ✅ | ❌ | ❌ |
| View payments | ✅ | ✅ (own events only) | ❌ | ❌ | own only |
| View audit logs | ✅ | ⚠️ scoped to own events (recommended) | ❌ | ❌ | ❌ |
| Register/pay for event | ✅ | ✅ | ✅ | ✅ | ✅ |

\* An Organizer is *not* automatically a Voucher. If you want your organizers to also be
able to invite people, grant them the VOUCHER role explicitly (see D2). This is
deliberately decoupled.

## 1.4 Key architectural decisions & assumptions (please review)

These are the places your spec was ambiguous or where two requirements interacted in a
non-obvious way. I picked the option I think is right; flag anything you want changed.

- **D1 / D2** — see above (Admin vs Organizer; Voucher as capability not hierarchy).
- **D3 — Event ↔ Organizer ownership.** One `organizerId` (a User with ORGANIZER role) owns
  each event. Co-organizing/team events is explicitly **Phase 2** (would need an
  `EventCollaborator` join table) — flag if you need it in MVP.
- **D4 — "Selected users" / "selected vouchers" visibility rules.** These are stored as
  rows in an `EventAccessGrant` table (`event_id`, `grant_type`, `subject_id`), not as
  JSON blobs on the event, so they're queryable, auditable, and indexable. See §9 in
  `03-architecture.md`.
- **D5 — Sharing an event.** Per your spec, sharing must never itself grant access.
  Recommendation: sharing generates a **deep link** (`/start?ref=eventShare_<eventId>`)
  that, when opened, runs the normal visibility check for that recipient. If they're not
  authorized, they see "You don't have access to this event" — never event details.
- **D6 — Duplicate registration definition.** "A user cannot register twice for the same
  event" — but only *one* registration per event can be in a non-terminal state
  (`PENDING_APPROVAL`, `PENDING_PAYMENT`, `APPROVED`, `CONFIRMED`, `WAITLISTED`).
  Enforced via a **partial unique index** on `(event_id, primary_user_id)` filtered to
  non-terminal statuses (Postgres supports partial unique indexes; a plain unique
  constraint would incorrectly block re-registration after a legitimate cancellation).
- **D7 — Guests who are also platform Users.** A guest with a Telegram ID is optionally
  linked to a `User` row (`RegistrationGuest.linked_user_id`, nullable). This does **not**
  create a second registration for them — they don't need vouched access themselves,
  since they're riding on the primary registrant's authorization. This is intentional:
  the spec implies guests bypass the normal access-control gate, which is correct for a
  private-event product (the primary attendee vouches for their +N in the moment).
- **D8 — "Guest is already registered separately" edge case.** If a linked guest is
  *also* independently registered (or later tries to register) for the same event, that's
  allowed — they're two different capacity-consuming entries — but the dashboard should
  visually flag it for the Organizer as a possible duplicate/no-show risk. Not blocked.
- **D9 — "Request more tickets" approval vs organizer capacity override.** These are the
  same underlying mechanism: a `CapacityOverrideRequest` row. Organizer approving it either
  (a) increases event capacity, or (b) grants that specific requester extra seats beyond
  the current remaining count. Recommendation: **(b)**, scoped to the requester, so one
  aggressive request doesn't silently expand everyone else's availability too.
- **D10 — Payment expiry vs Waitlist claim expiry** use the same background-job pattern
  (BullMQ delayed jobs + a DB `expires_at` column as the source of truth — see
  `03-architecture.md §Redis/Jobs`).
- **D11 — Notification opt-out on edits.** "Notify attendees about changes? Y/N" only
  suppresses *cosmetic* changes (description, DJs, dress code). Cancellation, location
  change, price change, and date change are always notified regardless of the toggle —
  these affect money/attendance and withholding them is a support/trust risk.
- **D12 — Price change after registration.** Recommendation: **price is locked at the
  amount shown at registration time** (`Registration.price_snapshot`), never retroactively
  changed for existing registrations. New registrations use the current event price. This
  is standard practice and avoids re-billing chaos.
- **D13 — Capacity reduced below confirmed count.** Not allowed by the API — reject the
  edit with a clear error (`newCapacity >= confirmedAndPendingCount`). Admin can override
  by explicit `force=true` flag, which is audit-logged.
- **D14 — Event date/time change.** Allowed anytime pre-completion; always triggers a
  mandatory notification to all non-terminal registrants regardless of D11's toggle.
- **D15 — Multiple Admins.** Supported from day one at the data-model level (role is a
  set membership, not a singleton flag) even though you're the only Admin initially.
- **D16 — Tiered/time-based pricing.** Organizer can define multiple sequential price
  tiers on an event (e.g. "Early bird $50" → "$75" → "Last day $100"), evaluated
  automatically by time, not manually switched. Design:
  - Tiers are **time-windowed and contiguous**, not "first N tickets"-based (your example
    is calendar-based: "last week," "last day"). If you also want quantity-based tiers
    (e.g. "first 50 tickets at $50") later, that's a straightforward Phase 2 extension
    (add an optional `max_quantity` to a tier) — flag if you want it in MVP instead.
  - Each tier has a `starts_at`. Its effective end is the **next tier's `starts_at`**, or
    the event's `start_at` for the last tier. Organizer only sets start times; the system
    derives the windows, which avoids the "gap between tiers" or "overlapping tiers" bugs
    that come from letting Organizers set both ends independently.
  - `Event.price` becomes the **base/default price**, used only if the Organizer defines
    no tiers at all (keeps simple single-price events simple — no forced tier UI for
    every event).
  - **Interaction with D12 (price lock at registration):** unchanged — whichever price
    was active at the moment of registration is snapshotted onto
    `Registration.price_snapshot` and never moves again for that registration, even if
    tier boundaries are edited afterward. This means tier edits are safe to make anytime
    without needing to touch historical registrations.
  - Organizer can edit/add/remove tiers on a DRAFT or OPEN event; **editing a tier whose
    window has already started and already has registrations against it is blocked** by
    default (existing snapshots make it harmless, but changing it retroactively-looking
    is confusing for support purposes) — Admin can force it. New tiers can be added ahead
    of their start time freely.
  - Display: event card always shows the **currently active price**, plus (recommended,
    not required) a small "increases to $X on <date>" hint so attendees have an incentive
    to register early — confirm if you want that hint or prefer to keep it silent.

If any of D1–D16 conflicts with what you actually want, tell me and I'll update this file
and the schema before we start Milestone 1.
