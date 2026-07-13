-- CreateTable
CREATE TABLE "post_order" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_chat_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "chatHistory" JSONB NOT NULL,
    "resumeText" TEXT,
    "resumeFileName" TEXT,
    "jobPosting" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "post_order_contentId_key" ON "post_order"("contentId");

-- CreateIndex
CREATE INDEX "post_order_projectId_order_idx" ON "post_order"("projectId", "order");

-- CreateIndex
CREATE INDEX "post_order_contentId_idx" ON "post_order"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "post_order_projectId_contentId_key" ON "post_order"("projectId", "contentId");

-- CreateIndex
CREATE INDEX "resume_chat_sessions_userId_idx" ON "resume_chat_sessions"("userId");

-- CreateIndex
CREATE INDEX "resume_chat_sessions_createdAt_idx" ON "resume_chat_sessions"("createdAt");

-- AddForeignKey
ALTER TABLE "post_order" ADD CONSTRAINT "post_order_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_order" ADD CONSTRAINT "post_order_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_chat_sessions" ADD CONSTRAINT "resume_chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
