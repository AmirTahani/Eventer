# 8. Testing & Automation Strategy

This expands the testing strategy referenced throughout the roadmap into a concrete,
toolchain-specific plan for **unit**, **E2E**, and **snapshot** tests across both
`Backend/` and `Frontend/`, since these need to be built alongside features (per-milestone
in `06-roadmap.md`), not bolted on at the end.

## 8.1 Tooling summary

| Layer | Tool | Lives in |
|---|---|---|
| Backend unit tests | Jest (Nest's default) | `Backend/test/unit`, colocated `*.spec.ts` next to services is also fine |
| Backend integration tests | Jest + **Testcontainers** (real Postgres + Redis in Docker per test run) | `Backend/test/integration` |
| Backend API E2E tests | Jest + Supertest, against a fully running API instance | `Backend/test/e2e` |
| Backend load/concurrency tests | k6 (or Artillery) | `Backend/test/load` |
| Frontend unit tests | Jest + React Testing Library | `Frontend/test/unit` |
| Frontend snapshot tests | Jest snapshot (component tree) + **Playwright visual snapshots** (rendered pixels) | `Frontend/test/snapshot` |
| Frontend E2E tests | **Playwright** | `Frontend/test/e2e` |
| Telegram bot tests | grammY's test harness (mocked Telegram API transport) + Jest | `Backend/apps/bot/test` |
| CI | GitHub Actions (or your preferred CI), one workflow per directory, both required to pass on PR | `.github/workflows/backend.yml`, `.github/workflows/frontend.yml` |

## 8.2 Unit tests

**Backend.** Every service in `Backend/libs/domain` gets unit tests with Prisma mocked
(`jest-mock-extended` against the Prisma client interface) — these test business logic
in isolation (state machine transitions, price-tier resolution, permission checks)
without touching a real database. Fast, run on every save during development.

Required unit coverage (non-negotiable, tied to the highest-risk logic in this spec):
- Event state machine: every transition in `02-lifecycles.md §2.1` table, plus every
  *invalid* transition explicitly asserted to throw.
- Registration state machine: same, for `§2.2`'s table.
- `PricingTier` active-price resolver: boundary conditions (exactly at a tier's
  `starts_at`, before the first tier, after the last tier, no tiers defined).
- `PoliciesService` ability checks: one test per row of the permission matrix in
  `01-overview-and-roles.md §1.3`.
- `LocationVisibilityPolicy`: every combination of registration status × release state.

**Frontend.** Component-level unit tests with React Testing Library, focused on
*behavior* not markup (click a button, assert the right callback fires; fill a form,
assert validation errors appear) — snapshot tests (below) cover markup/visual regression
separately so unit tests don't become brittle "did the DOM change" tests.

## 8.3 Snapshot tests

Two distinct kinds, both requested — don't conflate them:

**1. Structural/render snapshots (Jest).** For components with meaningful conditional
render logic and low visual-design churn expected — e.g. `<StatusChip status="CONFIRMED"
/>` renders the right color/label, `<EventCard>` renders the location line as "Hidden"
vs the real address depending on props. Run via `jest` + `react-test-renderer` or RTL's
`asFragment()`. Checked into git (`__snapshots__/`), reviewed like any diff on PR —
**a snapshot diff is a required-attention signal, not something to blindly
`--updateSnapshot` past.**

**2. Visual regression snapshots (Playwright).** Full-page/component screenshot
comparisons for the pages where the **luxury visual design itself** (`07-design-system.md`)
is the thing worth protecting from regression — event card, ticket card, dashboard event
detail, check-in scan screen. Playwright's `toHaveScreenshot()` with a small tolerance
threshold; run in CI on a fixed viewport/browser to avoid font-rendering flakiness across
OSes. These specifically catch "someone changed a theme token and now everything looks
wrong" in a way structural snapshots and unit tests can't.

Snapshot scope guidance: don't snapshot everything — snapshot components with real
conditional complexity (status-dependent rendering, RTL vs LTR layout) or ones that
encode the design system directly. A plain static `<Card>` wrapper isn't worth a
snapshot.

## 8.4 Integration tests (Backend)

Testcontainers spins up real Postgres + Redis per test suite run (not mocked) — this is
where the **capacity concurrency logic must be proven**, since mocked-Prisma unit tests
can't validate real row-locking behavior:

- Concurrency test: fire N parallel `createRegistration` calls at an event with exactly
  M remaining spots (`N > M`), assert exactly M succeed and the rest cleanly fall back to
  waitlist/rejection — this is the single most important test in the whole suite, given
  §14/§37 of the original spec.
- Duplicate registration race: two parallel requests from the same user, assert the
  partial unique index rejects the second and the service layer returns a clean error,
  not a 500.
- Payment webhook duplication: fire the same webhook payload twice concurrently, assert
  idempotent single state transition.
- Waitlist offer/expiry: simulate offer expiry, assert next-in-line is atomically offered
  exactly once even under concurrent expiry-sweep runs (`SKIP LOCKED` behavior).

## 8.5 E2E tests

**Backend API E2E** (Supertest): full request→response flows through real HTTP, real DB
(Testcontainers), asserting authorization boundaries end-to-end — e.g. Organizer A
genuinely cannot fetch Organizer B's attendee list via any endpoint, not just the
"intended" one (actively try adjacent/list endpoints too, this is where IDOR regressions
get caught).

**Frontend E2E** (Playwright): scripted through the actual dashboard UI —
- Full Organizer journey: log in → create event with pricing tiers → publish → approve
  a registration → release location → check someone in.
- Full attendee-adjacent journey: as much as is web-testable (most of the attendee
  experience is Telegram — see below) — e.g. viewing a shared event link as an
  unauthorized user and asserting no event details leak into the DOM at all (not just
  hidden via CSS).
- RTL smoke test: switch to Farsi, assert layout mirrors and Vazirmatn loads.

**Bot E2E**: grammY supports injecting a fake Telegram API transport, so bot flows
(registration wizard, guest collection, waitlist claim) can be driven programmatically in
Jest without hitting real Telegram — assert the sequence of messages/keyboards sent
matches the flows in `05-ux-flows.md §5.1`.

## 8.6 CI gates

Both `Backend/` and `Frontend/` workflows run independently (matches the two-directory
structure — no shared pipeline needed) but are both **required checks** on PRs touching
either directory:

1. Lint + typecheck
2. Unit tests
3. Integration tests (Backend only, Testcontainers)
4. Snapshot tests (both — structural on every PR; Playwright visual snapshots on every
   PR touching `Frontend/src/theme` or `Frontend/src/components`, otherwise on a nightly
   schedule to save CI minutes)
5. E2E tests (nightly + pre-deploy, not on every PR — too slow for the inner dev loop)

## 8.7 Where this lands in the roadmap

Tests are written **alongside** each milestone in `06-roadmap.md` (each milestone already
lists its required tests) — `M16 — Testing hardening` is specifically for filling any
gaps, adding the Playwright visual-snapshot baseline images, and running the load tests
at realistic scale before `M18 — Production deployment`.
