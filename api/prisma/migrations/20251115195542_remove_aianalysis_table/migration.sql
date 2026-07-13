/*
  Warnings:

  - You are about to drop the `ai_analysis` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ai_analysis" DROP CONSTRAINT "ai_analysis_contentId_fkey";

-- DropTable
DROP TABLE "ai_analysis";
