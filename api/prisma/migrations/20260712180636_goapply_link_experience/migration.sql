-- CreateTable
CREATE TABLE "_ProfileLinkedJobs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ProfileLinkedEducation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ProfileLinkedJobs_AB_unique" ON "_ProfileLinkedJobs"("A", "B");

-- CreateIndex
CREATE INDEX "_ProfileLinkedJobs_B_index" ON "_ProfileLinkedJobs"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProfileLinkedEducation_AB_unique" ON "_ProfileLinkedEducation"("A", "B");

-- CreateIndex
CREATE INDEX "_ProfileLinkedEducation_B_index" ON "_ProfileLinkedEducation"("B");

-- AddForeignKey
ALTER TABLE "_ProfileLinkedJobs" ADD CONSTRAINT "_ProfileLinkedJobs_A_fkey" FOREIGN KEY ("A") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfileLinkedJobs" ADD CONSTRAINT "_ProfileLinkedJobs_B_fkey" FOREIGN KEY ("B") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfileLinkedEducation" ADD CONSTRAINT "_ProfileLinkedEducation_A_fkey" FOREIGN KEY ("A") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfileLinkedEducation" ADD CONSTRAINT "_ProfileLinkedEducation_B_fkey" FOREIGN KEY ("B") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
