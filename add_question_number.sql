-- Questions tablosuna question_number alanı ekleme
ALTER TABLE questions 
ADD COLUMN question_number INTEGER;

-- Mevcut kayıtlar için question_number değerini hesaplama
CREATE OR REPLACE FUNCTION update_question_numbers() 
RETURNS VOID AS $$
DECLARE
    q RECORD;
    num INTEGER;
BEGIN
    FOR q IN SELECT id, image_url FROM questions LOOP
        -- image_url'den soru numarasını çıkar (Soru-X formatı)
        num := NULL;
        
        -- Önce 'Soru-X' formatını kontrol et
        num := (SELECT (regexp_matches(q.image_url, 'Soru-(\d+)', 'i'))[1]::INTEGER);
        
        -- Eğer bulunamadıysa, genel bir sayı ara
        IF num IS NULL THEN
            num := (SELECT (regexp_matches(q.image_url, '(\d+)'))[1]::INTEGER);
        END IF;
        
        -- Eğer hala bulunamadıysa, 0 olarak ata
        IF num IS NULL THEN
            num := 0;
        END IF;
        
        -- question_number alanını güncelle
        UPDATE questions SET question_number = num WHERE id = q.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonksiyonu çalıştır
SELECT update_question_numbers();

-- İşi biten fonksiyonu kaldır
DROP FUNCTION update_question_numbers();

-- question_number sütununa NOT NULL kısıtlaması ekle
ALTER TABLE questions 
ALTER COLUMN question_number SET NOT NULL,
ALTER COLUMN question_number SET DEFAULT 0;

-- RLS politikalarını güncelle - INSERT politikası
CREATE OR REPLACE POLICY "Enable insert for authenticated users with admin or teacher role" 
ON public.questions 
FOR INSERT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'teacher')
  )
);

-- RLS politikalarını güncelle - UPDATE politikası  
CREATE OR REPLACE POLICY "Enable update for authenticated users with admin or teacher role" 
ON public.questions 
FOR UPDATE
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'teacher')
  )
);

-- RLS politikalarını güncelle - DELETE politikası
CREATE OR REPLACE POLICY "Enable delete for authenticated users with admin or teacher role" 
ON public.questions 
FOR DELETE
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'teacher')
  )
);

-- RLS politikalarını güncelle - SELECT politikası (herkes görebilir)
CREATE OR REPLACE POLICY "Enable select for all users" 
ON public.questions 
FOR SELECT
TO authenticated 
USING (true);

-- Eksik soru numaralarını bulma
WITH RECURSIVE numaralar AS (
  SELECT 1 as sayi
  UNION ALL
  SELECT sayi + 1 FROM numaralar WHERE sayi < 1293
),
mevcut_numaralar AS (
  SELECT DISTINCT question_number FROM questions WHERE question_number IS NOT NULL
)
SELECT n.sayi AS eksik_numara
FROM numaralar n
LEFT JOIN mevcut_numaralar m ON n.sayi = m.question_number
WHERE m.question_number IS NULL
ORDER BY n.sayi;
