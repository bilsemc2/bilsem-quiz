-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own quiz results." ON public.quiz_results;
DROP POLICY IF EXISTS "Users can insert their own quiz results." ON public.quiz_results;

-- Create new policies for quiz_results
CREATE POLICY "Enable read access for own quiz results" ON public.quiz_results
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for own quiz results" ON public.quiz_results
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Drop existing policies for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- Create new policies for profiles
CREATE POLICY "Enable read access for all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable update for users based on id" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);
