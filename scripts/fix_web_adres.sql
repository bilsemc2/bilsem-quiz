-- Rakamla başlayan web_adres değerlerini düzelt
-- Örnek: 770506.meb.k12.tr -> safranbolubilsem.meb.k12.tr
-- Slug'ın ilk kelimesi + 'bilsem.meb.k12.tr' formatına çevir

UPDATE public.bilsem_kurumlari
SET web_adres = 
  REPLACE(
    LOWER(
      SPLIT_PART(slug, '-', 1) -- slug'ın ilk kelimesi (örn: safranbolu)
    ),
    'i̇', 'i' -- Türkçe İ karakterini düzelt
  ) || 'bilsem.meb.k12.tr'
WHERE web_adres ~ '^\d+\.meb\.k12\.tr$'; -- Sadece rakamla başlayanlar

-- Kaç kayıt etkilendi kontrol et
-- SELECT kurum_adi, web_adres, slug 
-- FROM public.bilsem_kurumlari 
-- WHERE web_adres ~ '^\d+\.meb\.k12\.tr$';
