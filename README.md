# Eventer

Telegram-first private event management platform.

## Structure

| Path | Purpose |
|---|---|
| `Backend/` | NestJS monorepo — `apps/api`, `apps/bot`, `apps/worker` + shared libs |
| `Frontend/` | Next.js Organizer/Admin dashboard |
| `*.md` | Product/tech blueprint (start with `00-README.md`) |

## Local setup

```bash
# Infra
docker compose up -d postgres redis

# Backend
cd Backend
cp .env.example .env   # adjust DATABASE_URL / secrets
pnpm install
pnpm prisma migrate deploy
pnpm start:api:dev     # http://localhost:3000/health  +  /docs
# optional: pnpm start:bot:dev / pnpm start:worker:dev

# Frontend
cd Frontend
cp .env.example .env
pnpm install
pnpm codegen           # types from Backend/openapi/openapi.json
pnpm dev               # http://localhost:3001
```

Full app stack via Compose: `docker compose --profile full up --build`

## Payments (OrcaRail)

Eventer supports `PAYMENT_PROVIDER=mock` (default) or `PAYMENT_PROVIDER=orcarail`.

1. Copy `Backend/.env.example` → `.env` and set:
   - `PAYMENT_PROVIDER=orcarail`
   - `ORCARAIL_API_KEY` / `ORCARAIL_API_SECRET`
   - `ORCARAIL_TOKEN_ID` / `ORCARAIL_NETWORK_ID` (catalog UUIDs from OrcaRail)
   - `ORCARAIL_RETURN_URL` / `ORCARAIL_CANCEL_URL` (e.g. `http://localhost:3001/payments/return` and `.../cancel`)
   - `ORCARAIL_WEBHOOK_SECRET` (dashboard webhook secret, or your API secret)
2. In the OrcaRail dashboard, point the webhook URL to  
   `https://<your-eventer-api>/payments/webhook/orcarail`  
   (signature header: `x-webhook-signature`).
3. **Self-hosted OrcaRail:** set `ORCARAIL_BASE_URL=https://your-orcarail-host/api/v1` — no code changes required.

Checkout flow: create intent → confirm → open hosted `pay_url` (Telegram bot sends a Pay button; Frontend has return/cancel pages). Ticket issuance stays webhook-driven (`payment_intent.completed`).

## Production checklist

Derived from `12-deployment-observability.md`:

1. **Secrets** — load `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`, `R2_*`, payment keys, `SENTRY_DSN` from a secrets manager (never bake into images).
2. **Migrate separately** — run `pnpm prisma migrate deploy` (or `Backend/scripts/migrate-and-start.sh` only for single-replica staging) **before** rolling new `api`/`bot`/`worker` replicas.
3. **Processes** — deploy four independently scalable processes: `api`, `bot`, `worker`, `web` (see Dockerfiles under `Backend/` and `Frontend/`).
4. **Health** — `GET /health` (liveness), `GET /health/ready` (DB readiness), `GET /metrics` (basic Prometheus text).
5. **Bot mode** — long polling in non-production when `TELEGRAM_BOT_TOKEN` is set; production should use webhook mode (token still required).
6. **Backups** — daily Postgres backups with ≥7-day retention; test restore before go-live. Prioritize `audit_logs` and `payments`.
7. **Observability** — structured JSON logs; optional `SENTRY_DSN` (stub logs until `@sentry/node` is wired); alert on queue age, 5xx rate, DB pool exhaustion.
8. **CI/CD** — Backend: lint → test → build → migrate deploy → roll images. Frontend: lint → codegen → test → build → deploy. Staging auto on `main`; production via manual promotion.
