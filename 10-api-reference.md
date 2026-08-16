# 10. API Reference — Detailed Request/Response Contracts

This expands the endpoint table in `03-architecture.md §3.3` into concrete request/
response shapes so an AI tool or engineer can implement each route without guessing
field names. Types reference the Prisma schema in `09-prisma-schema.prisma`.

Conventions used throughout:
- All authenticated routes require `Authorization: Bearer <jwt>`.
- All list endpoints are cursor-paginated: `?cursor=<opaque>&limit=20` (default 20, max 100), response includes `nextCursor: string | null`.
- All error responses: `{ "statusCode": number, "error": string, "message": string }` (standard Nest exception filter shape).
- Money fields are strings (`"49.99"`), not floats, to avoid float precision bugs — parsed as `Decimal` server-side.
- Timestamps are ISO 8601 UTC (`"2026-08-20T18:00:00.000Z"`).

## 10.1 Auth

### `POST /auth/telegram-login`
Public. Verifies the Telegram Login Widget payload and issues a session.

Request:
```json
{
  "id": 123456789,
  "first_name": "Amir",
  "last_name": "Rezai",
  "username": "amirr",
  "photo_url": "https://t.me/i/userpic/...",
  "auth_date": 1755331200,
  "hash": "e1a2b3c4..."
}
```

Response `200`:
```json
{
  "accessToken": "eyJhbGciOi...",
  "user": {
    "id": "8f2c...",
    "telegramUserId": "123456789",
    "firstName": "Amir",
    "status": "APPROVED",
    "roles": ["ORGANIZER"]
  }
}
```
Refresh token is set as an httpOnly cookie, not returned in the body.

Errors: `401` invalid hash, `401` `auth_date` older than 60s (replay), `403` user status is `PENDING`/`REJECTED`/`SUSPENDED` (message explains which).

### `GET /users/me`
Auth required.

Response `200`:
```json
{
  "id": "8f2c...",
  "telegramUserId": "123456789",
  "telegramUsername": "amirr",
  "firstName": "Amir",
  "lastName": "Rezai",
  "locale": "en",
  "status": "APPROVED",
  "roles": ["ORGANIZER"],
  "vouchedBy": { "id": "3a1f...", "firstName": "Sara" }
}
```

## 10.2 Vouchers / Invitations

### `POST /vouchers/invitations`
Requires `VOUCHER` or `ADMIN` role.

Request:
```json
{ "invitedTelegramUsername": "newperson" }
```
(`invitedTelegramUsername` is optional/best-effort; if omitted, response includes a deep link the voucher can send manually.)

Response `201`:
```json
{
  "id": "inv_...",
  "token": "a1b2c3d4e5",
  "deepLink": "https://t.me/EventBot?start=invite_a1b2c3d4e5",
  "status": "PENDING",
  "createdAt": "2026-08-16T10:00:00.000Z"
}
```

### `POST /vouchers/invitations/:token/accept`
Called by the bot on behalf of the invited Telegram user (bot service account auth,
`telegramUserId` of the acceptor passed in body).

Request:
```json
{ "telegramUserId": "987654321", "telegramUsername": "newperson", "firstName": "Newperson" }
```

Response `200`:
```json
{ "userId": "9c1d...", "status": "APPROVED" }
```
Errors: `409` if invitation already `ACCEPTED` or `REVOKED` — idempotent on genuine
retries (same acceptor + already-accepted → returns `200` with the existing user, not an
error, per §24-style duplicate-safety principle applied here too).

## 10.3 Events

### `GET /events`
Auth required. **Visibility-filtered at the query level** — never returns events the
requester can't see.

Query params: `status?`, `from?`, `to?`, `cursor?`, `limit?`

Response `200`:
```json
{
  "items": [
    {
      "id": "evt_...",
      "name": "Rooftop Summer Night",
      "coverImageUrl": "https://cdn.../cover.jpg",
      "startAt": "2026-09-05T19:00:00.000Z",
      "endAt": "2026-09-06T02:00:00.000Z",
      "status": "OPEN",
      "currentPrice": { "amount": "75.00", "currency": "USD" },
      "capacity": 300,
      "remaining": 42,
      "locationReleased": false,
      "djs": [{ "id": "dj_...", "name": "DJ Nova" }]
    }
  ],
  "nextCursor": "eyJpZCI6ImV2dF8uLi4ifQ=="
}
```
Note: `location` field is **entirely absent** from list responses, always — location
detail is only ever returned from `GET /events/:id` and only when authorized (§10.3.1).

### `GET /events/:id`
Auth required, visibility-checked (404, not 403, if unauthorized — see security note
below).

Response `200` (attendee without location access):
```json
{
  "id": "evt_...",
  "name": "Rooftop Summer Night",
  "description": "...",
  "coverImageUrl": "https://cdn.../cover.jpg",
  "category": "Rooftop",
  "dressCode": "Smart casual",
  "ageRestriction": true,
  "minAge": 21,
  "rules": "...",
  "startAt": "2026-09-05T19:00:00.000Z",
  "endAt": "2026-09-06T02:00:00.000Z",
  "capacity": 300,
  "remaining": 42,
  "maxPeoplePerRegistration": 6,
  "approvalRequired": false,
  "status": "OPEN",
  "currentPrice": { "amount": "75.00", "currency": "USD" },
  "priceIncreaseHint": { "nextAmount": "100.00", "startsAt": "2026-09-01T00:00:00.000Z" },
  "djs": [{ "id": "dj_...", "name": "DJ Nova", "genre": "House", "instagram": "@djnova" }],
  "location": null,
  "locationReleased": false
}
```

Response `200` (confirmed attendee, location released):
```json
{
  "...": "...same fields as above...",
  "location": {
    "venueName": "The Grand Rooftop",
    "address": "123 Skyline Ave, ...",
    "googleMapsUrl": "https://maps.google.com/...",
    "latitude": 40.712,
    "longitude": -74.006
  },
  "locationReleased": true
}
```

**Security note (§3.7 enforcement in practice):** if the requester is not authorized to
see the event at all (private visibility rule fails), return `404 Not Found`, **not**
`403 Forbidden` — this avoids confirming the event's existence to someone who shouldn't
know about it at all. If the requester *can* see the event but hasn't paid/confirmed,
return `200` with `location: null`, not an error — the event itself is visible, only the
location is gated.

### `POST /events`
Requires `ORGANIZER` or `ADMIN`.

Request:
```json
{
  "name": "Rooftop Summer Night",
  "description": "...",
  "category": "Rooftop",
  "dressCode": "Smart casual",
  "ageRestriction": true,
  "minAge": 21,
  "rules": "No outside drinks.",
  "djIds": ["dj_abc", "dj_def"],
  "locationId": null,
  "startAt": "2026-09-05T19:00:00.000Z",
  "endAt": "2026-09-06T02:00:00.000Z",
  "capacity": 300,
  "price": "75.00",
  "currency": "USD",
  "maxPeoplePerRegistration": 6,
  "approvalRequired": false,
  "visibilityMode": "ALL_APPROVED",
  "pricingTiers": [
    { "name": "Early Bird", "price": "50.00", "startsAt": "2026-08-01T00:00:00.000Z" },
    { "name": "Standard", "price": "75.00", "startsAt": "2026-08-25T00:00:00.000Z" },
    { "name": "Last Day", "price": "100.00", "startsAt": "2026-09-04T00:00:00.000Z" }
  ]
}
```
Validation: `startAt < endAt`; if `pricingTiers` provided, `startsAt` values strictly
increasing and all `< startAt` (event start); `capacity >= 1`; `maxPeoplePerRegistration
>= 1`; if `visibilityMode !== 'ALL_APPROVED'`, a separate call to manage
`EventAccessGrant`s is required (or accept an optional `accessGrants` array here — your
call, both are reasonable; documented here as a follow-up call to keep event creation
payload smaller).

Response `201`: full event object, `status: "DRAFT"`.

### `PATCH /events/:id`
Owner `ORGANIZER` or `ADMIN`. Same body shape as create, all fields optional (partial
update).

Validation specific to edits:
- `capacity`: rejected with `422` if `newCapacity < currentConfirmedAndPendingCount`,
  unless `force: true` is passed **and** requester is `ADMIN` (D13).
- Price/date changes always trigger mandatory notifications regardless of
  `notifyOnEditDefault` (D11/D14).
- `pricingTiers` replace via `PUT /events/:id/pricing-tiers` (separate endpoint, below),
  not through this route.

### `PUT /events/:id/pricing-tiers`
Owner `ORGANIZER` or `ADMIN`.

Request:
```json
{
  "tiers": [
    { "name": "Early Bird", "price": "50.00", "startsAt": "2026-08-01T00:00:00.000Z" },
    { "name": "Standard", "price": "75.00", "startsAt": "2026-08-25T00:00:00.000Z" }
  ],
  "force": false
}
```
`422` if any tier whose window has already started has existing registrations against it
and `force` is not `true` (Admin-only override, D16).

### `POST /events/:id/publish`
Owner/Admin. No body. `422` if event isn't currently `DRAFT`.

### `POST /events/:id/release-location`
Owner/Admin. No body. **Idempotent**: if already released, returns `200` with the
current (already-released) state rather than erroring — release is a one-way action, so
calling it twice is a safe no-op, not a client bug to punish.

Response `200`:
```json
{ "eventId": "evt_...", "locationReleasedAt": "2026-08-16T14:00:00.000Z" }
```

### `POST /events/:id/cancel`
Owner/Admin.

Request:
```json
{ "reason": "Venue unavailable" }
```
Response `200`: event with `status: "CANCELLED"`. Triggers mandatory notification to all
non-terminal registrants; all their tickets set to `VOID`.

## 10.4 Registrations

### `POST /events/:id/registrations`
Auth required, visibility-checked.

Request:
```json
{
  "peopleCount": 3,
  "guests": [
    { "telegramUserId": "555111222" },
    { "firstName": "Jane", "lastName": "Doe" }
  ]
}
```
(`guests` array length is `peopleCount - 1` — the requester is always the primary
attendee; each entry is either `{telegramUserId}` for a Telegram-resolved guest or
`{firstName, lastName}` for a manually entered one, per §12.)

Response `201` (capacity available, no approval required):
```json
{
  "id": "reg_...",
  "eventId": "evt_...",
  "status": "PENDING_PAYMENT",
  "peopleCount": 3,
  "priceSnapshot": "75.00",
  "currency": "USD",
  "totalAmount": "225.00",
  "expiresAt": "2026-08-16T10:30:00.000Z"
}
```

Response `201` (capacity unavailable):
```json
{
  "id": "reg_...",
  "status": "WAITLISTED",
  "peopleCount": 3,
  "waitlistPosition": 4
}
```
Alternative when the requester asked for more than remaining capacity, per §13's
"Request More Tickets" flow — this is returned as a `409` with a structured body so the
client can render the specific UI, not a generic error:
```json
{
  "statusCode": 409,
  "error": "InsufficientCapacity",
  "message": "Only 5 spots are currently available.",
  "remaining": 5,
  "requested": 10
}
```
Client then either resubmits with `peopleCount: 5`, or calls the capacity-override
endpoint below.

Errors: `409 DuplicateRegistration` if the partial unique index rejects a second active
registration for this user+event (D6).

### `POST /registrations/:id/capacity-requests`
Registration owner only, and only while their own registration is in a state where
`peopleCount` was capped by capacity (implementation detail: client passes the desired
extra count).

Request:
```json
{ "requestedExtraPeople": 5 }
```
Response `201`: `{ "id": "cor_...", "status": "PENDING" }`. Triggers organizer
notification ("Attendee request for more tickets").

### `POST /capacity-requests/:id/approve`
Event owner/Admin.

Response `200`: `{ "id": "cor_...", "status": "APPROVED" }` — grants the extra seats
scoped to that requester's registration only (D9), inside the same locking transaction
pattern as normal registration.

### `POST /registrations/:id/approve` / `POST /registrations/:id/reject`
Event owner/Admin, only valid while status is `PENDING_APPROVAL`.

Reject request:
```json
{ "reason": "Event is at capacity for this guest list size" }
```
Response `200`: registration with new status (`APPROVED` → auto-transitions to
`PENDING_PAYMENT` if capacity is still available at approval time, or `WAITLISTED` if
not — see `02-lifecycles.md §2.2`).

### `POST /registrations/:id/cancel`
Registration owner (pre-payment only, per §5) or event owner/Admin (any time, with the
understanding that post-payment cancellation is a Phase 2 refund-flow concern per
§27/§18).

Response `200`: registration with `status: "CANCELLED"`, capacity reservation released.

## 10.5 Payments

### `POST /payments/intents`
Registration owner.

Request:
```json
{ "registrationId": "reg_..." }
```
Response `201` (shape depends on eventual provider — this is the provider-agnostic
envelope):
```json
{
  "paymentId": "pay_...",
  "provider": "mock",
  "checkoutUrl": "https://provider.example/checkout/abc123",
  "amount": "225.00",
  "currency": "USD",
  "expiresAt": "2026-08-16T10:30:00.000Z"
}
```

### `POST /payments/webhook/:provider`
Not user-authenticated — **provider-signature-authenticated** instead (verify a header
like `X-Provider-Signature` against a shared secret/HMAC per the eventual provider's
spec). Idempotent upsert keyed on `(provider, providerTransactionId)`.

Request (example shape, provider-specific in reality):
```json
{
  "transactionId": "txn_abc123",
  "status": "succeeded",
  "amount": "225.00",
  "currency": "USD",
  "metadata": { "paymentId": "pay_..." }
}
```
Response `200` always (even on a duplicate/already-processed event — webhook senders
retry on non-2xx, so always ack once verified+parsed, and let internal idempotency handle
duplicates silently): `{ "received": true }`.

## 10.6 Tickets & Check-in

### `GET /tickets/mine`
Auth required.

Response `200`:
```json
{
  "items": [
    {
      "id": "tkt_...",
      "eventId": "evt_...",
      "eventName": "Rooftop Summer Night",
      "holderType": "PRIMARY",
      "status": "ISSUED",
      "qrImageUrl": "https://cdn.../qr/tkt_....png"
    }
  ]
}
```
`qrToken` itself is never returned in this list response body in plaintext if you want
extra defense-in-depth — the QR **image** (server-rendered from the signed token) is
returned instead, so the raw token isn't sitting in a JSON payload that could be logged.

### `POST /checkin/scan`
Event owner/Admin.

Request:
```json
{ "eventId": "evt_...", "qrToken": "eyJhbGciOi..." }
```
Response `200` (valid, first scan):
```json
{
  "result": "CHECKED_IN",
  "ticket": {
    "id": "tkt_...",
    "holderType": "PRIMARY",
    "holderName": "Amir Rezai",
    "checkedInAt": "2026-09-05T19:12:00.000Z",
    "checkedInBy": "Organizer Name"
  }
}
```
Response `200` (already checked in — **not an error**, per §27/§28):
```json
{
  "result": "ALREADY_CHECKED_IN",
  "ticket": {
    "id": "tkt_...",
    "holderName": "Amir Rezai",
    "checkedInAt": "2026-09-05T18:47:00.000Z",
    "checkedInBy": "Other Organizer"
  }
}
```
Response `404`: token doesn't resolve to a valid ticket for this event (forged/wrong
event). Response `409`: ticket is `VOID` (event/registration cancelled).

### `POST /checkin/manual`
Event owner/Admin.

Request:
```json
{ "eventId": "evt_...", "ticketId": "tkt_..." }
```
Same response shape as `/checkin/scan`, `method: "MANUAL"` recorded on the `CheckIn` row.

## 10.7 Audit logs

### `GET /audit-logs`
Admin (unrestricted) or Organizer (auto-scoped server-side to entities belonging to
their own events — never trust a client-supplied filter as the sole restriction).

Query: `entityType?`, `entityId?`, `actorUserId?`, `from?`, `to?`, `cursor?`

Response `200`:
```json
{
  "items": [
    {
      "id": "log_...",
      "actor": { "id": "8f2c...", "firstName": "Amir" },
      "action": "event.location_released",
      "entityType": "Event",
      "entityId": "evt_...",
      "beforeState": { "locationReleasedAt": null },
      "afterState": { "locationReleasedAt": "2026-08-16T14:00:00.000Z" },
      "source": "WEB",
      "createdAt": "2026-08-16T14:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```
