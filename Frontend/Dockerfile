FROM node:20-slim AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=$NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
CMD ["node", "server.js"]
