ALTER TABLE "cover_letters" ADD COLUMN "chatHistory" JSONB NOT NULL DEFAULT '[]', ADD COLUMN "pdfPath" TEXT;
