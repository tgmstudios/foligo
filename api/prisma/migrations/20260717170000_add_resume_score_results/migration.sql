CREATE TABLE "resume_score_results" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "gradedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_score_results_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "resume_score_results_documentId_gradedAt_idx"
ON "resume_score_results"("documentId", "gradedAt");

ALTER TABLE "resume_score_results"
ADD CONSTRAINT "resume_score_results_documentId_fkey"
FOREIGN KEY ("documentId") REFERENCES "resume_documents"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
