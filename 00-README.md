# Private Event Platform — Project Documentation

This is the full technical/product blueprint for the Telegram-first private event
management platform. It is split into files so it's easy to read and edit piece by piece.

## Files

| File | Contents |
|---|---|
| `01-overview-and-roles.md` | Executive summary, product requirements, roles & permission matrix, key decisions/assumptions |
| `02-lifecycles.md` | Event, Registration, Payment, Waitlist, Ticket/Check-in, Location, Voucher lifecycles + state machines |
| `03-architecture.md` | System architecture, module boundaries, API design, Telegram architecture, background jobs, Redis, auth/security, notifications, files, i18n |
| `04-database.md` | Full PostgreSQL schema, Mermaid ERD, indexes/constraints, capacity concurrency strategy (Prisma-specific) |
| `05-ux-flows.md` | Detailed Telegram bot flows + Web Dashboard flows |
| `06-roadmap.md` | MVP vs Phase 2/3, milestone-by-milestone build plan, risk register, unresolved decisions with recommendations |
| `07-design-system.md` | MUI theme, luxury navy/blue color palette, typography, RTL setup, component/UX conventions |
| `08-testing-strategy.md` | Unit, integration, E2E, and snapshot testing strategy across Backend and Frontend, with CI gates |
| `09-prisma-schema.prisma` | Complete, literal Prisma schema — copy directly into `Backend/prisma/schema.prisma` |
| `10-api-reference.md` | Full request/response JSON contracts for every endpoint |
| `11-edge-cases.md` | Every edge case from the original spec, resolved concretely with cross-references to the relevant decision |
| `12-deployment-observability.md` | Docker, docker-compose, env vars, migrations, backups, CI/CD, health checks, monitoring, scaling |

## How to hand this to another AI tool

Each file is self-contained but cross-references the others by filename — paste them
together (or upload all of them) so the tool has the full picture, especially
`01-overview-and-roles.md` (the decisions everything else depends on) and
`09-prisma-schema.prisma` (the literal schema). A reasonable prompt: *"Here is the full
spec/blueprint for a project. Start with Milestone 1 in `06-roadmap.md`: scaffold
`Backend/` and `Frontend/` exactly as described in `06-roadmap.md §6.1`, using
`09-prisma-schema.prisma` as-is."*

## How to use this

1. Read `01-overview-and-roles.md` first — it contains every place where I deviated from
   your spec or made an assumption (D1–D16). **Correct those before building** —
   everything downstream depends on them.
2. `09-prisma-schema.prisma` is the literal schema, ready to copy into
   `Backend/prisma/schema.prisma`; `04-database.md` is the narrative explanation behind
   it (why the partial unique index, why row-locking, etc.) — read both together.
3. `10-api-reference.md` has exact request/response JSON for every endpoint — use this
   when implementing or when prompting another AI tool, so field names aren't guessed.
4. `06-roadmap.md` is written so you can say "start Milestone 1" and get exactly that
   slice, then review before continuing — nothing more, nothing less.

## Status

Draft v2 — expanded with concrete Prisma schema, full API contracts, edge-case matrix,
and deployment details. One real inconsistency from v1 was caught and fixed: the
registration-lifecycle diagram in `02-lifecycles.md` referenced states
(`DRAFT_IN_PROGRESS`, `CHECKED_IN`) that weren't in the actual status enum and
contradicted the text below it — corrected. Nothing has been built yet.
