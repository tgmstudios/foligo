#!/bin/bash
set -e

# Run Prisma setup
echo "Running Prisma setup..."

# Generate Prisma client
echo "Generating Prisma client..."
npm run db:generate

# Run database migrations
echo "Running database migrations..."
npm run db:migrate

echo "Prisma setup completed."

# Start the application
echo "Starting API server..."
exec "$@" 