-- Candidate -> active publication state for AI question records

ALTER TABLE ai_questions
    ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'candidate';

ALTER TABLE ai_questions
    ADD COLUMN IF NOT EXISTS review_notes JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ai_questions_review_status_check'
    ) THEN
        ALTER TABLE ai_questions
            ADD CONSTRAINT ai_questions_review_status_check
            CHECK (review_status IN ('candidate', 'active', 'rejected'));
    END IF;
END;
$$;

UPDATE ai_questions
SET review_status = 'active'
WHERE review_status = 'candidate';

CREATE INDEX IF NOT EXISTS idx_ai_questions_active_lookup
    ON ai_questions (created_by, topic, locale, review_status, created_at DESC);

COMMENT ON COLUMN ai_questions.review_status IS 'Candidate review sonucu: candidate, active veya rejected';
COMMENT ON COLUMN ai_questions.review_notes IS 'Kalite kapisi ve review notlari';
