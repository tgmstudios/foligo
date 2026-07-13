/*
  Warnings:

  - You are about to drop the column `isPublished` on the `content` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN', 'REVISION');

-- AlterTable
ALTER TABLE "content" DROP COLUMN "isPublished",
ADD COLUMN     "revisedAt" TIMESTAMP(3),
ADD COLUMN     "revisionNumber" INTEGER,
ADD COLUMN     "revisionOf" TEXT,
ADD COLUMN     "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "content_revisionOf_idx" ON "content"("revisionOf");

-- CreateIndex
CREATE INDEX "content_status_idx" ON "content"("status");

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_revisionOf_fkey" FOREIGN KEY ("revisionOf") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
