---
name: Arcade Oyunu Standardize Etme
description: Mevcut bir arcade oyununu KidGameShell + kid-ui bileşenleri mimarisine gecirir
---

# Arcade Oyunu Standardize Etme Skill'i

Bu skill, mevcut veya yeni bir arcade oyununu projenin **tek tip standart mimarisine** kavusturmak icin kullanilir.

> Bu mimarinin pilot uygulamasi `RenkliBalon.tsx`'dir. Incelemek icin bak:
> `src/components/Arcade/Games/RenkliBalon/`

---

## Arcade/Shared ve kid-ui — Paylasimli Altyapi

Tum arcade oyunlari asagidaki **paylasimli dosyalari** kullanir:

| Dosya | Konum | Aciklama |
|-------|-------|----------|
| `KidGameShell` | `src/components/kid-ui/KidGameShell.tsx` | HUD, overlay (Baslat/Bitis/Basari) ve scroll yonetimi |
| `KidGameFeedbackBanner` | `src/components/kid-ui/KidGameFeedbackBanner.tsx` | `fixed bottom-6` anlık geri bildirim (`success` / `error` / `warning`) |
| `KidGameStatusOverlay` | `src/components/kid-ui/KidGameStatusOverlay.tsx` | Tam ekran durum overlay'i (game over, basari vb.) |
| `KidButton`, `KidCard`, `KidBadge` | `src/components/kid-ui/index.ts` | Cocuk dostu UI bilesenleri |
| `ArcadeConstants.ts` | `src/components/Arcade/Shared/` | Renkler, feedback yazilari, zorluk esikleri, spawn config, skor formulu |
| `useArcadeSoundEffects` | `src/components/Arcade/Shared/useArcadeSoundEffects.ts` | Arcade ses efektleri hook'u |
| `arcadeSoundModel` | `src/components/Arcade/Shared/arcadeSoundModel.ts` | Ses modeli (pure functions) |
| `useGameViewportFocus` | `src/hooks/useGameViewportFocus.ts` | Mobilde oyun alanina otomatik scroll/focus |
| `Balloon.tsx` | `src/components/Arcade/Shared/` | Tiklanabilir balon bileseni |
| `Cloud.tsx` | `src/components/Arcade/Shared/` | Animasyonlu bulut dekor bileseni |

> **SILINMIS BILESENLER:** `ArcadeGameShell.tsx` ve `ArcadeFeedbackBanner.tsx` artik **mevcut degildir**.
> Bunlarin yerine `KidGameShell`, `KidGameFeedbackBanner` ve `KidGameStatusOverlay` kullanin.

---

## Adim 1: Oyun Bileseninden Standart Kabuk'u Ayir

### Oyun dosyasina su import'lari ekle:

```tsx
import KidGameShell from '@/components/kid-ui/KidGameShell';
import KidGameFeedbackBanner from '@/components/kid-ui/KidGameFeedbackBanner';
import KidGameStatusOverlay from '@/components/kid-ui/KidGameStatusOverlay';
import { KidButton, KidCard, KidBadge } from '@/components/kid-ui';
import { useArcadeSoundEffects } from '../../Shared/useArcadeSoundEffects';
import { useGameViewportFocus } from '@/hooks/useGameViewportFocus';
import {
    ARCADE_COLORS,
    ARCADE_COLOR_NAMES,
    ARCADE_FEEDBACK_TEXTS,
    ARCADE_DIFFICULTY_THRESHOLDS,
    ARCADE_SPAWN_CONFIG,
    ARCADE_SCORE_FORMULA,
    ARCADE_SCORE_BASE,
} from '../../Shared/ArcadeConstants';
```

### GameState Tipi — her oyun bunu tanimlamali:

```ts
// types.ts dosyasina ekle
export interface GameState {
    score: number;
    level: number;
    lives: number;
    status: 'START' | 'PLAYING' | 'GAME_OVER' | 'SUCCESS';
}
```

> `WIN` veya `FINISHED` gibi ozel durum adlari **kullanmayin**. Standart `SUCCESS` kullanin.

---

## Adim 2: KidGameShell ile Sarmala

```tsx
const { containerRef } = useGameViewportFocus(gameState.status === 'PLAYING');
const sfx = useArcadeSoundEffects();

<div ref={containerRef}>
  <KidGameShell
      tone="yellow"
      title="OYUN BASLIGI"
      icon={IconComponent}
      badges={[{ label: 'TUZO 5.X.X', variant: 'info' }]}
      stats={[
          { label: 'Skor', value: gameState.score },
          { label: 'Seviye', value: gameState.level },
          { label: 'Can', value: gameState.lives, emphasis: gameState.lives <= 1 ? 'danger' : 'default' },
      ]}
      actions={[{ label: 'Basla', onClick: startGame }]}
  >
      {/* Oyunun kendi UI icerigi buraya */}
  </KidGameShell>
</div>
```

### KidGameShell Otomatik Olarak Yonetir:
- **HUD:** Skor / Seviye / Can sayaci — stats prop'u ile
- **Baslik ve Ikon:** Oyunun ust kisminda
- **Aksiyonlar:** Baslat/tekrar butonlari — actions prop'u ile
- **Ton:** `tone` prop'u ile renk temasi (yellow, blue, emerald, pink, orange, purple)

### KidGameFeedbackBanner Kullanimi:
```tsx
<KidGameFeedbackBanner
    message={feedback.message}
    type={feedback.type}  // 'success' | 'error' | 'warning'
/>
```
> Banner `fixed bottom-6` pozisyonundadir, absolute degil.

### KidGameStatusOverlay Kullanimi:
```tsx
{gameState.status === 'GAME_OVER' && (
    <KidGameStatusOverlay
        tone="pink"
        icon={XCircle}
        title="Oyun Bitti!"
        stats={[{ label: 'Skor', value: gameState.score }]}
        actions={[{ label: 'Tekrar Oyna', onClick: startGame }]}
    />
)}
```

---

## Adim 3: Ses ve Viewport

### useArcadeSoundEffects:
```tsx
const sfx = useArcadeSoundEffects();

// Dogru cevap
sfx.playCorrect();

// Yanlis cevap
sfx.playIncorrect();

// Seviye gecisi
sfx.playLevelUp();
```

### useGameViewportFocus:
```tsx
const { containerRef } = useGameViewportFocus(gameState.status === 'PLAYING');

return <div ref={containerRef}>...</div>;
```
> Mobilde oyun basladiginda otomatik olarak oyun alanina scroll yapar.

---

## Adim 4: Sabit Degerleri ArcadeConstants'a Yonlendir

### Skor Formulu:
```ts
// Eski:
score + (20 * prev.level)

// Yeni:
score + ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, prev.level)
```

### Renkler ve Isimler:
```ts
ARCADE_COLORS      // string[]
ARCADE_COLOR_NAMES // Record<string,string>
// Veya spesifik renk icin:
ARCADE_PALETTE.red.hex   // '#FF6B6B'
ARCADE_PALETTE.red.name  // 'Kirmizi'
```

### Feedback Yazilari:
```ts
const msg = ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES[Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES.length)];
const errMsg = ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES[Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES.length)];
```

---

## Adim 5: Modernizasyon Zorunluluklari

Tum arcade oyunlari asagidaki lifecycle guvenligi kurallarina uymali:

### Ref Havuzu (En Uste Ekle):
```tsx
const hasSavedRef = useRef<boolean>(false);
const isResolvingRef = useRef<boolean>(false);
const laserTimeoutRef = useRef<NodeJS.Timeout | null>(null);
```

### Global Unmount Cleanup (Zorunlu):
```tsx
useEffect(() => {
    return () => {
        if (laserTimeoutRef.current)    clearTimeout(laserTimeoutRef.current);
        if (spawnTimerRef.current)       clearInterval(spawnTimerRef.current);
    };
}, []);
```

### Callback Kilit Oruntüsu:
```tsx
const handleShoot = async (item, event) => {
    if (gameState.status !== 'PLAYING' || isResolvingRef.current) return;
    isResolvingRef.current = true;
    //... islem ...
    setTimeout(() => { isResolvingRef.current = false; }, 500);
};
```

### Oyun Bitis Kaydi (Idempotent):
```tsx
useEffect(() => {
    if (gameState.lives <= 0 && gameState.status === 'PLAYING') {
        setGameState(gs => ({ ...gs, status: 'GAME_OVER' }));
        if (!hasSavedRef.current) {
            hasSavedRef.current = true;
            saveGamePlay({ game_id: '...', score_achieved: gameState.score, ... });
        }
    }
}, [gameState.lives, gameState.status]);
```

### Game Loop'u Sadece PLAYING'de Calistir:
```tsx
useEffect(() => {
    if (gameState.status !== 'PLAYING') return;  // BU SATIR ZORUNLUDUR
    // interval / animation mantigi
}, [gameState.status, ...]);
```

---

## Adim 6: Paylasimli Bilesenleri Kullan

```tsx
// Yerel components/ klasoru YERINE:
import Balloon from '../../Shared/Balloon';
import Cloud from '../../Shared/Cloud';

// kid-ui bilesenleri:
import { KidButton, KidCard, KidBadge } from '@/components/kid-ui';
```

Yeni bir paylasimli bilesen eklenecekse:
- Arcade'e ozel: `src/components/Arcade/Shared/`
- Tum cocuk oyunlarina ortak: `src/components/kid-ui/`

---

## Renk Paleti (Cocuk Dostu Candy-Pastel)

| id | hex | Turkce Adi |
|----|-----|-----------|
| `red` | `#FF6B6B` | Kirmizi (Mercan) |
| `blue` | `#74B9FF` | Mavi (Gokyuzu) |
| `green` | `#55EFC4` | Yesil (Nane) |
| `yellow` | `#FFEAA7` | Sari (Limon) |
| `purple` | `#A29BFE` | Mor (Lavanta) |
| `pink` | `#FD79A8` | Pembe (Seker) |
| `orange` | `#FDCB6E` | Turuncu (Mandalin) |
| `teal` | `#00CEC9` | Turkuaz (Deniz) |

---

## Referans Dosyalar

| Dosya | Ozellik |
|-------|---------|
| `RenkliBalon/RenkliBalon.tsx` | Pilot standardizasyon, KidGameShell referans |
| `DarkMaze/DarkMaze.tsx` | Canvas + joystick kontrol |
| `ChromaHafiza/ChromaHafiza.tsx` | Bellek + grid |
| `SevimliMantik/SevimliMantik.tsx` | Mantik + level |
| `src/components/kid-ui/KidGameShell.tsx` | Standart kabuk |
| `src/components/kid-ui/KidGameFeedbackBanner.tsx` | Geri bildirim banner |
| `src/components/kid-ui/KidGameStatusOverlay.tsx` | Durum overlay |
| `Shared/ArcadeConstants.ts` | Sabitler |
| `Shared/useArcadeSoundEffects.ts` | Ses efektleri |
| `Shared/arcadeSoundModel.ts` | Ses modeli |