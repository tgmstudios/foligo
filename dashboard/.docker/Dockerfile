# Multi-stage build for Vue.js/Vite static site
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (skip type checking for faster Docker builds)
# Type checking should be done in CI/CD, not during Docker builds
# Run vite build directly to bypass vue-tsc which has Node 22 compatibility issues
RUN npx vite build

# Production stage - serve static files with nginx
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration (optional, if you have custom nginx config)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
