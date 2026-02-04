---
description: Complete SEO audit combining all 10 tools
---

# SupaRank Full SEO Audit

Bu workflow, belirtilen URL için kapsamlı bir SEO analizi yapar.

## Kullanım
```
/suparank-full https://example.com
```

## Adımlar

### 1. URL'yi Al
Kullanıcının belirttiği URL'yi analiz için hazırla.

### 2. Sayfa İçeriğini Çek
// turbo
`read_url_content` aracını kullanarak sayfanın HTML içeriğini al.

### 3. Meta Tag Analizi
Aşağıdaki meta tag'leri kontrol et:
- `<title>` - 50-60 karakter arası olmalı
- `<meta name="description">` - 150-160 karakter arası olmalı
- `<meta name="keywords">` - Opsiyonel
- Open Graph tag'leri (og:title, og:description, og:image, og:url)
- Twitter Card tag'leri
- Canonical URL

### 4. Heading Yapısı Analizi
- Tek bir `<h1>` olmalı
- H1 → H2 → H3 hiyerarşisi doğru olmalı
- Heading'lerde anahtar kelimeler bulunmalı

### 5. Schema.org Yapılandırılmış Veri
- JSON-LD formatında schema var mı kontrol et
- Organization, WebSite, BreadcrumbList gibi temel schema'ları öner

### 6. Görsel SEO
- Tüm `<img>` tag'lerinde `alt` özelliği var mı?
- Görsel boyutları optimize mi?
- WebP/AVIF formatı kullanılıyor mu?

### 7. Link Analizi
- İç linkler düzgün mü?
- Kırık linkler var mı?
- External linkler için `rel="noopener noreferrer"` var mı?

### 8. robots.txt Kontrolü
// turbo
`/robots.txt` dosyasını kontrol et.

### 9. sitemap.xml Kontrolü
// turbo
`/sitemap.xml` dosyasını kontrol et.

### 10. Core Web Vitals Önerileri
- LCP (Largest Contentful Paint) - 2.5s altında olmalı
- INP (Interaction to Next Paint) - 200ms altında olmalı
- CLS (Cumulative Layout Shift) - 0.1 altında olmalı

### 11. Erişilebilirlik (A11y)
- ARIA etiketleri var mı?
- Renk kontrastı yeterli mi?
- Keyboard navigation mümkün mü?

### 12. Rapor Oluştur
Tüm bulguları özetleyen bir markdown raporu oluştur:
- ✅ Başarılı öğeler
- ⚠️ Uyarılar
- ❌ Kritik sorunlar
- 📋 Öneriler

## Çıktı
Analiz sonuçlarını artifact olarak `brain/<conversation-id>/seo-audit-report.md` dosyasına kaydet.
