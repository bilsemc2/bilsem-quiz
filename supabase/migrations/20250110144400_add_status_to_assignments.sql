-- Assignments tablosuna status kolonu ekle
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Mevcut kayıtları güncelle
UPDATE assignments
SET status = 'pending'
WHERE status IS NULL;

-- Status için geçerli değerler kısıtlaması ekle
ALTER TABLE assignments
ADD CONSTRAINT assignments_status_check
CHECK (status IN ('pending', 'completed'));
