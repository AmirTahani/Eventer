# 11. Edge Case Matrix

Every edge case from the original spec's §49, resolved concretely against the design in
files 01–10. Where the resolution depends on a decision (D1–D16, Payment-1/2), it's
cross-referenced rather than re-argued.

| # | Edge case | Resolution |
|---|---|---|
| 1 | Event becomes full while user is registering | Capacity check happens inside the locking transaction at submit time (`04-database.md §4.3`); if lost, response is `409 InsufficientCapacity` or auto-`WAITLISTED` per `10-api-reference.md §10.4` |
| 2 | Two users claim the final spots simultaneously | `SELECT ... FOR UPDATE` on the Event row serializes both attempts; whichever transaction commits first wins, the second re-checks remaining capacity and fails/waitlists cleanly |
| 3 | User clicks a button twice (Telegram double-tap) | Partial unique index (D6) rejects the second insert; service layer catches the constraint violation and returns the existing registration's state instead of a raw DB error |
| 4 | Payment webhook arrives twice | Unique `(provider, providerTransactionId)` constraint makes the handler a safe upsert; second delivery is a no-op that still returns `200` |
| 5 | Payment succeeds after the 30-min reservation expired | The expiry job is guarded by re-checking DB status before acting (`03-architecture.md §3.5`) — but a payment success arriving *after* expiry already fired is a genuine race. Resolution: the webhook handler checks registration status; if `EXPIRED`, do **not** silently confirm — instead mark the payment `SUCCEEDED` but flag the registration for manual reconciliation (capacity may already be given away) and notify the Organizer + attempt automatic capacity re-reservation if a spot still happens to be free. This is the one place true full automation isn't safe; document it as a known manual-intervention path in Phase 1 rather than a silent auto-fix |
| 6 | User is removed/suspended after registering | Suspension doesn't retroactively cancel existing `CONFIRMED` registrations (they already paid); it does block them from making *new* ones and from bot/dashboard access going forward — Admin can manually cancel the specific registration if warranted |
| 7 | Organizer loses the Organizer role | Their existing events are untouched (ownership stays intact for history/audit), but they immediately lose the ability to edit/manage them; Admin can reassign `organizerId` if needed (a `PATCH /events/:id` field restricted to Admin) |
| 8 | Organizer edits event after registrations exist | Allowed for most fields; capacity floor enforced (D13), price locked per-registration via snapshot (D12), mandatory notifications for price/date changes (D11/D14) |
| 9 | Organizer decreases capacity | Rejected below `confirmed + pending` count unless Admin `force=true` (D13) |
| 10 | Organizer increases capacity | Always allowed; may trigger `FULL → OPEN` event-status recompute and/or waitlist promotion if the new capacity now covers waitlisted people |
| 11 | Event price changes | New registrations use new price; existing ones keep their `priceSnapshot` (D12) |
| 12 | Event date/time changes | Allowed pre-completion; always notifies all non-terminal registrants (D14) |
| 13 | Event is cancelled | State machine → `CANCELLED` (terminal); all tickets `VOID`; all non-terminal registrations notified; refund handling stubbed for Phase 2 (§2.6/§17) |
| 14 | Location changed after release | Content updates, `locationReleasedAt` never clears (one-way, §2.6); confirmed attendees + guests notified of the change |
| 15 | Location changed before release | Simple edit, no notification needed (nobody had access yet) |
| 16 | User cancels after approval, before payment | Allowed — `APPROVED`/`PENDING_PAYMENT` → `CANCELLED`, capacity released |
| 17 | User cancels after payment | Not self-service in MVP per §5/§26 — routed to "contact organizer," real cancellation+refund is Phase 2 |
| 18 | Guest changes (added/removed pre-payment) | Registration can be edited while `PENDING_APPROVAL`/`PENDING_PAYMENT` — treat as replacing the `RegistrationGuest` rows within the same transaction that re-validates `peopleCount` against capacity; **post-payment guest changes are Phase 2** (ticket regeneration/void-and-reissue implications need their own design) |
| 19 | Guest has a Telegram account | Linked via `RegistrationGuest.linkedUserId` (D7); doesn't require them to be independently vouched |
| 20 | Guest doesn't have a Telegram account | Manual name entry, `telegramUserId`/`telegramUsername` left null (§12) |
| 21 | Guest is already registered separately | Allowed, flagged for the Organizer as a possible duplicate/no-show risk, not blocked (D8) |
| 22 | User tries to register twice for the same event | Blocked by the partial unique index (D6), not just frontend validation |
| 23 | Waitlist user doesn't respond within 1 hour | `WaitlistEntry.status → EXPIRED`, shadow reservation released, next-in-line auto-`OFFERED` (§2.4) |
| 24 | Multiple waitlist users become eligible at once (e.g. capacity jumps by 5) | Offer job processes one `SELECT ... FOR UPDATE SKIP LOCKED` candidate at a time in a loop until the newly freed capacity is exhausted or the waitlist is empty — never offers more people than there is room for, even if several entries request different `peopleCount` sizes (a large waitlisted group might be skipped over in favor of smaller ones if it wouldn't fit — recommend documenting this as "waitlist offers are size-aware, not strictly FIFO when a large request can't fit yet," flag if you want strict FIFO with holds instead) |
| 25 | Organizer manually adds an attendee | Separate "invited guest" flow reusing registration/ticket infra (§23); no payment required, consumes capacity like any other confirmed entry |
| 26 | Organizer "exceeds capacity" intentionally | Only via the capacity-override mechanism (D9) or an explicit Admin-forced capacity increase (D13) — never a silent bypass |
| 27 | Admin overrides capacity | Admin can force-increase `Event.capacity` past what an Organizer would be allowed, and/or force-approve a `CapacityOverrideRequest` beyond what remaining capacity would normally allow — both actions audit-logged |
| 28 | User is suspended | See #6 |
| 29 | User loses access to a private event (visibility rule changed after they registered) | Existing registration is **not retroactively revoked** — access control gates the ability to *see/register*, not to keep an already-granted registration; document this explicitly so it's not assumed to auto-cancel people |
| 30 | Event visibility changes after registrations exist | Same as #29 — existing registrants keep their registration regardless of new visibility rules; only *new* registration attempts are affected |
| 31 | Ticket scanned twice | Idempotent "already checked in" response, not an error (§27/§28, `10-api-reference.md §10.6`) |
| 32 | Guest ticket scanned twice | Same as #31 — each guest's `Ticket` row is independent |
| 33 | QR code is forged | Signature verification fails → `404`/`invalid` response, no ticket state exposed; rate-limited to slow brute-force attempts against the token space |
| 34 | Telegram username changes | No impact — `telegramUserId` is the identity key everywhere (§31); `telegramUsername` is just a denormalized display field, refreshed opportunistically on next bot interaction |
| 35 | Telegram account has no username | `telegramUsername` stays null; all UI/notification flows already treat it as optional |
| 36 | User blocks the bot | Telegram delivery fails; `Notification.status → FAILED` after retry cap, surfaced to the Organizer dashboard for critical notification types (§3.8) |
| 37 | Telegram message fails (transient) | BullMQ retry/backoff (up to the cap in §3.8); DB row is the source of truth so a failed *notification* never means a failed *state transition* |
| 38 | Notification fails permanently | Marked `FAILED`, visible in an Organizer/Admin-facing "failed notifications" view (recommend adding to the `Notifications` dashboard section) |
| 39 | Redis unavailable | Jobs can't be scheduled/dequeued, but core registration/payment/capacity logic doesn't depend on Redis for correctness — `expires_at` columns + the periodic Postgres sweep job (§3.5) mean the system self-heals once Redis returns, at the cost of added latency on time-based transitions during the outage |
| 40 | Telegram API unavailable | Bot-originated writes queue/fail gracefully (retry via BullMQ); web dashboard remains fully functional since it doesn't depend on live Telegram API calls for anything except the initial login widget verification |
| 41 | Payment provider unavailable | Payment intent creation fails with a clear `503`-style error surfaced to the user; existing `PENDING_PAYMENT` registrations keep their reservation until the normal 30-min expiry regardless |
| 42 | Database transaction fails mid-operation | Postgres transaction semantics mean a failed transaction rolls back atomically — no partial capacity reservation, no orphaned registration row; the API returns a `500` and the client is expected to retry the whole operation (registration creation is safe to retry given the idempotent duplicate-protection index) |
