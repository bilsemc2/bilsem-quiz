-- AI question pool behavior settings
-- topic='*' and locale='*' means global default

CREATE TABLE IF NOT EXISTS ai_question_pool_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL DEFAULT '*',
    locale TEXT NOT NULL DEFAULT '*' CHECK (locale IN ('*', 'tr', 'en')),
    max_served_count INTEGER NOT NULL DEFAULT 2 CHECK (max_served_count > 0),
    target_pool_size INTEGER NOT NULL DEFAULT 12 CHECK (target_pool_size > 0),
    refill_batch_size INTEGER NOT NULL DEFAULT 5 CHECK (refill_batch_size > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (topic, locale)
);

CREATE INDEX IF NOT EXISTS idx_ai_question_pool_settings_active_topic_locale
    ON ai_question_pool_settings (is_active, topic, locale);

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ai_question_pool_settings_set_updated_at ON ai_question_pool_settings;
CREATE TRIGGER trg_ai_question_pool_settings_set_updated_at
    BEFORE UPDATE ON ai_question_pool_settings
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

ALTER TABLE ai_question_pool_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view active ai question pool settings" ON ai_question_pool_settings;
CREATE POLICY "Authenticated can view active ai question pool settings"
    ON ai_question_pool_settings
    FOR SELECT
    USING ((SELECT auth.uid()) IS NOT NULL AND is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage ai question pool settings" ON ai_question_pool_settings;
CREATE POLICY "Admins can manage ai question pool settings"
    ON ai_question_pool_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.is_admin = TRUE
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.is_admin = TRUE
        )
    );

INSERT INTO ai_question_pool_settings (
    topic,
    locale,
    max_served_count,
    target_pool_size,
    refill_batch_size,
    is_active
)
VALUES ('*', '*', 2, 12, 5, TRUE)
ON CONFLICT (topic, locale) DO UPDATE
SET
    max_served_count = EXCLUDED.max_served_count,
    target_pool_size = EXCLUDED.target_pool_size,
    refill_batch_size = EXCLUDED.refill_batch_size,
    is_active = EXCLUDED.is_active;

COMMENT ON TABLE ai_question_pool_settings IS 'AI soru havuzu topic/locale bazli davranis ayarlari';
