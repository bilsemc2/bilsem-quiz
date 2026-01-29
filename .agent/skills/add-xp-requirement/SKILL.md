---
name: XP Requirement Ekleme
description: Yeni sayfa/oyun için XP gereksinimi ekler
---

# 🔐 XP Requirement Ekleme Skill'i

## Path Formatları

| Kategori | Format | Örnek XP |
|----------|--------|----------|
| Oyunlar | `/oyunlar/[slug]` | 10 |
| Arcade | `/bilsem-zeka/[slug]` | 30-50 |
| Bireysel | `/atolyeler/bireysel-degerlendirme/[slug]` | 15 |
| Tablet | `/atolyeler/tablet-degerlendirme/[slug]` | 10 |

---

## Adım 1: Supabase SQL Editor

```sql
INSERT INTO xp_requirements (path, xp_cost, description) 
VALUES ('[path]', [cost], '[açıklama]');
```

---

## Adım 2: Admin Panel (Alternatif)

1. Admin Panel'e git
2. XP Gereksinimleri bölümü
3. Yeni Ekle
4. Path ve XP değerini gir

---

## RequireAuth Davranışı

`RequireAuth` wrapper otomatik olarak:
1. `xp_requirements` tablosunu kontrol eder
2. Kullanıcının yeterli XP'si yoksa uyarı gösterir
3. Yeterli XP varsa kesinti yapar

---

## Staff Bypass

Staff rolleri (admin, teacher, manager) XP kontrolünden muaftır.

---

## Doğrulama

```sql
SELECT * FROM xp_requirements WHERE path = '[path]';
```

---

## Referans

- `src/components/RequireAuth.tsx`
- Supabase > xp_requirements tablosu
