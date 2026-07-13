ALTER TABLE "resume_documents"
ADD COLUMN "isTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "cover_letters"
ADD COLUMN "isTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- A user can have at most one default of each document type. Partial indexes
-- allow all non-default documents to continue sharing the false value.
CREATE UNIQUE INDEX "resume_documents_userId_default_key"
ON "resume_documents"("userId") WHERE "isDefault" = true;

CREATE UNIQUE INDEX "cover_letters_userId_default_key"
ON "cover_letters"("userId") WHERE "isDefault" = true;
