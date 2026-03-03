# Architecture Conventions

Bu dokuman, `CLEAN_CODE_ARCHITECTURE_PLAN.md` icindeki Faz 1 hedeflerini kod duzeyinde standartlastirir.

## Klasor Katmanlari

- `src/shared`: framework-agnostic ortak tipler, saf util fonksiyonlar, sabitler.
- `src/features`: domain odakli is kurallari ve use-case'ler.
- `src/server`: veri erisimi ve AI provider adapter'lari.
- `src/pages` / `src/components`: UI orchestration ve presentational katman.

## Import Sinirlari

- `src/features` ve `src/server` katmanlari `src/pages` veya `src/components` icinden import etmez.
- Feature kodu UI tiplerine ihtiyac duyarsa tipler `src/shared` altina tasinmalidir.
- AI provider cagrilari yalnizca `src/server/ai` katmanindan yapilir.

## Veri Erisimi Kurallari

- UI katmaninda (`pages/components`) dogrudan `supabase.from(...)` cagrisi yazilmaz.
- Veri erisimi `src/server/repositories` veya feature-level api/use-case katmanindan gecmelidir.

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
- Yeni tipler yanlis katmanda tutuluyor mu?
