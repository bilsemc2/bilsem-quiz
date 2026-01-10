-- Eş Anlam Soruları Tablosu (Synonym Questions)
CREATE TABLE IF NOT EXISTS es_anlam_sorulari (
    id SERIAL PRIMARY KEY,
    kelime TEXT NOT NULL,              -- Soru kelimesi (örn: "Düş")
    secenek_a TEXT NOT NULL,
    secenek_b TEXT NOT NULL,
    secenek_c TEXT NOT NULL,
    secenek_d TEXT NOT NULL,
    dogru_cevap CHAR(1) NOT NULL CHECK (dogru_cevap IN ('a', 'b', 'c', 'd')),
    es_anlami TEXT,                    -- Kelimenin eş anlamlısı (referans için)
    zorluk TEXT DEFAULT 'orta' CHECK (zorluk IN ('kolay', 'orta', 'zor')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE es_anlam_sorulari ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "es_anlam_sorulari_select" ON es_anlam_sorulari
    FOR SELECT USING (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_es_anlam_zorluk ON es_anlam_sorulari(zorluk);
