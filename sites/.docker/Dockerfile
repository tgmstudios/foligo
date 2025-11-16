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

# Copy built application from build stage
# Nuxt 3+ with Nitro bundles everything needed in .output
COPY --from=build /app/.output ./.output

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nuxt -u 1001

# Change ownership
RUN chown -R nuxt:nodejs /app

USER nuxt

# Expose port 80 (Nuxt default)
EXPOSE 80

# Set environment
ENV NODE_ENV=production
ENV PORT=80
ENV HOST=0.0.0.0

# Start the Nuxt server
CMD ["node", ".output/server/index.mjs"]
