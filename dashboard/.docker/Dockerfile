# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

# Copy workspace config + lockfile from monorepo root
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY dashboard/package.json ./dashboard/package.json

# Install deps using workspace-aware pnpm
ENV PNPM_IGNORED_BUILDS=""
RUN pnpm install --no-frozen-lockfile --filter foligo-dashboard

COPY dashboard/ ./dashboard/
WORKDIR /app/dashboard

RUN pnpm run build

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
