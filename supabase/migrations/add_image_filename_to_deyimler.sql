-- Deyimler tablosuna image_filename kolonu ekle
ALTER TABLE deyimler ADD COLUMN IF NOT EXISTS image_filename TEXT;

-- Otomatik doldur: deyim metninden dosya adı türet
UPDATE deyimler
SET image_filename = LOWER(REPLACE(deyim, ' ', '_')) || '.png'
WHERE image_filename IS NULL;
