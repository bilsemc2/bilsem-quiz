---
description: Robots.txt generator with AI crawler rules
---

# SupaRank Robots.txt Generator

Robots.txt dosyası oluşturma ve AI crawler kuralları.

## Kullanım
```
/suparank-robots https://example.com
```

## Adımlar

### 1. Mevcut robots.txt Kontrolü
// turbo
`/robots.txt` dosyasını kontrol et.

### 2. Analiz
- [ ] Sitemap.xml referansı var mı?
- [ ] Kritik sayfalar engellenmemiş mi?
- [ ] Admin/private alanlar engellenmiş mi?

### 3. Standart robots.txt Şablonu

```
# BİLSEM C2 robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /private/

# Sitemap
Sitemap: https://bilsemc2.com/sitemap.xml

# AI Crawler kuralları
User-agent: GPTBot
Allow: /
Allow: /blog/
Allow: /atolyeler/

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Allow: /
```

### 4. AI Crawler Kuralları

| Bot | Şirket | Öneri |
|-----|--------|-------|
| GPTBot | OpenAI | Allow |
| Google-Extended | Google (Gemini) | Allow |
| CCBot | Common Crawl | Disallow |
| anthropic-ai | Anthropic | Allow |
| Applebot | Apple | Allow |
| Bytespider | ByteDance | Disallow |

### 5. public/robots.txt Oluştur
Dosyayı `public/` klasörüne kaydet.
