-- Add new skill_area enum values for Genel Yetenek sub-categories
-- Bu migration, Genel Yetenek'in Tablet ve Bireysel alt kategorilerini ekler

-- PostgreSQL'de enum'a yeni değer ekleme
ALTER TYPE skill_area ADD VALUE IF NOT EXISTS 'genel yetenek - tablet';
ALTER TYPE skill_area ADD VALUE IF NOT EXISTS 'genel yetenek - bireysel';

-- NOT: Bu değişikliklerin etkili olması için veritabanını yeniden başlatmanız gerekebilir.
-- Ayrıca, bu işlem geri alınamaz (PostgreSQL'de enum değerleri silinemez).
