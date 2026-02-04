---
description: Core Web Vitals analysis (LCP, INP, CLS)
---

# SupaRank Core Web Vitals Audit

Core Web Vitals performans analizi.

## Kullanım
```
/suparank-cwv https://example.com
```

## Core Web Vitals Metrikleri

### LCP (Largest Contentful Paint)
- **İyi:** < 2.5s
- **İyileştirme Gerekli:** 2.5s - 4s
- **Kötü:** > 4s

**Optimizasyon Önerileri:**
- Görsel optimizasyonu
- Server response time iyileştirme
- Render-blocking kaynakları kaldırma
- CDN kullanımı

### INP (Interaction to Next Paint)
- **İyi:** < 200ms
- **İyileştirme Gerekli:** 200ms - 500ms
- **Kötü:** > 500ms

**Optimizasyon Önerileri:**
- JavaScript optimizasyonu
- Long task'ları parçalama
- Event handler optimizasyonu

### CLS (Cumulative Layout Shift)
- **İyi:** < 0.1
- **İyileştirme Gerekli:** 0.1 - 0.25
- **Kötü:** > 0.25

**Optimizasyon Önerileri:**
- Görsel boyutlarını belirtme
- Font yükleme stratejisi
- Dinamik içerik için alan ayırma

## Test Araçları
- Google PageSpeed Insights
- Chrome DevTools Performance tab
- Web Vitals Chrome Extension
