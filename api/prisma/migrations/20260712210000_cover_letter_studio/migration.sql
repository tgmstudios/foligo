ALTER TABLE "cover_letters"
  ADD CONSTRAINT "cover_letters_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "job_applications"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "cover_letters_userId_idx" ON "cover_letters"("userId");
CREATE INDEX "cover_letters_jobId_idx" ON "cover_letters"("jobId");

CREATE TABLE "cover_letter_revisions" (
  "id" TEXT NOT NULL,
  "coverLetterId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cover_letter_revisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cover_letter_revisions_coverLetterId_fkey"
    FOREIGN KEY ("coverLetterId") REFERENCES "cover_letters"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "cover_letter_revisions_coverLetterId_idx" ON "cover_letter_revisions"("coverLetterId");
CREATE INDEX "cover_letter_revisions_createdAt_idx" ON "cover_letter_revisions"("createdAt");
