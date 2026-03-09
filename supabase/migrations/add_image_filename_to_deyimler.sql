-- Deyimler tablosuna image_filename kolonu ekle
ALTER TABLE deyimler ADD COLUMN IF NOT EXISTS image_filename TEXT;

-- Otomatik doldur: deyim metninden dosya adı türet (slash temizle, çift alt çizgi düzelt)
UPDATE deyimler
SET image_filename = REGEXP_REPLACE(
  REPLACE(REPLACE(LOWER(deyim), ' ', '_'), '/', ''),
  '_+', '_', 'g'
) || '.png'
WHERE image_filename IS NULL;
