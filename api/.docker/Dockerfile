FROM node:22-bookworm-slim

# Prisma engine needs OpenSSL
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

RUN corepack enable

# Copy workspace config + lockfile from monorepo root
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package.json ./
COPY api/package.json ./api/package.json

COPY api/.docker/entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && \
    sed -i 's/\r$//' /docker-entrypoint.sh

# Install deps using workspace-aware pnpm
RUN pnpm install --no-frozen-lockfile --filter foligo-api

COPY api/ ./api/
WORKDIR /usr/src/app/api

RUN pnpm exec prisma generate

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["pnpm", "run", "start"]
