# Multi-stage build for Nuxt.js SSR application
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage - run Nuxt.js server
FROM node:22-alpine

WORKDIR /app

# Install gettext for envsubst and su-exec for user switching
RUN apk add --no-cache gettext su-exec

# Copy built application from build stage
# Nuxt 3+ with Nitro bundles everything needed in .output
COPY --from=build /app/.output ./.output

# Copy env.js template
COPY .docker/env.js.template ./.output/public/env.js.template

# Copy entrypoint script
COPY .docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && \
    sed -i 's/\r$//' /docker-entrypoint.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nuxt -u 1001

# Change ownership (but keep entrypoint executable by root)
RUN chown -R nuxt:nodejs /app && \
    chown root:root /docker-entrypoint.sh

# Expose port 80 (Nuxt default)
EXPOSE 80

# Note: User switching happens in entrypoint script

# Set environment
ENV NODE_ENV=production
ENV PORT=80
ENV HOST=0.0.0.0

# Use custom entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
