# Story 4.1: Arcade Hub Interface

Status: completed

## Story

As a **öğrenci**,
I want **tüm arcade oyunlarını tek sayfada görebilmek**,
so that **istediğim oyunu kolayca seçebilleyim**.

## Acceptance Criteria

1. Tüm oyunlar grid layout'ta kartlar halinde gösterilmeli
2. Her kartta oyun adı, açıklaması, XP gereksinimi görünmeli
3. Oyunlar kategorilere göre filtrelenebilmeli
4. Kilitli oyunlar (yetersiz XP) görsel olarak ayırt edilmeli
5. Responsive tasarım (mobile, tablet, desktop)
6. Neon/glass estetik uygulanmalı

## Tasks / Subtasks

- [x] Task 1: Hub sayfası layout (AC: 1, 5, 6)
  - [x] Subtask 1.1: Grid layout implementasyonu
  - [x] Subtask 1.2: Responsive breakpoints
  - [x] Subtask 1.3: Neon glass card tasarımı

- [x] Task 2: Oyun kartları (AC: 2, 4)
  - [x] Subtask 2.1: Kart bileşeni oluştur
  - [x] Subtask 2.2: XP badge gösterimi
  - [x] Subtask 2.3: Kilitli durum overlay

- [x] Task 3: Filtreleme sistemi (AC: 3)
  - [x] Subtask 3.1: Kategori filtreleri
  - [x] Subtask 3.2: Arama fonksiyonu

## Dev Notes

### Oyun Kategorileri

| Kategori | Oyunlar |
|----------|---------|
| Uzamsal Zeka | Cam Köprü, Küp Puzzle, Kraft Origami |
| Mantık | ChromaBreak, Kart Dedektifi |
| Hafıza | Karanlık Labirent, Ayna, Dark Maze |
| Matematik | Neşeli Balonlar, Bubble Numbers |

### Card Component Structure

```tsx
<GameCard
  title="Cam Köprü"
  description="Uzamsal akıl yürütme"
  xpCost={50}
  category="spatial"
  isLocked={userXP < 50}
  onClick={() => navigate('/bilsem-zeka/cam-kopru')}
/>
```

### Routing Structure

```
/bilsem-zeka                    → Hub sayfası
/bilsem-zeka/cam-kopru         → Oyun sayfası
/bilsem-zeka/chromabreak       → Oyun sayfası
...
```

### Project Structure Notes

- `src/pages/BilsemZekaPage.tsx` - Hub sayfası
- `src/components/arcade/GameCard.tsx` - Oyun kartı
- `src/styles/arcade.css` - Neon glass styles

### References

- [Source: src/pages/BilsemZekaPage.tsx]
- [Source: docs/bilsem-zeka-architecture.md]

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro (Antigravity)

### Debug Log References

- Multiple conversations for BİLSEM Zeka implementation
- Jan 2026 rebranding from /zeka-arcade to /bilsem-zeka

### Completion Notes List

- Hub sayfası implementasyonu tamamlandı
- 14 oyun kartı oluşturuldu
- XP gating sistemi aktif
- Rebranding commit: `/zeka-arcade` → `/bilsem-zeka`

### File List

| File | Action |
|------|--------|
| `src/pages/BilsemZekaPage.tsx` | Created |
| `src/components/arcade/GameCard.tsx` | Created |
| `src/styles/arcade.css` | Created |
| `src/App.tsx` | Modified (routes) |
