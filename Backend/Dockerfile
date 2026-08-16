FROM node:20-slim AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm prisma generate
RUN pnpm build:api && pnpm build:bot && pnpm build:worker

FROM node:20-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts

RUN chmod +x ./scripts/migrate-and-start.sh

# One image, three entrypoints (override CMD in compose/k8s):
#   node dist/apps/api/main.js
#   node dist/apps/bot/main.js
#   node dist/apps/worker/main.js
# Optional single-replica helper: ./scripts/migrate-and-start.sh api
CMD ["node", "dist/apps/api/main.js"]
