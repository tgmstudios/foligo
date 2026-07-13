FROM node:22-bookworm-slim

# Prisma engine needs OpenSSL; fontconfig is needed for LuaLaTeX font discovery;
# git is needed to shallow-clone repos for the GitHub-crawling AI tools.
# TeX Live packages provide LuaLaTeX for resume compilation (replaces tectonic).
RUN DEBIAN_FRONTEND=noninteractive apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      openssl ca-certificates curl fontconfig git \
      texlive-latex-extra texlive-fonts-recommended && \
    rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /usr/src/app

# Install on the target architecture so transitive native modules (Prisma,
# @napi-rs/canvas, and future additions) always match the ARM64 runtime. This
# layer only changes when package metadata or the lockfile changes.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY api/package.json ./api/package.json
RUN PRISMA_SKIP_POSTINSTALL_GENERATE=true \
    pnpm install --frozen-lockfile --prod --filter foligo-api

# Generate the ARM64 Prisma client before copying general API source so route
# and service changes do not invalidate this emulated step.
COPY api/prisma/ ./api/prisma/
WORKDIR /usr/src/app/api
RUN pnpm run build

# Keep application source last: normal API changes now reuse dependencies
# and Prisma generation layers.
COPY api/ /usr/src/app/api/
RUN chmod +x ./.docker/entrypoint.sh && \
    sed -i 's/\r$//' ./.docker/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/src/app/api/.docker/entrypoint.sh"]
CMD ["pnpm", "run", "start"]
