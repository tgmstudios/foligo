-- AlterTable
ALTER TABLE "analytics_events" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "domain" TEXT,
ADD COLUMN     "os" TEXT,
ADD COLUMN     "previousPath" TEXT,
ADD COLUMN     "visitCount" INTEGER;
