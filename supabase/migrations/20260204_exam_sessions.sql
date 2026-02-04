-- Sınav Simülasyonu için exam_sessions tablosu
-- Adaptif (CAT) sınav sonuçlarını saklar

CREATE TABLE IF NOT EXISTS exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    module_count INTEGER NOT NULL,
    exam_mode VARCHAR(20) NOT NULL DEFAULT 'standard',
    results JSONB NOT NULL DEFAULT '[]'::jsonb,
    final_score INTEGER,
    bzp_score INTEGER,                  -- BİLSEM Zeka Puanı (70-145)
    ability_estimate NUMERIC(4,2), -- -3.00 ile +3.00 arası IRT theta değeri
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_id ON exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_completed_at ON exam_sessions(completed_at);

-- RLS Politikaları
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi sınav sonuçlarını görebilir
CREATE POLICY "Users can view own exam sessions"
    ON exam_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Kullanıcılar kendi sınav sonuçlarını oluşturabilir
CREATE POLICY "Users can create own exam sessions"
    ON exam_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi sınav sonuçlarını güncelleyebilir
CREATE POLICY "Users can update own exam sessions"
    ON exam_sessions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Admin tüm sınav sonuçlarını görebilir
CREATE POLICY "Admins can view all exam sessions"
    ON exam_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = TRUE
        )
    );

COMMENT ON TABLE exam_sessions IS 'Adaptif sınav simülasyonu sonuçları';
COMMENT ON COLUMN exam_sessions.ability_estimate IS 'IRT tabanlı yetenek tahmini (-3 ile +3 arası)';
COMMENT ON COLUMN exam_sessions.results IS 'Her modülün detaylı sonucu (moduleId, level, passed, score, duration)';
