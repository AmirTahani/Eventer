#!/usr/bin/env bash
# Deploy Eventer on the VPS: pull, build, migrate, restart, reload nginx.
# Requires: git, docker compose. Does NOT need Node/npm on the server.
#
# Usage (from repo root on the VPS):
#   ./scripts/deploy.sh
#   ./scripts/deploy.sh --skip-pull
#   ./scripts/deploy.sh --skip-nginx
#   ./scripts/deploy.sh --skip-migrate
#
# Optional on a machine that already has Node: npm run deploy

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SKIP_PULL=0
SKIP_NGINX=0
SKIP_MIGRATE=0

for arg in "$@"; do
  case "$arg" in
    --skip-pull) SKIP_PULL=1 ;;
    --skip-nginx) SKIP_NGINX=1 ;;
    --skip-migrate) SKIP_MIGRATE=1 ;;
    -h|--help)
      cat <<'EOF'
Usage: ./scripts/deploy.sh [options]

  --skip-pull      Do not run git pull
  --skip-migrate   Do not run prisma migrate deploy
  --skip-nginx     Do not reload nginx
  -h, --help       Show this help
EOF
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "docker compose is required" >&2
  exit 1
fi

run_nginx() {
  if [[ "$(id -u)" -eq 0 ]]; then
    nginx -t
    systemctl reload nginx
    return
  fi
  if command -v sudo >/dev/null 2>&1; then
    sudo nginx -t
    sudo systemctl reload nginx
    return
  fi
  echo "nginx reload needs root/sudo. Skipping." >&2
}

echo "==> Repo: $ROOT"

if [[ "$SKIP_PULL" -eq 0 ]]; then
  echo "==> git pull"
  git pull
else
  echo "==> Skipping git pull"
fi

echo "==> ${COMPOSE[*]} --profile full build"
"${COMPOSE[@]}" --profile full build

if [[ "$SKIP_MIGRATE" -eq 0 ]]; then
  echo "==> Starting postgres + redis for migrate"
  "${COMPOSE[@]}" up -d postgres redis
  echo "==> prisma migrate deploy (one-shot)"
  "${COMPOSE[@]}" --profile full run --rm --entrypoint sh api \
    -c 'pnpm exec prisma migrate deploy'
else
  echo "==> Skipping migrate"
fi

echo "==> ${COMPOSE[*]} --profile full up -d"
"${COMPOSE[@]}" --profile full up -d

if [[ "$SKIP_NGINX" -eq 0 ]]; then
  echo "==> nginx -t && systemctl reload nginx"
  run_nginx
else
  echo "==> Skipping nginx reload"
fi

echo "==> Deploy finished"
echo "    Smoke: https://eventer.world/  and  https://api.eventer.world/health"
