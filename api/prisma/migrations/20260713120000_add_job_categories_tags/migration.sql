ALTER TABLE "job_applications"
ADD COLUMN "category" TEXT,
ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
