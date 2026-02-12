# Database Setup (full_dump.sql)

Bu skeleton, mevcut veritabanini `../backup/full_dump.sql` dosyasindan yukleyerek calisacak sekilde hazirlandi.

## Hangi dump kullaniliyor?

- Dosya: `bilsem-quiz/backup/full_dump.sql`
- Boyut: ~23 MB
- Satir: ~96k

## Kritik tablolar (dump icindeki mevcut durum)

- `public.profiles`: 722 satir
- `public.game_plays`: 1307 satir
- `public.story`: 32 satir
- `public.story_questions`: 160 satir
- `public.exam_sessions`: 7 satir
- `public.packages`: 5 satir

Not: `public.exam_results` ve `public.user_subscriptions` dump icinde su an veri icermiyor.

## Local calistirma

1. `cp .env.example .env.local`
2. `npm run db:start`
3. `npm run db:restore`
4. `npm run dev`

## Restore davranisi

- Dump Supabase kaynakli oldugu icin vanilla Postgres'te bazi extension/role hatalari gorulebilir.
- `db-restore.sh`, bu hatalari best-effort modunda gecip migration icin gereken kritik public tablolari dogrular.
- Kritik tablo listesi script icinde kontrol edilir; eksikse komut hata kodu ile biter.

## Baglanti kontrolu

- Health endpoint: `/api/health`
- Veri endpointleri:
  - `/api/games/[gameId]`
  - `/api/stories`
  - `/api/profiles`
  - `/api/game-plays` (POST)

## Kullanim notu

`full_dump.sql` Supabase kaynakli oldugu icin `auth`, `storage`, `realtime` gibi ek schemalar da icerir. Bu skeleton'da migration icin esas bagimlilik `public` tablolaridir.
