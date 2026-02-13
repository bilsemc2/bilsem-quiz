---
name: BrainTrainer Simülatörü Ekleme
description: Bireysel Değerlendirme için yeni bir beyin eğitimi simülatörü ekler
---

# 🧠 BrainTrainer Simülatörü Ekleme Skill'i

Bu skill, `src/components/BrainTrainer/` altına yeni bir kognitif simülatör eklemek için gerekli adımları içerir.

## Gerekli Bilgiler

Simülatör eklemeden önce şu bilgileri kullanıcıdan alın:
1. **Simülatör Adı (Türkçe)**: Örn. "Renk Hafızası"
2. **Dosya Adı**: Örn. "ColorMemoryGame.tsx"
3. **Zeka Türü**: Görsel-Uzamsal, Sözel, Mantıksal, İşitsel, vb.
4. **Kognitif Hedef**: Hangi TUZÖ becerisini geliştiriyor?

---

## Platform Standartları

Tüm BrainTrainer simülatörleri şu standartları takip etmelidir:

| Parametre | Değer |
|-----------|-------|
| **Başlangıç Canı** | 5 |
| **Global Timer** | 180 saniye (3 dakika) |
| **Maksimum Level** | 20 |
| **Touch Target** | Minimum 80px |
| **Feedback** | `useGameFeedback` hook + `GameFeedbackBanner` component |
| **Feedback Süresi** | 2 saniye (yanlış cevapta doğruyu göstermek için) |
| **Canvas Max Genişlik** | `Math.min(window.innerWidth - 32, 480)` px |
| **Body Scroll Lock** | Oyun sırasında `overflow: hidden` + `touch-action: none` |
| **Responsive Yeniden Boyutlama** | `window.addEventListener('resize', ...)` zorunlu |

---

## Adım 1: Component Dosyasını Oluştur

`src/components/BrainTrainer/[SimulatorName]Game.tsx` dosyasını oluştur.

### Import'lar ve Sabitler

```tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, RotateCcw, Play, Star, Timer, Target, 
  XCircle, ChevronLeft, Zap, Brain, Heart 
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';
```

### Component Yapısı

```tsx
const [SimulatorName]Game: React.FC = () => {
  const { saveGamePlay } = useGamePersistence();
  const location = useLocation();
  const navigate = useNavigate();
  const { submitResult } = useExam();

  // ⚠️ examMode location.state'ten okunur — props DEĞİL!
  const examMode = location.state?.examMode || false;
  const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

  // Shared Feedback System
  const { feedbackState, showFeedback } = useGameFeedback();

  const hasSavedRef = useRef(false);

  // Core State
  const [phase, setPhase] = useState<Phase>('welcome');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
```

### Timer Effect

```tsx
  useEffect(() => {
    if (phase === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && phase === 'playing') {
      handleGameOver();
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, timeLeft]);
```

### Start, Auto-Start, GameOver, Victory

```tsx
  const handleStart = useCallback(() => {
    window.scrollTo(0, 0);
    setPhase('playing');
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
    startTimeRef.current = Date.now();
    hasSavedRef.current = false;
  }, [examMode, examTimeLimit]);

  // Auto-start: sınav modunda veya HUB'dan gelince welcome ekranını atla
  useEffect(() => {
    if ((location.state?.autoStart || examMode) && phase === 'welcome') {
      handleStart();
    }
  }, [location.state, examMode, phase, handleStart]);

  // Game Over
  const handleGameOver = useCallback(async () => {
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;
    setPhase('game_over');
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    if (examMode) {
      const passed = level >= 5; // Oyuna özel geçme kriteri
      (async () => {
        await submitResult(passed, score, 1000, duration);
        navigate('/atolyeler/sinav-simulasyonu/devam');
      })();
      return;
    }

    await saveGamePlay({
      game_id: '[simulator-slug]',
      score_achieved: score,
      duration_seconds: duration,
      metadata: { levels_completed: level, final_lives: lives },
    });
  }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

  // Victory (20. level tamamlandığında)
  const handleVictory = useCallback(async () => {
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;
    setPhase('victory');
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    if (examMode) {
      (async () => {
        await submitResult(true, score, 1000, duration);
        navigate('/atolyeler/sinav-simulasyonu/devam');
      })();
      return;
    }

    await saveGamePlay({
      game_id: '[simulator-slug]',
      score_achieved: score,
      duration_seconds: duration,
      metadata: { levels_completed: MAX_LEVEL, victory: true },
    });
  }, [saveGamePlay, score, examMode, submitResult, navigate]);
```

### Cevap Kontrol + Feedback Geçiş Pattern'i

**Standart pattern: `setTimeout` ile manuel geçiş** (15+ oyunda kullanılıyor)

`useGameFeedback` hook'u 2 saniye sonra banner'ı otomatik kapatır. Oyun geçişleri banner'dan bağımsız olarak `setTimeout` ile yönetilir:

```tsx
  // Standart feedback hook — callback'siz
  const { feedbackState, showFeedback } = useGameFeedback();

  // Cevap verilince:
  const handleAnswer = (selected: number) => {
    if (phase !== 'playing' || feedbackState) return; // Çift tıklama koruması

    const isCorrect = selected === correctAnswer;
    showFeedback(isCorrect);  // Otomatik: ses çalar, 2s overlay gösterir
    setPhase('feedback');     // Grid görünür kalır + doğru cevap vurgulanır

    if (isCorrect) {
      setScore(prev => prev + 10 * level);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
    }

    // ⏱️ 1500ms sonra geçiş (banner 2000ms'de kapanır, bu ondan önce)
    setTimeout(() => {
      if (isCorrect) {
        if (level >= MAX_LEVEL) {
          handleVictory();
        } else {
          const newLevel = level + 1;
          setLevel(newLevel);
          initLevel(newLevel);  // Yeni soruyu üret
          setPhase('playing');
        }
      } else {
        if (lives - 1 <= 0) {   // ⚠️ lives henüz güncellenmemiş olabilir, -1 ile kontrol et
          handleGameOver();
        } else {
          initLevel(level);     // Aynı seviyeyi tekrarla
          setPhase('playing');
        }
      }
    }, 1500);
  };
```

> **⚠️ DİKKAT — Stale Closure Riski:**
> `setTimeout` içinde `lives` ve `level` state değerleri closure'dan okunur. Eğer `setLives` veya `setLevel` çağrısı `setTimeout`'dan **önce** yapılırsa, setTimeout içinde **eski değer** okunur. Bu yüzden:
> - **Doğru**: `lives - 1 <= 0` (ham hesaplama)
> - **Yanlış**: `newLives <= 0` (eğer `newLives` closure dışında tanımlanmadıysa)
>
> Alternatif olarak `useRef` kullanarak güncel değeri saklayabilirsiniz.

**Alternatif pattern: `onFeedbackEnd` callback** (5 oyunda kullanılıyor)

Daha karmaşık oyunlarda (çok fazlı, animasyonlu) `useGameFeedback` hook'una callback geçilebilir:

```tsx
  const { feedbackState, showFeedback } = useGameFeedback({
    onFeedbackEnd: (correct) => {
      // 2s sonra otomatik çağrılır
      if (correct && level >= MAX_LEVEL) { handleVictory(); return; }
      if (!correct && livesRef.current <= 0) { handleGameOver(); return; }
      const nextLevel = correct ? level + 1 : level;
      setLevel(nextLevel);
      initLevel(nextLevel);
      setPhase('playing');
    }
  });
```

> **⚠️ DİKKAT — Declaration Order:**
> `onFeedbackEnd` callback, `handleGameOver`/`handleVictory` fonksiyonlarını çağırıyorsa ve bunlar henüz tanımlanmadıysa, `useRef` pattern'i gerekir (bkz. `MatrixEchoGame.tsx`).

### JSX Yapısı (Özet)

```tsx
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      {/* Decorative Background */}
      {/* Header: Skor, Can, Timer, Level */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <AnimatePresence mode="wait">
          {phase === 'welcome' && ( /* Welcome Screen */ )}
          {(phase === 'playing' || phase === 'feedback') && ( /* Game Board */ )}
          {phase === 'game_over' && ( /* Game Over Screen */ )}
          {phase === 'victory' && ( /* Victory Screen */ )}
        </AnimatePresence>

        {/* Feedback Banner — her zaman render, state ile görünür */}
        <GameFeedbackBanner feedback={feedbackState} />
      </div>
    </div>
  );
```

> **Tam JSX referansı** için mevcut oyunlardan birine bakın (bkz. [Referans Simülatörler](#referans-simülatörler)).

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
        icon: <Brain />, // veya uygun ikon
        color: 'violet',
        difficulty: 'Zor', // Kolay/Orta/Zor/Uzman
        link: '/games/[simulator-slug]',
        isNew: true,  // 🆕 YENİ badge gösterir
        tuzo: '5.X.X TUZÖ Beceri Adı',  // ❗ Zorunlu!
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

> **⚠️ Bu adım zorunludur!** Eklenmezse admin panelindeki TalentAnalytics/StudentStatistics raporlarında oyun görünmez.

---

## Adım 5: XP Requirement Ekle

```sql
INSERT INTO xp_requirements (path, xp_cost, description) 
VALUES ('/atolyeler/bireysel-degerlendirme/[simulator-slug]', 15, '[Simülatör Adı]');
```

---

## Adım 6: Sınav Simülasyonu Modülü Ekle ⚠️ ZORUNLU

Her yeni BrainTrainer oyunu sınav simülasyonuna da eklenmelidir. `src/config/examModules.ts` dosyasına ekle:

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

### examMode Akışı

```
ExamContinuePage → navigate(link, { state: { examMode: true, examTimeLimit: X } })
    → Oyun auto-start → oyun biter → await submitResult → navigate('/devam')
    → ExamContinuePage tekrar yüklenir → sıradaki modül
```

> **⚠️ KRİTİK:** `examMode` component props olarak **GEÇİLMEZ**. `ExamContinuePage` bunu `location.state` ile gönderir. Bu yüzden `location.state?.examMode` olarak okunmalıdır. Props olarak tanımlarsanız her zaman `false` kalır!

### examMode Entegrasyon Özeti

```typescript
// 1. location.state'ten oku (Adım 1'deki template'de zaten var)
const examMode = location.state?.examMode || false;
const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

// 2. Auto-start
if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();

// 3. submitResult — async IIFE ile await et!
if (examMode) {
    (async () => {
        await submitResult(passed, score, 1000, duration);
        navigate('/atolyeler/sinav-simulasyonu/devam');
    })();
    return;
}
```

> **⚠️ `submitResult` bir Promise döndürür.** Mutlaka `await` ile çağrılmalı, yoksa navigate submitResult tamamlanmadan çalışır ve session state güncellenemez.

### Pass Kriterleri Örnekleri

| Oyun Tipi | Geçme Kriteri |
|-----------|---------------|
| Hafıza | `correctCount >= questions.length / 2` |
| Tepki Süresi | `successfulReactions >= 5 && avgReaction < 400ms` |
| Dikkat | `accuracy >= 60%` |
| Desen/Level | `level >= 5` |

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

Bu simülatör, BİLSEM 2. Aşama Bireysel Değerlendirme sınavına hazırlık için tasarlandı. [Oyuna özgü 1-2 cümle açıklama]

⚡ Özellikler:
• 20 seviye — [seviye ilerlemesi açıklaması]
• [Oyuna özgü özellik 1]
• [Oyuna özgü özellik 2]
• 5 can, 180 saniye süre
• TUZÖ [X.X.X Beceri Adı] müfredatına uygun

🎯 TUZÖ Beceri: [X.X.X Beceri Adı]
📊 Kategori: Bireysel Değerlendirme (2. Aşama)

🔗 Hemen Oyna: https://www.bilsemc2.com/games/[slug]
🌐 Platform: https://www.bilsemc2.com

#BİLSEM #BİLSEM2Aşama #ZekaOyunları #[OyunaÖzgüHashtag] #BireyselDeğerlendirme #TUZÖ #BİLSEMHazırlık #BilsemC2
```

### Küçük Resim (Thumbnail) AI İstemleri

3 farklı thumbnail istemi üret:

**İstem 1 — Oyun Mekaniği Odaklı:**
```
YouTube thumbnail, [renk paleti] gradient background, [oyunun ana görselini tanımla],
bold Turkish text "[KISA BAŞLIK]" in [renk] with glow effect, child-friendly cartoon style,
clean modern design, 1280x720
```

**İstem 2 — Beyin/Hız Odaklı:**
```
YouTube thumbnail, vibrant [renk] gradient, brain icon with [efekt], [oyun elementleri],
bold Turkish text "[KANCA]" in white, energetic dynamic composition, 1280x720
```

**İstem 3 — Tuzak/Zorluk Odaklı:**
```
YouTube thumbnail, dark [renk] background with neon accents, [zorluk elementleri],
bold red Turkish text "[UYARI MESAJI]" at top, warning symbols, dramatic lighting, 1280x720
```

---

## Ek A: Tasarım Standartları — 3D Gummy Candy Stili

### 🍬 3D Gummy Candy Estetiği

Tüm BrainTrainer oyunları "yumuşak şeker" görsel stilini takip etmelidir.

#### Ana İkon (Welcome Screen)
```tsx
<motion.div 
    className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-[40%] flex items-center justify-center"
    style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
    animate={{ y: [0, -8, 0] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
>
    <IconComponent size={52} className="text-white drop-shadow-lg" />
</motion.div>
```

#### 3D Gummy Butonlar
```tsx
<motion.button
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-xl"
    style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}
>
    <div className="flex items-center gap-3">
        <Play size={28} className="fill-white" />
        <span>Başla</span>
    </div>
</motion.button>
```

#### 3D Gummy Kartlar/Hücreler
```tsx
style={{
    background: isActive 
        ? 'linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)' 
        : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    boxShadow: isActive 
        ? 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3), 0 0 30px rgba(129, 140, 248, 0.6)'
        : 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.1)',
    borderRadius: '24px',
}}
```

### 🎨 Renk Paleti

```css
/* Arka Plan - Koyu Gradient */
bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900

/* Glassmorphism Paneller */
bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20

/* HUD Elementleri */
bg-amber-500/20 border-amber-500/30    /* Skor */
bg-red-500/20 border-red-500/30        /* Can */
bg-blue-500/20 border-blue-500/30      /* Süre */
bg-emerald-500/20 border-emerald-500/30 /* Seviye */
```

#### Kalp İkonlu Can Gösterimi
```tsx
<div className="flex items-center gap-1">
    {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
        <Heart key={i} size={14} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'} />
    ))}
</div>
```

### 📍 TUZÖ Badge

```tsx
<div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
    <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
    <span className="text-[9px] font-bold text-violet-400">5.X.X Beceri Adı</span>
</div>
```

### 🎭 Animasyonlar
```tsx
// Hover efekti (3D float)
whileHover={{ scale: 1.05, y: -4 }}
whileTap={{ scale: 0.95 }}

// Bounce animasyonu (ikon)
animate={{ y: [0, -8, 0] }}
transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}

// Zafer animasyonu
animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
transition={{ duration: 1.5, repeat: Infinity }}
```

---

## Ek B: Touch-First & Responsive Standartlar

### Minimum Dokunma Alanları
```css
min-h-[80px] min-w-[80px]  /* Kartlar */
px-8 py-4                   /* Butonlar */
gap-4                       /* Grid spacing */
rounded-2xl                 /* Yumuşak köşeler */
```

### 📐 Responsive Canvas Boyutlandırma (Canvas Oyunları İçin Zorunlu)

```tsx
const [canvasSize, setCanvasSize] = useState(0);

useEffect(() => {
    const updateSize = () => {
        const maxWidth = Math.min(window.innerWidth - 32, 480);
        setCanvasSize(maxWidth);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
}, []);

// Container'da explicit boyut kullan (aspect-square DEĞİL)
<div style={{ maxWidth: canvasSize, height: canvasSize }}>
    <canvas ref={canvasRef} />
</div>
```

> **ÖNEMLİ:** `aspect-square` class'ı canvas parent'larında kullanmayın.

### 🔒 Body Scroll Lock (Oyun Sırasında Zorunlu)

```tsx
useEffect(() => {
    const isActive = phase === 'playing' || phase === 'feedback';
    if (isActive) {
        window.scrollTo(0, 0);
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
        document.documentElement.style.overflow = 'hidden';
    }
    return () => {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        document.documentElement.style.overflow = '';
    };
}, [phase]);

// Root container'da:
<div
    className={`min-h-screen ... ${isActive ? 'overflow-hidden h-screen' : ''}`}
    style={isActive ? { touchAction: 'none', overscrollBehavior: 'none' } : {}}
>
```

### 🕹️ Canvas Oyunlarında Çift Kontrol Modu

| Kontrol | Platform | Uygulama |
|---------|----------|----------|
| **Sanal Joystick** | Mobil + Masaüstü | `touchStart/Move/End` + `mouseDown/Move/Up` |
| **Ok Tuşları** | Masaüstü | `window.addEventListener('keydown', ...)` |

Joystick sabitleri:
```tsx
const JOYSTICK_RADIUS = 50;
const MOVE_THRESHOLD = 25;
const MOVE_COOLDOWN = 150; // ms
```

Referans: `src/components/Arcade/Games/DarkMaze/DarkMaze.tsx`

### Canvas Touch Event Handling

Canvas üzerinde dokunmatik input varsa **mutlaka** `e.preventDefault()`:

```tsx
onTouchStart={(e) => { e.preventDefault(); handleStart(e.touches[0]); }}
onTouchMove={(e) => { e.preventDefault(); handleMove(e.touches[0]); }}
onTouchEnd={handleEnd}
```

Canvas container'da `touch-none` class'ı zorunlu:
```tsx
<div className="... touch-none">
    <canvas ... />
</div>
```

---

## Doğrulama Kontrol Listesi

- [ ] Platform standartları uygulandı (5 can, 180s, 20 level)
- [ ] `useGamePersistence` entegre edildi
- [ ] `hasSavedRef` ile çift kayıt engellendi
- [ ] `useGameFeedback` + `GameFeedbackBanner` kullanıldı
- [ ] Touch-first hedefler (80px min)
- [ ] Responsive canvas boyutlandırma (canvas oyunlarında)
- [ ] Body scroll lock (playing/feedback fazında)
- [ ] Glassmorphism / Gummy Candy tasarım
- [ ] Welcome / Playing / Feedback / GameOver / Victory ekranları
- [ ] `src/routes/gameRoutes.tsx`'e route eklendi
- [ ] `IndividualAssessmentPage`'e **EN ÜSTE** eklendi + `isNew: true`
- [ ] Önceki oyunun `isNew` kaldırıldı
- [ ] `intelligenceTypes.ts`'e eklendi (zeka + workshop)
- [ ] XP requirement veritabanına eklendi
- [ ] **examMode `location.state`'ten okunuyor** (Props DEĞİL!)
- [ ] **submitResult async IIFE ile await ediliyor**
- [ ] **`examModules.ts`'e eklendi**
- [ ] YouTube paketi oluşturuldu (3 başlık, açıklama, 3 thumbnail istemi)

---

## Referans Simülatörler

| Oyun | Dosya | Özellik |
|------|-------|---------|
| Stroop Etkisi | `StroopGame.tsx` | Dikkat + examMode referans |
| Kozmik Hafıza | `CosmicMemoryGame.tsx` | Bellek + grid layout |
| MindMatch | `MindMatchGame.tsx` | Kategori analizi + emoji grid |
| Yansıma Toplamı | `ReflectionSumGame.tsx` | Matematik + çalışma belleği |
| Algısal Hız | `PerceptualSpeedGame.tsx` | İşlem hızı + canvas |
| Lazer Labirent | `LaserMazeGame.tsx` | Canvas + joystick kontrol |
