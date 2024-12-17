-- Add user_answers column to quiz_results table
ALTER TABLE public.quiz_results 
ADD COLUMN IF NOT EXISTS user_answers JSONB;

-- Add quiz_id column if it doesn't exist (noticed this is used in the code but wasn't in original schema)
ALTER TABLE public.quiz_results 
ADD COLUMN IF NOT EXISTS quiz_id UUID REFERENCES public.quizzes(id);

-- Add questions_answered column if it doesn't exist (noticed this is used in the code but wasn't in original schema)
ALTER TABLE public.quiz_results 
ADD COLUMN IF NOT EXISTS questions_answered INTEGER;
