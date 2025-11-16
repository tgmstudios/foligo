#!/bin/bash
set -e

# Set default values if environment variables are not set
export VITE_API_URL="${VITE_API_URL:-http://localhost:9012/api}"
export VITE_APP_NAME="${VITE_APP_NAME:-Foligo Dashboard}"
export VITE_APP_VERSION="${VITE_APP_VERSION:-1.0.0}"
export NODE_ENV="${NODE_ENV:-development}"

# Generate runtime environment configuration
echo "Generating environment configuration..."
echo "VITE_API_URL=${VITE_API_URL}"
envsubst < /usr/share/nginx/html/env.js.template > /usr/share/nginx/html/env.js

# Start nginx
echo "Starting nginx..."
exec "$@" 