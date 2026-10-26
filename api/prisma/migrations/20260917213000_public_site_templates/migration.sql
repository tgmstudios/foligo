-- Persist the public renderer selection and its versioned presentation data.
-- Defaults preserve every existing published portfolio without a data rewrite.
ALTER TABLE "site_config"
  ADD COLUMN "templateId" TEXT NOT NULL DEFAULT 'studio',
  ADD COLUMN "templateVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "templateSettings" JSONB,
  ADD COLUMN "theme" JSONB,
  ADD COLUMN "publishedRevision" INTEGER NOT NULL DEFAULT 1;
