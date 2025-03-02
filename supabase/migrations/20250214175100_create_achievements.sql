-- Başarı tipleri için enum
CREATE TYPE achievement_type AS ENUM (
    'quiz_master',        -- 100 quiz tamamlama
    'perfect_score',      -- %100 başarılı quiz
    'daily_streak',       -- 7 gün üst üste quiz çözme
    'referral_champion',  -- 5 başarılı referans
    'quick_solver',       -- 1 dakikadan kısa sürede quiz tamamlama
    'subject_expert'      -- Bir konuda %90 üzeri başarı
);

-- Başarılar tablosu
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type achievement_type NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 200,
    requirements JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Kullanıcı başarıları tablosu
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    achievement_id UUID REFERENCES achievements NOT NULL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, achievement_id)
);

-- RLS politikaları
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements için politikalar
CREATE POLICY "Achievements herkes tarafından görüntülenebilir"
    ON achievements FOR SELECT
    TO authenticated
    USING (true);

-- User Achievements için politikalar
CREATE POLICY "Kullanıcılar kendi başarılarını görebilir"
    ON user_achievements FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Temel başarıları ekle
INSERT INTO achievements (type, name, description, icon, points, requirements) VALUES
    ('quiz_master', 'Quiz Ustası', '100 quiz tamamla', '🎯', 200, '{"quiz_count": 100}'),
    ('perfect_score', 'Mükemmel Skor', 'Bir quizi tüm sorulara doğru cevap vererek tamamla', '🌟', 200, '{"correct_ratio": 100}'),
    ('daily_streak', 'Süreklilik', '7 gün üst üste quiz çöz', '🔥', 200, '{"days": 7}'),
    ('referral_champion', 'Davet Şampiyonu', '5 arkadaşını davet et', '👥', 200, '{"referral_count": 5}'),
    ('quick_solver', 'Hızlı Çözücü', 'Bir quizi 1 dakikadan kısa sürede tamamla', '⚡', 200, '{"time_limit": 60}'),
    ('subject_expert', 'Konu Uzmanı', 'Bir konuda %90 üzeri başarı elde et', '📚', 200, '{"success_ratio": 90}');

-- Updated_at için trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_achievements_updated_at
    BEFORE UPDATE ON achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
