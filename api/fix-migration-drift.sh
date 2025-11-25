#!/bin/bash
set -e

echo "🔧 Fixing Prisma migration drift..."
echo ""
echo "This script will resolve the missing migration without losing data."
echo ""

MIGRATION_NAME="20251116220712_init"
MIGRATION_DIR="prisma/migrations/${MIGRATION_NAME}"

# Step 1: Create the migration directory and file if it doesn't exist
if [ ! -d "$MIGRATION_DIR" ]; then
  echo "Step 1: Creating missing migration directory and file..."
  mkdir -p "$MIGRATION_DIR"
  
  # Create an empty migration file (since the migration is already applied to the DB)
  # We just need the file structure for Prisma to recognize it
  echo "-- Migration already applied to database" > "$MIGRATION_DIR/migration.sql"
  echo "-- This migration was created to resolve drift" >> "$MIGRATION_DIR/migration.sql"
  echo "-- The actual migration was applied earlier" >> "$MIGRATION_DIR/migration.sql"
fi

# Step 2: Mark the migration as applied
echo "Step 2: Marking migration as applied..."
npx prisma migrate resolve --applied "$MIGRATION_NAME"

echo ""
echo "✅ Migration drift resolved!"
echo ""
echo "You can now run: npm run db:migrate"
echo "This will sync your schema with any new changes without losing data."

