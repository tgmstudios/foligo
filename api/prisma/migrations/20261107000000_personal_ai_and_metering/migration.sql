ALTER TABLE "ai_models" ADD COLUMN "billingRates" JSONB;
CREATE TABLE "user_ai_connections" (
 "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "providerType" TEXT NOT NULL, "model" TEXT NOT NULL, "modelType" TEXT NOT NULL DEFAULT 'QUICK', "apiKey" TEXT NOT NULL,
 "oauthRefreshToken" TEXT, "oauthExpiresAt" TIMESTAMP(3), "oauthAccountId" TEXT,
 "enabled" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "user_ai_connections_userId_providerType_key" ON "user_ai_connections"("userId", "providerType");
CREATE TABLE "user_ai_usage_policies" (
 "userId" TEXT NOT NULL PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "unlimited" BOOLEAN NOT NULL DEFAULT true, "monthlyRequests" INTEGER, "monthlyTokens" INTEGER,
 "monthlyCostUsd" DECIMAL(18,6), "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "nonnegative_ai_limits" CHECK (("monthlyRequests" IS NULL OR "monthlyRequests" >= 0) AND ("monthlyTokens" IS NULL OR "monthlyTokens" >= 0) AND ("monthlyCostUsd" IS NULL OR "monthlyCostUsd" >= 0))
);
CREATE TABLE "ai_usage_events" (
 "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "source" TEXT NOT NULL, "selection" TEXT NOT NULL, "providerType" TEXT NOT NULL, "model" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'RESERVED', "inputTokens" INTEGER NOT NULL DEFAULT 0, "outputTokens" INTEGER NOT NULL DEFAULT 0,
 "cacheReadTokens" INTEGER NOT NULL DEFAULT 0, "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
 "reasoningTokens" INTEGER NOT NULL DEFAULT 0, "totalTokens" INTEGER NOT NULL DEFAULT 0,
 "costUsd" DECIMAL(18,6), "rates" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3)
);
CREATE INDEX "ai_usage_events_userId_source_createdAt_idx" ON "ai_usage_events"("userId", "source", "createdAt");
CREATE TABLE "user_ai_device_logins" (
 "userId" TEXT NOT NULL PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "session" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "nextPollAt" TIMESTAMP(3) NOT NULL
);
