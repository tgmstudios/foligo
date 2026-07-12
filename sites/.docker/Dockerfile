# Build stage
FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable

# Copy workspace config + lockfile from monorepo root
COPY pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY package.json ./
COPY sites/package.json ./sites/package.json

# Install deps using workspace-aware pnpm
RUN pnpm install --frozen-lockfile --filter foligo-sites

COPY sites/ ./sites/
WORKDIR /app/sites

# Turbo remote cache
ARG TURBO_API
ENV TURBO_API=$TURBO_API
RUN --mount=type=secret,id=TURBO_TOKEN \
    TURBO_TOKEN="$(cat /run/secrets/TURBO_TOKEN)" \
    pnpm exec turbo run build --filter=foligo-sites

# Production stage
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache gettext su-exec

COPY --from=build /app/sites/.output ./.output

COPY sites/.docker/env.js.template ./.output/public/env.js.template

COPY sites/.docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && \
    sed -i 's/\r$//' /docker-entrypoint.sh

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nuxt -u 1001

RUN chown -R nuxt:nodejs /app && \
    chown root:root /docker-entrypoint.sh

EXPOSE 80

ENV NODE_ENV=production
ENV PORT=80
ENV HOST=0.0.0.0

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
