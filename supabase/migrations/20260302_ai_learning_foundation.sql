-- AI learning foundation tables for adaptive questioning
-- Tables:
--   - ability_snapshot (latest ability profile per user)
--   - session_performance (session-level performance aggregates)
--   - question_attempt (append-only attempt events)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS session_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    locale TEXT NOT NULL DEFAULT 'tr' CHECK (locale IN ('tr', 'en')),
    total_questions INTEGER NOT NULL DEFAULT 0 CHECK (total_questions >= 0),
    correct_answers INTEGER NOT NULL DEFAULT 0 CHECK (correct_answers >= 0),
    recent_accuracy NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (recent_accuracy >= 0 AND recent_accuracy <= 1),
    average_response_ms INTEGER NOT NULL DEFAULT 0 CHECK (average_response_ms >= 0),
    target_response_ms INTEGER NOT NULL DEFAULT 4500 CHECK (target_response_ms > 0),
    streak_correct INTEGER NOT NULL DEFAULT 0 CHECK (streak_correct >= 0),
    consecutive_wrong INTEGER NOT NULL DEFAULT 0 CHECK (consecutive_wrong >= 0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (correct_answers <= total_questions)
);

CREATE TABLE IF NOT EXISTS ability_snapshot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    overall_score NUMERIC(5,2) NOT NULL DEFAULT 50 CHECK (overall_score >= 0 AND overall_score <= 100),
    memory_score NUMERIC(5,2) NOT NULL DEFAULT 50 CHECK (memory_score >= 0 AND memory_score <= 100),
    logic_score NUMERIC(5,2) NOT NULL DEFAULT 50 CHECK (logic_score >= 0 AND logic_score <= 100),
    attention_score NUMERIC(5,2) NOT NULL DEFAULT 50 CHECK (attention_score >= 0 AND attention_score <= 100),
    verbal_score NUMERIC(5,2) NOT NULL DEFAULT 50 CHECK (verbal_score >= 0 AND verbal_score <= 100),
    spatial_score NUMERIC(5,2) NOT NULL DEFAULT 50 CHECK (spatial_score >= 0 AND spatial_score <= 100),
    processing_speed_score NUMERIC(5,2) NOT NULL DEFAULT 50 CHECK (processing_speed_score >= 0 AND processing_speed_score <= 100),
    model_version TEXT NOT NULL DEFAULT 'v1',
    source TEXT NOT NULL DEFAULT 'rule_engine' CHECK (source IN ('rule_engine', 'ai', 'hybrid', 'manual')),
    last_session_id UUID REFERENCES session_performance(id) ON DELETE SET NULL,
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_attempt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_performance_id UUID NOT NULL REFERENCES session_performance(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    difficulty_level SMALLINT NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    was_correct BOOLEAN NOT NULL,
    response_ms INTEGER NOT NULL CHECK (response_ms >= 0),
    selected_index SMALLINT CHECK (selected_index >= 0 AND selected_index <= 3),
    correct_index SMALLINT CHECK (correct_index >= 0 AND correct_index <= 3),
    source TEXT NOT NULL DEFAULT 'ai' CHECK (source IN ('ai', 'fallback', 'bank')),
    question_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_performance_user_created_at
    ON session_performance (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_performance_user_topic_created_at
    ON session_performance (user_id, topic, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_question_attempt_session_created_at
    ON question_attempt (session_performance_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_question_attempt_user_created_at
    ON question_attempt (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_session_performance_set_updated_at ON session_performance;
CREATE TRIGGER trg_session_performance_set_updated_at
    BEFORE UPDATE ON session_performance
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_ability_snapshot_set_updated_at ON ability_snapshot;
CREATE TRIGGER trg_ability_snapshot_set_updated_at
    BEFORE UPDATE ON ability_snapshot
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

ALTER TABLE session_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ability_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempt ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own session performance" ON session_performance;
CREATE POLICY "Users can view own session performance"
    ON session_performance
    FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own session performance" ON session_performance;
CREATE POLICY "Users can insert own session performance"
    ON session_performance
    FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own session performance" ON session_performance;
CREATE POLICY "Users can update own session performance"
    ON session_performance
    FOR UPDATE
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all session performance" ON session_performance;
CREATE POLICY "Admins can view all session performance"
    ON session_performance
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.is_admin = TRUE
        )
    );

DROP POLICY IF EXISTS "Users can view own ability snapshot" ON ability_snapshot;
CREATE POLICY "Users can view own ability snapshot"
    ON ability_snapshot
    FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own ability snapshot" ON ability_snapshot;
CREATE POLICY "Users can insert own ability snapshot"
    ON ability_snapshot
    FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own ability snapshot" ON ability_snapshot;
CREATE POLICY "Users can update own ability snapshot"
    ON ability_snapshot
    FOR UPDATE
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all ability snapshots" ON ability_snapshot;
CREATE POLICY "Admins can view all ability snapshots"
    ON ability_snapshot
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.is_admin = TRUE
        )
    );

DROP POLICY IF EXISTS "Users can view own question attempts" ON question_attempt;
CREATE POLICY "Users can view own question attempts"
    ON question_attempt
    FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own question attempts" ON question_attempt;
CREATE POLICY "Users can insert own question attempts"
    ON question_attempt
    FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all question attempts" ON question_attempt;
CREATE POLICY "Admins can view all question attempts"
    ON question_attempt
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.is_admin = TRUE
        )
    );

COMMENT ON TABLE ability_snapshot IS 'Her kullanici icin guncel yetenek profili (0-100)';
COMMENT ON TABLE session_performance IS 'Oturum bazli performans ozeti';
COMMENT ON TABLE question_attempt IS 'Soru cevaplama event kayitlari (append-only)';
