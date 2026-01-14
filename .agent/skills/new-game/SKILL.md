---
name: Yeni Oyun Ekleme
description: Logic Capsule Pattern kullanarak yeni bir oyun ekler
---

# 🎮 Yeni Oyun Ekleme Skill'i

Bu skill, **Logic Capsule Pattern** kullanarak yeni bir oyun eklemek için gerekli tüm adımları içerir.

## Gerekli Bilgiler

Oyun eklemeden önce şu bilgileri kullanıcıdan alın:
1. **Oyun Adı (Türkçe)**: Örn. "Renk Avı"
2. **Oyun Slug'ı**: Örn. "renk-avi" (URL'de kullanılacak)
3. **Minimum Sınıf Seviyesi**: 1-8 arası
4. **Oyun Kategorisi**: logic, memory, attention, verbal, spatial, arithmetic
5. **Zeka Türü**: Görsel-Uzamsal, Sözel, Mantıksal-Matematiksel, vb.

---

## Adım 1: Feature Klasör Yapısını Oluştur

```bash
mkdir -p src/features/[oyun-slug]-game/components
mkdir -p src/features/[oyun-slug]-game/hooks
mkdir -p src/features/[oyun-slug]-game/utils
```

### Örnek Yapı:
```
src/features/renk-avi-game/
├── components/
│   └── RenkAviGame.tsx       # Ana orchestrator
├── hooks/
│   └── useGameLogic.ts       # Oyun mantığı hook'u (opsiyonel)
├── utils/
│   └── helpers.ts            # Yardımcı fonksiyonlar (opsiyonel)
├── types.ts                  # Tip tanımları
├── constants.ts              # Sabitler
└── index.ts                  # Export barrel
```

---

## Adım 2: types.ts Dosyasını Oluştur

```typescript
// src/features/[oyun-slug]-game/types.ts

export type GamePhase = 'welcome' | 'playing' | 'loading' | 'game_over';

export interface GameState {
  phase: GamePhase;
  score: number;
  lives: number;
  level: number;
  isGameCompleted: boolean;
}

// Oyuna özel tipler buraya eklenir
export interface GameItem {
  id: string;
  // ... oyuna özel alanlar
}
```

---

## Adım 3: constants.ts Dosyasını Oluştur

```typescript
// src/features/[oyun-slug]-game/constants.ts

export const GAME_CONFIG = {
  INITIAL_LIVES: 5,
  MAX_LEVEL: 20,
  TIME_LIMIT_SECONDS: 180,
  POINTS_PER_CORRECT: 10,
  POINTS_BONUS_MULTIPLIER: 1.5,
};

export const COLORS = {
  PRIMARY: '#6366f1',
  SUCCESS: '#22c55e',
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
};
```

---

## Adım 4: Ana Game Component'i Oluştur

```tsx
// src/features/[oyun-slug]-game/components/[OyunAdi]Game.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useGameTracker } from '../../../hooks/useGameTracker';
import BaseGameContainer from '../../../components/game/BaseGameContainer';
import type { GamePhase, GameState } from '../types';
import { GAME_CONFIG } from '../constants';

const [OyunAdi]Game: React.FC = () => {
  const { profile } = useAuth();
  const gameTracker = useGameTracker('[oyun-slug]');
  
  // Game State
  const [phase, setPhase] = useState<GamePhase>('welcome');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(GAME_CONFIG.INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [isGameCompleted, setIsGameCompleted] = useState(false);

  // Oyun başlatma
  const handleStart = useCallback(() => {
    setPhase('playing');
    setScore(0);
    setLives(GAME_CONFIG.INITIAL_LIVES);
    setLevel(1);
    setIsGameCompleted(false);
    gameTracker.startSession();
  }, [gameTracker]);

  // Oyun yeniden başlatma
  const handleRestart = useCallback(() => {
    handleStart();
  }, [handleStart]);

  // Oyun bitişi
  const handleGameEnd = useCallback(async (won: boolean) => {
    setPhase('game_over');
    setIsGameCompleted(true);
    
    await gameTracker.endSession({
      score_achieved: score,
      levels_completed: level,
      accuracy_percentage: (score / (level * GAME_CONFIG.POINTS_PER_CORRECT)) * 100,
    });
  }, [gameTracker, score, level]);

  // Doğru cevap
  const handleCorrect = useCallback(() => {
    setScore(prev => prev + GAME_CONFIG.POINTS_PER_CORRECT);
    // Sonraki seviyeye geç veya oyunu bitir
    if (level >= GAME_CONFIG.MAX_LEVEL) {
      handleGameEnd(true);
    } else {
      setLevel(prev => prev + 1);
    }
  }, [level, handleGameEnd]);

  // Yanlış cevap
  const handleIncorrect = useCallback(() => {
    const newLives = lives - 1;
    setLives(newLives);
    
    if (newLives <= 0) {
      handleGameEnd(false);
    }
  }, [lives, handleGameEnd]);

  // Minimum sınıf seviyesi kontrolü
  const minGrade = 1; // Kullanıcıdan alınan değer

  return (
    <BaseGameContainer
      gameTitle="[Oyun Adı]"
      minGrade={minGrade}
      gameTracker={gameTracker}
      phase={phase}
      score={score}
      lives={lives}
      isGameCompleted={isGameCompleted}
      onStart={handleStart}
      onRestart={handleRestart}
      benefits={[
        {
          icon: 'Brain',
          title: 'Hafıza Geliştirme',
          description: 'Görsel hafızanızı güçlendirin',
          color: 'text-purple-400',
        },
        {
          icon: 'Target',
          title: 'Dikkat Kontrolü',
          description: 'Odaklanma becerinizi artırın',
          color: 'text-blue-400',
        },
      ]}
    >
      {/* Oyun içeriği buraya */}
      <div className="w-full max-w-4xl mx-auto p-4">
        {/* Oyun board'u, kartlar, grid vb. */}
      </div>
    </BaseGameContainer>
  );
};

export default [OyunAdi]Game;
```

---

## Adım 5: index.ts Export Barrel Oluştur

```typescript
// src/features/[oyun-slug]-game/index.ts

export { default as [OyunAdi]Game } from './components/[OyunAdi]Game';
export * from './types';
export * from './constants';
```

---

## Adım 6: Page Component Oluştur (Thin Wrapper)

```tsx
// src/pages/[OyunAdi]GamePage.tsx

import React, { Suspense, lazy } from 'react';
import { LazyWrapper } from '../router';

const [OyunAdi]Game = lazy(() => 
  import('../features/[oyun-slug]-game').then(m => ({ default: m.[OyunAdi]Game }))
);

const [OyunAdi]GamePage: React.FC = () => {
  return (
    <LazyWrapper>
      <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>}>
        <[OyunAdi]Game />
      </Suspense>
    </LazyWrapper>
  );
};

export default [OyunAdi]GamePage;
```

---

## Adım 7: App.tsx'e Route Ekle

`src/App.tsx` dosyasında:

```tsx
// Lazy import ekle
const [OyunAdi]GamePage = React.lazy(() => import('./pages/[OyunAdi]GamePage'));

// Route ekle (Routes içinde)
<Route 
  path="/oyunlar/[oyun-slug]" 
  element={
    <RequireAuth>
      <[OyunAdi]GamePage />
    </RequireAuth>
  } 
/>
```

---

## Adım 8: Game Registry'ye Ekle (Opsiyonel)

Eğer `src/data/games.tsx` veya `gameRegistry.ts` kullanılıyorsa:

```tsx
// src/data/games.tsx

{
  id: '[oyun-slug]',
  title: '[Oyun Adı]',
  description: 'Oyun açıklaması',
  category: 'logic', // veya memory, attention, verbal, spatial, arithmetic
  minGrade: 1,
  icon: <Brain size={48} className="text-white" />,
  link: '/oyunlar/[oyun-slug]',
  isActive: true,
}
```

---

## Adım 9: XP Requirement Ekle (Veritabanı)

Admin panelinden veya Supabase SQL Editor'dan:

```sql
INSERT INTO xp_requirements (path, xp_cost, description) 
VALUES ('/oyunlar/[oyun-slug]', 10, '[Oyun Adı] oyunu');
```

---

## Doğrulama Kontrol Listesi

- [ ] Feature klasörü oluşturuldu
- [ ] `types.ts` ve `constants.ts` dosyaları mevcut
- [ ] Ana game component `BaseGameContainer` ile entegre
- [ ] Page component thin wrapper olarak oluşturuldu
- [ ] Route `App.tsx`'e eklendi
- [ ] `RequireAuth` wrapper uygulandı
- [ ] Game registry güncellendi (varsa)
- [ ] XP requirement veritabanına eklendi
- [ ] `npm run build` başarılı
- [ ] Oyun tarayıcıda çalışıyor

---

## Yaygın Hatalar ve Çözümleri

| Hata | Çözüm |
|------|-------|
| `gameTitle` vs `gameName` | Sadece `gameTitle` kullanın |
| `onRetry` vs `onRestart` | Sadece `onRestart` kullanın |
| Unused imports (TS6133) | Kullanılmayan import'ları temizleyin |
| `phase` type mismatch | `GamePhase` tipini `'welcome' \| 'playing' \| 'game_over'` ile eşleştirin |

---

## Referans Dosyalar

- **Örnek Oyun**: `src/features/abc-connection-game/`
- **BaseGameContainer**: `src/components/game/BaseGameContainer.tsx`
- **useGameTracker**: `src/hooks/useGameTracker.ts`
- **App Routes**: `src/App.tsx`
