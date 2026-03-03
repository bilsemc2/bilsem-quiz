---
name: Component Standardization
description: Touch-First UX standartlarına göre component modernize eder
---

# 🎨 Component Standardization Skill'i

Mevcut component'leri platform'un **Tactile Cyber-Pop** & **Toy-Box** tasarım standartlarına göre modernize etmek için.

> **⚠️ KULLANMA:** Gradient, Glassmorphism (`backdrop-blur`), Soft Shadow (`shadow-xl`), opacity-based background.
> **✅ KULLAN:** Solid renkler, kalın border'lar, hard shadow, `font-nunito font-black`.

---

## Tasarım DNA'sı

### BrainTrainer Oyunları → Tactile Cyber-Pop
```css
/* Yüzeyler */
bg-white dark:bg-slate-800
bg-[#FAF9F6] dark:bg-slate-900     /* Sayfa arka planı */

/* Kartlar */
border-2 border-black/10 rounded-2xl shadow-neo-sm

/* Butonlar */
border-2 border-black/10 rounded-xl shadow-neo-sm font-nunito font-black
active:translate-y-1 active:shadow-none

/* Tipografi */
font-nunito font-black text-xs tracking-widest uppercase  /* Etiketler */
font-nunito font-black text-lg                             /* Butonlar */
```

### Arcade Oyunları → Tactile Toy-Box
```css
/* Yüzeyler */
bg-sky-200 dark:bg-slate-900

/* Kartlar */
border-4 border-black shadow-[8px_8px_0_#000] rounded-2xl
dark:shadow-[8px_8px_0_#0f172a]

/* Butonlar */
border-4 border-black shadow-[8px_8px_0_#000] rounded-2xl font-black uppercase tracking-widest
hover:-translate-y-1 hover:shadow-[12px_12px_0_#000]
active:translate-y-2 active:translate-x-1 active:shadow-none

/* Tipografi */
font-syne font-black uppercase tracking-widest  /* Başlıklar */
font-chivo                                       /* Gövde metni */
```

---

## Touch-First Hedefler

| Element | Minimum Boyut | Tailwind |
|---------|---------------|----------|
| Butonlar | 48px yükseklik | `min-h-[48px] px-6 py-3` |
| Kartlar/Hücreler | 80px x 80px | `min-w-[80px] min-h-[80px]` |
| Grid spacing | 12-16px | `gap-3` veya `gap-4` |
| Köşe yuvarlatma | Büyük | `rounded-xl` veya `rounded-2xl` |

---

## Renk Paleti

### BrainTrainer → `GAME_COLORS`
```typescript
import { GAME_COLORS } from './shared/gameColors';

GAME_COLORS.correct   // '#14F195' — doğru cevap (emerald)
GAME_COLORS.incorrect // '#f43f5e' — yanlış cevap (pink)
GAME_COLORS.highlight // '#dcf126' — seçili öğe (yellow)
GAME_COLORS.blue      // '#1e40af' — bilgi
GAME_COLORS.purple    // '#B026FF' — özel/premium
GAME_COLORS.orange    // '#FF9500' — uyarı
```

### Arcade → `ARCADE_PALETTE`
```typescript
import { ARCADE_PALETTE, ARCADE_COLORS } from '../../Shared/ArcadeConstants';

ARCADE_PALETTE.red.hex    // '#FF6B6B'
ARCADE_PALETTE.blue.hex   // '#74B9FF'
ARCADE_PALETTE.green.hex  // '#55EFC4'
ARCADE_PALETTE.yellow.hex // '#FFEAA7'
```

### Tailwind Cyber Tokens
```css
bg-cyber-yellow  bg-cyber-pink  bg-cyber-blue  bg-cyber-green
bg-cyber-purple  bg-cyber-orange  bg-cyber-emerald
```

---

## Standart Bileşen Örnekleri

### Soru Kartı (BrainTrainer)
```tsx
<div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 shadow-neo-sm">
    <p className="text-slate-500 dark:text-slate-400 font-nunito font-black text-xs tracking-widest uppercase mb-3">
        SORU BAŞLIĞI
    </p>
    {/* İçerik */}
</div>
```

### Cevap Butonu (BrainTrainer)
```tsx
<motion.button
    whileTap={{ scale: 0.95 }}
    onClick={handleAnswer}
    className="p-4 border-2 border-black/10 rounded-xl font-nunito font-black text-lg shadow-neo-sm 
               bg-white dark:bg-slate-700 text-black dark:text-white 
               active:translate-y-1 active:shadow-none transition-colors"
>
    {option.label}
</motion.button>
```

### Tactile Buton (Arcade)
```tsx
<button className="w-full px-8 py-5 bg-yellow-400 text-black border-4 border-black rounded-2xl 
                   text-2xl font-black uppercase tracking-widest 
                   shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#0f172a]
                   hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] 
                   active:translate-y-2 active:shadow-none transition-all">
    Başla
</button>
```

### TUZÖ Badge
```tsx
{/* BrainTrainer stili */}
<div className="inline-flex items-center gap-2 px-4 py-2 bg-cyber-blue/10 dark:bg-cyber-blue/20 
                border-2 border-cyber-blue text-cyber-blue rounded-xl 
                shadow-[2px_2px_0_#000] dark:shadow-[2px_2px_0_#0f172a] rotate-2">
    <span className="text-xs font-black uppercase tracking-widest">TUZÖ</span>
    <span className="text-xs font-bold">5.X.X Beceri Adı</span>
</div>
```

---

## Animasyonlar

```tsx
// Hover/Tap efekti (fiziksel basma)
whileTap={{ scale: 0.95 }}
className="active:translate-y-1 active:shadow-none"

// Bounce animasyonu (ikon)
animate={{ y: [0, -8, 0] }}
transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}

// Giriş animasyonu
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
```

---

## Dark Mode Zorunlulukları

Her öğe için karanlık mod varyantı **zorunludur**:

| Light | Dark |
|-------|------|
| `bg-white` | `dark:bg-slate-800` |
| `bg-[#FAF9F6]` | `dark:bg-slate-900` |
| `text-black` | `dark:text-white` |
| `border-black` | `dark:border-slate-700` |
| `shadow-[8px_8px_0_#000]` | `dark:shadow-[8px_8px_0_#0f172a]` |
| `text-slate-500` | `dark:text-slate-400` |

Ana container'a `transition-colors duration-300` eklemeyi unutmayın.

---

## Kontrol Listesi

- [ ] Glassmorphism/gradient yok (solid renkler)
- [ ] `GAME_COLORS` veya `ARCADE_PALETTE` kullanılıyor
- [ ] Touch hedefleri minimum 48px
- [ ] Framer Motion animasyonları
- [ ] Responsive grid layout (`grid-cols-2`)
- [ ] `max-w-md` veya `max-w-lg` genişlik sınırı
- [ ] Dark mode tüm öğelerde uygulanmış
- [ ] `font-nunito font-black` (BrainTrainer) veya `font-syne font-black` (Arcade)
- [ ] `shadow-neo-sm` veya `shadow-[Xpx_Xpx_0_#000]`
