---
name: Blog Yazısı Ekleme
description: Supabase'e yeni blog yazısı ekler
---

# 📝 Blog Yazısı Ekleme Skill'i

## Gerekli Bilgiler

1. **Başlık**: Türkçe başlık
2. **Kategori**: egitim, bilsem, teknoloji, vb.
3. **İçerik**: Markdown formatında
4. **Kapak Görseli**: WebP formatında

---

## Adım 1: Slug Oluşturma

Türkçe karakterleri dönüştür:
```
ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u
Boşluk → tire (-)
Küçük harf
```

Örnek: "Bilsem Sınavı Hazırlık" → "bilsem-sinavi-hazirlik"

---

## Adım 2: Görsel Optimizasyonu

1. Görseli WebP formatına dönüştür
2. Max boyut: 1200x630 (sosyal medya uyumlu)
3. `public/images/blog/` klasörüne ekle

---

## Adım 3: Supabase'e Ekle

```sql
INSERT INTO blog_posts (
  title, slug, content, excerpt, category, 
  cover_image, author_id, is_published
) VALUES (
  '[Başlık]',
  '[slug]',
  '[Markdown içerik]',
  '[Kısa açıklama]',
  '[kategori]',
  '/images/blog/[gorsel].webp',
  'author-uuid',
  true
);
```

---

## Adım 4: SEO Meta

BlogPage otomatik olarak şunları ekler:
- `<title>` tag
- `<meta description>`
- Open Graph tags

---

## Referans

- `src/pages/BlogPage.tsx`
- Admin Panel > Blog Yönetimi
