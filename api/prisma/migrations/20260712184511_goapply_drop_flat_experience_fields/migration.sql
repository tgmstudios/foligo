-- GoApply now fully relies on linked Content(EXPERIENCE)/Skill objects instead of
-- duplicating job/education/skills data as flat text on user_profiles.

-- DropColumn
ALTER TABLE "user_profiles" DROP COLUMN "skills";
ALTER TABLE "user_profiles" DROP COLUMN "highestDegree";
ALTER TABLE "user_profiles" DROP COLUMN "school";
ALTER TABLE "user_profiles" DROP COLUMN "discipline";
ALTER TABLE "user_profiles" DROP COLUMN "gpa";
ALTER TABLE "user_profiles" DROP COLUMN "educationSummary";
ALTER TABLE "user_profiles" DROP COLUMN "currentCompany";
ALTER TABLE "user_profiles" DROP COLUMN "currentTitle";
ALTER TABLE "user_profiles" DROP COLUMN "currentlyWorking";
ALTER TABLE "user_profiles" DROP COLUMN "experienceSummary";
ALTER TABLE "user_profiles" DROP COLUMN "yearsExperience";

-- CreateTable
CREATE TABLE "_ProfileLinkedSkills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ProfileLinkedSkills_AB_unique" ON "_ProfileLinkedSkills"("A", "B");

-- CreateIndex
CREATE INDEX "_ProfileLinkedSkills_B_index" ON "_ProfileLinkedSkills"("B");

-- AddForeignKey
ALTER TABLE "_ProfileLinkedSkills" ADD CONSTRAINT "_ProfileLinkedSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfileLinkedSkills" ADD CONSTRAINT "_ProfileLinkedSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
