-- ============================================================================
-- DEYIMLER ÇOCUK GÜVENLİĞİ FİLTRESİ
-- Yaklaşım: Whitelist — Önce tümü engellenir, sonra sadece
-- Türkiye'de çocuklara en sık öğretilen 100 deyim açılır.
-- Kaynak: MEB Türkçe ders kitapları (3-8. sınıf) müfredatı
-- ============================================================================

-- 1) Kolonu ekle (yoksa)
ALTER TABLE public.deyimler ADD COLUMN IF NOT EXISTS child_safe BOOLEAN DEFAULT false;

-- 2) Önce TÜM deyimleri kapat
UPDATE public.deyimler SET child_safe = false;

-- 3) Sadece çocuklar için uygun 100 deyimi aç
UPDATE public.deyimler SET child_safe = true WHERE id IN (
  -- ═══════════ DUYGULAR & KARAKTERİSTİK ═══════════
  17,  -- Açık alınla: Başarı, şeref ve dürüstlükle
  18,  -- Açık fikirli: Yeniliklere açık, anlayışlı kimse
  19,  -- Açık kalpli / yürekli: Samimi, içi dışı bir olan
  20,  -- Açık seçik: Çok açık, çok belirgin
  40,  -- Ağır başlı: Ciddi, olgun, ölçülü kimse
  55,  -- Ağzı var dili yok: Sessiz, sakin, kendi hâlinde
  897, -- Geniş gönüllü: Telâş göstermeyen, hoş karşılayan
  985, -- Gözü tok: Paraya düşkün olmayan, cömert
  972, -- Gözü açık: Uyanık, becerikli, zeki

  -- ═══════════ SEVİNÇ & MUTLULUK ═══════════
  53,  -- Ağzı kulaklarına varmak: Çok sevinmek
  841, -- Etekleri zil çalmak: Çok sevinmek
  910, -- Göğsü kabarmak: Övünç duymak
  971, -- Gözlerinin içi gülmek: Sevindiğini belli etmek
  1005, -- Güllük gülistanlık: Neşe ve huzur içinde
  2144, -- Yüzü gülmek: Sevinci yüzünden anlaşılmak

  -- ═══════════ ÜZÜNTÜ & ŞAŞKINLİK ═══════════
  577, -- Buz kesilmek: Üzücü olay karşısında donup kalmak
  968, -- Gözleri yaşarmak: Duygulanıp gözlerinden yaş gelmek
  1072, -- Hayal kırıklığı: Umduğu şeyin gerçekleşmemesinden üzüntü
  964, -- Gözleri fal taşı gibi açılmak: Çok şaşırmak
  1589, -- Parmak ısırmak: Büyük şaşkınlık duymak
  1006, -- Gülmekten kırılmak: Çok gülmekten halsiz düşmek

  -- ═══════════ KONUŞMA & İLETİŞİM ═══════════
  54,  -- Ağzı laf yapmak: Güzel konuşma yeteneği
  60,  -- Ağzında bakla ıslanmamak: Sır saklayamamak
  61,  -- Ağzından bal akmak: Çok tatlı konuşmak
  63,  -- Ağzından düşürmemek: Her zaman söz etmek
  65,  -- Ağzından kaçırmak: İstemeden söyleyivermek
  68,  -- Ağzını bıçak açmamak: Üzüntüden konuşamaz olmak
  581, -- Bülbül gibi konuşmak: Kolaylıkla konuşmak
  679, -- Dil dökmek: Tatlı sözlerle ikna etmek
  683, -- Dile getirmek: Bir meseleyi belirtmek, anlatmak
  686, -- Dili dönmemek: Doğru düzgün söyleyememe
  688, -- Dili tutulmak: Konuşamaz duruma gelmek
  692, -- Dilinde tüy bitmek: Söylemekten bıkmak
  680, -- Dil uzatmak: Kötü söz söylemek
  1735, -- Sözü ağzında bırakmak: Konuşmasını yarıda kesmek
  1728, -- Söz dinlemek: Öğüdü tutmak, uymak

  -- ═══════════ ÇALIŞMA & GAYRET ═══════════
  91,  -- Akla karayı seçmek: Çok yorulmak, zahmet çekmek
  132, -- Alnının akıyla: Şerefiyle başarma
  142, -- Altından kalkmak: Zorluğu yenip başarmak
  616, -- Canını dişine takmak: Büyük zorluklara katlanarak çalışmak
  620, -- Canla başla: Seve seve, var gücüyle
  709, -- Dişini sıkmak: Sıkıntıya dayanmak
  710, -- Dişini tırnağına takmak: Çok zorlukla çalışmak
  726, -- Dört elle sarılmak: İşe önem verip girişmek
  735, -- Durup dinlenmeden: Sürekli, ara vermeden
  774, -- El emeği: Elle yapılan emeğin değeri
  820, -- Emek vermek: Özenle ve çok çalışmak
  950, -- Göz nuru dökmek: Göz emeği harcamak

  -- ═══════════ AKIL & DÜŞÜNME ═══════════
  90,  -- Akıntıya kürek çekmek: Boşuna çaba sarf etmek
  92,  -- Aklı başına gelmek: Uslanıp akıllıca davranmak
  101, -- Aklına gelmek: Hatırlamak, düşünmek
  106, -- Aklını başına almak: Akıllıca bir yola girmek
  143, -- Altını çizmek: Önemini belirtmek, vurgulamak
  175, -- Armut piş, ağzıma düş: Hazıra konmak istemek
  641, -- Dağ doğura doğura fare doğurdu: Büyük beklentiden küçük sonuç
  865, -- Fikir vermek: Düşüncesini bildirmek, yol göstermek
  1095, -- Hesaba katmak: Göz önünde bulundurmak
  1330, -- Kılı kırk yarmak: Çok titiz davranmak
  1587, -- Parmak basmak: Bir nokta üzerine dikkati çekmek

  -- ═══════════ GÖZLEM & DİKKAT ═══════════
  931, -- Göz açıp kapayıncaya kadar: Çok çabuk, kısa zamanda
  935, -- Göz bebeği: Pek değerli, çok önem verilen kimse
  938, -- Göz gezdirmek: Şöyle bir bakıvermek
  949, -- Göz kulak olmak: Korumak, gözetmek
  956, -- Gözden geçirmek: İncelemek, durumu anlamak
  958, -- Gözden kaçmak: Farkına varılmamak
  960, -- Göze almak: Tehlikeyi önceden kabullenmek
  974, -- Gözü arkada kalmak: Bıraktığı şeyle ilgili merak etmek
  978, -- Gözü gibi sakınmak: Çok koruyup gözetmek
  995, -- Gözünü açmak: Uyanık, dikkatli olmak
  996, -- Gözünü ayırmamak: Devamlı bakmak
  1371, -- Kulağına küpe olmak: Yaşadığından ders almak
  1373, -- Kulak asmamak: Önemsememek, dinlememek
  1375, -- Kulak kabartmak: Gizlice dinlemeye çalışmak

  -- ═══════════ İLİŞKİ & DEĞER VERME ═══════════
  226, -- Ayak uydurmak: Uyum sağlamak
  253, -- Bal gibi: Pekâlâ, çok iyi
  284, -- Baş tacı etmek: Büyük saygı göstermek
  355, -- Bel bağlamak: Güvenmek, inanmak
  535, -- Boyun eğmek: İstemeye istemeye kabul etmek
  575, -- Burun kıvırmak: Beğenmemek, küçümsemek
  727, -- Dudak bükmek: Umursamamak, küçümsemek
  781, -- El üstünde tutulmak: Çok değer verilmek
  788, -- Elden ele dolaşmak: Pek çok kişi tarafından kullanılmak
  922, -- Gönül almak: Sevindirmek, hoşnut etmek
  1004, -- Gücüne gitmek: Onuruna dokunmak
  1007, -- Gülüp geçmek: Umursamamak, aldırış etmemek
  1260, -- Kanat germek: Birini korumak, gözetimi altına almak

  -- ═══════════ GENEL YAŞAM ═══════════
  232, -- Ayıkla pirincin taşını: İçinden çıkılması güç iş
  280, -- Baş göstermek: Ortaya çıkmak, belirmek
  301, -- Başı dik: Onurlu
  331, -- Başından geçmek: O olayı yaşamış olmak
  476, -- Bir taşla iki kuş vurmak: İki yararlı sonuç elde etmek
  647, -- Dal budak salmak: Yayılıp genişlemek
  725, -- Dört dönmek: Telâşla sağa sola koşmak
  769, -- El atmak: Bir işe girişmek
  1493, -- Ne pahasına olursa olsun: Her türlü zorluğu göze alarak
  1521, -- Omuz omuza: Dayanışarak, yan yana
  1830, -- Taşı gediğine koymak: Tam zamanında uygun sözü söylemek
  2080, -- Yol göstermek: Rehberlik etmek
  2137, -- Yüz yüze gelmek: Karşılaşmak, bir araya gelmek
  288  -- Başa çıkmak: Gücünü kanıtlamak
);
