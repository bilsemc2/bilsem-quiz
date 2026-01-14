---
name: Bireysel Değerlendirme Simülatörü
description: Stage 2 bireysel değerlendirme için yeni simülatör ekler
---

# 📊 Bireysel Değerlendirme Simülatörü Skill'i

Stage 2 (Bireysel Değerlendirme) hub'ına yeni bir kognitif simülatör eklemek için.

## Zeka Türleri

| Zeka Türü | İkon | Renk |
|-----------|-----|------|
| Görsel-Uzamsal | Eye | purple |
| Sözel | BookOpen | blue |
| Mantıksal-Matematiksel | Calculator | emerald |
| İşitsel | Music | pink |
| Hafıza | Brain | indigo |
| Dikkat | Target | amber |

---

## Adım 1: BrainTrainer Simülatörü Oluştur

`new-brain-trainer` skill'ini kullanarak simülatörü oluşturun.

---

## Adım 2: IndividualAssessmentPage'e Ekle

`src/pages/workshops/IndividualAssessmentPage.tsx`:

```tsx
// İlgili kategoriye ekle
{
  title: '[Simülatör Adı]',
  description: 'Kısa açıklama',
  icon: Brain,
  path: '/atolyeler/bireysel-degerlendirme/[slug]',
  intelligenceType: 'Görsel-Uzamsal Zeka',
  color: 'from-purple-500 to-indigo-600',
}
```

---

## Adım 3: Route ve XP

```tsx
// App.tsx
<Route path="/atolyeler/bireysel-degerlendirme/[slug]" element={<RequireAuth><Component /></RequireAuth>} />
```

```sql
INSERT INTO xp_requirements (path, xp_cost, description) 
VALUES ('/atolyeler/bireysel-degerlendirme/[slug]', 15, '[Simülatör Adı]');
```

---

## Referans

- `src/pages/workshops/IndividualAssessmentPage.tsx`
- `src/components/BrainTrainer/CosmicMemoryGame.tsx`
