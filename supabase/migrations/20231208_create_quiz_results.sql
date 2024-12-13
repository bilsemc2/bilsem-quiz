-- Create quiz_results table
CREATE TABLE IF NOT EXISTS public.quiz_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    correct_answers INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    points_earned INTEGER NOT NULL,
    xp_earned INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own quiz results." ON public.quiz_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz results." ON public.quiz_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON public.quiz_results(user_id);
