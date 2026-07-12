FROM node:22-bookworm-slim

# Prisma engine needs OpenSSL; fontconfig + libssl are runtime deps for tectonic (LaTeX compiler)
RUN apt-get update -y && apt-get install -y openssl ca-certificates curl fontconfig && rm -rf /var/lib/apt/lists/*

# Tectonic — self-contained LaTeX engine used to compile resume documents to PDF (api/src/services/latex-compiler.js)
RUN curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh && \
    mv tectonic /usr/local/bin/tectonic

WORKDIR /usr/src/app

RUN corepack enable

# Copy workspace config + lockfile from monorepo root
COPY pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY package.json ./
COPY api/package.json ./api/package.json

COPY api/.docker/entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && \
    sed -i 's/\r$//' /docker-entrypoint.sh

# Install deps using workspace-aware pnpm
RUN pnpm install --frozen-lockfile --filter foligo-api

COPY api/ ./api/
WORKDIR /usr/src/app/api

# Turbo remote cache
ARG TURBO_API
ENV TURBO_API=$TURBO_API
RUN --mount=type=secret,id=TURBO_TOKEN \
    TURBO_TOKEN="$(cat /run/secrets/TURBO_TOKEN)" \
    pnpm exec turbo run build --filter=foligo-api

# Pre-warm tectonic's TeX package bundle cache at build time by compiling the
# starter template once, so the first real request doesn't need outbound
# network access (tectonic normally fetches+caches packages on first use).
RUN tectonic src/assets/starter-resume.tex --outdir /tmp/tectonic-warmup && rm -rf /tmp/tectonic-warmup

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["pnpm", "run", "start"]
