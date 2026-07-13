FROM --platform=$BUILDPLATFORM node:22-bookworm-slim AS build

# The API dependency tree is JavaScript except for Prisma. Install and generate
# on the runner's native architecture, while explicitly fetching the ARM64 CLI
# and client engines needed by the production image.
ENV PRISMA_CLI_BINARY_TARGETS=linux-arm64-openssl-3.0.x

WORKDIR /usr/src/app

RUN corepack enable

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY api/package.json ./api/package.json

RUN PRISMA_SKIP_POSTINSTALL_GENERATE=true \
    pnpm install --frozen-lockfile --prod --filter foligo-api

COPY api/ ./api/
RUN chmod +x ./api/.docker/entrypoint.sh && \
    sed -i 's/\r$//' ./api/.docker/entrypoint.sh

WORKDIR /usr/src/app/api
RUN pnpm run build

FROM node:22-bookworm-slim

# Prisma engine needs OpenSSL; fontconfig + libssl are runtime deps for tectonic (LaTeX compiler);
# git is needed to shallow-clone repos for the GitHub-crawling AI tools (api/src/services/github-service.js)
RUN DEBIAN_FRONTEND=noninteractive apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      openssl ca-certificates curl fontconfig git && \
    rm -rf /var/lib/apt/lists/*

# Tectonic — self-contained LaTeX engine used to compile resume documents to PDF (api/src/services/latex-compiler.js)
ARG TECTONIC_VERSION=0.16.9
ARG TECTONIC_SHA256=f9aa39017dbd51f111fdb93dda222178cbe51c8193508fc567b523cc74fff9c1
ENV TECTONIC_BUNDLE_URL=https://data1.fullyjustified.net/tlextras-2022.0r0.tar
# The statically linked musl binary does not reliably discover Debian's CA
# store on ARM64. Point its TLS stack at the certificates installed above.
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
ENV SSL_CERT_DIR=/etc/ssl/certs
RUN curl --proto '=https' --tlsv1.2 -fsSL --retry 3 \
      -o /tmp/tectonic.tar.gz \
      "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40${TECTONIC_VERSION}/tectonic-${TECTONIC_VERSION}-aarch64-unknown-linux-musl.tar.gz" && \
    echo "${TECTONIC_SHA256}  /tmp/tectonic.tar.gz" | sha256sum -c - && \
    tar -xzf /tmp/tectonic.tar.gz -C /usr/local/bin tectonic && \
    rm /tmp/tectonic.tar.gz && \
    tectonic --version

RUN corepack enable

# Pre-warm tectonic's TeX package bundle cache at build time by compiling the
# starter template once, so the first real request doesn't need outbound
# network access (tectonic normally fetches+caches packages on first use).
# Keep this layer independent of API source changes. CI cannot consistently
# reach the bundle host, so one non-fatal attempt avoids four redundant 30s
# network timeouts while still caching the bundle whenever the host responds.
COPY api/src/assets/starter-resume.tex /tmp/tectonic-warmup/starter-resume.tex
RUN if ! tectonic --bundle "$TECTONIC_BUNDLE_URL" \
      /tmp/tectonic-warmup/starter-resume.tex --outdir /tmp/tectonic-warmup; then \
      echo "Tectonic bundle warmup failed; continuing without it" >&2; \
    fi && \
    rm -rf /tmp/tectonic-warmup

COPY --from=build /usr/src/app /usr/src/app
COPY --from=build /usr/src/app/api/.docker/entrypoint.sh /docker-entrypoint.sh

WORKDIR /usr/src/app/api

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["pnpm", "run", "start"]
