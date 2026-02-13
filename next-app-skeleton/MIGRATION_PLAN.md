# Vite -> Next.js Migration Plan

Bu plan, mevcut `/src` monolit yapinin kontrollu sekilde Next.js skeleton'a tasinmasi icin hazirlandi.

## Mevcut Uygulama Analizi (Ozet)

- Routing: `src/routes/*` ile buyuk SPA route haritasi
- Alanlar: oyunlar, workshoplar, auth, admin, profile, story/content
- Cross-cutting: `contexts`, `hooks`, `utils`, `services`
- Riskler:
  - Domain ve UI katmanlarinin ic ice olmasi
  - Tek bundle'a yakin davranis (route bazli ayristirma sinirli)
  - Client-only pattern agirligi (SSR/RSC avantaji dusuk)

## Dump Tabanli Baslangic Durumu

`backup/full_dump.sql` dosyasindaki mevcut veri, migration icin referans data source olarak kabul edildi.

Oncelikli tablolar:

- `public.profiles`
- `public.game_plays`
- `public.story`
- `public.story_questions`
- `public.exam_sessions`
- `public.packages`
- `public.user_subscriptions`

## Hedef Mimarisi

- Route layer: `app/*`
- Feature layer: `src/features/*`
- Shared layer: `src/shared/*`
- Server layer: `src/server/*`

## Fazlar

1. Faz 0 - Data Foundation
- [x] `docker-compose` ile local PostgreSQL ac
- [x] `full_dump.sql` restore et (best-effort + kritik tablo dogrulama)
- [x] Kritik tablolar icin repository/service katmanini ayaga kaldir

2. Faz 1 - Temel Altyapi
- [x] App Router skeleton + route groups
- [x] `middleware.ts` ile protected route guard
- [x] Env ve scripts (`db:start`, `db:restore`) tanimlari

3. Faz 2 - Public + Auth Tasima
- [x] Public shell (`/home`) route'u
- [x] `AboutPage`, `FAQPage`, `SignUpPage` route-level migration
- [x] Auth action/provider entegrasyonu (login + sign-up + forgot/reset password + callback)

4. Faz 3 - Workshop Domain Tasima
- [x] Workshop listing route iskeleti
- [x] Workshop feature katalogu (`src/features/workshops/data`) ve detail route (`/workshops/[workshopId]`)
- [x] Workshop API route'lari (`/api/workshops`, `/api/workshops/[workshopId]`)
- [x] Workshop interaktif modullerinin route-by-route tam tasinmasi

5. Faz 4 - BrainTrainer Games Tasima
- [x] Dynamic game route: `/games/[gameId]`
- [x] `farki-bul` migrate edildi (oynanabilir client component)
- [x] `kelime-avi` migrate edildi (oynanabilir client component)
- [x] `matematik-grid` migrate edildi (oynanabilir client component)
- [x] `gorsel-hafiza` migrate edildi (oynanabilir client component)
- [x] `sayisal-hafiza` migrate edildi (oynanabilir client component)
- [x] `kozmik-hafiza` migrate edildi (oynanabilir client component)
- [x] Oyun sonu sonucu `public.game_plays` tablosuna yaziliyor (`/api/game-plays`)
- [ ] Diger oyunlarin route-by-route tasinmasi
- [x] lazer-labirent migrate edildi (oynanabilir client component)
- [x] saat-problemi migrate edildi (oynanabilir client component)
- [x] labirent migrate edildi (oynanabilir client component)
- [x] algisal-hiz migrate edildi (oynanabilir client component)
- [x] dikkat-ve-kodlama migrate edildi (oynanabilir client component)
- [x] sayi-sihirbazi migrate edildi (oynanabilir client component)
- [x] n-geri-sifresi migrate edildi (oynanabilir client component)
- [x] sembol-arama migrate edildi (oynanabilir client component)
- [x] sayisal-dizi migrate edildi (oynanabilir client component)
- [x] sayisal-sifre migrate edildi (oynanabilir client component)
- [x] sekil-hafizasi migrate edildi (oynanabilir client component)
- [x] gorsel-tarama migrate edildi (oynanabilir client component)
- [x] isitsel-hafiza migrate edildi (oynanabilir client component)
- [x] tepki-suresi migrate edildi (oynanabilir client component)
- [x] sozel-analoji migrate edildi (oynanabilir client component)
- [x] es-anlam migrate edildi (oynanabilir client component)
- [x] cumle-ici-es-anlam migrate edildi (oynanabilir client component)
- [x] simge-kodlama migrate edildi (oynanabilir client component)
- [x] kosullu-yonerge migrate edildi (oynanabilir client component)
- [x] mantik-bulmacasi migrate edildi (oynanabilir client component)

6. Faz 5 - Admin + Profile + Reporting
- [x] Dashboard stats tabani (`profiles` + `game_plays`)
- [x] Admin detay ekranlari (`/admin`, `/admin/users`, `/admin/users/[userId]`, `/admin/game-plays`)
- [ ] PDF/report servislerinin server action'a tasinmasi

7. Faz 6 - Kalite ve Performans
- [x] `typecheck`, `lint`, `build`, `test` green
- [x] `src/server/db/client.ts` icin telemetry + retry stratejisi
- [ ] Lighthouse + Web Vitals olcumu
- [ ] E2E test coverage

## Tasima Kurallari

- Bir kerede tum uygulamayi tasima: YAPMA.
- Route-by-route migration uygula.
- Her tasinan modulu old/new parity checklist ile kapat.
- Her faz sonunda:
  - `npm run typecheck`
  - `npm run lint`
  - Smoke test

## Sonraki Oncelik

1. Diger BrainTrainer oyunlarini migration backlog'undan one al
2. PDF/report servislerini server action katmanina tasi
3. Lighthouse + Web Vitals + E2E kalite adimlarini tamamla
