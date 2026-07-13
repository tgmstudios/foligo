# Build stage
# The build emits static assets, so run it on the runner's native architecture
# instead of emulating the target architecture. The nginx stage still uses the
# requested target platform (linux/arm64 in CI).
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

# node-canvas build dependencies (alpine/musl)
RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev

WORKDIR /app

RUN corepack enable

# Copy workspace config + lockfile from monorepo root
COPY pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY package.json ./
COPY dashboard/package.json ./dashboard/package.json

# Install deps using workspace-aware pnpm
RUN pnpm install --frozen-lockfile --filter foligo-dashboard

COPY dashboard/ ./dashboard/
WORKDIR /app/dashboard

# Turbo remote cache
ARG TURBO_API
ARG TURBO_TEAM
ENV TURBO_API=$TURBO_API
ENV TURBO_TEAM=$TURBO_TEAM
RUN --mount=type=secret,id=TURBO_TOKEN \
    TURBO_TOKEN="$(cat /run/secrets/TURBO_TOKEN)" \
    pnpm exec turbo run build --filter=foligo-dashboard

# Production stage
FROM nginx:alpine

RUN apk add --no-cache bash gettext

COPY dashboard/.docker/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dashboard/dist /usr/share/nginx/html

COPY dashboard/.docker/env.js.template /usr/share/nginx/html/env.js.template

COPY dashboard/.docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && \
    sed -i 's/\r$//' /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
