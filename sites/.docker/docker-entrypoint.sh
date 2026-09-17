#!/bin/sh
set -e

export NODE_ENV="${NODE_ENV:-development}"
export API_BASE_URL="${API_BASE_URL:-https://api.foligo.tech}"
export DASHBOARD_URL="${DASHBOARD_URL:-https://dashboard.foligo.tech}"

# Generate runtime environment configuration
echo "Generating environment configuration..."
if [ -f /app/.output/public/env.js.template ]; then
  envsubst < /app/.output/public/env.js.template > /app/.output/public/env.js
  # Change ownership to nuxt user if running as root
  if [ "$(id -u)" = "0" ]; then
    chown nuxt:nodejs /app/.output/public/env.js
  fi
  echo "Generated env.js from template"
else
  echo "Warning: env.js.template not found, skipping env.js generation"
fi

# Switch to nuxt user if running as root
if [ "$(id -u)" = "0" ]; then
  exec su-exec nuxt "$@"
else
  exec "$@"
fi
