# 6. Roadmap & Build Plan

## 6.1 Stack decision

- Backend: NestJS + TypeScript + PostgreSQL + Prisma + Redis + BullMQ + grammY (Telegram) — as specified/recommended above.
- Frontend: **Next.js (App Router) + TypeScript + Material UI (MUI v6)**, `next-intl` for i18n/RTL, TanStack Query for data fetching against the NestJS API. See `07-design-system.md` for the theme (luxury navy palette, typography, RTL wiring) and component conventions. Chosen over plain React/Vite because you get SSR for the dashboard's data-heavy list pages, file-based routing that maps cleanly onto the module list in §29, and MUI's `DataGrid`/`Table`/`Dialog`/`Stepper` components are production-grade for the dense Organizer/Admin screens this dashboard is mostly made of.
- Repo: **two top-level directories, `Backend/` and `Frontend/`, each independently
  installable/deployable** (own `package.json`, own lockfile, own Dockerfile) — no shared
  monorepo tooling spanning both. This trades away some DRY-ness on shared types for a
  clean, simple split that matches how you want the repo organized; see the note on type
  sharing below for how we avoid the usual monorepo pain this creates.

```
Backend/
  apps/
    api/            NestJS HTTP API — all REST endpoints, business logic, authZ
    bot/             grammY Telegram bot process
    worker/          BullMQ workers (payment expiry, waitlist, notifications, reminders)
  libs/
    domain/          Shared application services used by api/bot/worker (registrations,
                      events, capacity, etc.) — the actual business logic lives here,
                      apps/* are thin entrypoints per §3.1's rule
    db/               Prisma schema, generated client, migrations
    common/           Guards, interceptors, config/env validation (zod), i18n JSON
  test/
    unit/
    integration/       (module + real Postgres/Redis via testcontainers)
    e2e/               (full API E2E, Supertest against a running instance)
  prisma/
  Dockerfile
  package.json

Frontend/
  src/
    app/              Next.js App Router pages (mirrors the dashboard sections in §5.2)
    components/        Shared UI components (built on the MUI theme)
    theme/             MUI theme + RTL setup (07-design-system.md's theme.ts lives here)
    lib/                API client (generated — see below), hooks, i18n setup
    generated/          Auto-generated OpenAPI client + types (never hand-edited)
  test/
    unit/               component/hook unit tests (Jest + React Testing Library)
    snapshot/           component snapshot tests
    e2e/                Playwright specs
  Dockerfile
  package.json
```

**Type sharing across the Backend/Frontend boundary, without a shared package:**
`Backend` runs `@nestjs/swagger` to auto-generate an OpenAPI spec from its DTOs/decorators
(near-zero extra work — you annotate DTOs once, which you'd want for API docs anyway).
`Frontend` runs `openapi-typescript` (or `orval`, which also generates React Query hooks
directly) against that spec as a build-time codegen step, producing
`Frontend/src/generated/*`. This gives Frontend fully typed request/response shapes and
catches drift at build time (a changed DTO that breaks the frontend build fails CI
immediately) — **without** needing a shared `packages/` directory that would violate the
"two directories" structure. `Backend/apps/bot` and `Backend/apps/worker` don't need this
codegen step since they import `libs/domain` directly in the same repo/build.

## 6.2 MVP scope

Everything in this document **except** the items explicitly called out as Phase 2/3
below. In particular MVP includes: full role system, voucher/invitation flow, DJs,
locations, full event lifecycle + visibility rules, full registration/guest/capacity
system, approval flow, payment **abstraction** (provider stubbed/mocked — wire a real
provider once you pick one), waitlist, tickets/QR/check-in, location privacy, audit logs,
Telegram bot, web dashboard, i18n (EN/FA), notifications, background jobs.

## 6.3 Phase 2

- Real payment provider integration (Stripe or a local Iranian/regional provider —
  tell me which and I'll design the adapter)
- Refunds
- Event collaborators (multi-organizer events)
- Configurable reminder offsets (organizer-set, beyond a hardcoded 24h/2h default)
- Promo codes / discounts
- Voucher invitation limits (schema already supports this, just needs a counter + guard)
- Email notification channel
- Advanced analytics dashboard

## 6.4 Phase 3

- Mobile app
- SMS channel
- Multiple currencies
- Membership tiers / subscriptions
- Advanced ticket categories (VIP/GA tiers)
- Referral system
- Offline check-in (only if you actually get reports of venue connectivity problems —
  don't build it speculatively)

## 6.5 Milestones

Each milestone is scoped so you can say **"build Milestone N"** and get a working,
testable slice. I'll stop after each one for your review before continuing.

**M1 — Foundation**
`Backend/` and `Frontend/` skeletons per the structure in §6.1 (Nest monorepo mode for
`apps/api`, `apps/bot`, `apps/worker` + `libs/domain`, `libs/db`, `libs/common`), Docker
Compose (Postgres, Redis), Prisma schema from `04-database.md` + initial migration,
env/config validation, health check endpoint, OpenAPI generation wired up on `Backend`
with a stub codegen step on `Frontend` pointed at it, CI skeleton (lint + build + test on
PR, run separately per directory).
DoD: `docker compose up` gives a running API with `/health` green and a migrated empty DB;
`Frontend` builds successfully against the generated API types.

**M2 — Auth, Users, Roles**
Telegram Login verification, JWT issuance, `users`/`auth` modules, role guards,
`PoliciesService` skeleton, admin bootstrap script (seed the first Admin from an env var
`ADMIN_TELEGRAM_ID`).
Tests: hash verification, role guard unit tests, IDOR test on `/users/me`.

**M3 — Vouchers & Invitations**
Invitation create/accept, `vouched_by` history, bot `/start?start=invite_...` handler.
Tests: double-accept idempotency, invalid token handling.

**M4 — DJs & Locations**
CRUD for both (shared pools), file upload flow for DJ photos (R2 integration).
Tests: reuse-across-events query correctness.

**M5 — Events (core + drafts + visibility + pricing tiers)**
Event CRUD, state machine, `EventAccessGrant`, visibility-filtered list/detail
endpoints, location-hidden-by-default enforcement, `PricingTier` CRUD + active-price
resolver (D16).
Tests: every visibility mode denies unauthorized reads; location never leaks pre-release;
tier resolver returns the correct price across window boundaries (including the
before-first-tier and no-tiers-defined fallback cases).

**M6 — Registrations & Capacity**
Registration state machine, guest handling, the full capacity-locking transaction from
`04-database.md §4.3`, partial-unique-index duplicate protection, capacity-override
requests.
Tests: **concurrency test** — N parallel requests for the last 2 spots, assert exactly 2
succeed; duplicate-registration race test.

**M7 — Approval flow**
Approval-required path, organizer approve/reject endpoints + notifications trigger
points (notification module can still just log to console until M9).

**M8 — Waitlist**
Join/offer/claim/expire, shadow reservations, offer-expiry job (stub BullMQ locally is
fine, real Redis wiring here).
Tests: expiry-and-cascade-to-next-person test, concurrent-claim race test.

**M9 — Payments (abstraction only)**
`Payment` entity, mock provider adapter, webhook intake endpoint + idempotency, 30-min
expiry job wired to real BullMQ, capacity release on expiry.
Tests: duplicate webhook test, expiry-releases-capacity test.

**M10 — Tickets & Check-in**
Ticket issuance on confirmation, signed QR token generation, check-in scan + manual
endpoints, per-guest independent check-in, re-scan idempotent response.
Tests: forged-token rejection, re-scan-shows-already-checked-in.

**M11 — Notifications (real)**
Notification module fully wired: enqueue calls from every domain event listed in §22,
Telegram delivery worker, dedupe-key idempotency, failure handling/backoff.

**M12 — Telegram bot (full UX)**
All flows from `05-ux-flows.md §5.1` implemented against the now-complete API.

**M13 — Web dashboard**
Design-system setup first (theme in `Frontend/src/theme`, fonts, RTL cache provider — see
`07-design-system.md §7.6`), then Next.js app: auth, all sections from
`05-ux-flows.md §5.2`, i18n/RTL.

**M14 — Audit logs**
Wire audit writes into every privileged action across all modules (should mostly be
"add one line per service method" by this point since the module boundaries are already
right), audit query API + dashboard viewer.

**M15 — Reminders & polish**
Event reminder jobs (24h/2h/30min defaults), edge-case sweep (re-verify the matrix in
§6.6 below against actual behavior), rate limiting rollout.

**M16 — Testing hardening**
Full test pyramid across both directories per `08-testing-strategy.md`: unit, integration,
E2E, and snapshot tests all filled out and passing in CI; concurrency/load tests expanded
and stress-tested against the capacity endpoint.

**M17 — Observability**
Structured logging (`pino`), error tracking (Sentry), metrics (Prometheus + a couple of
Grafana dashboards: registration throughput, job queue depth, webhook latency), liveness/
readiness probes for all four processes.

**M18 — Production deployment**
Dockerfiles per app, docker-compose for staging, CI/CD (build → migrate → deploy),
secrets manager wiring, DB backup policy, horizontal scaling notes for `api`/`bot`/
`worker` (stateless, scale independently; `worker` concurrency tuned per queue).

## 6.6 Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Capacity race condition bug ships to prod | Med | High | Dedicated concurrency test suite in M6/M16, load-tested before go-live |
| Location leak via a future endpoint someone forgets to guard | Med | High | Single `LocationVisibilityPolicy` reused everywhere, tested as part of every new endpoint's checklist |
| Telegram API outage during an event push (reminders/location release) | Med | Med | Notification retry/backoff + dashboard visibility into failed sends so organizer can manually follow up |
| Payment provider not yet chosen blocks M9+ | High (currently unresolved) | Med | Ship with a mock provider now; adapter interface makes swapping in real one a contained task |
| Redis outage stalls jobs | Low-Med | Med | DB-level `expires_at` + periodic sweep job means correctness survives Redis downtime, just with added latency |
| Scope creep from Phase 2/3 items bleeding into MVP | Med | Med | This roadmap is the gate — anything not listed under 6.2 needs an explicit decision to pull forward |

## 6.7 Unresolved decisions — needs your input before/around the listed milestone

1. **Payment provider** (needed by M9). Which one? Regional constraints (Iran-related
   payment rails often need a specific local provider) will shape the adapter.
2. **Age restriction enforcement** — is `min_age` self-declared by the registrant (no
   verification), or purely informational text on the event card? Recommendation:
   self-declared checkbox, no ID verification in MVP — flag if you need real
   verification, that's a different (KYC) problem.
3. **Organizer bot-side scope** (§5.3) — confirm approve/reject + release-location only.
4. **Voucher dashboard access** (§5.3) — confirm bot-only for MVP.
5. **Invitation limits** — confirm no hard cap in MVP (schema supports adding one later
   without migration pain).
6. **Multiple Admins in practice** — do you want an explicit "promote to Admin" dashboard
   action in MVP, or is env-var bootstrap + a manual DB update sufficient until you
   actually add a second Admin?
7. **Currency** — single fixed currency for MVP (e.g. IRR or USD — which one?), multi-
   currency is Phase 3 per your own list.
8. **Pricing tier "increases to $X" hint** (D16) — show it on the event card or keep the
   price silent until it changes?
9. **Approval-required price lock timing** (Payment-2, file 02) — lock at request time
   (recommended) or approval time?

Once you confirm/adjust decisions D1–D15 (file 01) and the items above, tell me to start
**Milestone 1** and I'll begin building.
