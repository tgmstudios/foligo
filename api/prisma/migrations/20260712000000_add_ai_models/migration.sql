CREATE TABLE "ai_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "endpoint" TEXT,
    "apiKey" TEXT,
    "headers" JSONB,
    "modelType" TEXT NOT NULL DEFAULT 'QUICK',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_models_slug_key" ON "ai_models"("slug");
CREATE INDEX "ai_models_modelType_enabled_idx" ON "ai_models"("modelType", "enabled");

-- Bootstrap the OpenCode Go models currently used by Foligo. They inherit the
-- OpenCode endpoint/API key from AI_OPENCODE_* until an admin saves overrides.
INSERT INTO "ai_models" ("id", "name", "slug", "providerType", "model", "modelType", "enabled", "isDefault", "createdAt", "updatedAt")
VALUES
  ('4ea2a1bc-963a-4df1-b7b9-b96fe4a2b930', 'OpenCode Go DeepSeek Flash', 'opencode-go-deepseek-flash', 'opencode', 'deepseek-v4-flash', 'QUICK', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('a46d8501-553d-47e9-a01f-49700579db0a', 'OpenCode Go DeepSeek Pro', 'opencode-go-deepseek-pro', 'opencode', 'deepseek-v4-pro', 'LONG', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
