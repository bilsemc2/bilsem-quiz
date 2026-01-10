-- Sözel Analoji Soruları Tablosu
CREATE TABLE IF NOT EXISTS analoji_sorulari (
    id SERIAL PRIMARY KEY,
    soru_metni TEXT NOT NULL,
    secenek_a TEXT NOT NULL,
    secenek_b TEXT NOT NULL,
    secenek_c TEXT NOT NULL,
    secenek_d TEXT NOT NULL,
    dogru_cevap CHAR(1) NOT NULL CHECK (dogru_cevap IN ('a', 'b', 'c', 'd')),
    aciklama TEXT,
    zorluk TEXT DEFAULT 'orta' CHECK (zorluk IN ('kolay', 'orta', 'zor')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE analoji_sorulari ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "analoji_sorulari_select" ON analoji_sorulari
    FOR SELECT USING (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_analoji_zorluk ON analoji_sorulari(zorluk);

