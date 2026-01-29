# Story 7.1: Blog Management System

Status: completed

## Story

As a **admin**,
I want **blog yazıları oluşturabilmek ve yönetebilmek**,
so that **platform içeriğini zenginleştirebilleyim**.

## Acceptance Criteria

1. Blog yazısı CRUD işlemleri yapılabilmeli
2. Rich text editor (markdown) desteği
3. Görsel yükleme ve yerleştirme
4. Kategori ve etiket yönetimi
5. SEO meta bilgileri (title, description, keywords)
6. Türkçe uyumlu slug otomatik oluşturulmalı
7. Yayın/taslak durumu yönetimi
8. Yayın zamanlaması

## Tasks / Subtasks

- [x] Task 1: Blog CRUD (AC: 1, 7)
  - [x] Subtask 1.1: Create blog post form
  - [x] Subtask 1.2: Edit functionality
  - [x] Subtask 1.3: Delete with confirmation
  - [x] Subtask 1.4: Draft/publish toggle

- [x] Task 2: Content editing (AC: 2, 3)
  - [x] Subtask 2.1: Markdown editor entegrasyonu
  - [x] Subtask 2.2: Image upload to storage
  - [x] Subtask 2.3: Image picker/inserter

- [x] Task 3: Taxonomy (AC: 4)
  - [x] Subtask 3.1: Kategori CRUD
  - [x] Subtask 3.2: Etiket sistemi
  - [x] Subtask 3.3: Multi-select UI

- [x] Task 4: SEO features (AC: 5, 6)
  - [x] Subtask 4.1: Meta field'ları
  - [x] Subtask 4.2: Türkçe slug generator
  - [x] Subtask 4.3: SEO preview

## Dev Notes

### Blog Post Schema

```typescript
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  category_id: string;
  tags: string[];
  meta_title: string;
  meta_description: string;
  published: boolean;
  published_at: Date;
  created_at: Date;
  updated_at: Date;
  author_id: string;
}
```

### Turkish Slug Generation (Fixed)

```typescript
const createSlug = (title: string) => {
  const turkishMap = {
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u'
  };
  
  let result = title;
  // Map BEFORE toLowerCase
  Object.keys(turkishMap).forEach(key => {
    result = result.split(key).join(turkishMap[key]);
  });
  return result.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};
```

### Project Structure Notes

- `src/components/admin/BlogManagement.tsx` - Ana yönetim sayfası
- `src/components/admin/BlogEditor.tsx` - Yazı editörü
- `src/components/admin/AIBlogWriterModal.tsx` - AI entegrasyonu

### References

- [Source: src/components/admin/BlogManagement.tsx]
- [Source: story-7.4-turkish-slug-generation.md]

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro (Antigravity)

### Completion Notes List

- Blog yönetim sistemi aktif
- AI blog yazarı entegre
- Türkçe slug sorunu çözüldü
- SEO meta desteği mevcut

### File List

| File | Action |
|------|--------|
| `src/components/admin/BlogManagement.tsx` | Created/Modified |
| `src/components/admin/BlogEditor.tsx` | Created |
| `src/components/admin/AIBlogWriterModal.tsx` | Created |
