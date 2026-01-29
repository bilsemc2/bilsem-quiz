# Story 7.4: Turkish Character Slug Generation

Status: completed

## Story

As a **sistem**,
I want **Türkçe karakterleri doğru slug'a dönüştürebilmek**,
so that **SEO-uyumlu URL'ler oluşturabileyim**.

## Acceptance Criteria

1. Türkçe büyük harfler (İ, Ğ, Ü, Ş, Ö, Ç) doğru ASCII karşılıklarına dönüştürülmeli
2. Türkçe küçük harfler (ı, ğ, ü, ş, ö, ç) doğru ASCII karşılıklarına dönüştürülmeli
3. Frontend `createSlug` fonksiyonu tutarlı çıktı üretmeli
4. Backend `generate_slug` Supabase fonksiyonu tutarlı çıktı üretmeli
5. Mevcut hatalı slug'lar düzeltilmeli
6. Sitemap güncellenmiş slug'ları içermeli

## Tasks / Subtasks

- [x] Task 1: Frontend `createSlug` fonksiyonunu düzelt (AC: 1, 2, 3)
  - [x] Subtask 1.1: `BlogManagement.tsx` içindeki fonksiyonu analiz et
  - [x] Subtask 1.2: Map-before-Lower pattern uygula
  - [x] Subtask 1.3: Test et ve commit et

- [x] Task 2: Backend `generate_slug` fonksiyonunu düzelt (AC: 1, 2, 4)
  - [x] Subtask 2.1: Supabase fonksiyonunu analiz et
  - [x] Subtask 2.2: SQL migration oluştur
  - [x] Subtask 2.3: Supabase'de çalıştır

- [x] Task 3: Mevcut hatalı slug'ları düzelt (AC: 5)
  - [x] Subtask 3.1: `blog_posts_rows.sql` analiz et
  - [x] Subtask 3.2: 40+ hatalı slug tespit et
  - [x] Subtask 3.3: UPDATE sorguları oluştur ve çalıştır

- [x] Task 4: Sitemap yenile (AC: 6)
  - [x] Subtask 4.1: `npm run sitemap` çalıştır
  - [x] Subtask 4.2: Commit ve push et

## Dev Notes

### Map-Before-Lower Pattern

Türkçe karakter dönüşümü `toLowerCase()` çağrılmadan **önce** yapılmalıdır.

**Yanlış:**
```javascript
title.toLowerCase().replace('ç', 'c')...
```

**Doğru:**
```javascript
// Önce Türkçe karakterleri dönüştür
let result = title;
Object.keys(turkishMap).forEach(key => {
  result = result.split(key).join(turkishMap[key]);
});
// Sonra toLowerCase
result = result.toLowerCase();
```

### Project Structure Notes

- `src/components/admin/BlogManagement.tsx` - Frontend slug oluşturma
- `supabase/functions/generate_slug` - Backend slug oluşturma (trigger)
- `public/sitemap.xml` - SEO sitemap
- `scripts/generate-sitemap.js` - Sitemap generator

### References

- [Source: src/components/admin/BlogManagement.tsx#L16-38]
- [Source: supabase/migrations/20260129_fix_blog_slugs.sql]

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro (Antigravity)

### Debug Log References

- Conversation: 55548082-59a8-4f1c-8c00-d358346f7f59
- Date: 2026-01-29

### Completion Notes List

- Frontend düzeltmesi commit: `fix(blog): Türkçe karakter slug dönüşümü düzeltildi`
- Backend düzeltmesi: Supabase SQL Editor'da çalıştırıldı
- Sitemap güncelleme commit: `fix(seo): Türkçe karakter slug düzeltmeleri ve sitemap güncelleme`

### File List

| File | Action |
|------|--------|
| `src/components/admin/BlogManagement.tsx` | Modified |
| `supabase/migrations/20260129_fix_blog_slugs.sql` | Created |
| `public/sitemap.xml` | Regenerated |
| `scripts/generate-sitemap.js` | Modified |
