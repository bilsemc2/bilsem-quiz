# Architecture Conventions

Bu dokuman, `CLEAN_CODE_ARCHITECTURE_PLAN.md` icindeki Faz 1 hedeflerini kod duzeyinde standartlastirir.

## Klasor Katmanlari

- `src/app`: bootstrap, provider composition, router shell.
- `src/shared`: framework-agnostic ortak tipler, saf util fonksiyonlar, sabitler.
- `src/features`: domain odakli is kurallari ve use-case'ler.
- `src/server`: veri erisimi ve AI provider adapter'lari.
- `src/pages` / `src/components`: UI orchestration ve presentational katman.

## Import Sinirlari

- `src/app` en ust katmandir; bootstrap ve route composition burada kalir.
- `src/shared` hicbir ust katmani import etmez.
- `src/features` ve `src/server` katmanlari `src/pages` veya `src/components` icinden import etmez.
- `src/features` ve `src/server` katmanlari `src/app`, `src/contexts`, `src/hooks`, `src/routes` icinden import etmez.
- Feature kodu UI tiplerine ihtiyac duyarsa tipler `src/shared` altina tasinmalidir.
- AI provider cagrilari yalnizca `src/server/ai` katmanindan yapilir.

## Veri Erisimi Kurallari

- UI katmaninda (`pages/components`) dogrudan `supabase.from(...)` cagrisi yazilmaz.
- Veri erisimi `src/server/repositories` veya feature-level api/use-case katmanindan gecmelidir.
- `@/lib/supabase` importu yalnizca `src/server/repositories/**` ve `src/lib/**` icinde kalmalidir.
- `src/pages`, `src/components`, `src/contexts`, `src/hooks`, `src/routes`, `src/services`, `src/utils` altinda Supabase clienti dogrudan import edilmez.
- Edge function veya auth token kullanan UI akislarinda da istemci kodu use-case/repository uzerinden ilerlemelidir.

## Lint Ile Zorlanan Sinirlar

- ESLint `no-restricted-imports` kurali UI/orchestration katmaninda `@/lib/supabase` ve relatif `lib/supabase` importlarini bloklar.
- Bu kuralin amaci sadece stil degil, veri erisimi ile ekran mantigi arasinda kalici sinir olusturmaktir.
- Yeni istisna acilacaksa once repository/use-case alternatifi degerlendirilmelidir; istisna son care olmalidir.

## AI Akis Kurallari

- AI cevabi kullanilmadan once schema + safety dogrulamasi zorunludur.
- AI basarisiz oldugunda fallback soru kaynagi devreye girmelidir.
- Uretilen sorular icin deduplikasyon uygulanmalidir.

## Dosya Boyutu ve Sorumluluk

- 400+ satir dosyalar asamali olarak parcalanir.
- Bir dosya tek ana sorumluluga sahip olmalidir.
- Buyuk oyun dosyalari: container / presentation / logic olarak ayrilir.

## PR Kontrol Listesi

- Katman siniri ihlali var mi?
- Yeni kod testle desteklendi mi?
- Dogrudan UI icinde veri erisimi eklendi mi?
- UI/orchestration katmaninda `lib/supabase` importu geri geldi mi?
- Yeni tipler yanlis katmanda tutuluyor mu?
