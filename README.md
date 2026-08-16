# Eventer

Telegram-first private event management platform.

## Structure

| Path | Purpose |
|---|---|
| `Backend/` | NestJS monorepo — `apps/api`, `apps/bot`, `apps/worker` + shared libs |
| `Frontend/` | Next.js Organizer/Admin dashboard |
| `*.md` | Product/tech blueprint (start with `00-README.md`) |

## Milestone 1 — local setup

```bash
# Infra (Docker, when available)
docker compose up -d postgres redis

# Or Homebrew (current local path without Docker):
# brew services start postgresql@16
# redis-server --daemonize yes

# Backend
cd Backend
cp .env.example .env   # adjust DATABASE_URL if needed
pnpm install
pnpm prisma migrate deploy
pnpm start:api:dev     # http://localhost:3000/health  +  /docs

# Frontend
cd Frontend
cp .env.example .env
pnpm install
pnpm codegen           # types from Backend/openapi/openapi.json
pnpm dev               # http://localhost:3001
```

Full app stack via Compose: `docker compose --profile full up --build`
