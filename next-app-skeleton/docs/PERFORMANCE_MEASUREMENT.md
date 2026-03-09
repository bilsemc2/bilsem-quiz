# Performance Measurement

Bu proje icin performans olcumu iki katmanda yapilir:

1. Gercek kullanici metrikleri: Web Vitals (`/api/web-vitals` uzerinden toplanir)
2. Lab olcumu: Lighthouse CI (`lighthouse:ci` script'i)

## 1) Web Vitals veri akisi

- `src/shared/monitoring/WebVitalsReporter.tsx` client tarafinda metrikleri yakalar.
- Metrikler `POST /api/web-vitals` endpoint'ine gonderilir.
- Server, `public.web_vitals_metrics` tablosuna yazar.
- Admin panelinde son 24 saat ozeti ve son metrikler gorulur.

Tablo yoksa otomatik olusturulur:

- `public.web_vitals_metrics`

## 2) Lighthouse CI

Konfigurasyon: `lighthouserc.json`

Calistirma:

```bash
npm run build
npm run start
npm run lighthouse:ci
```

Notlar:

- `lighthouse:ci` script'i `@lhci/cli` paketini `npx` ile calistirir.
- Sonuclar `.lighthouseci/` klasorune yazilir.
- Assertion'lar `warn` olarak ayarlidir; ileride CI kapisina gecirilebilir.
