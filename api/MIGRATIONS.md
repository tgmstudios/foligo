# Database Migrations Guide

## Production Setup (Without Migrations Directory)

If you don't keep the `prisma/migrations` directory in production, you have two options:

### Option 1: Use `prisma db push` (Recommended)

This syncs your `schema.prisma` directly to the database without requiring migration files.

**Pros:**
- Simple and straightforward
- No migration files needed
- Works well for production deployments

**Cons:**
- Less control over migration history
- Can't easily rollback
- Not ideal for complex migrations

**Usage:**
```bash
npm run db:push
```

Or use the production script:
```bash
npm run db:prod
```

### Option 2: Use `prisma migrate resolve` + `migrate deploy`

This marks existing migrations as applied, then uses normal migration flow.

**Pros:**
- Maintains migration history
- Better for complex migrations
- Can track migration state

**Cons:**
- More complex setup
- Requires resolving migrations first

**Usage:**
```bash
bash prod-migrate-with-resolve.sh
```

## Development Setup

For development, always use migrations:

```bash
# Create a new migration
npm run db:migrate

# This will:
# 1. Detect schema changes
# 2. Create migration files
# 3. Apply them to your dev database
```

## Fixing Migration Drift

If you encounter drift (database has migrations that files don't exist):

```bash
npm run db:fix-drift
```

This will:
1. Create missing migration files
2. Mark them as applied
3. Resolve the drift without losing data

## Production Deployment

The Docker entrypoint (`entrypoint.sh`) automatically handles this:

- If `prisma/migrations` exists → uses `prisma migrate deploy`
- If `prisma/migrations` doesn't exist → uses `prisma db push`

This means your production setup will work whether or not you include migrations.

## Best Practices

1. **Development**: Always use `prisma migrate dev` to create migrations
2. **Production without migrations**: Use `prisma db push` or the production scripts
3. **Production with migrations**: Use `prisma migrate deploy` (requires migrations directory)
4. **Schema changes**: Always test in development first, then deploy to production

## Important Notes

- `prisma db push` will **modify your database schema** to match `schema.prisma`
- Always backup your production database before running migrations
- `db push` is safe for additive changes (adding tables, columns)
- Be careful with destructive changes (dropping columns, tables) - use `--accept-data-loss` flag if needed

