CREATE TABLE "ai_chat_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "contextId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'New chat',
    "chatHistory" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_chat_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_chat_sessions_userId_scope_contextId_idx" ON "ai_chat_sessions"("userId", "scope", "contextId");
CREATE INDEX "ai_chat_sessions_updatedAt_idx" ON "ai_chat_sessions"("updatedAt");
ALTER TABLE "ai_chat_sessions" ADD CONSTRAINT "ai_chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
