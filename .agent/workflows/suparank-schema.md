---
description: Schema.org structured data validator and generator
---

# SupaRank Schema.org Audit

Yapılandırılmış veri (structured data) analizi ve oluşturma.

## Kullanım
```
/suparank-schema https://example.com
```

## Kontroller

### Mevcut Schema Kontrolü
// turbo
Sayfadaki JSON-LD ve microdata formatındaki schema'ları tespit et.

### Önerilen Schema Türleri

#### Web Siteleri İçin
- Organization
- WebSite
- BreadcrumbList
- SearchAction

#### Blog/Makale İçin
- Article
- BlogPosting
- NewsArticle

#### Ürün/E-ticaret İçin
- Product
- Offer
- Review
- AggregateRating

#### Eğitim Siteleri İçin
- Course
- EducationalOrganization
- EducationalOccupationalProgram

### Örnek Schema (Eğitim Platformu)

```json
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "BİLSEM C2",
  "url": "https://bilsemc2.com",
  "description": "BİLSEM sınavlarına hazırlık platformu",
  "sameAs": [
    "https://instagram.com/bilsemc2",
    "https://youtube.com/bilsemc2"
  ]
}
```

### Doğrulama
Google Rich Results Test ile schema'ları doğrula:
https://search.google.com/test/rich-results
