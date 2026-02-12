# Bilsem Quiz Next.js Skeleton

Bu klasor, mevcut `bilsem-quiz` Vite SPA uygulamasini Next.js App Router mimarisine tasimak icin hazirlanan ayri bir boilerplate projesidir.

## Hedef

- Olceklenebilir feature-tabanli klasor yapisi
- Server Component odakli veri akis modeli
- Route-group ile alan ayrimi: public/auth/games/workshops/dashboard/admin
- Middleware ile auth korumasi
- API route handler + server action iskeleti
- `backup/full_dump.sql` ile ayni veriyi kullanabilen DB katmani

## Kurulum

```bash
npm install
cp .env.example .env.local
npm run db:start
npm run db:restore
npm run dev
```

## Proje Yapisi

```txt
next-app-skeleton/
  app/
    (public)/home/page.tsx
    (public)/about/page.tsx
    (public)/faq/page.tsx
    (auth)/login/page.tsx
    (auth)/signup/page.tsx
    (auth)/forgot-password/page.tsx
    (auth)/reset-password/page.tsx
    auth/callback/route.ts
    (games)/games/page.tsx
    (games)/games/[gameId]/page.tsx
    (workshops)/workshops/page.tsx
    (workshops)/workshops/[workshopId]/page.tsx
    (dashboard)/dashboard/page.tsx
    (dashboard)/admin/page.tsx
    (dashboard)/admin/users/page.tsx
    (dashboard)/admin/users/[userId]/page.tsx
    (dashboard)/admin/game-plays/page.tsx
    api/
      health/route.ts
      games/[gameId]/route.ts
      game-plays/route.ts
      stories/route.ts
      profiles/route.ts
      workshops/route.ts
      workshops/[workshopId]/route.ts
    layout.tsx
    page.tsx
  src/
    features/
      auth/
      games/
      workshops/
      admin/
      content/
    shared/
      ui/
      hooks/
      config/
      lib/
      types/
    server/
      actions/
      auth/
      db/
      queries/
      repositories/
      services/
    app-providers/
  scripts/
    db-restore.sh
  docs/
    DATABASE_SETUP.md
    LEGACY_ANALYSIS.md
  docker-compose.yml
  middleware.ts
  MIGRATION_PLAN.md
```

## Mimaride Kurallar

- `app/` altinda sadece route tanimi ve sayfa composition bulunsun.
- Domain mantigi `src/features` altinda yasasin.
- Ortak bilesen/hook/helper `src/shared` altinda olsun.
- Veri erisimi `src/server` katmaninda toplansin.
- Client component sadece interaktif kisimlarda kullanilsin.

## DB Notlari

- Bu skeleton dogrudan `public.game_plays`, `public.story`, `public.profiles` gibi dump tablolarini okur.
- `farki-bul`, `kelime-avi`, `matematik-grid`, `gorsel-hafiza`, `sayisal-hafiza` ve `kozmik-hafiza` oyunlari migrate edilmistir; sonuc kayitlari `/api/game-plays` ile `public.game_plays` tablosuna yazilir.
- Workshop domain'i katalog + detail + API patterniyle feature-bazli tasinmistir.
- Supabase Auth email/sifre login + sign-up + forgot/reset password akisi aktiftir (`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`).
- Auth callback linklerinin dogru calismasi icin `NEXT_PUBLIC_APP_URL` degeri dogru host ile tanimlanmalidir.
- DB client katmaninda retry + telemetry ayarlari env ile kontrol edilir (`DB_RETRY_*`, `DB_TELEMETRY`, `DB_SLOW_QUERY_MS`).
- DB baglantisi yoksa service katmaninda fallback veri doner; uygulama ayakta kalir.
- Ayrintilar: `docs/DATABASE_SETUP.md`

## Sonraki Adimlar

1. Workshop interaktif modullerini (muzik/resim/tablet) route-by-route tasimaya devam et.
2. Diger BrainTrainer oyunlarini migration backlog'undan one al.
3. Lighthouse + Web Vitals + E2E kalite adimlarini tamamla.
4. `src/server/db/client.ts` telemetry ciktilarini merkezi izleme aracina bagla.

## Legacy Analiz Notu

- Vite kaynak uygulama analizi: `docs/LEGACY_ANALYSIS.md`
