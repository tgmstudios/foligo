/*
  Warnings:

  - You are about to drop the column `tagId` on the `skills` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,category]` on the `skills` table will be added. If there are existing duplicate values, this will fail.

*/
-- Step 1: Add category column (nullable for now)
ALTER TABLE "skills" ADD COLUMN "category" TEXT;

-- Step 2: Migrate category data from ContentTag to Skill
-- Copy the category from the related tag to the skill
UPDATE "skills" 
SET "category" = (
  SELECT "category" 
  FROM "content_tags" 
  WHERE "content_tags"."id" = "skills"."tagId"
)
WHERE "tagId" IS NOT NULL;

-- Step 3: Drop the foreign key constraint
ALTER TABLE "skills" DROP CONSTRAINT IF EXISTS "skills_tagId_fkey";

-- Step 4: Drop the old unique constraint
ALTER TABLE "skills" DROP CONSTRAINT IF EXISTS "skills_name_tagId_key";

-- Step 5: Drop the tagId column
ALTER TABLE "skills" DROP COLUMN "tagId";

-- Step 6: Create new unique constraint on name and category
ALTER TABLE "skills" ADD CONSTRAINT "skills_name_category_key" UNIQUE ("name", "category");

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS "skills_name_idx" ON "skills"("name");
CREATE INDEX IF NOT EXISTS "skills_category_idx" ON "skills"("category");

