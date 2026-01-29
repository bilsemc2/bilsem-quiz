-- BİLSEM Blog Yazıları Hatalı Slug Düzeltmeleri
-- Sorun: generate_slug() fonksiyonu büyük harf Türkçe karakterleri dönüştürmüyordu
-- Tarih: 2026-01-29

-- =====================================================
-- 1. generate_slug() fonksiyonunu düzelt
-- =====================================================
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  result := title;
  
  -- Büyük harf Türkçe karakterleri önce dönüştür
  result := REGEXP_REPLACE(result, 'İ', 'i', 'g');
  result := REGEXP_REPLACE(result, 'I', 'i', 'g');
  result := REGEXP_REPLACE(result, 'Ğ', 'g', 'g');
  result := REGEXP_REPLACE(result, 'Ü', 'u', 'g');
  result := REGEXP_REPLACE(result, 'Ş', 's', 'g');
  result := REGEXP_REPLACE(result, 'Ö', 'o', 'g');
  result := REGEXP_REPLACE(result, 'Ç', 'c', 'g');
  
  -- Küçük harf Türkçe karakterleri
  result := REGEXP_REPLACE(result, 'ı', 'i', 'g');
  result := REGEXP_REPLACE(result, 'ğ', 'g', 'g');
  result := REGEXP_REPLACE(result, 'ü', 'u', 'g');
  result := REGEXP_REPLACE(result, 'ş', 's', 'g');
  result := REGEXP_REPLACE(result, 'ö', 'o', 'g');
  result := REGEXP_REPLACE(result, 'ç', 'c', 'g');
  
  -- Küçük harfe çevir
  result := LOWER(result);
  
  -- Özel karakterleri temizle
  result := REGEXP_REPLACE(result, '[^a-z0-9\s-]', '', 'g');
  
  -- Boşlukları tire yap
  result := REGEXP_REPLACE(result, '\s+', '-', 'g');
  
  -- Birden fazla tireyi teke indir
  result := REGEXP_REPLACE(result, '-+', '-', 'g');
  
  -- Baş ve sondaki tireleri temizle
  result := TRIM(BOTH '-' FROM result);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 2. Mevcut hatalı slug'ları düzelt
-- =====================================================

-- BİLSEM kelimesi bozuk olanlar
UPDATE blog_posts SET slug = 'bilsem-sinavlarina-hazirlikta-yeni-nesil-platform' WHERE slug = 'blsem-sinavlarina-hazirlikta-yeni-nesil-platform';
UPDATE blog_posts SET slug = 'karabukten-dunyaya-siber-kalkan-bilsem-ogrencilerinden-tarihi-basari' WHERE slug = 'karabkten-dnyaya-siber-kalkan-blsem-rencilerinden-tarihi-baar';
UPDATE blog_posts SET slug = 'genc-mucitlerden-hayata-tutunma-cagrisi-bilsemden-deprem-icin-hayatta-kalma-destek-bilekligi' WHERE slug = 'gen-mucitlerden-hayata-tutunma-ars-blsemden-deprem-in-hayatta-kalma-destek-bileklii';
UPDATE blog_posts SET slug = 'bilsem-2-asama-tuzo-maratonu' WHERE slug = 'blsem-2-asama-tuz-maratonu';
UPDATE blog_posts SET slug = 'bilsem-sinavlarina-calismak-gerekir-mi-gerekmez-mi' WHERE slug = 'blsem-snavlarna-almak-gerekir-mi-gerekmez-mi';
UPDATE blog_posts SET slug = 'ucretsiz-bilsem-deneme-sinavlari-2026-tablet-ve-tuzo-formatina-uygun-en-kapsamli-kaynaklar' WHERE slug = 'ucretsiz-blsem-deneme-sinavlari-2026-tablet-ve-tuz-formatina-uygun-en-kapsamli-kaynaklar';
UPDATE blog_posts SET slug = 'bilsem-sinavi-nedir-ve-2026-doneminde-nasil-basvurulur-veliler-icin-tam-kapsamli-rehber' WHERE slug = 'blsem-sinavi-nedir-ve-2026-doneminde-nasil-basvurulur-veliler-cin-tam-kapsamli-rehber';
UPDATE blog_posts SET slug = '2025-bilsem-bireysel-degerlendirme-sonuclari-aciklandi' WHERE slug = '2025-blsem-bireysel-degerlendirme-sonuclari-aciklandi';
UPDATE blog_posts SET slug = 'afyonkarahisar-dumlupinar-bilim-ve-sanat-merkezi-bilsem-ogrencisi-asli-kilcinin-hikayesi' WHERE slug = 'afyonkarahisar-dumlupinar-bilim-ve-sanat-merkezi-blsem-ogrencisi-asli-kilcinin-hikayesi';
UPDATE blog_posts SET slug = 'bilsem-sinavina-nasil-hazirlanilir-2026-icin-taktikler-ve-en-iyi-dijital-kaynaklar' WHERE slug = 'blsem-sinavina-nasil-hazirlanilir-2026-cin-taktikler-ve-en-yi-dijital-kaynaklar';
UPDATE blog_posts SET slug = 'bilsem-mi-ozel-okul-mu-ustun-yetenekli-cocugunuz-icin-dogru-yol-haritasi' WHERE slug = 'blsem-mi-zel-okul-mu-stun-yetenekli-ocugunuz-cin-dogru-yol-haritasi';
UPDATE blog_posts SET slug = 'bilsem-kazandiktan-sonra-ne-olur-2026-kayit-sureci-ve-egitim-yolculugu' WHERE slug = 'blsem-kazandiktan-sonra-ne-olur-2026-kayit-sureci-ve-egitim-yolculugu';
UPDATE blog_posts SET slug = 'yeni-nesil-bilsem-muzik-yetenek-testi-dijital-ekosistemle-gelecegin-muzisyenlerini-kesfedin' WHERE slug = 'yeni-nesil-blsem-muzik-yetenek-testi-dijital-ekosistemle-gelecegin-muzisyenlerini-kesfedin';
UPDATE blog_posts SET slug = 'bilseme-kimler-girebilir-2026-basvuru-sartlari-ve-aday-gosterme-sureci' WHERE slug = 'blseme-kimler-girebilir-2026-basvuru-sartlari-ve-aday-gosterme-sureci';

-- TÜZÖ kelimesi bozuk olanlar
UPDATE blog_posts SET slug = 'tuzo-tubitak-ustun-zekalilar-ve-yetenekliler-olcegi' WHERE slug = 'tzo-tbtak-stun-zekalilar-ve-yetenekliler-lcegi';

-- Türkçe karakter sorunlu diğer slug'lar
UPDATE blog_posts SET slug = 'uzamsal-zeka-zihninizdeki-gizli-super-guc' WHERE slug = 'uzamsal-zeka-zihninizdeki-gizli-sper-g';
UPDATE blog_posts SET slug = 'kucuk-kalpler-icin-buyuk-enerji-sirri' WHERE slug = 'kk-kalpler-in-byk-enerji-srr';
UPDATE blog_posts SET slug = 'bilsemc2-ogretmen-portali' WHERE slug = 'bilsemc2-gretmen-portali';
UPDATE blog_posts SET slug = 'corumdan-yukselen-isik-gorme-engelliler-icin-3-boyutlu-egitim-devrimi' WHERE slug = 'orumdan-ykselen-ik-grme-engelliler-in-3-boyutlu-eitim-devrimi';
UPDATE blog_posts SET slug = '2025-lgs-tam-puan-alan-ogrenciler-ve-okullari-hakkinda-kapsamli-rapor' WHERE slug = '2025-lgs-tam-puan-alan-renciler-ve-okullar-hakknda-kapsaml-rapor';
UPDATE blog_posts SET slug = 'eratosthenes-ve-dunyanin-cevresini-olcen-adam' WHERE slug = 'eratosthenes-ve-dunyanin-evresini-lcen-adam';

-- Diğer Türkçe karakter hataları (İ, Ç, Ğ, Ö, Ş, Ü bozuk olanlar)
UPDATE blog_posts SET slug = 'sudoku-ve-zeka-gelisimi' WHERE slug = 'sudoku-ve-zek-gelisimi';
UPDATE blog_posts SET slug = 'yapay-zeka-caginda-cocuklarimizi-gelecegin-mesleklerine-nasil-hazirlamaliyiz' WHERE slug = 'yapay-zeka-aginda-ocuklarimizi-gelecegin-mesleklerine-nasil-hazirlamaliyiz';
UPDATE blog_posts SET slug = 'akran-ogrenmesi-birlikte-daha-hizli-ve-etkili-ogrenmek' WHERE slug = 'akran-grenmesi-birlikte-daha-hizli-ve-etkili-grenmek';
UPDATE blog_posts SET slug = 'turkiyede-cocuk-universiteleri' WHERE slug = 'turkiyede-ocuk-niversiteleri';
UPDATE blog_posts SET slug = 'ogretmenlerin-kiyafetlerinin-ogrenci-davranislari-ve-algilari-uzerindeki-etkisi' WHERE slug = 'gretmenlerin-kiyafetlerinin-ogrenci-davranislari-ve-algilari-uzerindeki-etkisi';
UPDATE blog_posts SET slug = 'labirent-oyunlari-ve-zeka-gelisimi' WHERE slug = 'labirent-oyunlari-ve-zek-gelisimi';
UPDATE blog_posts SET slug = 'turkiye-iq-ortalamasi' WHERE slug = 'trkiye-iq-ortalamas';
UPDATE blog_posts SET slug = 'insan-vucudundaki-zarlar-kucuk-kasifler-icin-rehber' WHERE slug = 'nsan-vcudundaki-zarlar-kk-kaiflere-rehber';
UPDATE blog_posts SET slug = 'oyun-bosa-gecen-zaman-mi-yoksa-beynin-en-ciddi-isi-mi' WHERE slug = 'oyun-bosa-gecen-zaman-mi-yoksa-beynin-en-ciddi-si-mi';
UPDATE blog_posts SET slug = '2026-lgs-veli-rehberi-cocugunuzun-basarisi-icin-stratejik-yol-haritasi' WHERE slug = '2026-lgs-veli-rehberi-ocugunuzun-basarisi-cin-stratejik-yol-haritasi';
UPDATE blog_posts SET slug = 'sevgi-sadece-bir-duygu-degil-beynin-mimaridir-ilk-5-yilin-bilimsel-sirri' WHERE slug = 'sevgi-sadece-bir-duygu-degil-beynin-mimaridir-lk-5-yilin-bilimsel-sirri';
UPDATE blog_posts SET slug = 'tetris-ve-zeka-iliskisi' WHERE slug = 'tetris-ve-zeka-likisi';
UPDATE blog_posts SET slug = '0-5-yas-arasi-cocuklar-icin-super-beyin-rehberi' WHERE slug = '0-5-yas-arasi-ocuklar-cin-super-beyin-rehberi';
UPDATE blog_posts SET slug = 'zeki-misiniz-yoksa-zekanizi-henuz-kesfetmediniz-mi' WHERE slug = 'zeki-misiniz-yoksa-zeknizi-henuz-kesfetmediniz-mi';
UPDATE blog_posts SET slug = 'bilsem-sinavi-2025-veli-ve-ogrenci-deneyimleri' WHERE slug = 'bilsem-sinavi-2025-veli-ve-grenci-deneyimleri';
UPDATE blog_posts SET slug = 'cocugum-ustun-zekali-mi' WHERE slug = 'ocugum-stun-zekali-mi';
UPDATE blog_posts SET slug = 'karanlik-oksijen' WHERE slug = 'karanlk-oksijen';
UPDATE blog_posts SET slug = 'zeka-testindeki-garip-sorunun-sirri' WHERE slug = 'zeka-testindeki-garip-sorunun-srr';
UPDATE blog_posts SET slug = 'tuzo-turkiye-zeka-olcegi-nedir' WHERE slug = 'tuz-turkiye-zeka-lcegi-nedir';
UPDATE blog_posts SET slug = 'aferin-demek-yeterli-degil-cocugunuzun-ozguvenini-yikan-8-gizli-mesaj-ve-yerine-ne-soylemelisiniz' WHERE slug = 'aferin-demek-yeterli-degil-ocugunuzun-zguvenini-yikan-8-gizli-mesaj-ve-yerine-ne-soylemelisiniz';
UPDATE blog_posts SET slug = 'keske-cocugum-3-yasina-gelmeden-once-bilseydim-her-ebeveynin-ihtiyac-duydugu-10-hayati-ders' WHERE slug = 'keske-ocugum-3-yasina-gelmeden-nce-bilseydim-her-ebeveynin-htiyac-duydugu-10-hayati-ders';
UPDATE blog_posts SET slug = 'davranis-sorunu-degil-beyin-sagligi-sorunu-cocugunuzu-anlamanin-biyolojik-anahtari' WHERE slug = 'davranis-sorunu-degil-beyin-sagligi-sorunu-ocugunuzu-anlamanin-biyolojik-anahtari';
UPDATE blog_posts SET slug = 'oxford-kuantum-bilisim' WHERE slug = 'oxford-kuantum-biliim';
UPDATE blog_posts SET slug = 'kanser-gerilemesinde-yeni-bir-donem' WHERE slug = 'kanser-gerilemesinde-yeni-bir-dnem';
UPDATE blog_posts SET slug = '2024-2025-bilim-ve-sanat-merkezleri-ogrenci-tanilama-ve-yerlestirme-takvimi' WHERE slug = '2024-2025-blm-ve-sanat-merkezler-renc-tanilama-ve-yerletrme-takvm';
UPDATE blog_posts SET slug = 'cocugunuz-icin-dogru-kitabi-secin-ilkokul-kitap-onerileri-ve-yazarlar' WHERE slug = 'ocuunuz-in-doru-kitab-sein-lkokul-kitap-nerileri-ve-yazarlar';
UPDATE blog_posts SET slug = 'gcat-psikolojik-olcme-araci-gelistirilmesi' WHERE slug = 'gcat-psikolojik-lcme-araci-gelistirilmesi';

-- =====================================================
-- 3. Sonuç kontrolü
-- =====================================================
-- Düzeltme tamamlandıktan sonra sitemap.xml'i yeniden oluşturun:
-- npm run generate-sitemap
