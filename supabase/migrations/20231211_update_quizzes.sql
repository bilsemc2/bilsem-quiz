-- Add grade and subject columns to quizzes table
ALTER TABLE quizzes
ADD COLUMN grade SMALLINT CHECK (grade IN (1, 2, 3)),
ADD COLUMN subject TEXT;
