#!/bin/bash
set -e

# Run Prisma setup
echo "Running Prisma setup..."

# Generate Prisma client
echo "Generating Prisma client..."
npm run db:generate

# Run database migrations
# For production without migrations directory, use db:push instead
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  # Migrations directory exists, use migrate deploy
  echo "Running database migrations (migrate deploy)..."
  npm run db:migrate:deploy
else
  # No migrations directory, use db push (syncs schema directly)
  echo "No migrations directory found. Syncing schema directly (db push)..."
  npm run db:push
fi

echo "Prisma setup completed."

# Start the application
echo "Starting API server..."
exec "$@" 