ALTER TABLE "resume_chat_sessions"
ADD COLUMN "jobId" TEXT,
ADD COLUMN "attachedResumeIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "attachedCoverLetterIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "resume_chat_sessions_jobId_idx" ON "resume_chat_sessions"("jobId");
