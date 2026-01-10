-- Add resim_analiz_hakki column to profiles table
-- This column tracks how many art analysis submissions a student has remaining

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS resim_analiz_hakki integer DEFAULT 3;

-- Add a comment to explain the column
COMMENT ON COLUMN profiles.resim_analiz_hakki IS 'Resim atölyesi analiz hakkı sayısı. Her analiz yapıldığında 1 azalır.';
