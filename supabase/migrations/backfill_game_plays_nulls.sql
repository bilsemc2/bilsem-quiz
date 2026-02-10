-- Backfill: game_plays tablosundaki null workshop_type ve intelligence_type alanlarını doldur
-- Bu migration, daha önce intelligenceTypes.ts'te eksik olan game_id eşleştirmelerini düzeltir

-- ==========================================
-- Bireysel Değerlendirme (2. Aşama) Oyunları
-- ==========================================

-- İşitsel Bellek (eski game_id: isitsel-bellek)
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Çalışma Belleği'
WHERE game_id = 'isitsel-bellek' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- İşitsel Hafıza (isitsel-hafiza)
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Çalışma Belleği'
WHERE game_id = 'isitsel-hafiza' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Renk Algılama
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Görsel Algı'
WHERE game_id = 'renk-algilama' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Renk Sekans
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Görsel Hafıza'
WHERE game_id = 'renk-sekans' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Sinyal Toplamı
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Seçici Dikkat'
WHERE game_id = 'sinyal-toplami' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Kozmik Hafıza
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Çalışma Belleği'
WHERE game_id = 'kozmik-hafiza' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- N-Geri Şifresi
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Çalışma Belleği'
WHERE game_id = 'n-geri-sifresi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Gölge Dedektifi
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Görsel Algı'
WHERE game_id = 'golge-dedektifi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Çapraz Eşleşme
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Çalışma Belleği'
WHERE game_id = 'capraz-eslesme' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Hedef Sayı
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Çalışma Belleği'
WHERE game_id = 'hedef-sayi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Akışkan Toplam
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Akıcı Zeka'
WHERE game_id = 'akiskan-toplam' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Görünmez Kule
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Sayısal Zeka'
WHERE game_id = 'gorunmez-kule' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Matris Yankısı
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Mantıksal Zeka'
WHERE game_id = 'matris-yankisi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Yansıma Toplamı
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Çalışma Belleği'
WHERE game_id = 'yansima-toplami' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Deyimler
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Sözel Zeka'
WHERE game_id = 'deyimler' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Labirent
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Motor Koordinasyon'
WHERE game_id = 'labirent' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Stroop Renk
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Bilişsel Esneklik'
WHERE game_id = 'stroop-renk' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Stroop Yön
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Uzamsal Dikkat'
WHERE game_id = 'stroop-yon' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Stroop Emoji
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Bilişsel Esneklik'
WHERE game_id = 'stroop-emoji' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Stroop Kalem
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Seçici Dikkat'
WHERE game_id = 'stroop-kalem' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Şekil Hafızası
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Görsel Hafıza'
WHERE game_id = 'sekil-hafizasi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Çift Mod Hafıza
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Çalışma Belleği'
WHERE game_id = 'cift-mod-hafiza' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Sayısal Dizi
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Sayısal Zeka'
WHERE game_id = 'sayisal-dizi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Sözel Analoji
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Sözel Zeka'
WHERE game_id = 'sozel-analoji' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Eş Anlam
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Sözel Zeka'
WHERE game_id = 'es-anlam' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Cümle İçi Eş Anlam
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Sözel Zeka'
WHERE game_id = 'cumle-ici-es-anlam' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Simge Kodlama
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Seçici Dikkat'
WHERE game_id = 'simge-kodlama' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Görsel Tarama
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Seçici Dikkat'
WHERE game_id = 'gorsel-tarama' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Sayısal Hafıza
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Çalışma Belleği'
WHERE game_id = 'sayisal-hafiza' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Tepki Süresi
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'İşleme Hızı'
WHERE game_id = 'tepki-suresi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Yüz İfadesi
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Görsel Algı'
WHERE game_id = 'yuz-ifadesi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Puzzle Master
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Görsel Algı'
WHERE game_id = 'puzzle-master' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Bilgi Kartları
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Sözel Zeka'
WHERE game_id = 'bilgi-kartlari-bosluk-doldur' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Hikaye Quiz
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Sözel Zeka'
WHERE game_id = 'hikaye-quiz' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Sayısal Şifre
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Mantıksal Zeka'
WHERE game_id = 'sayisal-sifre' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Gürültü Filtresi
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Seçici Dikkat'
WHERE game_id = 'gurultu-filtresi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Sayı Sihirbazı
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Çalışma Belleği'
WHERE game_id = 'sayi-sihirbazi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Matris Bulmaca
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Mantıksal Zeka'
WHERE game_id = 'matris-bulmaca' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Sembol Arama
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Seçici Dikkat'
WHERE game_id = 'sembol-arama' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Dikkat ve Kodlama
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'İşleme Hızı'
WHERE game_id = 'dikkat-ve-kodlama' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Desen Boyama (bireysel oyun)
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Görsel-Uzamsal Zeka'
WHERE game_id = 'desen-boyama' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Görsel Cebir Dengesi
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Mantıksal Zeka'
WHERE game_id = 'gorsel-cebir-dengesi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- PatternIQ Express
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Mantıksal Zeka'
WHERE game_id = 'patterniq-express' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Konum Bulmaca
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Görsel-Uzamsal Zeka'
WHERE game_id = 'konum-bulmaca' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- MindMatch Örüntü
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Mantıksal Zeka'
WHERE game_id = 'mindmatch-oruntu' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Mantık Bulmacası
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Mantıksal Zeka'
WHERE game_id = 'mantik-bulmacasi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Son Harf Ustası
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Sözel Zeka'
WHERE game_id = 'son-harf-ustasi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Koşullu Yönerge
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Mantıksal Zeka'
WHERE game_id = 'kosullu-yonerge' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Yaratık Mantığı
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Mantıksal Zeka'
WHERE game_id = 'yaratik-mantigi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- ==========================================
-- Tablet Değerlendirme (1. Aşama) Oyunları
-- ==========================================

-- Parça Bütün
UPDATE game_plays
SET workshop_type = 'tablet', intelligence_type = 'Görsel-Uzamsal Zeka'
WHERE game_id = 'parca-butun' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Rotasyon Matrisi
UPDATE game_plays
SET workshop_type = 'tablet', intelligence_type = 'Görsel-Uzamsal Zeka'
WHERE game_id = 'rotasyon-matrisi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Sihirli Küpler
UPDATE game_plays
SET workshop_type = 'tablet', intelligence_type = 'Görsel-Uzamsal Zeka'
WHERE game_id = 'sihirli-kupler' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- ==========================================
-- Arcade Oyunları
-- ==========================================

-- Karanlık Labirent
UPDATE game_plays
SET workshop_type = 'arcade', intelligence_type = 'Görsel-Uzamsal Zeka'
WHERE game_id = 'arcade-dark-maze' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Neşeli Balonlar
UPDATE game_plays
SET workshop_type = 'arcade', intelligence_type = 'Görsel Hafıza'
WHERE game_id = 'neseli-balonlar' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Arcade Labirent Ustası
UPDATE game_plays
SET workshop_type = 'arcade', intelligence_type = 'Görsel-Uzamsal Zeka'
WHERE game_id = 'arcade-labirent-ustasi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Renkli Balon
UPDATE game_plays
SET workshop_type = 'arcade', intelligence_type = 'Seçici Dikkat'
WHERE game_id = 'renkli-balon' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Kart Dedektifi
UPDATE game_plays
SET workshop_type = 'arcade', intelligence_type = 'Mantıksal Zeka'
WHERE game_id = 'kart-dedektifi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Örüntülü Top
UPDATE game_plays
SET workshop_type = 'arcade', intelligence_type = 'Akıcı Zeka'
WHERE game_id = 'oruntulu-top' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Kraft Origami
UPDATE game_plays
SET workshop_type = 'arcade', intelligence_type = 'Görsel-Uzamsal Zeka'
WHERE game_id = 'arcade-kraft-origami' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Ayna Ustası
UPDATE game_plays
SET workshop_type = 'arcade', intelligence_type = 'Görsel-Uzamsal Zeka'
WHERE game_id = 'arcade-ayna-ustasi' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Ters Navigatör
UPDATE game_plays
SET workshop_type = 'arcade', intelligence_type = 'Bilişsel Esneklik'
WHERE game_id = 'ters-navigator' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Chromabreak
UPDATE game_plays
SET workshop_type = 'arcade', intelligence_type = 'Görsel Hafıza'
WHERE game_id = 'chromabreak' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Yol Bulmaca
UPDATE game_plays
SET workshop_type = 'arcade', intelligence_type = 'Çalışma Belleği'
WHERE game_id = 'yol-bulmaca' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Renkli Lambalar
UPDATE game_plays
SET workshop_type = 'arcade', intelligence_type = 'Görsel Hafıza'
WHERE game_id = 'renkli-lambalar' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Chroma Hafıza 3D
UPDATE game_plays
SET workshop_type = 'arcade', intelligence_type = 'Görsel Hafıza'
WHERE game_id = 'arcade-chroma-hafiza' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- Sevimli Mantık
UPDATE game_plays
SET workshop_type = 'arcade', intelligence_type = 'Mantıksal Zeka'
WHERE game_id = 'arcade-sevimli-mantik' AND (workshop_type IS NULL OR intelligence_type IS NULL);

-- ==========================================
-- Eski/Kaldırılmış Oyunlar
-- ==========================================

-- Pattern Pop (eski oyun, artık aktif değil)
UPDATE game_plays
SET workshop_type = 'bireysel', intelligence_type = 'Mantıksal Zeka'
WHERE game_id = 'pattern-pop' AND (workshop_type IS NULL OR intelligence_type IS NULL);
