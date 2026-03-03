---
name: BrainTrainer Simülatörü Ekleme
description: Bireysel Değerlendirme için yeni bir beyin eğitimi simülatörü ekler
---

# 🧠 BrainTrainer Simülatörü Ekleme Skill'i

Bu skill, `src/components/BrainTrainer/` altına yeni bir kognitif simülatör eklemek için gerekli adımları içerir.

**Mimari:** Tüm BrainTrainer oyunları **3 paylaşımlı yapı** üzerine kuruludur:
1. `useGameEngine` — State yönetimi, timer, can, skor, examMode, kayıt
2. `BrainTrainerShell` — HUD, welcome/game_over/victory ekranları, feedback banner
3. `GAME_COLORS` — Paylaşımlı renk paleti

## Gerekli Bilgiler

Simülatör eklemeden önce şu bilgileri kullanıcıdan alın:
1. **Simülatör Adı (Türkçe)**: Örn. "Renk Hafızası"
2. **Dosya Adı**: Örn. "ColorMemoryGame.tsx"
3. **Zeka Türü**: Görsel-Uzamsal, Sözel, Mantıksal, İşitsel, vb.
4. **Kognitif Hedef**: Hangi TUZÖ becerisini geliştiriyor?

---

## Platform Standartları

| Parametre | Değer | Yöneten |
|-----------|-------|---------|
| **Başlangıç Canı** | 5 | `useGameEngine` |
| **Global Timer** | 180 saniye | `useGameEngine` |
| **Maksimum Level** | 20 | `useGameEngine` |
| **examMode** | `location.state` otomatik | `useGameEngine` |
| **Skor Kaydı** | `saveGamePlay` otomatik | `useGameEngine` |
| **Welcome/GameOver/Victory** | Otomatik render | `BrainTrainerShell` |
| **HUD (skor, can, timer)** | Otomatik render | `BrainTrainerShell` |
| **Feedback Banner** | Otomatik render | `BrainTrainerShell` |
| **Touch Target** | Minimum 80px | Oyun JSX'inde |
| **Renkler** | `GAME_COLORS` sabitleri | `shared/gameColors.ts` |
| **Font** | `font-nunito font-black` | Tailwind class |

> **⚠️ Inline Style Yasağı:**
> `style={{ backgroundColor: '...' }}` gibi inline style'lar **kullanmayın**.
> - **KULLANMA:** Gradient, Soft Shadow, Glassmorphism.
> - **KULLAN:** `border-2 border-black/10`, `shadow-neo-sm`, Solid Renkler.
> - **İstisna:** Yalnızca JavaScript ile dinamik hesaplanan değerler inline olabilir.

---

## Adım 1: Component Dosyasını Oluştur

`src/components/BrainTrainer/[SimulatorName]Game.tsx` dosyasını oluştur.

### Tam Şablon

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react'; // Oyuna uygun ikon seç
import { useSound } from '../../hooks/useSound';
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import { useGameEngine } from './shared/useGameEngine';
import BrainTrainerShell from './shared/BrainTrainerShell';
import { GAME_COLORS } from './shared/gameColors';

const GAME_ID = '[simulator-slug]';
const GAME_TITLE = '[Simülatör Adı]';
const GAME_DESCRIPTION = '[Kısa açıklama]';
const TUZO_TEXT = 'TUZÖ 5.X.X [Beceri Adı]';

const [SimulatorName]Game: React.FC = () => {
  // ====== 1. HOOKS ======
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1000 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const { phase, level, addScore, loseLife, nextLevel } = engine;

  // ====== 2. OYUN STATE'İ ======
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);

  // ====== 3. SORU ÜRETİMİ ======
  const generateQuestion = useCallback(() => {
    // Oyuna özgü soru üretimi
    return { /* question data */ };
  }, [level]); // Seviye bazlı zorluk artışı

  const startLevel = useCallback(() => {
    setCurrentQuestion(generateQuestion());
  }, [generateQuestion]);

  // ====== 4. PHASE EFEKTİ ======
  useEffect(() => {
    if (phase === 'playing' && !currentQuestion) {
      startLevel();
    } else if (phase === 'welcome' || phase === 'game_over' || phase === 'victory') {
      setCurrentQuestion(null);
    }
  }, [phase, currentQuestion, startLevel]);

  // ====== 5. CEVAP KONTROL ======
  const handleAnswer = (answer: any) => {
    if (phase !== 'playing' || !!feedbackState || !currentQuestion) return;

    const isCorrect = /* doğruluk kontrolü */;
    showFeedback(isCorrect);
    playSound(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      addScore(10 * level);
      safeTimeout(() => {
        dismissFeedback();
        nextLevel();
        startLevel();
      }, 1000);
    } else {
      loseLife();
      safeTimeout(() => {
        dismissFeedback();
        if (engine.lives > 1) {
          startLevel();
        }
      }, 1000);
    }
  };

  // ====== 6. CONFIG ======
  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Brain,
    accentColor: 'cyber-blue', // cyber-blue, cyber-pink, cyber-green, cyber-yellow
    maxLevel: 20,
    howToPlay: [
      'Adım 1 açıklaması.',
      'Adım 2 açıklaması.',
      'Adım 3 açıklaması.'
    ],
  };

  // ====== 7. RENDER ======
  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full">
          {phase === 'playing' && currentQuestion && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md text-center space-y-4"
            >
              {/* SORU ALANI */}
              <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 shadow-neo-sm">
                <p className="text-slate-500 dark:text-slate-400 font-nunito font-black text-xs tracking-widest uppercase mb-3">
                  SORU BAŞLIĞI
                </p>
                {/* Soru içeriği */}
              </div>

              {/* CEVAP BUTONLARI */}
              <div className="grid grid-cols-2 gap-3">
                {/* Her buton için: */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAnswer(option)}
                  className="p-4 border-2 border-black/10 rounded-xl font-nunito font-black text-lg shadow-neo-sm bg-white dark:bg-slate-700 text-black dark:text-white active:translate-y-1 active:shadow-none"
                >
                  {option.label}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default [SimulatorName]Game;
```

### useGameEngine Sağladıkları (Import Etmeyin, Zaten İçinde)

| Özellik | Açıklama |
|---------|----------|
| `phase` | `'welcome' \| 'playing' \| 'feedback' \| 'game_over' \| 'victory'` |
| `level`, `score`, `lives`, `timeLeft` | Otomatik yönetilen state |
| `handleStart()` | Oyun başlatma (BrainTrainerShell çağırır) |
| `addScore(points)` | Skor ekleme |
| `loseLife()` | Can azaltma (0'da otomatik game_over) |
| `nextLevel()` | Seviye artırma (maxLevel'da otomatik victory) |
| `onCorrect(bonus?)` | addScore + nextLevel birleşik |
| `onIncorrect()` | loseLife kısayolu |
| `setGamePhase(phase)` | Manuel phase değişikliği |
| `examMode` | `location.state` otomatik okuma |
| `addTime(seconds)` | Timer'a süre ekleme |

### BrainTrainerShell Otomatik Yönetir

| Bileşen | Açıklama |
|---------|----------|
| **Welcome Screen** | Başlık, açıklama, nasıl oynanır, TUZÖ badge, Başla butonu |
| **HUD** | Skor, canlar, timer, seviye göstergesi |
| **Game Over Screen** | Skor özeti, tekrar oyna butonu |
| **Victory Screen** | Tebrik, skor, tekrar oyna |
| **Feedback Banner** | Doğru/yanlış overlay (`GameFeedbackBanner`) |
| **Geri Dön** | `/atolyeler/bireysel-degerlendirme` link |
| **Scroll Lock** | Otomatik body scroll lock |

### GameShellConfig Seçenekleri

```typescript
{
  title: string;           // Zorunlu
  icon: LucideIcon;        // Zorunlu
  description: string;     // Zorunlu
  howToPlay: ReactNode[];  // Zorunlu
  tuzoCode?: string;       // TUZÖ badge (önerilir)
  maxLevel?: number;       // Varsayılan: 20
  accentColor?: string;    // 'cyber-blue' | 'cyber-pink' | 'cyber-green' | 'cyber-yellow'
  wideLayout?: boolean;    // true ise max-w-3xl (geniş oyunlar için)
  extraHudItems?: ReactNode;         // HUD'a ek öğeler
  extraGameOverActions?: ReactNode;  // Game over'da ek içerik
  customWelcome?: ReactNode;         // Welcome ekranını override et
  backLink?: string;                 // Geri dön linki override
  backLabel?: string;                // Geri dön etiketi override
  onRestart?: () => void;            // Tekrar oyna'da özel reset
}
```

---

## Adım 2: Route Ekle

`src/routes/gameRoutes.tsx` dosyasına ekle:

```tsx
// Lazy import (dosyanın üstüne)
const [SimulatorName]Game = React.lazy(() => import('@/components/BrainTrainer/[SimulatorName]Game'));

// gameRoutes dizisine ekle
<Route key="[slug]" path="/games/[slug]" element={<RequireAuth><[SimulatorName]Game /></RequireAuth>} />,
```

---

## Adım 3: IndividualAssessmentPage'e Ekle ⚠️ EN ÜSTE EKLE

`src/pages/workshops/IndividualAssessmentPage.tsx` dosyasında **modules dizisinin EN BAŞINA** ekle:

```tsx
const modules = [
    {
        id: '[simulator-slug]',
        title: '[Simülatör Adı]',
        desc: 'Kısa açıklama',
        icon: <Brain />,
        color: 'cyber-green', // cyber-blue, cyber-pink, cyber-green, cyber-yellow
        difficulty: 'Zor', // Kolay/Orta/Zor/Uzman
        link: '/games/[simulator-slug]',
        isNew: true,  // 🆕 YENİ badge gösterir
        tuzo: '5.X.X TUZÖ Beceri Adı',
    },
    // ... mevcut oyunlar
];
```

> **⚠️ Kurallar:**
> 1. **En üste ekle**: Yeni oyun her zaman listenin en başında olmalı
> 2. **isNew: true ekle**: Bu, oyunun yanında "YENİ" badge'i gösterir
> 3. **Önceki oyunun isNew'ini kaldır**: Bir önceki yeni oyunun `isNew: true` satırını sil

**Mevcut TUZÖ Kodları:**
| Kod | Beceri |
|-----|--------|
| 5.1.x | Sözel Beceriler (Kelime, Analoji, Anlama) |
| 5.2.x | Sayısal Beceriler (Dizi, Problem, Mantık) |
| 5.3.x | Uzamsal Beceriler (Desen, Şekil, Labirent) |
| 5.4.x | Kısa Süreli Bellek (Sayısal, Görsel) |
| 5.5.x | Akıl Yürütme (Analogik, Kural Çıkarsama) |
| 5.6.x | İşlem Hızı |
| 5.7.x | Dikkat (Seçici, Bölünmüş) |
| 5.8.x | Kontrol/Esneklik (Stroop, İnhibishyon) |
| 5.9.x | Çalışma Belleği (Güncelleme, İzleme, Bağlama) |
| 5.10.x | Sosyal Zeka |

---

## Adım 4: Zeka Türü Eşleştirmesi Ekle ⚠️ KRİTİK

`src/constants/intelligenceTypes.ts` dosyasında oyunu **her iki tabloya** ekle:

```typescript
// 1. OYUN_ZEKA_ESLESTIRMESI
export const OYUN_ZEKA_ESLESTIRMESI: Record<string, ZekaTuru> = {
    '[simulator-slug]': ZEKA_TURLERI.[UYGUN_TIP],
};

// 2. OYUN_WORKSHOP_ESLESTIRMESI
export const OYUN_WORKSHOP_ESLESTIRMESI: Record<string, WorkshopType> = {
    '[simulator-slug]': 'bireysel',
};
```

> **⚠️ Bu adım zorunludur!** Eklenmezse admin panelindeki raporlarda oyun görünmez.

---

## Adım 5: XP Requirement Ekle

```sql
INSERT INTO xp_requirements (path, xp_cost, description) 
VALUES ('/atolyeler/bireysel-degerlendirme/[simulator-slug]', 15, '[Simülatör Adı]');
```

---

## Adım 6: Sınav Simülasyonu Modülü Ekle ⚠️ ZORUNLU

`src/config/examModules.ts` dosyasına ekle:

```typescript
{
    id: '[simulator-slug]',
    title: '[Simülatör Adı]',
    link: '/games/[simulator-slug]',
    tuzo: '5.X.X Beceri Adı',
    category: 'memory' | 'logic' | 'attention' | 'verbal' | 'speed' | 'perception' | 'social',
    timeLimit: 120, // saniye
    active: true
},
```

> **⚠️ KRİTİK:** examMode tamamen `useGameEngine` tarafından yönetilir. Oyun kodunda `location.state`, `submitResult`, `navigate` gibi examMode mantığı **EKLEMEYIN** — engine otomatik halleder.

---

## Adım 7: YouTube İçerik Paketi

Her yeni simülatör için YouTube tanıtım içeriği oluştur.

### Başlık Formülü

```
BİLSEM [Simülatör Adı] 🧠[emoji] [Kısa Kanca] | [TUZÖ Beceri Adı]
```

**Kurallar:**
- Maks 70 karakter (mobil uyum)
- İlk 40 karakterde ana kanca
- En az 1 emoji
- BİLSEM kelimesi başta
- TUZÖ beceri adı sonda

**3 alternatif başlık üret**, farklı açılardan:
1. Oyun mekaniği odaklı
2. Zorluk/tuzak odaklı
3. Hız/beyin odaklı

### Açıklama Şablonu

```
🧠 BİLSEM [Simülatör Adı] — [Bir cümlelik oyun açıklaması]

Bu simülatör, BİLSEM 2. Aşama Bireysel Değerlendirme sınavına hazırlık için tasarlandı.

⚡ Özellikler:
• 20 seviye
• [Oyuna özgü özellik 1]
• [Oyuna özgü özellik 2]
• 5 can, 180 saniye süre
• TUZÖ [X.X.X Beceri Adı] müfredatına uygun

🎯 TUZÖ Beceri: [X.X.X Beceri Adı]
📊 Kategori: Bireysel Değerlendirme (2. Aşama)

🔗 Hemen Oyna: https://www.bilsemc2.com/games/[slug]
🌐 Platform: https://www.bilsemc2.com

#BİLSEM #BİLSEM2Aşama #ZekaOyunları #BireyselDeğerlendirme #TUZÖ #BİLSEMHazırlık #BilsemC2
```

---

## GAME_COLORS Referans

```typescript
import { GAME_COLORS } from './shared/gameColors';

// Ana Palet
GAME_COLORS.yellow    // '#dcf126' — cyber-yellow
GAME_COLORS.blue      // '#1e40af' — cyber-blue
GAME_COLORS.pink      // '#f43f5e' — cyber-pink
GAME_COLORS.emerald   // '#14F195' — cyber-emerald
GAME_COLORS.purple    // '#B026FF' — cyber-purple
GAME_COLORS.orange    // '#FF9500' — cyber-orange

// Semantik
GAME_COLORS.correct   // '#14F195' — doğru cevap
GAME_COLORS.incorrect // '#f43f5e' — yanlış cevap
GAME_COLORS.highlight // '#dcf126' — seçili/highlight

// Yüzeyler
GAME_COLORS.paper     // '#FAF9F6' — açık arka plan
GAME_COLORS.obsidian  // '#0B0C10' — koyu arka plan

// Canvas/SVG şekilleri
GAME_COLORS.shapes    // 8 renklik dizi
```

---

## Doğrulama Kontrol Listesi

- [ ] `useGameEngine` + `BrainTrainerShell` + `GAME_COLORS` kullanıldı
- [ ] Oyun yalnızca `phase === 'playing'` içeriğini render ediyor
- [ ] `useGameFeedback` + `useSafeTimeout` + `useSound` kullanıldı
- [ ] Çift tıklama koruması: `if (!!feedbackState) return;`
- [ ] Yanlış cevapta yeni soru üretiliyor
- [ ] `max-w-md` veya `max-w-lg` genişlik sınırı
- [ ] `grid-cols-2` buton düzeni (4 seçenekte)
- [ ] Dark mode uyumlu (`dark:bg-slate-800`, `dark:text-white`)
- [ ] `src/routes/gameRoutes.tsx`'e route eklendi
- [ ] `IndividualAssessmentPage`'e **EN ÜSTE** eklendi + `isNew: true`
- [ ] Önceki oyunun `isNew` kaldırıldı
- [ ] `intelligenceTypes.ts`'e eklendi (zeka + workshop)
- [ ] XP requirement veritabanına eklendi
- [ ] `examModules.ts`'e eklendi
- [ ] YouTube paketi oluşturuldu

---

## Referans Simülatörler

| Oyun | Dosya | Özellik |
|------|-------|---------|
| Yüz İfadesi | `FaceExpressionGame.tsx` | Basit soru-cevap şablonu |
| Renkli Kalemler | `PencilStroopGame.tsx` | Stroop + dinamik stil |
| Kozmik Hafıza | `CosmicMemoryGame.tsx` | Bellek + grid layout |
| Labirent | `MazeRunnerGame.tsx` | Canvas + touch |
| Sayı Dizisi | `NumberSequenceGame.tsx` | Mantık + level zorluk |
| Sözel Analoji | `VerbalAnalogyGame.tsx` | Sözel beceri |
