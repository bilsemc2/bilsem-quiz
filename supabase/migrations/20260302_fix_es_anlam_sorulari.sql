-- es_anlam_sorulari düzeltmeleri
-- Tarih: 2026-03-02

-- 1. Tuvalet/Hela sorularını kaldır (çocuklar için uygunsuz)
DELETE FROM public.es_anlam_sorulari WHERE id IN (267, 360);

-- 2. Cin → Cins (eş anlamı "tür" doğru olsun)
UPDATE public.es_anlam_sorulari SET kelime = 'Cins' WHERE id = 254;

-- 3. Yanlış eş anlamlar
UPDATE public.es_anlam_sorulari SET secenek_b = 'mesela', es_anlami = 'mesela' WHERE id = 526;
UPDATE public.es_anlam_sorulari SET secenek_c = 'tertip', es_anlami = 'tertip' WHERE id = 677;

-- 4. Kelime tekrarları (kelime kendisi seçenekte)
UPDATE public.es_anlam_sorulari SET secenek_a = 'Bellek' WHERE id = 79;
UPDATE public.es_anlam_sorulari SET secenek_a = 'Sürekli' WHERE id = 470;
UPDATE public.es_anlam_sorulari SET secenek_d = 'cenk' WHERE id = 604;

-- 5. Birleşik yazım hataları — paraakça
UPDATE public.es_anlam_sorulari SET secenek_d = 'para, akça', es_anlami = 'para, akça' WHERE id = 272;

-- 6. Birleşik yazım hataları — kuvvetzor (4 yer)
UPDATE public.es_anlam_sorulari SET secenek_b = 'kuvvet, zor' WHERE id = 228;
UPDATE public.es_anlam_sorulari SET secenek_a = 'kuvvet, zor', es_anlami = 'kuvvet, zor' WHERE id = 534;
UPDATE public.es_anlam_sorulari SET secenek_d = 'kuvvet, zor' WHERE id = 545;

-- 7. Birleşik yazım hataları — hayatömür (5 yer)
UPDATE public.es_anlam_sorulari SET secenek_d = 'hayat, ömür' WHERE id = 153;
UPDATE public.es_anlam_sorulari SET secenek_b = 'hayat, ömür' WHERE id = 197;
UPDATE public.es_anlam_sorulari SET secenek_b = 'hayat, ömür' WHERE id = 407;
UPDATE public.es_anlam_sorulari SET secenek_a = 'hayat, ömür', es_anlami = 'hayat, ömür' WHERE id = 613;

-- 8. Birleşik yazım hataları — istikbalati → istikbal (4 yer)
UPDATE public.es_anlam_sorulari SET secenek_d = 'istikbal' WHERE id = 28;
UPDATE public.es_anlam_sorulari SET secenek_d = 'istikbal' WHERE id = 313;
UPDATE public.es_anlam_sorulari SET secenek_c = 'istikbal', es_anlami = 'istikbal' WHERE id = 582;

-- 9. Birleşik yazım hataları — cimripinti → cimri, pinti (4 yer)
UPDATE public.es_anlam_sorulari SET secenek_b = 'cimri, pinti' WHERE id = 117;
UPDATE public.es_anlam_sorulari SET secenek_b = 'cimri, pinti', es_anlami = 'cimri, pinti' WHERE id = 487;
UPDATE public.es_anlam_sorulari SET secenek_d = 'cimri, pinti' WHERE id = 663;

-- 10. helawc kalan → hela (WC)
UPDATE public.es_anlam_sorulari SET secenek_c = 'hela (WC)' WHERE id = 639;

-- 11. serseri(aylak) → serseri, aylak
UPDATE public.es_anlam_sorulari SET secenek_d = 'serseri, aylak', es_anlami = 'serseri, aylak' WHERE id = 452;
