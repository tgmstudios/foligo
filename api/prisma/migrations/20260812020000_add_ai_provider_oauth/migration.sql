-- AlterTable
ALTER TABLE "ai_provider_configs" ADD COLUMN     "oauthRefreshToken" TEXT,
ADD COLUMN     "oauthExpiresAt" TIMESTAMP(3);
