---
name: Zeka Arcade Oyunu Ekleme
description: XP-tüketimli premium arcade oyunu ekler
---

# 🕹️ Zeka Arcade Oyunu Ekleme Skill'i

Bu skill, **Zeka Arcade** hub'ına yeni bir premium oyun eklemek için gerekli adımları içerir.

## Gerekli Bilgiler

1. **Oyun Adı (Türkçe)**: Örn. "Kristal Mağarası"
2. **Oyun Slug'ı**: Örn. "kristal-magarasi"
3. **XP Maliyeti**: 30-50 arası önerilir
4. **Gradient Renkleri**: Örn. "from-cyan-500 to-blue-600"

---

## Arcade vs Standard Oyun Farkları

| Özellik | Standard Oyun | Arcade Oyunu |
|---------|---------------|--------------|
| XP Modeli | XP kazandırır | XP harcar (jeton) |
| Giriş | Direkt erişim | Hub üzerinden CoinToss |
| UI | BaseGameContainer | Özel tema/atmosfer |

---

## Adım 1: Klasör Yapısını Oluştur

```bash
mkdir -p src/components/Arcade/Games/[OyunAdi]/components
mkdir -p src/components/Arcade/Games/[OyunAdi]/hooks
```

Klasör yapısı:
```
src/components/Arcade/Games/[OyunAdi]/
├── components/
├── hooks/
├── types.ts
├── constants.ts
└── [OyunAdi].tsx
```

---

## Adım 2: Temel Dosyaları Oluştur

**types.ts:**
```typescript
export type GamePhase = 'idle' | 'playing' | 'paused' | 'game_over' | 'victory';
```

**constants.ts:**
```typescript
export const GAME_CONFIG = {
  GRID_WIDTH: 15,
  GRID_HEIGHT: 15,
  CELL_SIZE: 40,
};
```

---

## Adım 3: games.tsx'e Ekle

```tsx
{
  id: '[oyun-slug]',
  title: '[Oyun Adı]',
  description: 'Oyun açıklaması',
  cost: 40,
  color: 'from-cyan-500 to-blue-600',
  icon: <Icon size={48} className="text-white" />,
  link: '/bilsem-zeka/[oyun-slug]',
  tuzo: '5.X.X TUZÖ Beceri Adı', // Zorunlu!
}
```

**Mevcut TUZÖ Kodları:**
| Kod | Beceri |
|-----|--------|
| 5.1.x | Sözel Beceriler |
| 5.2.x | Sayısal Beceriler |
| 5.3.x | Uzamsal Beceriler |
| 5.4.x | Kısa Süreli Bellek |
| 5.5.x | Akıl Yürütme |
| 5.6.x | İşlem Hızı |
| 5.7.x | Dikkat |
| 5.8.x | Kontrol/Esneklik |
| 5.9.x | Çalışma Belleği |
| 5.10.x | Sosyal Zeka |

---

## Adım 4: Route Ekle (App.tsx)

```tsx
const [OyunAdi] = React.lazy(() => 
  import('./components/Arcade/Games/[OyunAdi]/[OyunAdi]')
);

<Route path="/bilsem-zeka/[oyun-slug]" element={<RequireAuth><[OyunAdi] /></RequireAuth>} />
```

---

## Adım 5: XP Requirement Ekle

```sql
INSERT INTO xp_requirements (path, xp_cost, description) 
VALUES ('/bilsem-zeka/[oyun-slug]', 40, '[Oyun Adı]');
```

---

## Adım 6: Intelligence Types Eşleştirmesi

`src/constants/intelligenceTypes.ts` dosyasına oyunu ekle:

**OYUN_ZEKA_ESLESTIRMESI (Zeka Türü):**
```typescript
// Arcade Oyunları bölümüne ekle
'[oyun-slug]': ZEKA_TURLERI.CALISMA_BELLEGI, // veya uygun zeka türü
```

**OYUN_WORKSHOP_ESLESTIRMESI (Workshop Türü):**
```typescript
// Arcade Oyunları bölümüne ekle
'[oyun-slug]': 'arcade',
```

> ⚠️ Bu adım **zorunludur**! Eklenmezse `workshop_type` ve `intelligence_type` veritabanına `null` olarak kaydedilir.

---

## Tasarım Standartları - 3D Gummy Candy Stili

### 🍬 3D Gummy Candy Estetiği

Arcade oyunları "yumuşak şeker" görsel stilini takip etmelidir:

#### Ana İkon (Welcome Screen)
```tsx
<motion.div 
    className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[40%] flex items-center justify-center"
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
    className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-bold text-xl"
    style={{ boxShadow: '0 8px 32px rgba(6, 182, 212, 0.4)' }}
>
    <div className="flex items-center gap-3">
        <Play size={28} className="fill-white" />
        <span>Başla</span>
    </div>
</motion.button>
```

---

### 🎯 Çocuk Dostu Geri Bildirim Overlay

```tsx
const SUCCESS_MESSAGES = ["Harikasın! 🎮", "Süpersin! ⭐", "Muhteşem! 🌟"];
const FAIL_MESSAGES = ["Tekrar dene! 💪", "Düşün ve bul! 🧐"];

// Feedback Overlay
<AnimatePresence>
    {showFeedback && (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
            <motion.div
                className={`px-12 py-8 rounded-3xl text-center ${
                    isCorrect ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                              : 'bg-gradient-to-br from-orange-500 to-amber-600'
                }`}
                style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
            >
                {isCorrect ? <CheckCircle2 size={64} /> : <XCircle size={64} />}
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
bg-gradient-to-br from-cyan-950 via-blue-950 to-slate-900

/* Glassmorphism Paneller */
bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20

/* HUD Elementleri */
bg-amber-500/20 backdrop-blur-sm rounded-xl border border-amber-500/30  /* Skor */
bg-red-500/20 backdrop-blur-sm rounded-xl border border-red-500/30      /* Can */
bg-blue-500/20 backdrop-blur-sm rounded-xl border border-blue-500/30    /* Süre */

/* Kalp İkonlu Can Gösterimi */
{Array.from({ length: 5 }).map((_, i) => (
    <Heart key={i} size={14} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'} />
))}
```

---

### 📍 TUZÖ Badge

```tsx
<div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full">
    <span className="text-[9px] font-black text-cyan-300 uppercase tracking-wider">TUZÖ</span>
    <span className="text-[9px] font-bold text-cyan-400">5.X.X Beceri Adı</span>
</div>
```

---

## Arcade-Specific Özellikler

**CoinToss Akışı:**
```
ArcadeHub → ArcadeMachine → XP Check → CoinToss → navigate(link, { state: { arcadeMode: true, autoStart: true } })
```

**Location State:**
```tsx
const isArcadeMode = location.state?.arcadeMode === true;
const autoStart = location.state?.autoStart === true;
```

**Arcade Geri Yönlendirme:**
```tsx
const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
```

---

## 🛡️ Veri Kaydı ve Güvenlik (Çifte Kaydı Önleme)

Oyun skorlarının veritabanına çifte kaydedilmesini önlemek için `useEffect` ve `hasSavedRef` kullanımı zorunludur.

**Yanlış İbadet:**
State setter (`setLives`) içinde kayıt fonksiyonu çağırmayın.

**Doğru Mimari:**
```tsx
const hasSavedRef = useRef(false);

useEffect(() => {
  if (lives <= 0 && phase === 'playing') {
    if (!hasSavedRef.current) {
      hasSavedRef.current = true; // Guard
      saveGamePlay({ ... });
      setPhase('game_over');
    }
  }
}, [lives, phase]);

// startGame fonksiyonunda ref'i sıfırlayın
const startGame = () => {
  hasSavedRef.current = false;
  // ...
};
```

---

## Referans Oyunlar

- `src/components/Arcade/Games/DarkMaze/`
- `src/components/Arcade/Games/RenkliBalon/`
- `src/components/Arcade/README.md`
