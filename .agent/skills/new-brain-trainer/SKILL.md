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
4. **Hedef Workshop**: Tablet (Stage 1) veya Bireysel (Stage 2)
5. **Kognitif Hedef**: Hangi beceriyi geliştiriyor?

---

## Platform Standartları ("Rule of Three")

Tüm BrainTrainer simülatörleri şu standartları takip etmelidir:

| Parametre | Değer |
|-----------|-------|
| **Başlangıç Canı** | 5 |
| **Global Timer** | 180 saniye (3 dakika) |
| **Maksimum Level** | 20 |
| **Touch Target** | Minimum 80px |

---

## Adım 1: Component Dosyasını Oluştur

```tsx
// src/components/BrainTrainer/[SimulatorName]Game.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, RotateCcw, Play, Star, Timer, Target, 
  CheckCircle2, XCircle, ChevronLeft, Zap, Brain, Heart 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// Game Constants
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180; // 3 dakika
const MAX_LEVEL = 20;

type Phase = 'welcome' | 'playing' | 'game_over' | 'victory';

const [SimulatorName]Game: React.FC = () => {
  // Persistence Hook
  const { saveGamePlay, hasSavedRef } = useGamePersistence();
  
  // Core State
  const [phase, setPhase] = useState<Phase>('welcome');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  
  // Game-Specific State
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Timer Effect
  useEffect(() => {
    if (phase === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && phase === 'playing') {
      handleGameOver();
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, timeLeft]);

  // Generate Question
  const generateQuestion = useCallback(() => {
    // Oyuna özel soru üretim mantığı
    setCurrentQuestion({
      // ... soru verileri
    });
  }, [level]);

  // Level Setup
  useEffect(() => {
    if (phase === 'playing') {
      generateQuestion();
    }
  }, [phase, level, generateQuestion]);

  // Start Game
  const handleStart = useCallback(() => {
    setPhase('playing');
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setTimeLeft(TIME_LIMIT);
    startTimeRef.current = Date.now();
    hasSavedRef.current = false;
  }, [hasSavedRef]);

  // Game Over Handler
  const handleGameOver = useCallback(async () => {
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;
    
    setPhase('game_over');
    
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    await saveGamePlay({
      game_id: '[simulator-slug]',
      score_achieved: score,
      duration_seconds: duration,
      metadata: {
        levels_completed: level,
        final_lives: lives,
      }
    });
  }, [saveGamePlay, score, level, lives, hasSavedRef]);

  // Victory Handler
  const handleVictory = useCallback(async () => {
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;
    
    setPhase('victory');
    
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    await saveGamePlay({
      game_id: '[simulator-slug]',
      score_achieved: score,
      duration_seconds: duration,
      metadata: {
        levels_completed: MAX_LEVEL,
        victory: true,
      }
    });
  }, [saveGamePlay, score, hasSavedRef]);

  // Answer Handlers
  const handleCorrect = useCallback(() => {
    setScore(prev => prev + 10 * level);
    
    if (level >= MAX_LEVEL) {
      handleVictory();
    } else {
      setLevel(prev => prev + 1);
    }
  }, [level, handleVictory]);

  const handleIncorrect = useCallback(() => {
    const newLives = lives - 1;
    setLives(newLives);
    
    if (newLives <= 0) {
      handleGameOver();
    }
  }, [lives, handleGameOver]);

  // Format Time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link 
            to="/atolyeler/bireysel-degerlendirme" 
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            <span>Geri</span>
          </Link>
          
          {phase === 'playing' && (
            <div className="flex items-center gap-6">
              {/* Score */}
              <div className="flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-xl">
                <Star className="text-amber-400" size={20} />
                <span className="font-bold text-amber-400">{score}</span>
              </div>
              
              {/* Lives */}
              <div className="flex items-center gap-2 bg-red-500/20 px-4 py-2 rounded-xl">
                <Heart className="text-red-400" size={20} />
                <span className="font-bold text-red-400">{lives}</span>
              </div>
              
              {/* Timer */}
              <div className="flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-xl">
                <Timer className="text-blue-400" size={20} />
                <span className={`font-bold ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              
              {/* Level */}
              <div className="flex items-center gap-2 bg-emerald-500/20 px-4 py-2 rounded-xl">
                <Zap className="text-emerald-400" size={20} />
                <span className="font-bold text-emerald-400">Seviye {level}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <AnimatePresence mode="wait">
          {/* Welcome Screen */}
          {phase === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center max-w-xl"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center">
                <Brain size={48} className="text-white" />
              </div>
              
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                [Simülatör Adı]
              </h1>
              
              <p className="text-slate-400 mb-8">
                Oyun açıklaması ve talimatlar buraya yazılır.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                  <Heart className="text-red-400" size={16} />
                  <span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                  <Timer className="text-blue-400" size={16} />
                  <span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                  <Target className="text-emerald-400" size={16} />
                  <span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/25"
              >
                <div className="flex items-center gap-3">
                  <Play size={24} />
                  <span>Başla</span>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* Game Board */}
          {phase === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-4xl"
            >
              {/* Oyun içeriği buraya */}
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8">
                {/* Grid, kartlar, sorular vb. */}
              </div>
            </motion.div>
          )}

          {/* Game Over Screen */}
          {phase === 'game_over' && (
            <motion.div
              key="game_over"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center max-w-xl"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center">
                <XCircle size={48} className="text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-red-400 mb-4">Oyun Bitti!</h2>
              
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">Skor</p>
                    <p className="text-2xl font-bold text-amber-400">{score}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">Seviye</p>
                    <p className="text-2xl font-bold text-emerald-400">{level}</p>
                  </div>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-bold text-lg"
              >
                <div className="flex items-center gap-3">
                  <RotateCcw size={24} />
                  <span>Tekrar Dene</span>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* Victory Screen */}
          {phase === 'victory' && (
            <motion.div
              key="victory"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center max-w-xl"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-3xl flex items-center justify-center animate-bounce">
                <Trophy size={48} className="text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>
              
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                <p className="text-4xl font-bold text-amber-400">{score}</p>
                <p className="text-slate-400">Toplam Puan</p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-lg"
              >
                <div className="flex items-center gap-3">
                  <RotateCcw size={24} />
                  <span>Tekrar Oyna</span>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default [SimulatorName]Game;
```

---

## Adım 2: Route Ekle

`src/App.tsx` dosyasında:

```tsx
// Lazy import
const [SimulatorName]Game = React.lazy(() => import('./components/BrainTrainer/[SimulatorName]Game'));

// Route (atolyeler/bireysel-degerlendirme altında)
<Route 
  path="/atolyeler/bireysel-degerlendirme/[simulator-slug]" 
  element={
    <RequireAuth>
      <[SimulatorName]Game />
    </RequireAuth>
  } 
/>
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
        color: 'violet', // renk adı
        difficulty: 'Zor', // Kolay/Orta/Zor/Uzman
        link: '/games/[simulator-slug]',
        isNew: true,  // 🆕 YENİ badge gösterir
        tuzo: '5.X.X TUZÖ Beceri Adı',  // ❗ Zorunlu!
    },
    // ... mevcut oyunlar
];
```

**Mevcut TUZÖ Kodları:**
| Kod | Beceri |
|-----|--------|
| 5.1.x | Sözel Beceriler (Kelime, Analoji, Anlama) |
| 5.2.x | Sayısal Beceriler (Dizi, Problem, Mantık) |
| 5.3.x | Uzamsal Beceriler (Desen, Şekil, Labirent) |
| 5.4.x | Kısa Süreli Bellek (Sayısal, Görsel) |
| 5.5.x | Akıl Yürütme (Analogik, Kural Çıkarsama) |
| 5.6.x | İşlem Hızı |
| 5.7.x | Dikkat (Seçici, Bölünmüş) |
| 5.8.x | Kontrol/Esneklik (Stroop, İnhibishyon) |
| 5.9.x | Çalışma Belleği (Güncelleme, İzleme, Bağlama) |
| 5.10.x | Sosyal Zeka |

> **⚠️ Önemli Kurallar:**
> 1. **En üste ekle**: Yeni oyun her zaman listenin en başında olmalı
> 2. **isNew: true ekle**: Bu, oyunun yanında "YENİ" badge'i gösterir
> 3. **Önceki oyunun isNew'ini kaldır**: Bir önceki yeni oyunun `isNew: true` satırını sil

> **⚠️ Tip Güvenliği Notu:** `useAuth()` hook'undan dönen `profile.yetenek_alani` alanının tipi `AuthContext.tsx` içinde tanımlıdır. Yeni alanlar kullanıyorsanız, `src/contexts/AuthContext.tsx` dosyasındaki `Profile` interface'ine ekleyin.

---

## Adım 4: Zeka Türü Eşleştirmesi Ekle ⚠️ KRİTİK

`src/constants/intelligenceTypes.ts` dosyasında oyunu **her iki tabloya** ekle:

```typescript
// 1. OYUN_ZEKA_ESLESTIRMESI - Zeka türü analizi için
export const OYUN_ZEKA_ESLESTIRMESI: Record<string, ZekaTuru> = {
    // ...
    '[simulator-slug]': ZEKA_TURLERI.[UYGUN_TIP], // Örn: CALISMA_BELLEGI, GORSEL_UZAMSAL
};

// 2. OYUN_WORKSHOP_ESLESTIRMESI - Workshop kategorisi için
export const OYUN_WORKSHOP_ESLESTIRMESI: Record<string, WorkshopType> = {
    // ...
    '[simulator-slug]': 'bireysel', // veya 'tablet' veya 'arcade'
};
```

> **⚠️ Bu adım zorunludur!** Bu eşleştirmeler eklenmezse `useGamePersistence` hook'u `workshop_type` ve `intelligence_type` değerlerini `null` olarak kaydeder ve admin panelindeki TalentAnalytics/StudentStatistics raporlarında oyun görünmez.

---

## Adım 5: XP Requirement Ekle

```sql
INSERT INTO xp_requirements (path, xp_cost, description) 
VALUES ('/atolyeler/bireysel-degerlendirme/[simulator-slug]', 15, '[Simülatör Adı]');
```

---

## Tasarım Standartları - 3D Gummy Candy Stili

### 🍬 3D Gummy Candy Estetiği

Tüm BrainTrainer oyunları "yumuşak şeker" görsel stilini takip etmelidir:

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

---

### 🎯 Çocuk Dostu Geri Bildirim Overlay

```tsx
// Mesaj dizileri
const CORRECT_MESSAGES = [
    "Harikasın! 🎨",
    "Süpersin! ⭐",
    "Muhteşem! 🌟",
    "Bravo! 🎉",
    "Tam isabet! 🎯",
];

const WRONG_MESSAGES = [
    "Tekrar dene! 💪",
    "Düşün ve bul! 🧐",
    "Biraz daha dikkat! 🎯",
];

// Feedback Overlay Component
<AnimatePresence>
    {phase === 'feedback' && (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
            <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className={`px-12 py-8 rounded-3xl text-center ${
                    isCorrect 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                        : 'bg-gradient-to-br from-orange-500 to-amber-600'
                }`}
                style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
            >
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: isCorrect ? [0, 10, -10, 0] : [0, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                >
                    {isCorrect 
                        ? <CheckCircle2 size={64} className="mx-auto mb-4 text-white" />
                        : <XCircle size={64} className="mx-auto mb-4 text-white" />
                    }
                </motion.div>
                <p className="text-3xl font-black text-white">{feedbackMessage}</p>
            </motion.div>
        </motion.div>
    )}
</AnimatePresence>
```

---

### 🎨 Renk Paleti

```css
/* Arka Plan - Koyu Gradient */
bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900

/* Glassmorphism Paneller */
bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20

/* HUD Elementleri */
bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30  /* Skor */
bg-red-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-500/30      /* Can */
bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-500/30    /* Süre */
bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-500/30 /* Seviye */

/* Kalp İkonlu Can Gösterimi */
<div className="flex items-center gap-1">
    {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
        <Heart 
            key={i} 
            size={14} 
            className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'} 
        />
    ))}
</div>
```

---

### 📍 TUZÖ Badge

```tsx
<div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
    <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
    <span className="text-[9px] font-bold text-violet-400">5.X.X Beceri Adı</span>
</div>
```

---

### ✋ Touch-First Hedefler
```css
/* Minimum tıklama alanları */
min-h-[80px] min-w-[80px]  /* Kartlar */
px-8 py-4                   /* Butonlar */
gap-4                       /* Grid spacing */
rounded-2xl                 /* Yumuşak köşeler */
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

## Doğrulama Kontrol Listesi

- [ ] "Rule of Three" standartları uygulandı (5 can, 180s, 20 level)
- [ ] `useGamePersistence` entegre edildi
- [ ] `hasSavedRef` ile çift kayıt engellendi
- [ ] Touch-first hedefler (80px min)
- [ ] Glassmorphism tasarım
- [ ] Responsive layout
- [ ] Welcome/Playing/GameOver/Victory ekranları
- [ ] IndividualAssessmentPage'e **EN ÜSTE** eklendi
- [ ] `isNew: true` eklendi (YENİ badge)
- [ ] Önceki oyunun `isNew` kaldırıldı
- [ ] `intelligenceTypes.ts`'e eklendi (zeka + workshop)
- [ ] XP requirement veritabanına eklendi
- [ ] Route eklendi ve test edildi

---

## Referans Simülatörler

- **Stroop Game**: `src/components/BrainTrainer/StroopGame.tsx`
- **Cosmic Memory**: `src/components/BrainTrainer/CosmicMemoryGame.tsx`
- **Part-Whole**: `src/components/BrainTrainer/PartWholeGame.tsx`
- **Visual Scanning**: `src/components/BrainTrainer/VisualScanningGame.tsx`
- **Number Memory**: `src/components/BrainTrainer/NumberMemoryGame.tsx`

