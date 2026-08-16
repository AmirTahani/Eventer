# 3. System & Module Architecture

## 3.1 High-level shape

```
Telegram Bot (thin) ─┐
                      ├─► NestJS API (business logic, authZ) ─┬─► PostgreSQL (source of truth)
Web Dashboard (thin) ─┘                                        └─► Redis (jobs, cache, rate-limit)
                                                                          │
                                                                Background Workers
                                                          (BullMQ: payment expiry, waitlist
                                                           expiry, notifications, reminders,
                                                           event status recompute)
```

**Rule:** Telegram handlers and Dashboard controllers only (1) parse input, (2) call an
application service, (3) render the result. All branching business logic lives in
`Backend/apps/api/src/modules/*/*.service.ts`.

## 3.2 Module boundaries

| Module | Owns | Depends on |
|---|---|---|
| `auth` | Telegram Login verification, session/JWT issuance, role guards | `users` |
| `users` | User CRUD, approval/suspend, role assignment | — |
| `vouchers` | Invitation creation/acceptance, vouched_by history | `users`, `notifications` |
| `dj` | DJ profile CRUD (shared pool) | `files` |
| `locations` | Location CRUD (shared pool), no privacy logic itself | — |
| `events` | Event CRUD, lifecycle state machine, event access grants | `locations`, `dj`, `users` |
| `event-access` | Visibility rule evaluation ("can user X see event Y") | `events`, `vouchers` |
| `registrations` | Registration state machine, guests, capacity reservation, capacity-override requests | `events`, `event-access`, `payments` |
| `waitlist` | Waitlist entries, offer/claim/expire | `registrations` |
| `payments` | Payment entity, provider-agnostic interface, webhook intake | `registrations` |
| `tickets` | Ticket issuance, QR token signing | `registrations` |
| `checkin` | QR validation, check-in recording | `tickets` |
| `notifications` | Notification creation + delivery orchestration (channel-agnostic) | — |
| `telegram` | Bot framework glue: menus, callbacks, deep links, i18n rendering | calls into all app services above |
| `dashboard-api` | Web-specific composite endpoints (aggregations for dashboard views) | calls into all app services above |
| `audit` | Append-only audit log writer + query API | — |
| `files` | Upload handling, S3/R2 signed URLs | — |
| `admin` | Cross-cutting admin-only endpoints (impersonation-safe overrides) | everything |

This directly answers your §35: Telegram and Dashboard are **peers**, both calling the
same `registrations.service.ts::createRegistration()` etc. Neither owns business logic.

## 3.3 Representative API design

Auth: every request carries a JWT (issued after Telegram Login verification for the
dashboard, or a bot-service-account token for Telegram-originated calls — see §3.6).
`source` (`TELEGRAM | WEB | ADMIN_API`) is always recorded for audit purposes.

| Method | Route | Purpose | AuthZ | Notes |
|---|---|---|---|---|
| POST | `/auth/telegram-login` | Verify Telegram Login widget payload, issue session | public | validates hash per Telegram spec |
| GET | `/users/me` | Current user profile + roles | authenticated | |
| POST | `/vouchers/invitations` | Create invitation | VOUCHER or ADMIN | |
| POST | `/vouchers/invitations/:id/accept` | Accept invite (bot-driven) | the invited Telegram user | idempotent |
| GET | `/events` | List events visible to requester | authenticated | **filters at query level**, never post-filters a full list |
| GET | `/events/:id` | Event detail | authenticated | location omitted unless authorized (see §3.7) |
| POST | `/events` | Create event | ORGANIZER/ADMIN | |
| PATCH | `/events/:id` | Edit event | owner ORGANIZER/ADMIN | enforces D13 capacity-reduction rule |
| PUT | `/events/:id/pricing-tiers` | Replace the event's tier list | owner ORGANIZER/ADMIN | validates strictly-increasing `starts_at`, all before event `start_at`; blocks edits to already-started tiers with existing registrations unless `force=true` (Admin only) — see D16 |
| POST | `/events/:id/publish` | DRAFT → OPEN | owner/ADMIN | |
| POST | `/events/:id/release-location` | one-way | owner/ADMIN | idempotent (no-op if already released) |
| POST | `/events/:id/cancel` | any → CANCELLED | owner/ADMIN | |
| POST | `/events/:id/registrations` | Submit registration | authenticated + visibility-checked | body: `{peopleCount, guests[]}`; atomic capacity check |
| POST | `/registrations/:id/approve` | approval flow | owner ORGANIZER/ADMIN | |
| POST | `/registrations/:id/reject` | approval flow | owner ORGANIZER/ADMIN | |
| POST | `/registrations/:id/cancel` | user or organizer cancel | owner of registration, or event owner/ADMIN | |
| POST | `/registrations/:id/capacity-requests` | "request more tickets" | registration owner | |
| POST | `/capacity-requests/:id/approve` | grant extra seats | event owner/ADMIN | |
| POST | `/payments/intents` | Create payment intent for a registration | registration owner | provider-agnostic |
| POST | `/payments/webhook/:provider` | Provider callback | signature-verified, not user-authenticated | idempotent on `provider_transaction_id` |
| GET | `/tickets/mine` | List my tickets | authenticated | |
| POST | `/checkin/scan` | Validate + check in a QR token | ORGANIZER (event owner)/ADMIN | rate-limited |
| POST | `/checkin/manual` | Manual check-in by attendee search | ORGANIZER/ADMIN | |
| GET | `/events/:id/waitlist` | Waitlist for an event | owner/ADMIN | |
| GET | `/audit-logs` | Query audit logs | ADMIN (ORGANIZER scoped to own events) | |

Every list endpoint is **cursor-paginated**, filters by requester's authorization at the
SQL `WHERE` clause level (never fetch-then-filter in application code — that's an IDOR
trap).

## 3.4 Telegram architecture

- **Library:** `grammY` (modern, well-typed, first-class TS support, better session
  middleware model than node-telegram-bot-api) over `Telegraf` — recommend grammY.
- **Identity:** `telegram_user_id` (BigInt, Telegram's numeric ID) is the unique key on
  `User`. `telegram_username` is a nullable, mutable display field only — never used in a
  `WHERE` clause for identity.
- **State:** Multi-step flows (guest entry, registration wizard) use grammY's session
  middleware backed by **Redis**, keyed by `telegram_user_id`, TTL'd (e.g. 30 min of
  inactivity clears an in-progress wizard) — this is UI-flow state only, never
  business-authoritative state.
- **Deep links:** `t.me/<bot>?start=<payload>` for invitation acceptance
  (`invite_<token>`) and event sharing (`event_<eventId>`), decoded in the `/start`
  handler and dispatched to the right service call.
- **Long polling vs webhook:** recommend **webhook** in production (lower latency, no
  polling worker needed, scales with your API pods behind a load balancer), long polling
  only for local dev.

## 3.5 Background jobs & Redis

**BullMQ**, backed by Redis, for everything time-based:

| Job | Trigger | Idempotency key |
|---|---|---|
| `payment-expiry` | scheduled at `PENDING_PAYMENT` creation, delay=30min | `registration_id` — job checks current DB status before acting; no-ops if already CONFIRMED/CANCELLED |
| `waitlist-offer-expiry` | scheduled at OFFERED, delay=1h | `waitlist_entry_id`, same guard pattern |
| `event-status-recompute` | on every capacity-affecting write (in-process, not queued) + a periodic sweep job every 5 min as a safety net for `endDateTime` → COMPLETED transitions | `event_id` |
| `event-reminders` | scheduled per event at publish/edit time based on configured offsets | `event_id + offset` |
| `notification-dispatch` | enqueued by any domain service via `notifications.enqueue()` | `notification_id` |

Why not pure Postgres `pg_cron` or pure NestJS `@Cron`: `@Cron` alone doesn't survive
multi-instance deployment without a leader-election problem, and doesn't give you retry
/backoff/dead-letter semantics. `pg_cron` is fine for the *sweep* safety-net job but not
for precise per-row delayed jobs at scale. **Recommendation: BullMQ for all delayed/
retryable work, with the DB row's own status/`expires_at` field as the real source of
truth** — the job is just "wake up and re-check the DB," so even if a job is lost/delayed,
a periodic reconciliation sweep (cheap `WHERE status = 'PENDING_PAYMENT' AND
expires_at < now()`) guarantees correctness. This gives you at-least-once delivery with
idempotent, DB-verified execution — the standard robust pattern.

Redis is also used for: rate limiting (Telegram callback spam, check-in scan spam),
distributed lock for the waitlist-offer scan (`SET NX` lock around "find next candidate"),
and light caching of rarely-changing reads (DJ profiles, location metadata) — **never**
for capacity or registration status, which must always hit Postgres.

## 3.6 Authentication & authorization

- **Dashboard:** Telegram Login Widget. Flow: user clicks "Log in with Telegram" → widget
  returns a signed payload (`id, first_name, username, photo_url, auth_date, hash`) →
  backend **recomputes the HMAC-SHA-256 hash using the bot token as the secret** per
  Telegram's documented algorithm and rejects any mismatch → checks `auth_date` is recent
  (reject if older than ~60s, prevents replay) → looks up/creates `User` by
  `telegram_user_id` → issues a short-lived JWT + refresh token (httpOnly cookie).
  No separate username/password system — there's no architectural reason to add one, and
  it would create a second identity to keep in sync.
- **Telegram bot requests:** the bot process itself authenticates to the API as a trusted
  service account, but every call carries the **acting `telegram_user_id`** as a required
  field, and the API re-derives that user's roles from the DB on every request (never
  trusts a role claim baked into a long-lived token) — this closes the "role escalation
  via stale token" hole.
- **Authorization:** NestJS Guards + a `PoliciesService` per module (CASL-style ability
  checks: `can(user, 'checkIn', event)`), not scattered `if (user.role === ...)` checks.
  Ownership checks (`event.organizerId === user.id`) happen at the guard/service layer,
  never trusted from client input.

## 3.7 Location privacy enforcement (belt & suspenders)

1. **Query level:** the Prisma query for event detail only `select`s the location
   relation when a pre-computed boolean (`canSeeLocation`) is true; it's never fetched and
   then stripped in a serializer (stripping-after-fetch is how leaks happen when someone
   adds a new endpoint later and forgets to strip).
2. **Service level:** `canSeeLocation = event.locationReleasedAt !== null &&
   registrationsService.isConfirmedOrGuestOf(userId, eventId)`, computed fresh per
   request — never cached per-user.
3. **No client-side hiding.** The Telegram card renderer and the dashboard both simply
   render "Hidden until released" when the API returns `location: null` — they have no
   ability to un-hide it because the field genuinely isn't in the payload.
4. Applies identically to `GET /events/:id`, any list endpoint, and any future export/
   admin endpoint — enforced by a single reusable `LocationVisibilityPolicy`, not
   duplicated per-controller.

## 3.8 Notification architecture

```
Domain event (e.g. registration.confirmed)
        ↓
notifications.enqueue({recipientUserId, type, entityRef, channel: TELEGRAM})
        ↓
Notification row created (status=PENDING)
        ↓
BullMQ job → TelegramDeliveryWorker
        ↓
Notification row updated (SENT | FAILED, providerMessageId, attempts++)
```

- `Notification` table tracks recipient, type, entity type/id, channel, status, attempts,
  error, provider_message_id, created_at, sent_at — exactly matching your §40 spec.
- Idempotency: `enqueue()` takes a caller-supplied `dedupeKey` (e.g.
  `registration:<id>:confirmed`) with a unique constraint, so a retried service call
  can't double-notify.
- Channel is an enum today (`TELEGRAM`) but the worker is resolved via a `ChannelSender`
  interface so `EMAIL`/`SMS`/`PUSH` senders can be added later without touching the
  `notifications` module's core logic.
- "User blocked the bot" / delivery failure is caught, stored on the row, and does **not**
  retry indefinitely — cap at e.g. 3 attempts with backoff, then mark `FAILED` and surface
  it to the Organizer dashboard for critical notification types (location release,
  cancellation).

## 3.9 Files/media

**Cloudflare R2** (S3-compatible, no egress fees, cheapest for a media-heavy Telegram
bot use case where images get re-fetched a lot). Upload flow: client requests a
pre-signed PUT URL from `/files/upload-url`, uploads directly to R2, then confirms with
the backend which stores the resulting object key on `Event.coverImageKey` /
`DJ.photoKey`. Backend never proxies raw binary traffic. Serve via R2's public bucket URL
or a CDN in front of it; validate content-type and size server-side before issuing the
signed URL.

## 3.10 i18n

- **Backend:** `nestjs-i18n`, translation files per locale
  (`i18n/en/notifications.json`, `i18n/fa/notifications.json`, etc.), keyed by
  message ID — the backend resolves the *current user's* stored `locale` preference and
  renders notification text server-side before enqueueing (so delivery workers don't need
  locale logic).
- **Telegram bot UI (menus/buttons):** same translation files, resolved by grammY
  middleware from `ctx.session.locale` (defaulting to `User.locale`).
- **Dashboard:** `next-intl` (pairs naturally with the Next.js recommendation below),
  same key namespaces mirrored as JSON, so translators/you maintain one vocabulary across
  both surfaces conceptually even though the runtime libraries differ.
- Farsi needs **RTL layout** on the dashboard. With MUI: `theme.direction = 'rtl'` +
  an Emotion cache configured with `stylis-plugin-rtl`, switched alongside the locale —
  full setup and the theme itself are in `07-design-system.md`.

## 3.11 Security checklist (mitigations)

| Risk | Mitigation |
|---|---|
| Telegram identity spoofing | HMAC hash verification on Login widget payload; bot-side updates trust `ctx.from.id` only from Telegram's own webhook signature (verify `X-Telegram-Bot-Api-Secret-Token` header) |
| Role escalation | Roles re-derived from DB per-request, never from client-supplied token claims beyond `userId` |
| IDOR (registrations, tickets, events) | Every fetch-by-id service method takes the requester and applies an ownership/visibility filter *in the query*, not after |
| Location leakage | §3.7, defense in depth at query+service layer |
| QR forgery/replay | QR encodes an opaque signed token (`JWT` or HMAC'd random ID) referencing `ticket_id`; backend validates signature + `ticket.status`; re-scan is idempotent-safe, not a security hole, just informational |
| Payment webhook spoofing | Verify provider signature header before processing; reject unsigned/invalid |
| Payment webhook duplication | Unique constraint on `(provider, provider_transaction_id)`; handler is a pure upsert, safe to receive N times |
| Callback query tampering | Callback data encodes only opaque IDs + a short signed nonce, never trust raw numeric IDs without re-checking ownership server-side |
| Rate limiting / bot abuse | Redis-backed rate limiter (per `telegram_user_id`) on registration, check-in-scan, and invitation-creation endpoints |
| Invitation abuse | Even without hard limits in MVP, log invite counts per voucher so Admin can spot abuse; D2 keeps the door open for a hard cap later |
| File upload risk | Content-type allowlist, size limit, no execution surface (object storage only), signed URLs expire quickly |
| XSS (dashboard) | React auto-escapes by default; sanitize any rich text (event description) with a strict allowlist if you support markdown |
| SQL injection | Prisma parameterizes all queries; raw SQL only for the capacity-locking transaction (see `04-database.md`), written and reviewed carefully |
| Secrets | `.env` locally, a real secrets manager (Doppler/Vault/cloud provider secrets) in staging/prod, never committed |
