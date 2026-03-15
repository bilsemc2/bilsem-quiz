---
name: BrainTrainer Simulatoru Ekleme
description: Bireysel Degerlendirme icin yeni bir beyin egitimi simulatoru ekler (Pattern B)
---

# BrainTrainer Simulatoru Ekleme Skill'i

Bu skill, `src/components/BrainTrainer/` altina yeni bir kognitif simulasyon eklemek icin gerekli adimlari icerir.

**Mimari (Pattern B):** Her BrainTrainer oyunu asagidaki yapiya sahiptir:

1. **`{gameName}/logic.ts`** — Pure fonksiyonlar (soru uret, cevap kontrol, skor hesapla, feedback mesaji)
2. **`{gameName}/use{GameName}Controller.ts`** — React hook, `useGameEngine` kullanir
3. **`{gameName}/{GameName}Board.tsx`** — Presentational bilesen (opsiyonel)
4. **`{gameName}/constants.ts`** — GAME_ID, MAX_LEVEL, TIME_LIMIT, INITIAL_LIVES, FEEDBACK_DURATION_MS
5. **`{gameName}/types.ts`** — TypeScript tipleri
6. **`{GameName}Game.tsx`** (ust seviye) — Thin wrapper, controller + BrainTrainerShell cagirir

Paylasimli altyapi:
- `useGameEngine` — `src/components/BrainTrainer/shared/useGameEngine.ts`
- `BrainTrainerShell` — `src/components/BrainTrainer/shared/BrainTrainerShell.tsx`
- `useGameFeedback` — `src/hooks/useGameFeedback.ts` (1200ms standart)
- `GAME_COLORS` — `src/components/BrainTrainer/shared/gameColors.ts`
- Paylasimli bilesenler: `GameOptionButton`, `GameNumpad`, `GameQuestionCard` — `src/components/BrainTrainer/shared/`

## Gerekli Bilgiler

Simulatoru eklemeden once su bilgileri kullanicidan alin:
1. **Simulatoru Adi (Turkce)**: Orn. "Renk Hafizasi"
2. **Dosya Adi**: Orn. "ColorMemoryGame.tsx"
3. **Zeka Turu**: Gorsel-Uzamsal, Sozel, Mantiksal, Isitsel, vb.
4. **Kognitif Hedef**: Hangi TUZO becerisini gelistiriyor?

---

## Platform Standartlari

| Parametre | Deger | Yoneten |
|-----------|-------|---------|
| **Baslangic Cani** | 5 | `useGameEngine` (INITIAL_LIVES) |
| **Global Timer** | 180 saniye | `useGameEngine` (TIME_LIMIT) |
| **Maksimum Level** | 20 | `useGameEngine` (MAX_LEVEL) |
| **Feedback Suresi** | 1200ms | `FEEDBACK_DURATION_MS` sabiti |
| **examMode** | `location.state` otomatik | `useGameEngine` |
| **Skor Kaydi** | `saveGamePlay` otomatik | `useGameEngine` |
| **Welcome/GameOver/Victory** | Otomatik render | `BrainTrainerShell` |
| **HUD (skor, can, timer)** | Otomatik render | `BrainTrainerShell` |
| **Feedback Banner** | Otomatik render | `BrainTrainerShell` |
| **Shuffle** | Fisher-Yates | `.sort(() => random() - 0.5)` KULLANMAYIN |
| **Font** | `font-nunito font-black` | Tailwind class |

> **Inline Style Yasagi:**
> `style={{ backgroundColor: '...' }}` gibi inline style'lar **kullanmayin**.
> - **KULLANMA:** Gradient, Soft Shadow, Glassmorphism.
> - **KULLAN:** `border-2 border-black/10`, `shadow-neo-sm`, Solid Renkler.
> - **Istisna:** Yalnizca JavaScript ile dinamik hesaplanan degerler inline olabilir.

---

## Adim 1: Klasor Yapisi ve Dosyalar

```bash
mkdir -p src/components/BrainTrainer/[gameName]
```

```
src/components/BrainTrainer/
├── [gameName]/
│   ├── logic.ts                    <- Pure fonksiyonlar
│   ├── use[GameName]Controller.ts  <- React hook (useGameEngine)
│   ├── [GameName]Board.tsx         <- Presentational bilesen (opsiyonel)
│   ├── constants.ts                <- Sabitler (opsiyonel, controller icinde de olabilir)
│   └── types.ts                    <- TypeScript tipleri (opsiyonel)
└── [GameName]Game.tsx              <- Thin wrapper (UST SEVIYE)
```

---

## Adim 2: logic.ts — Pure Fonksiyonlar

```typescript
// src/components/BrainTrainer/[gameName]/logic.ts

/** Seviyeye gore soru zorlugunu belirle */
export const getDifficultyForLevel = (level: number) =>
    level <= 5 ? 'easy' : level <= 10 ? 'medium' : level <= 15 ? 'hard' : 'expert';

/** Yeni round/soru uret — pure fonksiyon, side-effect yok */
export const generateRound = (level: number) => {
    const difficulty = getDifficultyForLevel(level);
    // ... soru uretim mantigi ...
    return {
        question: /* ... */,
        correctAnswer: /* ... */,
        options: /* ... */,
    };
};

/** Cevap dogru mu kontrol et */
export const checkAnswer = (
    userAnswer: string,
    correctAnswer: string,
): boolean => {
    return userAnswer === correctAnswer;
};

/** Skor hesapla */
export const calculateScore = (level: number, basePoints: number = 10) =>
    basePoints * level;

/** Feedback mesaji olustur — her oyun bunu MUTLAKA export etmeli */
export const build[GameName]FeedbackMessage = ({
    correct,
    level,
    maxLevel,
    correctAnswer,
}: {
    correct: boolean;
    level: number;
    maxLevel: number;
    correctAnswer: string;
}) => {
    if (correct) {
        if (level >= maxLevel) {
            return 'Tebrikler! Tum seviyeleri tamamladin!';
        }
        return `Dogru! Seviye ${level + 1}'e geciyorsun.`;
    }
    return `Yanlis! Dogru cevap: ${correctAnswer}.`;
};
```

> **ONEMLI:** `build[GameName]FeedbackMessage` fonksiyonu her oyunda **zorunludur**. Isimlendirme kalıbi: `buildXxxFeedbackMessage`.

> **Shuffle icin Fisher-Yates kullanin:**
> ```ts
> function fisherYatesShuffle<T>(arr: T[]): T[] {
>     const result = [...arr];
>     for (let i = result.length - 1; i > 0; i--) {
>         const j = Math.floor(Math.random() * (i + 1));
>         [result[i], result[j]] = [result[j], result[i]];
>     }
>     return result;
> }
> ```
> `.sort(() => Math.random() - 0.5)` asla kullanmayin — uniform dagitim saglamaz.

---

## Adim 3: use[GameName]Controller.ts — Controller Hook

```typescript
// src/components/BrainTrainer/[gameName]/use[GameName]Controller.ts

import { useCallback, useEffect, useState } from 'react';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import { useSound } from '../../../hooks/useSound';
import { useGameEngine } from '../shared/useGameEngine';
import {
    generateRound,
    checkAnswer,
    calculateScore,
    build[GameName]FeedbackMessage,
} from './logic';

const GAME_ID = '[game-slug]';
const MAX_LEVEL = 20;
const FEEDBACK_DURATION_MS = 1200;

export const use[GameName]Controller = () => {
    const engine = useGameEngine({
        gameId: GAME_ID,
        maxLevel: MAX_LEVEL,
        initialLives: 5,
        timeLimit: 180,
    });

    const { playSound } = useSound();
    const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
    const { feedbackState, showFeedback, dismissFeedback } = feedback;

    const { phase, level, addScore, loseLife, nextLevel } = engine;

    const [currentRound, setCurrentRound] = useState<ReturnType<typeof generateRound> | null>(null);

    const startRound = useCallback(() => {
        setCurrentRound(generateRound(level));
    }, [level]);

    // Phase degistiginde round baslat
    useEffect(() => {
        if (phase === 'playing' && !currentRound) {
            startRound();
        } else if (phase !== 'playing') {
            setCurrentRound(null);
        }
    }, [phase, currentRound, startRound]);

    const handleAnswer = useCallback((answer: string) => {
        if (phase !== 'playing' || !!feedbackState || !currentRound) return;

        const correct = checkAnswer(answer, currentRound.correctAnswer);
        const message = build[GameName]FeedbackMessage({
            correct,
            level,
            maxLevel: MAX_LEVEL,
            correctAnswer: currentRound.correctAnswer,
        });

        showFeedback(correct, message);
        playSound(correct ? 'correct' : 'incorrect');

        if (correct) {
            addScore(calculateScore(level));
        } else {
            loseLife();
        }

        setTimeout(() => {
            dismissFeedback();
            if (correct) {
                nextLevel();
            }
            startRound();
        }, FEEDBACK_DURATION_MS);
    }, [phase, feedbackState, currentRound, level, showFeedback, playSound, addScore, loseLife, nextLevel, dismissFeedback, startRound]);

    return {
        engine,
        feedback,
        currentRound,
        handleAnswer,
    };
};
```

---

## Adim 4: [GameName]Game.tsx — Thin Wrapper (Ust Seviye)

```tsx
// src/components/BrainTrainer/[GameName]Game.tsx

import React from 'react';
import { Brain } from 'lucide-react';
import BrainTrainerShell from './shared/BrainTrainerShell';
import { use[GameName]Controller } from './[gameName]/use[GameName]Controller';

const [GameName]Game: React.FC = () => {
    const { engine, feedback, currentRound, handleAnswer } = use[GameName]Controller();

    const gameConfig = {
        title: '[Simulatoru Adi]',
        description: '[Kisa aciklama]',
        tuzoCode: 'TUZO 5.X.X [Beceri Adi]',
        icon: Brain,
        accentColor: 'cyber-blue',
        maxLevel: 20,
        howToPlay: [
            'Adim 1 aciklamasi.',
            'Adim 2 aciklamasi.',
            'Adim 3 aciklamasi.',
        ],
    };

    return (
        <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
            {() => (
                <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full">
                    {engine.phase === 'playing' && currentRound && (
                        <div className="w-full max-w-md text-center space-y-4">
                            {/* SORU ALANI */}
                            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 shadow-neo-sm">
                                <p className="text-slate-500 dark:text-slate-400 font-nunito font-black text-xs tracking-widest uppercase mb-3">
                                    SORU BASLIGI
                                </p>
                                {/* Soru icerigi */}
                            </div>

                            {/* CEVAP BUTONLARI */}
                            <div className="grid grid-cols-2 gap-3">
                                {currentRound.options.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => handleAnswer(option)}
                                        className="p-4 border-2 border-black/10 rounded-xl font-nunito font-black text-lg shadow-neo-sm bg-white dark:bg-slate-700 text-black dark:text-white active:translate-y-1 active:shadow-none"
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </BrainTrainerShell>
    );
};

export default [GameName]Game;
```

---

## Adim 5: Route Ekle

`src/routes/gameRoutes.tsx` dosyasina ekle:

```tsx
const [GameName]Game = React.lazy(() => import('@/components/BrainTrainer/[GameName]Game'));

<Route key="[slug]" path="/games/[slug]" element={<RequireAuth><[GameName]Game /></RequireAuth>} />,
```

---

## Adim 6: IndividualAssessmentPage'e Ekle (EN USTE EKLE)

`src/pages/workshops/IndividualAssessmentPage.tsx` dosyasinda **modules dizisinin EN BASINA** ekle:

```tsx
const modules = [
    {
        id: '[simulator-slug]',
        title: '[Simulatoru Adi]',
        desc: 'Kisa aciklama',
        icon: <Brain />,
        color: 'cyber-green',
        difficulty: 'Zor',
        link: '/games/[simulator-slug]',
        isNew: true,
        tuzo: '5.X.X TUZO Beceri Adi',
    },
    // ... mevcut oyunlar
];
```

> **Kurallar:**
> 1. **En uste ekle**: Yeni oyun her zaman listenin en basinda olmali
> 2. **isNew: true ekle**: Bu, oyunun yaninda "YENI" badge'i gosterir
> 3. **Onceki oyunun isNew'ini kaldir**: Bir onceki yeni oyunun `isNew: true` satirini sil

---

## Adim 7: Zeka Turu Eslestirmesi Ekle (KRITIK)

`src/constants/intelligenceTypes.ts` dosyasinda oyunu **her iki tabloya** ekle:

```typescript
// 1. OYUN_ZEKA_ESLESTIRMESI
'[simulator-slug]': ZEKA_TURLERI.[UYGUN_TIP],

// 2. OYUN_WORKSHOP_ESLESTIRMESI
'[simulator-slug]': 'bireysel',
```

> Bu adim zorunludur! Eklenmezse admin panelindeki raporlarda oyun gorunmez.

---

## Adim 8: XP Requirement Ekle

```sql
INSERT INTO xp_requirements (path, xp_cost, description)
VALUES ('/atolyeler/bireysel-degerlendirme/[simulator-slug]', 15, '[Simulatoru Adi]');
```

---

## Adim 9: Sinav Simulasyonu Modulu Ekle (ZORUNLU)

`src/config/examModules.ts` dosyasina ekle:

```typescript
{
    id: '[simulator-slug]',
    title: '[Simulatoru Adi]',
    link: '/games/[simulator-slug]',
    tuzo: '5.X.X Beceri Adi',
    category: 'memory' | 'logic' | 'attention' | 'verbal' | 'speed' | 'perception' | 'social',
    timeLimit: 120,
    active: true
},
```

> examMode tamamen `useGameEngine` tarafindan yonetilir. Oyun kodunda `location.state`, `submitResult`, `navigate` gibi examMode mantigi **EKLEMEYIN**.

---

## useGameEngine Sagladiklari

| Ozellik | Aciklama |
|---------|----------|
| `phase` | `'welcome' \| 'playing' \| 'feedback' \| 'game_over' \| 'victory'` |
| `level`, `score`, `lives`, `timeLeft` | Otomatik yonetilen state |
| `handleStart()` | Oyun baslatma (BrainTrainerShell cagirir) |
| `addScore(points)` | Skor ekleme |
| `loseLife()` | Can azaltma (0'da otomatik game_over) |
| `nextLevel()` | Seviye artirma (maxLevel'da otomatik victory) |
| `onCorrect(bonus?)` | addScore + nextLevel birlesik |
| `onIncorrect()` | loseLife kisayolu |
| `setGamePhase(phase)` | Manuel phase degisikligi |
| `examMode` | `location.state` otomatik okuma |
| `addTime(seconds)` | Timer'a sure ekleme |

---

## GAME_COLORS Referans

```typescript
import { GAME_COLORS } from './shared/gameColors';

GAME_COLORS.yellow    // '#dcf126' — cyber-yellow
GAME_COLORS.blue      // '#1e40af' — cyber-blue
GAME_COLORS.pink      // '#f43f5e' — cyber-pink
GAME_COLORS.emerald   // '#14F195' — cyber-emerald
GAME_COLORS.purple    // '#B026FF' — cyber-purple
GAME_COLORS.orange    // '#FF9500' — cyber-orange

GAME_COLORS.correct   // '#14F195' — dogru cevap
GAME_COLORS.incorrect // '#f43f5e' — yanlis cevap
GAME_COLORS.highlight // '#dcf126' — secili/highlight

GAME_COLORS.paper     // '#FAF9F6' — acik arka plan
GAME_COLORS.obsidian  // '#0B0C10' — koyu arka plan
GAME_COLORS.shapes    // 8 renklik dizi
```

---

## Dogrulama Kontrol Listesi

- [ ] `logic.ts` pure fonksiyonlar icerir (generateRound, checkAnswer, buildXxxFeedbackMessage)
- [ ] `use[GameName]Controller.ts` `useGameEngine` kullanir
- [ ] `[GameName]Game.tsx` thin wrapper, controller + BrainTrainerShell
- [ ] FEEDBACK_DURATION_MS = 1200
- [ ] Fisher-Yates shuffle kullanildi (.sort random DEGIL)
- [ ] `build[GameName]FeedbackMessage` export edildi
- [ ] Cift tiklama korumasi: `if (!!feedbackState) return;`
- [ ] Dark mode uyumlu (`dark:bg-slate-800`, `dark:text-white`)
- [ ] `src/routes/gameRoutes.tsx`'e route eklendi
- [ ] `IndividualAssessmentPage`'e **EN USTE** eklendi + `isNew: true`
- [ ] Onceki oyunun `isNew` kaldirildi
- [ ] `intelligenceTypes.ts`'e eklendi (zeka + workshop)
- [ ] XP requirement veritabanina eklendi
- [ ] `examModules.ts`'e eklendi

---

## Referans Simulatorler

| Oyun | Klasor | Ozellik |
|------|--------|---------|
| Renk Algilama | `colorPerception/` | logic.ts + controller kalip ornegi |
| Kozmik Hafiza | `cosmicMemory/` | Bellek + grid layout |
| Dikkat Kodlama | `attentionCoding/` | Grid + hiz |
| Gurultu Filtresi | `noiseFilter/` | Isitsel + audioModel.ts |
| Kalem Stroop | `pencilStroop/` | Stroop + dinamik stil |
| Capraz Eslesme | `crossMatch/` | Coklu kural |