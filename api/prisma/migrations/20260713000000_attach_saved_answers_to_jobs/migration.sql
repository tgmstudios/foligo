CREATE TABLE "_JobSavedAnswers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_JobSavedAnswers_AB_unique" ON "_JobSavedAnswers"("A", "B");
CREATE INDEX "_JobSavedAnswers_B_index" ON "_JobSavedAnswers"("B");

ALTER TABLE "_JobSavedAnswers"
ADD CONSTRAINT "_JobSavedAnswers_A_fkey"
FOREIGN KEY ("A") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_JobSavedAnswers"
ADD CONSTRAINT "_JobSavedAnswers_B_fkey"
FOREIGN KEY ("B") REFERENCES "saved_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
