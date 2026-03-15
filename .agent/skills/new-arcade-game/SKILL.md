---
name: Zeka Arcade Oyunu Ekleme
description: XP-tuketimli premium arcade oyunu ekler
---

# Zeka Arcade Oyunu Ekleme Skill'i

Bu skill, **Zeka Arcade** hub'ina yeni bir premium oyun **kaydetmek** icin gerekli adimlari icerir.
(Kayit: routing, hub listesi, XP, veritabani)

> **Oyun bilesenini olusturmak icin** mutlaka `standardize-arcade-game` skill'ini de oku:
> `.agent/skills/standardize-arcade-game/SKILL.md`
> Bu skill; `KidGameShell`, `KidGameFeedbackBanner`, `KidGameStatusOverlay`, lifecycle guvenligi ve renk standardini belgeler.

## Gerekli Bilgiler

1. **Oyun Adi (Turkce)**: Orn. "Kristal Magarasi"
2. **Oyun Slug'i**: Orn. "kristal-magarasi"
3. **XP Maliyeti**: 30-50 arasi onerilir
4. **Gradient Renkleri**: Orn. "from-cyan-500 to-blue-600"
5. **Kategori**: `memory` | `spatial` | `flexibility`

---

## Arcade vs Standard Oyun Farklari

| Ozellik | Standard Oyun (BrainTrainer) | Arcade Oyunu |
|---------|------------------------------|--------------|
| XP Modeli | XP kazandirir | XP harcar (jeton) |
| Giris | Direkt erisim | Hub uzerinden CoinToss |
| UI Kabugu | `BrainTrainerShell` | `KidGameShell` + `KidGameFeedbackBanner` + `KidGameStatusOverlay` |
| Ses | Standart | `useArcadeSoundEffects` |

---

## Adim 1: Klasor Yapisini Olustur

```bash
mkdir -p src/components/Arcade/Games/[OyunAdi]
```

Klasor yapisi:
```
src/components/Arcade/Games/[OyunAdi]/
├── types.ts          <- GameState ve oyuna ozgu tipler
├── constants.ts      <- Oyuna ozgu config (gerekirse)
└── [OyunAdi].tsx     <- Ana bilesen (KidGameShell icerir)
```

> Paylasimli bilesenler zaten mevcut — yeni kopya olusturmayin:
> - `src/components/kid-ui/` — KidGameShell, KidGameFeedbackBanner, KidGameStatusOverlay, KidButton, KidCard, KidBadge
> - `src/components/Arcade/Shared/` — ArcadeConstants, useArcadeSoundEffects, arcadeSoundModel, Balloon, Cloud

**types.ts sablonu:**
```typescript
export type GameStatus = 'START' | 'PLAYING' | 'GAME_OVER' | 'SUCCESS';

export interface GameState {
    score: number;
    level: number;
    lives: number;
    status: GameStatus;
}
```

---

## Adim 2: Ana Oyun Bilesenini Olustur

```tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import KidGameShell from '@/components/kid-ui/KidGameShell';
import KidGameFeedbackBanner from '@/components/kid-ui/KidGameFeedbackBanner';
import KidGameStatusOverlay from '@/components/kid-ui/KidGameStatusOverlay';
import { KidButton, KidCard, KidBadge } from '@/components/kid-ui';
import { useArcadeSoundEffects } from '../../Shared/useArcadeSoundEffects';
import { useGameViewportFocus } from '@/hooks/useGameViewportFocus';
import {
    ARCADE_SCORE_FORMULA,
    ARCADE_SCORE_BASE,
} from '../../Shared/ArcadeConstants';
import type { GameState } from './types';

const OyunAdi: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>({
        score: 0, level: 1, lives: 5, status: 'START',
    });

    const hasSavedRef = useRef(false);
    const isResolvingRef = useRef(false);
    const { containerRef } = useGameViewportFocus(gameState.status === 'PLAYING');
    const sfx = useArcadeSoundEffects();

    const startGame = useCallback(() => {
        hasSavedRef.current = false;
        isResolvingRef.current = false;
        setGameState({ score: 0, level: 1, lives: 5, status: 'PLAYING' });
    }, []);

    return (
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
                actions={gameState.status === 'START' ? [{ label: 'Basla', onClick: startGame }] : []}
            >
                {gameState.status === 'PLAYING' && (
                    <div>{/* Oyun icerigi */}</div>
                )}

                <KidGameFeedbackBanner
                    message={feedback?.message ?? null}
                    type={feedback?.type}
                />

                {gameState.status === 'GAME_OVER' && (
                    <KidGameStatusOverlay
                        tone="pink"
                        title="Oyun Bitti!"
                        stats={[{ label: 'Skor', value: gameState.score }]}
                        actions={[{ label: 'Tekrar Oyna', onClick: startGame }]}
                    />
                )}
            </KidGameShell>
        </div>
    );
};
```

---

## Adim 3: games.tsx'e Ekle

`src/components/Arcade/games.tsx` dosyasina ekle:

```tsx
{
  id: '[oyun-slug]',
  title: '[Oyun Adi]',
  description: 'Oyun aciklamasi',
  cost: 40,
  color: 'from-cyan-500 to-blue-600',
  icon: <Icon size={48} className="text-white" />,
  link: '/bilsem-zeka/[oyun-slug]',
  tuzo: '5.X.X TUZO Beceri Adi',
  category: 'memory'
}
```

**Kategori Sistemi:**
| Kategori | Slug | Hub Basligi |
|----------|------|-------------|
| Hafiza Oyunlari | `memory` | Hafiza Oyunlari |
| Uzamsal Zeka | `spatial` | Uzamsal Zeka |
| Bilissel Esneklik | `flexibility` | Bilissel Esneklik |

> `category` alani zorunludur! Hub sayfasinda oyunlar kategorilere gore gruplandirilir.

**Mevcut TUZO Kodlari:**
| Kod | Beceri |
|-----|--------|
| 5.1.x | Sozel Beceriler |
| 5.2.x | Sayisal Beceriler |
| 5.3.x | Uzamsal Beceriler |
| 5.4.x | Kisa Sureli Bellek |
| 5.5.x | Akil Yurutme |
| 5.6.x | Islem Hizi |
| 5.7.x | Dikkat |
| 5.8.x | Kontrol/Esneklik |
| 5.9.x | Calisma Bellegi |
| 5.10.x | Sosyal Zeka |

---

> **Inline Style Yasagi:**
> `style={{ backgroundColor: '...' }}` gibi inline style'lar **kullanmayin**. Tailwind class'larini tercih edin:
> - `boxShadow` icin `shadow-neo-xs`, `shadow-neo-sm`, `shadow-neo-md`, `shadow-neo-lg` kullanin
> - `background` icin canli ve solid renkler `bg-amber-300`, `bg-sky-200`. Gradient **kullanmayin**
> - `border` icin kalin cerceveler `border-3 border-black/10`
> - `borderRadius` icin `rounded-2xl`, `rounded-3xl`, `rounded-full`
>
> **Istisna:** Yalnizca JavaScript ile dinamik hesaplanan degerler (canvas boyutu, pozisyon, hesaplanmis rotasyon) inline olabilir.

---

## Adim 4: Route Ekle

`src/routes/arcadeRoutes.tsx` dosyasina ekle:

```tsx
// Lazy import (dosyanin ustune)
const [OyunAdi] = React.lazy(() => import('@/components/Arcade/Games/[OyunAdi]/[OyunAdi]'));

// arcadeRoutes dizisine ekle
<Route key="[oyun-slug]" path="/bilsem-zeka/[oyun-slug]" element={<RequireAuth><[OyunAdi] /></RequireAuth>} />,
```

---

## Adim 5: XP Requirement Ekle

```sql
INSERT INTO xp_requirements (path, xp_cost, description)
VALUES ('/bilsem-zeka/[oyun-slug]', 40, '[Oyun Adi]');
```

---

## Adim 6: Intelligence Types Eslestirmesi

`src/constants/intelligenceTypes.ts` dosyasina oyunu ekle:

**OYUN_ZEKA_ESLESTIRMESI (Zeka Turu):**
```typescript
'[oyun-slug]': ZEKA_TURLERI.CALISMA_BELLEGI, // veya uygun zeka turu
```

**OYUN_WORKSHOP_ESLESTIRMESI (Workshop Turu):**
```typescript
'[oyun-slug]': 'arcade',
```

> Bu adim **zorunludur**! Eklenmezse `workshop_type` ve `intelligence_type` veritabanina `null` olarak kaydedilir.

---

## Tasarim Standartlari - Tactile Toy-Box Stili

### Tactile Toy-Box Estetigi

Arcade oyunlari "oyuncak kutusu" (Tactile Toy-Box) ve Cyber-Pop gorsel stilini takip etmelidir. Canli ve solid renkler, kalin cerceveler, belirgin neo-brutalism golgeleri ve child-friendly bilesenler temel alinir.

Kid-UI bilesenleri kullanin:
- `KidButton` — 3D press efektli butonlar
- `KidCard` — kalin kenarlikli kartlar
- `KidBadge` — renkli etiketler
- `KidGameShell` — oyun kabugu
- `KidGameFeedbackBanner` — geri bildirim (fixed bottom-6)
- `KidGameStatusOverlay` — durum ekrani

### Karanlik Mod (Dark Mode) Uyumu

Tum arcade oyunlari **mutlaka** karanlik mod destegine sahip olmalidir. `dark:` Tailwind varyantlariyla tamamlanmalidir.

1. **Renk Gecisleri:** `transition-colors duration-300`
2. **Arka Planlar:** `dark:bg-slate-800`, `dark:bg-slate-900`
3. **Metinler ve Kenarliklar:** `dark:text-white`, `dark:border-slate-700`

---

## Arcade-Specific Ozellikler

**CoinToss Akisi:**
```
ArcadeHub -> ArcadeMachine -> XP Check -> CoinToss -> navigate(link, { state: { arcadeMode: true, autoStart: true } })
```

**Location State:**
```tsx
const isArcadeMode = location.state?.arcadeMode === true;
const autoStart = location.state?.autoStart === true;
```

**Arcade Geri Yonlendirme:**
```tsx
const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
```

---

## Veri Kaydi ve Guvenlik (Cifte Kaydi Onleme)

```tsx
const hasSavedRef = useRef(false);

useEffect(() => {
  if (lives <= 0 && phase === 'playing') {
    if (!hasSavedRef.current) {
      hasSavedRef.current = true;
      saveGamePlay({ ... });
      setPhase('game_over');
    }
  }
}, [lives, phase]);

const startGame = () => {
  hasSavedRef.current = false;
  // ...
};
```

---

## Adim 7: YouTube Icerik Paketi

Her yeni arcade oyunu icin YouTube tanitim icerigi olustur.

### Baslik Formulu

```
BILSEM Zeka Arcade: [Oyun Adi] [emoji] [Kisa Kanca] | [TUZO Beceri Adi]
```

**Kurallar:**
- Maks 70 karakter (mobil uyum)
- Ilk 40 karakterde ana kanca
- En az 1 emoji
- "BILSEM Zeka" veya "Zeka Arcade" basta
- TUZO beceri adi sonda

**3 alternatif baslik uret**, farkli acilardan:
1. Oyun mekanigi odakli
2. Zorluk/tuzak odakli
3. Eglence/aksiyon odakli

### Aciklama Sablonu

```
BILSEM Zeka Arcade: [Oyun Adi] — [Bir cumlelik oyun aciklamasi]

BILSEM Zeka Arcade'in premium oyunlarindan! [Oyuna ozgu 1-2 cumle aciklama]

Ozellikler:
- [Oyuna ozgu ozellik 1]
- [Oyuna ozgu ozellik 2]
- [Oyuna ozgu ozellik 3]
- XP ile acilan premium icerik
- TUZO [X.X.X Beceri Adi] mufredatina uygun

TUZO Beceri: [X.X.X Beceri Adi]
Kategori: Zeka Arcade — [Memory/Spatial/Logic/Flexibility]
XP Maliyeti: [30-50] XP

Hemen Oyna: https://www.bilsemc2.com/bilsem-zeka
Platform: https://www.bilsemc2.com

#BILSEM #ZekaArcade #BILSEMZeka #ZekaOyunlari #TUZO #BILSEMHazirlik #BilsemC2
```

---

## Referans Oyunlar

- `src/components/Arcade/Games/RenkliBalon/` — Pilot standardizasyon oyunu
- `src/components/Arcade/Shared/` — Paylasimli bilesenler (ArcadeConstants, useArcadeSoundEffects, arcadeSoundModel)
- `src/components/kid-ui/` — KidGameShell, KidGameFeedbackBanner, KidGameStatusOverlay, KidButton, KidCard, KidBadge
- `src/hooks/useGameViewportFocus.ts` — Viewport focus hook
- **Bilesen mimarisi icin:** `.agent/skills/standardize-arcade-game/SKILL.md`