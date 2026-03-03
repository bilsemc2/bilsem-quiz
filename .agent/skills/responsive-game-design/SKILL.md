---
name: Responsive Touch-First Game Design
description: Arcade oyunları için responsive ve touch-first tasarım standartları
---

# 📱 Responsive Touch-First Game Design

Arcade oyunlarını mobil uyumlu ve touch-friendly yapmak için standart pattern'ler.

---

## 🎯 Core Principles

### 1. Touch Scroll Prevention
Oyun alanında sayfa kaydırmasını engelle:

```tsx
// Container'da touch-none ve overflow-hidden
<div className="h-screen overflow-hidden touch-none" 
     style={{ WebkitTapHighlightColor: 'transparent' }}>

// Touch event'lerde preventDefault
const handleTouchStart = (e: React.TouchEvent) => {
  e.preventDefault();
  // ... işlem
};
```

### 2. Responsive Breakpoints

| Breakpoint | Kullanım |
|------------|----------|
| Base (< 640px) | Mobil - en kompakt |
| `sm:` (≥ 640px) | Tablet |
| `lg:` (≥ 1024px) | Desktop - yan yana layout |
| `xl:` (≥ 1280px) | Geniş ekran |

---

## 📐 Layout Patterns

### Main Container
```tsx
<div className="h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 
                flex flex-col items-center justify-center 
                p-2 sm:p-4 pt-16 sm:pt-20 
                touch-none"
     style={{ WebkitTapHighlightColor: 'transparent' }}>
```

### Responsive HUD
```tsx
<div className="absolute top-16 sm:top-20 left-2 sm:left-4 z-50">
  <Link className="flex items-center gap-1.5 sm:gap-2 
                   px-2.5 sm:px-4 py-1.5 sm:py-2 
                   text-xs sm:text-sm rounded-lg sm:rounded-xl">
    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
    <span className="font-bold">BİLSEM</span>
  </Link>
</div>
```

### Responsive Game Canvas
```tsx
<div className="w-full max-w-[280px] sm:max-w-[400px] lg:max-w-[500px]
                border-2 sm:border-4 rounded-2xl sm:rounded-3xl
                p-2 sm:p-4">
```

---

## 🎮 Interactive Elements

### Touch-Friendly Buttons
```tsx
<button
  onClick={handleClick}
  onTouchStart={(e) => {
    e.preventDefault();
    handleClick();
  }}
  className="h-16 sm:h-24 rounded-2xl sm:rounded-3xl touch-none active:scale-90"
  style={{ WebkitTapHighlightColor: 'transparent' }}
>
```

### Canvas Touch Handling
```tsx
<canvas
  className="touch-none cursor-crosshair"
  style={{ WebkitTapHighlightColor: 'transparent' }}
  onTouchStart={(e) => { e.preventDefault(); handleStart(e); }}
  onTouchMove={(e) => { e.preventDefault(); handleMove(e); }}
  onTouchEnd={(e) => { e.preventDefault(); handleEnd(e); }}
/>
```

---

## 📋 Responsive Checklist

### Container
- [ ] `h-screen` veya `min-h-screen`
- [ ] `overflow-hidden` (scroll engelleme)
- [ ] `touch-none` class
- [ ] `WebkitTapHighlightColor: transparent`

### HUD Elements  
- [ ] `top-16 sm:top-20` positioning
- [ ] `left-2 sm:left-4` spacing
- [ ] `text-xs sm:text-sm` font sizes
- [ ] `w-4 h-4 sm:w-5 sm:h-5` icon sizes
- [ ] Kompakt back button text (ör. "BİLSEM" vs "BİLSEM Zeka")

### Game Area
- [ ] `max-w-[280px] sm:max-w-[400px] lg:max-w-[500px]`
- [ ] `gap-2 sm:gap-4` spacing
- [ ] `p-2 sm:p-4` padding
- [ ] `rounded-2xl sm:rounded-3xl` corners

### Buttons/Controls
- [ ] `h-16 sm:h-24` minimum height
- [ ] `onTouchStart` with `preventDefault`
- [ ] `touch-none` class
- [ ] `active:scale-90` feedback

---

## Oyun Düzeltme Checklist

### Tamamlanan ✅
- [x] Ayna Ustası - Touch scroll fixed
- [x] Renkli Balon - Full responsive  
- [x] Ters Navigator - Full responsive
- [x] DarkMaze - Virtual joystick
- [x] Labirent Ustası - Virtual joystick
- [x] Neşeli Balonlar - Full responsive
- [x] Örüntülü Top - Responsive HUD
- [x] Renkli Lambalar - Responsive HUD + touch-none
- [x] Yol Bulmaca - Responsive HUD + touch-none
- [x] Kart Dedektifi - Responsive HUD + touch-none
- [x] ChromaBreak - Responsive header + touch-none
- [x] Chroma Hafıza - Responsive header + touch-none (3D game)

### Kalan ⬜
- [x] KraftOrigami (Paper folder)
