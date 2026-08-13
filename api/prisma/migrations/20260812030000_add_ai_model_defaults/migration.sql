-- CreateTable
CREATE TABLE "ai_model_defaults" (
    "id" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "order" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_model_defaults_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_model_defaults_modelType_key" ON "ai_model_defaults"("modelType");
