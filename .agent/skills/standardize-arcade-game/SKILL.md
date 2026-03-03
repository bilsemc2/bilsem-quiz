---
name: Arcade Oyunu Standardize Etme
description: Mevcut bir arcade oyununu ArcadeGameShell + paylaşımlı bileşenler mimarisine geçirir
---

# 🔧 Arcade Oyunu Standardize Etme Skill'i

Bu skill, mevcut veya yeni bir arcade oyununu projenin **tek tip standart mimarisine** kavuşturmak için kullanılır.

> Bu mimarinin pilot uygulaması `RenkliBalon.tsx`'dir. İncelemek için bak:
> `src/components/Arcade/Games/RenkliBalon/`

---

## 📁 Arcade/Shared — Paylaşımlı Altyapı

Tüm arcade oyunları aşağıdaki **paylaşımlı dosyaları** kullanır. Yeni bir oyun oluşturulduğunda bunlar zaten hazırdır:

| Dosya | Açıklama |
|-------|----------|
| `ArcadeGameShell.tsx` | HUD, overlay (Başlat/Bitiş/Başarı) ve scroll yönetimi |
| `ArcadeConstants.ts` | Renkler, feedback yazıları, zorluk eşikleri, spawn config, skor formülü |
| `ArcadeFeedbackBanner.tsx` | Ekran ortasında anlık geri bildirim (`success` / `error` / `warning`) |
| `Balloon.tsx` | Tıklanabilir balon bileşeni (Renkli Balon ve benzer oyunlar için) |
| `Cloud.tsx` | Animasyonlu bulut dekor bileşeni |

---

## ✅ Adım 1: Oyun Bileşeninden Standart Kabuk'u Ayır

### Oyun dosyasına şu import'ları ekle:

```tsx
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import {
    ARCADE_COLORS,
    ARCADE_COLOR_NAMES,
    ARCADE_FEEDBACK_TEXTS,
    ARCADE_DIFFICULTY_THRESHOLDS,
    ARCADE_SPAWN_CONFIG,
    ARCADE_SCORE_FORMULA,
    ARCADE_SCORE_BASE,
} from '../../Shared/ArcadeConstants';
import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';
```

### GameState Tipi — her oyun bunu tanımlamalı:

```ts
// types.ts dosyasına ekle
export interface GameState {
    score: number;
    level: number;
    lives: number;
    status: 'START' | 'PLAYING' | 'GAME_OVER' | 'SUCCESS';
}
```

> ⚠️ `WIN` veya `FINISHED` gibi özel durum adları **kullanmayın**. Standart `SUCCESS` kullanın.

---

## ✅ Adım 2: ArcadeGameShell ile Sarmala

```tsx
<ArcadeGameShell
    gameState={gameState}
    gameMetadata={{
        id: 'oyun-slug',
        title: 'OYUN BAŞLIĞI',
        description: (<>...</>),   // JSX açıklama
        tuzoCode: '5.X.X Beceri',
        icon: <IconComponent className="w-14 h-14 text-black" strokeWidth={3} />,
        iconBgColor: 'bg-rose-400',
        containerBgColor: 'bg-sky-200 dark:bg-slate-900'
    }}
    onStart={startGame}
    onRestart={startGame}
    onNextLevel={handleNextLevel}  // Opsiyonel, sadece seviyeli oyunlar için
>
    {/* Oyunun kendi UI içeriği buraya */}
</ArcadeGameShell>
```

### ArcadeGameShell Otomatik Olarak Yönetir:
- **HUD:** Skor / Seviye / Cansayacı — sadece `PLAYING` durumunda
- **Başlangıç Ekranı:** `status === 'START'` iken gösterir
- **Oyun Bitti Ekranı:** `status === 'GAME_OVER'` iken gösterir
- **Başarı Ekranı:** `status === 'SUCCESS'` iken gösterir
- **Scroll Davranışı:** Mobilde sabit (overflow-hidden), masaüstünde kaydırılabilir

---

## ✅ Adım 3: Sabit Değerleri ArcadeConstants'a Yönlendir

### Zorluk Seviyeleri:
```ts
// Eski (hardcoded):
if (level > 10) diff = Difficulty.HARD;
else if (level > 5) diff = Difficulty.MEDIUM;

// Yeni (standart):
if (level > ARCADE_DIFFICULTY_THRESHOLDS.HARD_LEVEL) diff = Difficulty.HARD;
else if (level > ARCADE_DIFFICULTY_THRESHOLDS.MEDIUM_LEVEL) diff = Difficulty.MEDIUM;
```

### Spawn Aralığı ve Hız:
```ts
// Eski:
const interval = Math.max(700, 1800 - (level * 80));
const speed = Math.max(1.5, 5 + Math.random() * 2 - (level * 0.15));

// Yeni:
const interval = Math.max(
    ARCADE_SPAWN_CONFIG.INTERVAL_MIN_MS,
    ARCADE_SPAWN_CONFIG.INTERVAL_BASE_MS - (level * ARCADE_SPAWN_CONFIG.INTERVAL_DECAY_PER_LEVEL)
);
const speed = Math.max(
    ARCADE_SPAWN_CONFIG.SPEED_MIN,
    ARCADE_SPAWN_CONFIG.SPEED_BASE + Math.random() * ARCADE_SPAWN_CONFIG.SPEED_VARIANCE
    - (level * ARCADE_SPAWN_CONFIG.SPEED_DECAY_PER_LEVEL)
);
```

### Skor Formülü:
```ts
// Eski:
score + (20 * prev.level)

// Yeni:
score + ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, prev.level)
```

### Renkler ve İsimler:
```ts
// Eski:
const COLORS = ['#FF5F5D', ...];
const COLOR_NAMES: Record<string, string> = { ... };

// Yeni (import yeterli):
ARCADE_COLORS      // string[]
ARCADE_COLOR_NAMES // Record<string,string>
// Veya spesifik renk için:
ARCADE_PALETTE.red.hex   // '#FF6B6B'
ARCADE_PALETTE.red.name  // 'Kırmızı'
```

### Feedback Yazıları:
```ts
// Eski:
setFeedback("Harika!");
setFeedback("Hatalı!");

// Yeni:
const msg = ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES[Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES.length)];
setFeedback({ message: msg, type: 'success' });

const errMsg = ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES[Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES.length)];
setFeedback({ message: errMsg, type: 'error' });
```

---

## ✅ Adım 4: Modernizasyon Zorunlulukları

Tüm arcade oyunları aşağıdaki lifecycle güvenliği kurallarına uymalı:

### Ref Havuzu (En Üste Ekle):
```tsx
const hasSavedRef = useRef<boolean>(false);        // Çifte kayıt koruması
const isResolvingRef = useRef<boolean>(false);     // Çoklu tıklama kilit
const laserTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const patternTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
```

### Global Unmount Cleanup (Zorunlu):
```tsx
useEffect(() => {
    return () => {
        if (laserTimeoutRef.current)    clearTimeout(laserTimeoutRef.current);
        if (patternTimeoutRef.current)  clearTimeout(patternTimeoutRef.current);
        if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
        if (spawnTimerRef.current)       clearInterval(spawnTimerRef.current);
    };
}, []);
```

### startGame / Restart'ta Ref Sıfırlama:
```tsx
const startGame = () => {
    hasSavedRef.current = false;
    isResolvingRef.current = false;
    // ...
};
```

### Callback Kilit Örüntüsü:
```tsx
const handleShoot = async (item, event) => {
    if (gameState.status !== 'PLAYING' || isResolvingRef.current) return;
    isResolvingRef.current = true;
    //... işlem ...
    setTimeout(() => { isResolvingRef.current = false; }, 500);
};
```

### Oyun Bitiş Kaydı (Idempotent):
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

### Game Loop'u Sadece PLAYING'de Çalıştır:
```tsx
useEffect(() => {
    if (gameState.status !== 'PLAYING') return;  // BU SATIR ZORUNLUDUR
    // interval / animation mantığı
}, [gameState.status, ...]);
```

---

## ✅ Adım 5: Paylaşımlı Bileşenleri Kullan

Eğer oyun `Balloon` veya `Cloud` kullanıyorsa (ya da ileride benzeri bileşenler `Shared/`'a eklenirse):

```tsx
// Yerel components/ klasörü YERINE:
import Balloon from '../../Shared/Balloon';
import Cloud from '../../Shared/Cloud';
```

Yeni bir paylaşımlı bileşen eklenecekse doğrudan `src/components/Arcade/Shared/` klasörüne koy, oyuna özgü `components/` klasörüne değil.

---

## ✅ Adım 6: ArcadeConstants'a Yeni Değer Eklenirse

`ArcadeConstants.ts`'deki sabitleri oyun-özelinde **override etme**. İhtiyaç varsa sabit ekle:

```ts
// ArcadeConstants.ts'e yeni sabit ekle
export const ARCADE_SPAWN_CONFIG = Object.freeze({
    //...mevcut alanlar...
    YENI_ALAN: değer,
} as const);
```

> Oyuna özgü config gerektiren durumlarda oyun klasörüne `constants.ts` eklenebilir, ama **global sabitler her zaman `Shared/ArcadeConstants.ts`'de** kalır.

---

## 🎨 Renk Paleti (Çocuk Dostu Candy-Pastel)

| id | hex | Türkçe Adı |
|----|-----|-----------|
| `red` | `#FF6B6B` | Kırmızı (Mercan) |
| `blue` | `#74B9FF` | Mavi (Gökyüzü) |
| `green` | `#55EFC4` | Yeşil (Nane) |
| `yellow` | `#FFEAA7` | Sarı (Limon) |
| `purple` | `#A29BFE` | Mor (Lavanta) |
| `pink` | `#FD79A8` | Pembe (Şeker) |
| `orange` | `#FDCB6E` | Turuncu (Mandalin) |
| `teal` | `#00CEC9` | Turkuaz (Deniz) |

---

## Referans Dosyalar

| Dosya | Özellik |
|-------|---------|
| `RenkliBalon/RenkliBalon.tsx` | Pilot standardizasyon, ArcadeGameShell referans |
| `DarkMaze/DarkMaze.tsx` | Canvas + joystick kontrol |
| `ChromaHafiza/ChromaHafiza.tsx` | Bellek + grid |
| `SevimliMantik/SevimliMantik.tsx` | Mantık + level |
| `Shared/ArcadeGameShell.tsx` | Standart kabuk |
| `Shared/ArcadeConstants.ts` | Sabitler |
| `Shared/ArcadeFeedbackBanner.tsx` | Geri bildirim |
