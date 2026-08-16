#!/usr/bin/env sh
# Run migrations then start the given process.
# Usage (Docker/K8s entrypoint override):
#   ./scripts/migrate-and-start.sh api
#   ./scripts/migrate-and-start.sh bot
#   ./scripts/migrate-and-start.sh worker
#
# Prefer running `prisma migrate deploy` as a separate CI/CD step before
# rolling out replicas (avoids N pods racing the same migration). This script
# is a convenient single-replica / staging helper.

set -eu

TARGET="${1:-api}"

echo "[migrate-and-start] Running prisma migrate deploy..."
pnpm exec prisma migrate deploy

case "$TARGET" in
  api)
    exec node dist/apps/api/main.js
    ;;
  bot)
    exec node dist/apps/bot/main.js
    ;;
  worker)
    exec node dist/apps/worker/main.js
    ;;
  *)
    echo "Unknown target: $TARGET (expected api|bot|worker)" >&2
    exit 1
    ;;
esac
