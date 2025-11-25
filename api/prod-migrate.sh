#!/bin/bash
set -e

# Production migration script that works without migrations directory
# This script handles database schema updates in production

echo "🔧 Running production database migration..."

# Option 1: Use prisma db push (recommended for production without migrations)
# This syncs your schema.prisma directly to the database
# It's safe and doesn't require migration files
echo "Syncing schema to database..."
npx prisma db push --skip-generate

# Generate Prisma client after schema sync
echo "Generating Prisma client..."
npx prisma generate

echo "✅ Database migration completed!"

