-- AlterTable
ALTER TABLE "job_applications" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "jobCategories" TEXT[] DEFAULT ARRAY[]::TEXT[];
