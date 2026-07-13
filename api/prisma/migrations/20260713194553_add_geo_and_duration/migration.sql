-- CreateTable
CREATE TABLE "analytics_properties" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "writeKeyHash" TEXT NOT NULL,
    "writeKeyPrefix" TEXT NOT NULL,
    "allowedOrigins" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitorHash" TEXT,
    "sessionHash" TEXT,
    "url" TEXT,
    "path" TEXT,
    "title" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "city" TEXT,
    "region" TEXT,
    "duration" INTEGER,
    "device" TEXT,
    "metadata" JSONB,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'ElevenLabs',
    "provider" TEXT NOT NULL DEFAULT 'elevenlabs',
    "agentId" TEXT NOT NULL,
    "voiceId" TEXT,
    "modelId" TEXT,
    "apiKey" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "analytics_properties_projectId_key" ON "analytics_properties"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_properties_writeKeyHash_key" ON "analytics_properties"("writeKeyHash");

-- CreateIndex
CREATE INDEX "analytics_events_propertyId_occurredAt_idx" ON "analytics_events"("propertyId", "occurredAt");

-- CreateIndex
CREATE INDEX "analytics_events_propertyId_name_occurredAt_idx" ON "analytics_events"("propertyId", "name", "occurredAt");

-- CreateIndex
CREATE INDEX "analytics_events_propertyId_path_occurredAt_idx" ON "analytics_events"("propertyId", "path", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "voice_providers_provider_key" ON "voice_providers"("provider");

-- AddForeignKey
ALTER TABLE "analytics_properties" ADD CONSTRAINT "analytics_properties_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "analytics_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
