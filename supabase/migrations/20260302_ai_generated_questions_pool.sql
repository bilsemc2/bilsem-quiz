-- AI generated question pool
-- Purpose:
--   1) Persist generated questions per user
--   2) Reuse unsolved questions from DB when needed
--   3) Regenerate when pending pool is exhausted or stale

CREATE TABLE IF NOT EXISTS ai_generated_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    locale TEXT NOT NULL DEFAULT 'tr' CHECK (locale IN ('tr', 'en')),
    external_id TEXT,
    stem TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_index SMALLINT NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
    explanation TEXT NOT NULL,
    difficulty_level SMALLINT NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    source TEXT NOT NULL DEFAULT 'ai' CHECK (source IN ('ai', 'fallback')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'solved', 'retired')),
    served_count INTEGER NOT NULL DEFAULT 0 CHECK (served_count >= 0),
    generation_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_served_at TIMESTAMPTZ,
    solved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_generated_questions_user_topic_status
    ON ai_generated_questions (user_id, topic, locale, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_generated_questions_user_status
    ON ai_generated_questions (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_generated_questions_external_id
    ON ai_generated_questions (external_id)
    WHERE external_id IS NOT NULL;

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ai_generated_questions_set_updated_at ON ai_generated_questions;
CREATE TRIGGER trg_ai_generated_questions_set_updated_at
    BEFORE UPDATE ON ai_generated_questions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

ALTER TABLE ai_generated_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ai generated questions" ON ai_generated_questions;
CREATE POLICY "Users can view own ai generated questions"
    ON ai_generated_questions
    FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own ai generated questions" ON ai_generated_questions;
CREATE POLICY "Users can insert own ai generated questions"
    ON ai_generated_questions
    FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own ai generated questions" ON ai_generated_questions;
CREATE POLICY "Users can update own ai generated questions"
    ON ai_generated_questions
    FOR UPDATE
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all ai generated questions" ON ai_generated_questions;
CREATE POLICY "Admins can view all ai generated questions"
    ON ai_generated_questions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.is_admin = TRUE
        )
    );

COMMENT ON TABLE ai_generated_questions IS 'Kullanici bazli AI soru havuzu (pending/solved/retired)';
