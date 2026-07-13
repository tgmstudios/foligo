-- DropForeignKey
ALTER TABLE "resume_history" DROP CONSTRAINT "resume_history_templateId_fkey";

-- DropForeignKey
ALTER TABLE "resume_history" DROP CONSTRAINT "resume_history_userId_fkey";

-- DropForeignKey
ALTER TABLE "resume_templates" DROP CONSTRAINT "resume_templates_userId_fkey";

-- DropTable
DROP TABLE "resume_history";

-- DropTable
DROP TABLE "resume_templates";

-- CreateTable
CREATE TABLE "resume_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "jobDescription" TEXT,
    "chatHistory" JSONB NOT NULL DEFAULT '[]',
    "pdfPath" TEXT,
    "linkedJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_document_revisions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "jobDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_document_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_documents_userId_idx" ON "resume_documents"("userId");

-- CreateIndex
CREATE INDEX "resume_documents_createdAt_idx" ON "resume_documents"("createdAt");

-- CreateIndex
CREATE INDEX "resume_documents_linkedJobId_idx" ON "resume_documents"("linkedJobId");

-- CreateIndex
CREATE INDEX "resume_document_revisions_documentId_idx" ON "resume_document_revisions"("documentId");

-- CreateIndex
CREATE INDEX "resume_document_revisions_createdAt_idx" ON "resume_document_revisions"("createdAt");

-- AddForeignKey
ALTER TABLE "resume_documents" ADD CONSTRAINT "resume_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_documents" ADD CONSTRAINT "resume_documents_linkedJobId_fkey" FOREIGN KEY ("linkedJobId") REFERENCES "job_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_document_revisions" ADD CONSTRAINT "resume_document_revisions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "resume_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

