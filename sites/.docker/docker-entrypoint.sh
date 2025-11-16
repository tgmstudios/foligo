#!/bin/sh
set -e

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

