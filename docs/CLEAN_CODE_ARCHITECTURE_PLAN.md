# Bilsem Quiz - Temiz Kod ve Mimari Planı

## 1) Amaç

Bu planın amacı:

- Kod tabanını sürdürülebilir hale getirmek
- Yeni özellik ekleme hızını artırmak
- Hata oranını ve regresyon riskini düşürmek
- Vite tabanlı mevcut uygulama ile olası Next geçişini kontrollü yönetmek
- İleride AI-merkezli soru üretimi ve adaptif seviyelemeyi güvenli şekilde devreye almak

---

## 2) Mevcut Durum (Özet)

Hızlı repo analizi sonucu:

- Yaklaşık `386` adet `ts/tsx` dosyası
- Yaklaşık `70k` satır TypeScript/TSX
- `src/components` altında `244` dosya (yüksek yoğunluk)
- Büyük dosya sayısı yüksek (`400+` satırlık çok sayıda bileşen)
- Supabase erişimi çok sayıda `page/component/hook` içine dağılmış
- Test dosyası neredeyse yok
- `npm run build` başarılı
- `npm run lint` başarısız (`1064` problem; önemli kısmı üretilmiş klasörlerin lint’e dahil olmasından kaynaklı)

Temel mimari sorun:

- UI + iş kuralı + veri erişimi katmanları iç içe
- Route dosyaları tek noktada büyümüş
- Oyun modülleri için tekrar eden state/timer/persistence mantığı var
- Aynı repo içinde aktif Vite uygulaması + ayrı `next-app-skeleton` bulunuyor (stratejik karar ihtiyacı)
- AI için gerekli olan soru/deneme/başarı event modeli henüz standart değil

---

## 3) Hedef Mimari

Önerilen hedef: **Modüler Monolit + Net Katman Sınırları**

```txt
src/
  app/                # bootstrap, provider composition, router shell
  shared/             # framework-agnostic utils, ui primitives, config
  entities/           # domain entity tipleri ve saf model yardımcıları
  features/
    auth/
    xp/
    ai/
      question-generation/
      adaptive-difficulty/
      quality-safety/
    games/
      brain-trainer/
      arcade/
    workshops/
    profile/
    admin/
    content/
  processes/          # çok feature'ı birleştiren akışlar
  server/
    ai/               # provider adapter, prompt orchestration, validation
    repositories/     # supabase/db erişim katmanı
```

### Katman Kuralları

- `shared` katmanı üst katmanları import etmez
- `features/*` yalnızca `shared` ve kendi alt modüllerini kullanır
- UI bileşenleri doğrudan Supabase çağrısı yapmaz
- Veri erişimi sadece `features/*/api` veya `repositories` katmanından geçer
- AI provider çağrıları doğrudan UI'dan yapılmaz; yalnızca `server/ai` katmanından yapılır
- UI/orchestration katmanında `@/lib/supabase` importu ESLint ile bloklanır; yalnızca `src/server/repositories/**` client import edebilir

### AI Tasarım İlkeleri

- Deterministik zorluk hesaplama + AI önerisi birlikte çalışır (AI tek otorite olmaz)
- AI çıktısı kullanıcıya gitmeden önce doğrulama/filtreleme katmanından geçer
- Her AI sorusu versiyonlu şablon + model metadata ile saklanır
- Fallback zorunlu: AI başarısızsa statik soru bankası devreye girer
- Kişisel veri minimizasyonu: modele yalnızca gerekli özet özellikler gönderilir

---

## 4) Fazlara Bölünmüş Yol Haritası

## Faz 0 - Stabilizasyon ve Ölçümleme (1 hafta)

Hedef: Gürültüyü temizleyip güvenli refactor zemini oluşturmak.

İşler:

1. Lint scope düzeltmesi (`dist`, `dev-dist`, `next-app-skeleton/.next`, geçici çıktılar hariç tutulacak)
2. Root script standardizasyonu:
   - `typecheck`
   - `lint`
   - `build`
   - `test` (en az smoke)
3. Package manager standardı:
   - ya tamamen `npm` ya tamamen `pnpm`
   - `.npmrc` içindeki uyumsuz anahtarlar temizlenecek
4. CI pipeline: PR’da en az `typecheck + lint + build` zorunlu

Done kriteri:

- `npm run lint` gerçek kaynak kodu hedefleyip anlamlı çıktı üretir
- CI olmadan merge edilmez

## Faz 1 - Mimari Sınırların Çizilmesi (1 hafta)

Hedef: Kod organizasyonunu geleceğe uygun şekilde standardize etmek.

İşler:

1. Klasör sözleşmesi dokümante edilir (`docs/architecture-conventions.md`)
2. Import boundary kuralları (ESLint `no-restricted-imports`)
3. `app` / `shared` / `features` tabanı oluşturulur
4. Route tanımları feature bazlı modüllere ayrılır (tek dosya/tek odak)
5. AI için `server/ai` ve `features/ai` iskeleti hazırlanır (aktif kullanılmadan)

Done kriteri:

- Yeni kod sadece yeni sözleşmeye göre eklenir
- Boundary ihlali lint hatası olur

## Faz 2 - Veri Erişimini Merkezileştirme (1-2 hafta)

Hedef: Supabase çağrılarını UI’dan ayırmak.

İşler:

1. `features/*/api` veya `repositories` katmanları eklenir
2. `pages/components` içindeki doğrudan `supabase.from(...)` çağrıları aşamalı taşınır
   - tamamlayıcı koruma: `pages/components/hooks/services/utils` altında `lib/supabase` importu lint hatası olur
3. Ortak hata/başarı sonucu tipi (`Result<T, E>`) belirlenir
4. Kritik domainlerden başlanır:
   - `auth`
   - `xp`
   - `game_plays`
   - `exam_sessions`
5. AI entegrasyonuna temel olacak olay modeli için standart DTO hazırlanır:
   - `question_attempt`
   - `session_performance`
   - `ability_snapshot`

Done kriteri:

- Yeni UI kodunda doğrudan Supabase çağrısı olmaz
- En kritik 4 domain repository katmanına taşınır

## Faz 3 - Oyun Motoru Standardizasyonu (2 hafta)

Hedef: Oyunlarda tekrar eden state yönetimini azaltmak.

İşler:

1. Ortak oyun sözleşmesi:
   - phase
   - timer
   - score
   - persistence
2. `BrainTrainer` ve `Arcade` için ortak altyapı modülleri
3. En büyük 10 oyun dosyası parçalanır:
   - container (orchestrator)
   - presentation
   - pure game logic
4. `400+` satır dosyalar için parçalama hedefi (`<=250` satır)
5. Tüm oyunlardan ortak performans sinyali çıkarımı standartlaştırılır (accuracy, response_time, streak)

Done kriteri:

- En az 10 büyük oyun dosyası modüler yapıya geçer
- Tekrarlanan yardımcılar shared utility’ye taşınır

## Faz 4 - Context Azaltma ve Domain State (1 hafta)

Hedef: Global context karmaşıklığını düşürmek.

İşler:

1. `Auth`, `XP`, `Exam`, `Sound` context sorumlulukları yeniden ayrılır
2. Side-effect yoğun kısımlar custom hook/use-case katmanına çekilir
3. Route guard (`RequireAuth`) üçe bölünür:
   - auth guard
   - role guard
   - xp gate

Done kriteri:

- Her context tek ana sorumluluğa iner
- Guard dosyaları okunabilir ve testlenebilir hale gelir

## Faz 5 - Test Stratejisi ve Güvenlik Ağı (2 hafta)

Hedef: Refactor sonrası güvenli yayın süreci.

İşler:

1. Unit test (saf fonksiyonlar, game rules)
2. Integration test (repository + domain use-case)
3. E2E smoke:
   - login
   - bir oyun oynama/kayıt
   - xp düşümü
   - sınav akışı
   - ara hedef: kaynak-seviyesi `npm run test:critical` smoke kapısı aktif tutulur
   - browser seviyesi smoke iki katmanda korunur:
     - `npm run test:e2e:anon`: public ve guard redirect davranışları
     - `npm run test:e2e:auth:mock`: deterministic mock-auth tabanı ile auth wiring
     - `npm run test:e2e:auth`: yerelde akıllı auth smoke; credential varsa gerçek, yoksa mock
     - `npm run test:e2e:auth:real`: secret varsa mock fallback kapalı, strict gerçek backend auth doğrulaması
4. Minimum coverage hedefi:
   - domain logic: `%70+`
5. Adaptif seviyeleme için simülasyon test altyapısı hazırlanır (offline replay)

Done kriteri:

- PR’da test çalışmadan merge yok
- Kritik akışlar otomasyonla doğrulanır

## Faz 6 - Performans ve Dağıtım Hijyeni (1 hafta)

Hedef: Üretim kalitesi ve bundle kontrolü.

İşler:

1. Bundle budget tanımları (`chunk` eşikleri)
2. Ağır sayfalar için daha agresif split/lazy stratejisi
3. PWA cache politikasının gözden geçirilmesi
4. Lighthouse/Web Vitals raporlama

Done kriteri:

- Aşırı büyük chunk’lar için aksiyon listesi kapanır
- Temel performans metrikleri dashboard’a alınır

## Faz 7 - AI Veri Temeli ve Güvenlik (1-2 hafta)

Hedef: AI soru üretimi için güvenli veri altyapısını kurmak.

İşler:

1. Yeni tablolar (migration ile):
   - `question_attempt_events`
   - `ability_snapshots`
   - `ai_generation_jobs`
   - `ai_questions`
2. RLS politikaları (performans odaklı):
   - policy içinde `(select auth.uid())` kullanımı
   - policy kolonlarına indeks
3. İndeks stratejisi:
   - FK kolonları için zorunlu indeks
   - en sık sorgular için composite index
4. Veri saklama politikası:
   - ham event retention
   - model prompt/response redaction kuralları

Done kriteri:

- Migration’lar geri alınabilir ve test ortamında doğrulanmış olur
- RLS + indeks doğrulaması tamamlanır

## Faz 8 - AI Soru Üretim Servisi (2-3 hafta)

Hedef: AI ile güvenli ve kontrol edilebilir soru üretmek.

İşler:

1. `server/ai/providers` altında provider abstraction:
   - `openai`
   - `gemini` (opsiyonel/fallback)
2. Prompt şablonları:
   - sınıf/seviye/oyun türü bazlı versiyonlama
3. Çıktı doğrulama katmanı:
   - JSON schema doğrulama
   - pedagojik ve içerik güvenliği filtreleri
   - tekrar/çok benzer soru deduplikasyonu
4. Yayın modeli:
   - önce `candidate` soru
   - kalite kontrol sonrası `active` soru

Done kriteri:

- AI çıktısının doğrudan kullanıcıya gitmediği güvenli akış çalışır
- Başarısız üretimde fallback soru bankası devrededir

## Faz 9 - Adaptif Seviyeleme Motoru (2 hafta)

Hedef: Kullanıcı performansına göre dinamik zorluk ayarlamak.

İşler:

1. Yetenek skoru modeli:
   - doğruluk
   - yanıt süresi
   - tutarlılık
   - son oturum trendi
2. Zorluk güncelleme kuralları:
   - hızlı düşürme/yükseltme sınırları (anti-jitter)
   - minimum/maximum zorluk eşikleri
3. Hibrit karar yapısı:
   - kural tabanı + AI önerisi
   - riskli durumda kural tabanı önceliği
4. A/B test:
   - adaptif motor açık/kapalı karşılaştırması

Done kriteri:

- Zorluk değişimleri açıklanabilir log ile izlenir
- Öğrenme metriklerinde gerileme olmadan devreye alınır

## Faz 10 - AI Operasyon, Maliyet ve Kalite (sürekli)

Hedef: AI sistemini üretimde sürdürülebilir yönetmek.

İşler:

1. Gözlemlenebilirlik:
   - model latency
   - hata oranı
   - fallback oranı
2. Maliyet kontrolü:
   - token bütçesi
   - cache reuse
   - düşük maliyetli model fallback
3. Kalite değerlendirmesi:
   - otomatik rubric skoru
   - manuel örnekleme denetimi
4. Güvenlik ve uyum:
   - prompt injection önlemleri
   - çocuklara uygun içerik filtresi
   - KVKK/mahremiyet uyumluluğu

Done kriteri:

- AI kalite/maliyet dashboard’ları aktif
- Kritik eşikler aşıldığında otomatik alarm üretir

---

## 5) Öncelikli Backlog

### Kısa Vadeli (hemen başlanacak)

1. ESLint ignore kapsamını düzelt
2. `typecheck` ve `test` scriptlerini root’a ekle
3. CI workflow oluştur (`lint + typecheck + critical smoke + build`)
4. Mimari sözleşme dokümanı yaz
5. Import boundary lint kuralı ekle
6. `auth` domain için repository katmanı çıkar
7. `xp` domain için repository/use-case katmanı çıkar
8. `RequireAuth` bileşenini parçalara ayır
9. En büyük 3 oyun dosyasını (`600+` satır) modülerleştir
10. İlk test setini ekle (auth + xp + bir oyun akışı + kritik wiring smoke)

### AI Hazırlık Backlog'u (Faz 7+)

1. `question_attempt_events` ve `ability_snapshots` migration taslağı
2. `server/ai` provider abstraction iskeleti
3. Prompt template versioning formatı
4. AI output JSON schema doğrulayıcı
5. Fallback soru bankası seçici mekanizma
6. Adaptif seviyeleme kural seti (ilk sürüm)

---

## 6) Ölçülebilir Başarı Kriterleri (KPI)

- `lint` hataları: ilk ay sonunda `%80+` azalma
- `400+` satır dosya sayısı: ilk 2 ayda `%50+` azalma
- Doğrudan Supabase çağrısı yapan `page/component` sayısı: `%70+` azalma
- Kritik akış regresyonu: release başına `0` hedef
- Build süresi ve büyük chunk sayısı: kademeli düşüş
- AI soru kalite skoru (rubric): `%90+`
- Adaptif motor sonrası terk oranı: kötüleşmemeli (`<= mevcut baseline`)
- AI fallback oranı: ilk sürümde `< %15`, hedef `< %5`
- Ortalama AI yanıt süresi: hedef `<= 2.5s` (cache hariç)

---

## 7) Framework Kararı (Vite mi Next mi?)

Bu repo için kısa vadede öneri:

1. Önce mevcut Vite kod tabanını stabilize et (Faz 0-2)
2. Sonra `next-app-skeleton` için **go/no-go** kararı ver
3. İkinci bir aktif uygulama tutulacaksa ownership ve sync kuralları yazılmadan paralel geliştirme yapma
4. AI katmanı framework bağımsız kalmalı (`server/ai`), UI framework değiştirse de core bozulmamalı

Not:

- Aynı anda iki ana uygulamayı aktif geliştirmek, mimari borcu hızla büyütür
- Karar verilene kadar tek “source of truth” net olmalı

---

## 8) Yönetim Modeli

- Her faz sonunda kısa “architecture checkpoint” toplantısı
- Her PR’da:
  - hangi katmana dokundu?
  - boundary ihlali var mı?
  - test eklendi mi?
- Haftalık teknik borç raporu (otomatik veya yarı otomatik)
- AI için aylık kalite/maliyet/güvenlik değerlendirmesi ayrı yapılır

---

## 9) AI İçin Gelecek Veritabanı Notları

Bu planın AI fazlarında veritabanında yeni tablolar eklenecek, mevcut tablolar mümkün olduğunca korunacak.

Önerilen prensipler:

1. PK/FK ve veri tipleri:
   - `uuid` veya `bigint` tutarlı kullanılmalı
   - zaman alanları `timestamptz` olmalı
   - metin alanlarında gereksiz `varchar(n)` kullanılmamalı
2. FK kolonlarında indeks:
   - her FK için indeks zorunlu
3. Sorgu bazlı composite index:
   - örnek: `(user_id, created_at desc)` gibi gerçek filtre düzenine göre
4. RLS performansı:
   - policy fonksiyonları satır başı pahalı çalışmamalı
   - `(select auth.uid())` pattern'i tercih edilmeli
5. Event tablosu yaklaşımı:
   - immutable/append-only event kayıtları
   - ability snapshot ayrı tabloda tutulmalı

Not:

- Faz 0-6 için zorunlu şema değişikliği yok
- Faz 7+ AI geçişinde kontrollü migration gerekecek
