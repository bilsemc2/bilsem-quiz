---
name: Component Standardization
description: Touch-First UX standartlarına göre component modernize eder
---

# 🎨 Component Standardization Skill'i

Mevcut component'leri Touch-First UX standartlarına göre modernize etmek için.

---

## Touch-First Hedefler

| Element | Minimum Boyut |
|---------|---------------|
| Butonlar | 80px x 48px |
| Kartlar | 80px x 80px |
| Grid gap | 16px (gap-4) |
| Padding | 16px (p-4) |

---

## Standart Bileşenler

**TouchButton:**
```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="min-h-[48px] min-w-[80px] px-6 py-3 rounded-xl"
>
```

**GameHUD:**
```tsx
import GameHUD from '../components/game/GameHUD';
<GameHUD score={score} lives={lives} timeLeft={timeLeft} level={level} />
```

---

## Renk Paleti

```css
/* Durum renkleri */
text-amber-400   /* Skor */
text-red-400     /* Can */
text-blue-400    /* Süre */
text-emerald-400 /* Başarı */

/* Arka plan */
bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900

/* Glassmorphism */
bg-slate-800/50 backdrop-blur-xl rounded-3xl
```

---

## Animasyonlar

```tsx
// Hover/Tap
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}

// Pulse (dikkat çekme)
className="animate-pulse"

// Bounce (zafer)
className="animate-bounce"
```

---

## Kontrol Listesi

- [ ] Minimum touch hedefleri (80px)
- [ ] Framer Motion animasyonları
- [ ] Glassmorphism paneller
- [ ] Responsive grid layout
- [ ] Dark theme uyumlu
