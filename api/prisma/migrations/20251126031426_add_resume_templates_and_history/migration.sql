-- CreateTable
CREATE TABLE "resume_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templatePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateId" TEXT,
    "jobDescription" TEXT NOT NULL,
    "resumeData" JSONB NOT NULL,
    "contentItemIds" JSONB,
    "resumeSize" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_templates_userId_idx" ON "resume_templates"("userId");

-- CreateIndex
CREATE INDEX "resume_templates_createdAt_idx" ON "resume_templates"("createdAt");

-- CreateIndex
CREATE INDEX "resume_history_userId_idx" ON "resume_history"("userId");

-- CreateIndex
CREATE INDEX "resume_history_createdAt_idx" ON "resume_history"("createdAt");

-- AddForeignKey
ALTER TABLE "resume_templates" ADD CONSTRAINT "resume_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_history" ADD CONSTRAINT "resume_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_history" ADD CONSTRAINT "resume_history_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "resume_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
