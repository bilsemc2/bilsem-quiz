-- AI generation jobs, canonical AI question storage, and RLS/index hardening

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.is_admin = TRUE
    );
$$;

CREATE OR REPLACE FUNCTION public.build_ai_question_fingerprint(
    input_stem TEXT,
    input_options JSONB
)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    WITH normalized_stem AS (
        SELECT trim(
            regexp_replace(
                regexp_replace(
                    replace(lower(unaccent(COALESCE(input_stem, ''))), 'ı', 'i'),
                    '[^[:alnum:][:space:]]',
                    ' ',
                    'g'
                ),
                '\s+',
                ' ',
                'g'
            )
        ) AS value
    ),
    normalized_options AS (
        SELECT COALESCE(
            string_agg(
                normalized_option,
                '|' ORDER BY normalized_option
            ),
            ''
        ) AS value
        FROM (
            SELECT trim(
                regexp_replace(
                    regexp_replace(
                        replace(lower(unaccent(option_value)), 'ı', 'i'),
                        '[^[:alnum:][:space:]]',
                        ' ',
                        'g'
                    ),
                    '\s+',
                    ' ',
                    'g'
                )
            ) AS normalized_option
            FROM jsonb_array_elements_text(COALESCE(input_options, '[]'::jsonb)) AS option_row(option_value)
        ) option_values
    )
    SELECT normalized_stem.value || '::' || normalized_options.value
    FROM normalized_stem, normalized_options;
$$;

CREATE TABLE IF NOT EXISTS ai_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    locale TEXT NOT NULL DEFAULT 'tr' CHECK (locale IN ('tr', 'en')),
    job_type TEXT NOT NULL CHECK (job_type IN ('story_questions', 'adaptive_pool')),
    requested_question_count INTEGER NOT NULL DEFAULT 0 CHECK (requested_question_count >= 0),
    generated_question_count INTEGER NOT NULL DEFAULT 0 CHECK (generated_question_count >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    model_name TEXT,
    error_message TEXT,
    request_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    locale TEXT NOT NULL DEFAULT 'tr' CHECK (locale IN ('tr', 'en')),
    external_id TEXT,
    stem TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_index SMALLINT NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
    explanation TEXT NOT NULL,
    difficulty_level SMALLINT NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    source TEXT NOT NULL DEFAULT 'ai' CHECK (source IN ('ai', 'fallback', 'bank')),
    question_fingerprint TEXT NOT NULL,
    prompt_version TEXT NOT NULL DEFAULT 'v1',
    model_name TEXT,
    generation_job_id UUID REFERENCES ai_generation_jobs(id) ON DELETE SET NULL,
    generation_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (created_by, topic, locale, question_fingerprint)
);

ALTER TABLE ai_generated_questions
    ADD COLUMN IF NOT EXISTS question_fingerprint TEXT;

ALTER TABLE ai_generated_questions
    ADD COLUMN IF NOT EXISTS ai_question_id UUID REFERENCES ai_questions(id) ON DELETE SET NULL;

ALTER TABLE ai_generated_questions
    ADD COLUMN IF NOT EXISTS generation_job_id UUID REFERENCES ai_generation_jobs(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS story_questions
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'bank';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'story_questions_source_check'
    ) THEN
        ALTER TABLE story_questions
            ADD CONSTRAINT story_questions_source_check
            CHECK (source IN ('ai', 'fallback', 'bank'));
    END IF;
END;
$$;

UPDATE ai_generated_questions
SET question_fingerprint = public.build_ai_question_fingerprint(stem, options)
WHERE question_fingerprint IS NULL;

ALTER TABLE ai_generated_questions
    ALTER COLUMN question_fingerprint SET NOT NULL;

INSERT INTO ai_questions (
    created_by,
    topic,
    locale,
    external_id,
    stem,
    options,
    correct_index,
    explanation,
    difficulty_level,
    source,
    question_fingerprint,
    generation_context,
    created_at,
    updated_at
)
SELECT DISTINCT ON (user_id, topic, locale, question_fingerprint)
    user_id,
    topic,
    locale,
    external_id,
    stem,
    options,
    correct_index,
    explanation,
    difficulty_level,
    source,
    question_fingerprint,
    generation_context,
    created_at,
    updated_at
FROM ai_generated_questions
ORDER BY user_id, topic, locale, question_fingerprint, created_at ASC
ON CONFLICT (created_by, topic, locale, question_fingerprint) DO NOTHING;

UPDATE ai_generated_questions agq
SET ai_question_id = aiq.id
FROM ai_questions aiq
WHERE agq.ai_question_id IS NULL
  AND aiq.created_by = agq.user_id
  AND aiq.topic = agq.topic
  AND aiq.locale = agq.locale
  AND aiq.question_fingerprint = agq.question_fingerprint;

UPDATE story_questions
SET source = CASE
    WHEN ai_generated_question_id IS NOT NULL THEN 'ai'
    ELSE 'bank'
END
WHERE source IS NULL
   OR source NOT IN ('ai', 'fallback', 'bank');

CREATE INDEX IF NOT EXISTS idx_ability_snapshot_last_session_id
    ON ability_snapshot (last_session_id)
    WHERE last_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_generation_jobs_user_topic_locale_status
    ON ai_generation_jobs (user_id, topic, locale, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_questions_created_by_topic_locale
    ON ai_questions (created_by, topic, locale, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_questions_generation_job_id
    ON ai_questions (generation_job_id)
    WHERE generation_job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_generated_questions_pending_lookup
    ON ai_generated_questions (user_id, topic, locale, served_count, created_at ASC)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_ai_generated_questions_fingerprint_lookup
    ON ai_generated_questions (user_id, topic, locale, question_fingerprint)
    WHERE status IN ('pending', 'solved');

CREATE INDEX IF NOT EXISTS idx_ai_generated_questions_ai_question_id
    ON ai_generated_questions (ai_question_id)
    WHERE ai_question_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_generated_questions_generation_job_id
    ON ai_generated_questions (generation_job_id)
    WHERE generation_job_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_ai_generation_jobs_set_updated_at ON ai_generation_jobs;
CREATE TRIGGER trg_ai_generation_jobs_set_updated_at
    BEFORE UPDATE ON ai_generation_jobs
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_ai_questions_set_updated_at ON ai_questions;
CREATE TRIGGER trg_ai_questions_set_updated_at
    BEFORE UPDATE ON ai_questions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

ALTER TABLE ai_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all session performance" ON session_performance;
CREATE POLICY "Admins can view all session performance"
    ON session_performance
    FOR SELECT
    USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can view all ability snapshots" ON ability_snapshot;
CREATE POLICY "Admins can view all ability snapshots"
    ON ability_snapshot
    FOR SELECT
    USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can view all question attempts" ON question_attempt;
CREATE POLICY "Admins can view all question attempts"
    ON question_attempt
    FOR SELECT
    USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can view all ai generated questions" ON ai_generated_questions;
CREATE POLICY "Admins can view all ai generated questions"
    ON ai_generated_questions
    FOR SELECT
    USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage ai question pool settings" ON ai_question_pool_settings;
CREATE POLICY "Admins can manage ai question pool settings"
    ON ai_question_pool_settings
    FOR ALL
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Users can view own ai generation jobs" ON ai_generation_jobs;
CREATE POLICY "Users can view own ai generation jobs"
    ON ai_generation_jobs
    FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own ai generation jobs" ON ai_generation_jobs;
CREATE POLICY "Users can insert own ai generation jobs"
    ON ai_generation_jobs
    FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own ai generation jobs" ON ai_generation_jobs;
CREATE POLICY "Users can update own ai generation jobs"
    ON ai_generation_jobs
    FOR UPDATE
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all ai generation jobs" ON ai_generation_jobs;
CREATE POLICY "Admins can view all ai generation jobs"
    ON ai_generation_jobs
    FOR SELECT
    USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Users can view own ai questions" ON ai_questions;
CREATE POLICY "Users can view own ai questions"
    ON ai_questions
    FOR SELECT
    USING ((SELECT auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can insert own ai questions" ON ai_questions;
CREATE POLICY "Users can insert own ai questions"
    ON ai_questions
    FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update own ai questions" ON ai_questions;
CREATE POLICY "Users can update own ai questions"
    ON ai_questions
    FOR UPDATE
    USING ((SELECT auth.uid()) = created_by)
    WITH CHECK ((SELECT auth.uid()) = created_by);

DROP POLICY IF EXISTS "Admins can view all ai questions" ON ai_questions;
CREATE POLICY "Admins can view all ai questions"
    ON ai_questions
    FOR SELECT
    USING (public.is_current_user_admin());

COMMENT ON TABLE ai_generation_jobs IS 'AI soru üretim istekleri için redakte edilmiş job kayıtları';
COMMENT ON TABLE ai_questions IS 'Kullanıcı bazlı normalize edilmiş AI/fallback soru kaydı';
