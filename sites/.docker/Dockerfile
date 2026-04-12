# Build stage
FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache gettext su-exec

COPY --from=build /app/.output ./.output

COPY .docker/env.js.template ./.output/public/env.js.template

COPY .docker/docker-entrypoint.sh /docker-entrypoint.sh
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
