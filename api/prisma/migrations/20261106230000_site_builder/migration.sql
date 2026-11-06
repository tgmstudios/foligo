ALTER TABLE "site_config" ADD COLUMN "builderDraft" JSONB, ADD COLUMN "builderPublished" JSONB, ADD COLUMN "builderRevision" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "builderHistory" JSONB;
