# Dockerfile - NEVER query DB during build
FROM node:24-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /app

ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_APP_URL
ARG BETTER_AUTH_URL

COPY . .
# NO database operations here - DB is not accessible during build
RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/next.config.ts ./next.config.ts

EXPOSE 3000

# Runtime image stays stateless; run migrations separately
CMD ["pnpm", "start"]
