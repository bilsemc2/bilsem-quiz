# Legacy App Analysis (bilsem-quiz)

Bu not, mevcut Vite uygulamasinin Next.js migration planina girdi olmasi icin hazirlandi.

## Snapshot

- Proje tipi: Vite + React SPA
- Ana kaynak dizini: `src/`
- Route orchestrator: `src/routes/*.tsx`

## Hacim Gozlemi

- `src/components/BrainTrainer/*.tsx`: 58 dosya
- `src/pages/**/*.tsx`: 57 dosya
- `src/routes/*`: 8 dosya
- `src/contexts/*`: 4 dosya
- `src/hooks/*`: 10 dosya
- `src/utils/*`: 12 dosya

## Domain dagilimi

- Oyunlar: BrainTrainer ve Arcade tarafi yogun
- Workshoplar: bireysel, muzik, resim gibi alt alanlar
- Icerik: Story, Blog, Bilsem rehberi
- Yonetim: Admin, profile, classroom, package/subscription

## Migration etkisi

- En yuksek etki:
  1. Oyun modulleri (state + timer + scoring)
  2. Context bagimliliklari (Auth/XP/Exam/Sound)
  3. Supabase sorgularinin server/client ayrimi

## Next.js hedef esleme

- `src/routes` -> `app/` route groups
- `src/components/BrainTrainer/*` -> `src/features/games/*`
- `src/pages/workshops/*` -> `src/features/workshops/*`
- `src/lib/supabase.ts` ve tablo erisimi -> `src/server/{repositories,services}`
- Ortak UI -> `src/shared/ui`
