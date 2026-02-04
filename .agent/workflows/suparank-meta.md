---
description: Meta tags generator and validator
---

# SupaRank Meta Tag Analizi

Meta tag'leri analiz eder ve optimize eder.

## Kullanım
```
/suparank-meta https://example.com
```

## Kontrol Listesi

### Title Tag
- [x] Mevcut mu?
- [x] 50-60 karakter arası mı?
- [x] Anahtar kelime içeriyor mu?
- [x] Benzersiz mi?

### Meta Description
- [x] Mevcut mu?
- [x] 150-160 karakter arası mı?
- [x] Call-to-action içeriyor mu?
- [x] Anahtar kelime içeriyor mu?

### Open Graph Tags
- [x] og:title
- [x] og:description
- [x] og:image (1200x630px önerilir)
- [x] og:url
- [x] og:type
- [x] og:site_name

### Twitter Card Tags
- [x] twitter:card
- [x] twitter:title
- [x] twitter:description
- [x] twitter:image

### Diğer Meta Tags
- [x] viewport
- [x] charset
- [x] canonical
- [x] robots
- [x] language (hreflang)

## Adımlar

### 1. Sayfa İçeriğini Çek
// turbo
`read_url_content` ile sayfayı al.

### 2. Meta Tag'leri Parse Et
HTML'den tüm meta tag'leri çıkar.

### 3. Eksikleri Raporla
Her eksik veya hatalı tag için öneri sun.

### 4. Optimizasyon Önerileri
Mevcut tag'ler için iyileştirme önerileri ver.
