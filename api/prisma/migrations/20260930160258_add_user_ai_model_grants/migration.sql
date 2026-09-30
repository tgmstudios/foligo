-- CreateTable
CREATE TABLE "user_ai_model_grants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aiModelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_ai_model_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_ai_model_grants_userId_aiModelId_key" ON "user_ai_model_grants"("userId", "aiModelId");

-- CreateIndex
CREATE INDEX "user_ai_model_grants_userId_idx" ON "user_ai_model_grants"("userId");

-- CreateIndex
CREATE INDEX "user_ai_model_grants_aiModelId_idx" ON "user_ai_model_grants"("aiModelId");

-- AddForeignKey
ALTER TABLE "user_ai_model_grants" ADD CONSTRAINT "user_ai_model_grants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_ai_model_grants" ADD CONSTRAINT "user_ai_model_grants_aiModelId_fkey" FOREIGN KEY ("aiModelId") REFERENCES "ai_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;
