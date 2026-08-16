# 12. Deployment, Docker & Observability

## 12.1 Processes to deploy

Four independently deployable processes, matching `Backend/apps/*`:

| Process | Description | Scaling |
|---|---|---|
| `api` | NestJS HTTP server | Horizontal, stateless, behind a load balancer |
| `bot` | grammY Telegram bot (webhook mode in prod) | Horizontal, stateless (session state lives in Redis, not in-process) |
| `worker` | BullMQ job processors | Horizontal; tune per-queue concurrency (e.g. `checkin`-adjacent queues need low latency, `reminders` can run with higher concurrency/lower priority) |
| `web` (Frontend) | Next.js dashboard | Horizontal, stateless, standard Next.js deployment (SSR) |

Plus managed/self-hosted infra: **PostgreSQL** (primary + read replica optional later,
not needed at MVP scale), **Redis**, and **Cloudflare R2** for file storage.

## 12.2 Docker

Each of `Backend` and `Frontend` gets its own multi-stage `Dockerfile`.

`Backend/Dockerfile` (shape, not literal — adjust for your Nest monorepo build output):
```dockerfile
FROM node:20-slim AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate
RUN pnpm build:api    # also build:bot, build:worker as separate targets

FROM node:20-slim AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
ENV NODE_ENV=production
# One image, three entrypoints selected by CMD override per-service in compose/k8s:
#   node dist/apps/api/main.js
#   node dist/apps/bot/main.js
#   node dist/apps/worker/main.js
CMD ["node", "dist/apps/api/main.js"]
```

`Frontend/Dockerfile`: standard Next.js standalone-output multi-stage build
(`output: 'standalone'` in `next.config.js`), served via `node server.js` in the runtime
stage.

**docker-compose (local dev + staging reference):**
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: events
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes: ["pgdata:/var/lib/postgresql/data"]
  redis:
    image: redis:7
  api:
    build: ./Backend
    command: node dist/apps/api/main.js
    env_file: ./Backend/.env
    depends_on: [postgres, redis]
    ports: ["3000:3000"]
  bot:
    build: ./Backend
    command: node dist/apps/bot/main.js
    env_file: ./Backend/.env
    depends_on: [postgres, redis, api]
  worker:
    build: ./Backend
    command: node dist/apps/worker/main.js
    env_file: ./Backend/.env
    depends_on: [postgres, redis]
  web:
    build: ./Frontend
    env_file: ./Frontend/.env
    depends_on: [api]
    ports: ["3001:3000"]
volumes:
  pgdata:
```

## 12.3 Environment variables (representative, not exhaustive)

**Backend:**
```
DATABASE_URL=postgresql://user:pass@postgres:5432/events
REDIS_URL=redis://redis:6379
JWT_SECRET=...
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=events-media
ADMIN_TELEGRAM_ID=...           # bootstrap seed for the first Admin
PAYMENT_PROVIDER=mock           # swapped once a real provider is chosen
SENTRY_DSN=...
```

**Frontend:**
```
NEXT_PUBLIC_API_BASE_URL=https://api.yourevents.app
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=EventBot
SENTRY_DSN=...
```

All secrets (`JWT_SECRET`, `TELEGRAM_BOT_TOKEN`, `R2_*`, provider keys) come from a real
secrets manager in staging/prod — Doppler, Vault, or your cloud provider's native secrets
service — never committed, never baked into the Docker image.

## 12.4 Database migrations

`prisma migrate deploy` runs as a **separate CI/CD step before the new `api` image is
rolled out**, not on container boot (avoids N replicas racing to apply the same
migration on startup). Recommended pipeline order: build image → run `prisma migrate
deploy` against the target DB → roll out new `api`/`bot`/`worker` containers → roll out
`web`.

Backward-compatible migrations only for zero-downtime deploys: additive changes
(new nullable columns, new tables) are safe to deploy before the code that uses them;
destructive changes (dropping a column, renaming) go through an expand-migrate-contract
pattern (add new, backfill, switch reads, remove old in a later deploy) — call this out
explicitly in PR review once the schema stabilizes post-MVP.

## 12.5 Backups

- Automated daily PostgreSQL backups (managed provider snapshot, or `pg_dump` to R2/S3 on
  a cron) with at least 7-day retention; test restore procedure once before go-live, not
  just after something breaks.
- `AuditLog` and `Payment` tables are the highest-value data to protect — consider a
  slightly longer retention window for backups covering these specifically if your
  provider allows differentiated policies.

## 12.6 CI/CD

Two independent pipelines (matches the two-directory repo structure):

- **Backend pipeline:** lint → typecheck → unit tests → integration tests
  (Testcontainers) → build → (on merge to `main`) `prisma migrate deploy` → deploy
  `api`/`bot`/`worker` images.
- **Frontend pipeline:** lint → typecheck → OpenAPI codegen (fails the build if it drifts
  from what the deployed Backend actually exposes — catch this via a codegen step against
  a pinned staging API spec, not against `main`'s in-progress backend) → unit/snapshot
  tests → build → deploy.

**Environments:** `staging` (auto-deploy on merge to `main`), `production` (manual
promotion/approval gate). Both Backend and Frontend deploy to the same environment name
together, but as independent deploy actions — no hard coupling requiring both to ship in
lockstep, as long as the API contract (OpenAPI spec) stays backward-compatible.

## 12.7 Health checks

`GET /health` on `api`: checks DB connectivity (`SELECT 1`) and Redis connectivity
(`PING`), returns `200` only if both succeed — used for both liveness and readiness in
MVP (a stricter setup would separate "is the process alive" from "is it ready to serve
traffic," worth doing once you're running multiple replicas behind a load balancer with
real rollout windows).

`worker` and `bot` expose a lightweight `/health` too (even though they're not HTTP
services in the traditional sense — a tiny internal HTTP server just for the probe) so
your orchestrator (Docker Swarm/Kubernetes/etc.) can restart a hung process automatically.

## 12.8 Observability

| Concern | Tool | Notes |
|---|---|---|
| Structured logging | `pino` (via `nestjs-pino`) | JSON logs, correlation ID per request propagated through to job logs where a job originated from an HTTP request |
| Error tracking | Sentry | Wired into `api`, `bot`, `worker`, and `web` — catches unhandled exceptions and job failures alike |
| Metrics | Prometheus (`@willsoto/nestjs-prometheus`) + Grafana | Track: registration throughput, capacity-lock transaction duration (watch for lock contention), BullMQ queue depth/age per queue, webhook processing latency, Telegram API error rate |
| Job monitoring | BullMQ's own dashboard (`bull-board`) mounted behind an Admin-only route | Lets you see stuck/failed jobs without needing to query Redis directly |
| DB monitoring | Your Postgres provider's built-in metrics (connection count, slow query log) | Specifically watch the `Event` row-lock pattern from `04-database.md §4.3` under load — if it becomes a bottleneck on very popular events, that's the first place to look |

Alert thresholds worth setting up before go-live (not exhaustive, a starting point):
- BullMQ queue age > 5 min on `payment-expiry`/`waitlist-offer-expiry` (these are
  time-sensitive; a stuck queue means people aren't getting capacity released/offered on
  time)
- API 5xx rate > 1% over 5 min
- DB connection pool exhaustion warnings
- Sentry error rate spike

## 12.9 Horizontal scaling notes

- `api`, `bot`, `worker`, `web` are all stateless and scale by adding replicas — no
  sticky sessions needed anywhere (JWT auth, Redis-backed bot session state).
- The one place that doesn't scale by "just add replicas" is **contention on a single
  popular Event's row lock** during a capacity-sensitive drop (e.g. a flash sale-style
  rush of registrations for one specific event) — this is a per-row bottleneck by design
  (§4.3's whole point), so more `api` replicas won't help throughput for *that one event*
  beyond a point; it will still be correct, just serialized. If this becomes a real
  product need (mass simultaneous registration opens), that's a dedicated scaling
  problem to revisit post-MVP, not something to over-engineer for now.
