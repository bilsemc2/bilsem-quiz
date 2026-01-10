-- Cümle içi eş anlam bulma soruları tablosu
CREATE TABLE IF NOT EXISTS cumle_ici_es_anlam_sorulari (
    id SERIAL PRIMARY KEY,
    cumle TEXT NOT NULL,
    secenek_a TEXT NOT NULL,
    secenek_b TEXT NOT NULL,
    secenek_c TEXT NOT NULL,
    secenek_d TEXT NOT NULL,
    dogru_cevap CHAR(1) NOT NULL CHECK (dogru_cevap IN ('a', 'b', 'c', 'd')),
    dogru_kelime TEXT NOT NULL,
    zorluk TEXT DEFAULT 'orta' CHECK (zorluk IN ('kolay', 'orta', 'zor')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS politikaları
ALTER TABLE cumle_ici_es_anlam_sorulari ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes cümle içi eş anlam sorularını okuyabilir"
    ON cumle_ici_es_anlam_sorulari FOR SELECT
    USING (true);

-- Zorluk bazlı sorgu için index
CREATE INDEX IF NOT EXISTS idx_cumle_ici_es_anlam_zorluk ON cumle_ici_es_anlam_sorulari(zorluk);
