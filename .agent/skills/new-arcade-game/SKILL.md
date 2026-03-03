---
name: Zeka Arcade Oyunu Ekleme
description: XP-tüketimli premium arcade oyunu ekler
---

# 🕹️ Zeka Arcade Oyunu Ekleme Skill'i

Bu skill, **Zeka Arcade** hub'ına yeni bir premium oyun **kaydetmek** için gerekli adımları içerir.
(Kayıt: routing, hub listesi, XP, veritabanı)

> 🔧 **Oyun bileşenini oluşturmak için** mutlaka `standardize-arcade-game` skill'ini de oku:
> `.agent/skills/standardize-arcade-game/SKILL.md`
> Bu skill; `ArcadeGameShell`, `ArcadeConstants`, lifecycle güvenliği ve renk standardını belgeler.

## Gerekli Bilgiler

1. **Oyun Adı (Türkçe)**: Örn. "Kristal Mağarası"
2. **Oyun Slug'ı**: Örn. "kristal-magarasi"
3. **XP Maliyeti**: 30-50 arası önerilir
4. **Gradient Renkleri**: Örn. "from-cyan-500 to-blue-600"
5. **Kategori**: `memory` | `spatial` | `flexibility`

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
mkdir -p src/components/Arcade/Games/[OyunAdi]
```

Klasör yapısı:
```
src/components/Arcade/Games/[OyunAdi]/
├── types.ts          ← GameState ve oyuna özgü tipler
├── constants.ts      ← Oyuna özgü config (gerekirse)
└── [OyunAdi].tsx     ← Ana bileşen (ArcadeGameShell içerir)
```

> Paylaşımlı bileşenler (`Balloon`, `Cloud`, `ArcadeFeedbackBanner` vb.) zaten
> `src/components/Arcade/Shared/` altında mevcut — yeni kopya oluşturmayın.

**types.ts şablonu:**
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

## Adım 2: games.tsx'e Ekle

`src/components/Arcade/games.tsx` dosyasına ekle:

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
  category: 'memory' // Zorunlu! 'memory' | 'spatial' | 'flexibility'
}
```

**Kategori Sistemi:**
| Kategori | Slug | Hub Başlığı |
|----------|------|-------------|
| Hafıza Oyunları | `memory` | 🧠 Hafıza Oyunları |
| Uzamsal Zeka | `spatial` | 🧩 Uzamsal Zeka |
| Bilişsel Esneklik | `flexibility` | ⚡ Bilişsel Esneklik |

> ⚠️ `category` alanı zorunludur! Hub sayfasında oyunlar kategorilere göre gruplandırılır.

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

> **⚠️ Inline Style Yasağı:**
> `style={{ backgroundColor: '...' }}` gibi inline style'lar **kullanmayın**. Tailwind class'larını tercih edin:
> - `boxShadow` → Tactile Toy-Box için `shadow-[8px_8px_0_#000]`, `shadow-[4px_4px_0_#000]` gibi keskin ve belirgin gölgeler kullanın. Karanlık mod için `dark:shadow-[8px_8px_0_#0f172a]` ekleyin.
> - `background` → Canlı ve solid renkler `bg-amber-300`, `bg-sky-200`. Gradient **kullanmayın**. Karanlık mod için `dark:bg-slate-800` gibi koyu zeminler tanımlayın.
> - `border` → Kalın siyah çerçeveler `border-4 border-black`. Karanlık mod için `dark:border-slate-700` veya `dark:border-slate-800` kullanın.
> - `borderRadius` → `rounded-2xl`, `rounded-3xl`, `rounded-full`.
>
> **İstisna:** Yalnızca JavaScript ile dinamik hesaplanan değerler (canvas boyutu, pozisyon, hesaplanmış rotasyon) inline olabilir.

---

## Adım 3: Route Ekle

`src/routes/arcadeRoutes.tsx` dosyasına ekle:

```tsx
// Lazy import (dosyanın üstüne)
const [OyunAdi] = React.lazy(() => import('@/components/Arcade/Games/[OyunAdi]/[OyunAdi]'));

// arcadeRoutes dizisine ekle
<Route key="[oyun-slug]" path="/bilsem-zeka/[oyun-slug]" element={<RequireAuth><[OyunAdi] /></RequireAuth>} />,
```

---

## Adım 4: XP Requirement Ekle

```sql
INSERT INTO xp_requirements (path, xp_cost, description) 
VALUES ('/bilsem-zeka/[oyun-slug]', 40, '[Oyun Adı]');
```

---

## Adım 5: Intelligence Types Eşleştirmesi

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

## Tasarım Standartları - Tactile Toy-Box Stili

### 🪀 Tactile Toy-Box Estetiği

Arcade oyunları "oyuncak kutusu" (Tactile Toy-Box) ve Cyber-Pop görsel stilini takip etmelidir. Bulanık efektler (glassmorphism) ve gradientler **kaldırılmıştır**. Canlı ve solid renkler, kalın siyah çerçeveler, belirgin offset gölgeler ve rotasyonlu elementler temel alınır. Metinlerde kontrast için genellikle siyah kullanılır, tüm componentlerde `font-black` ve `uppercase` kullanımına ağırlık verilir.

---

### 🌙 Karanlık Mod (Dark Mode) Uyumu

Tüm arcade oyunları **mutlaka** karanlık mod desteğine sahip olmalıdır. Sabit ışık modu renkleri (örneğin `bg-white`, `border-black`, `text-black`) tek başına bırakılamaz; daima `dark:` Tailwind varyantlarıyla tamamlanmalıdır.

1. **Renk Geçişleri:** Tema değişiminin pürüzsüz olması için ana konteynere ve değişen tüm arayüz elemanlarına `transition-colors duration-300` sınıfını ekleyin.
2. **Arka Planlar:** Açık renkli zeminler (`bg-sky-200`, `bg-white`) için karanlık modda derin renkler (`dark:bg-slate-800`, `dark:bg-slate-900`) tercih edin.
3. **Metinler ve Kenarlıklar:** Siyah metin ve kenarlıklar için karanlık modda okunaklı zıt varyantlar (`dark:text-white`, `dark:border-slate-700`) kullanın.
4. **Katı Gölgeler (Solid Shadows):** `shadow-[8px_8px_0_#000]` gibi siyah katı gölgeler karanlık renkli arka planlarda görünmez olabileceği için `dark:shadow-[..._#0f172a]` kullanarak `bg-slate-900` vb. zeminlerde kontrast oluşturmasını sağlayın.

#### Ana İkon Container (Welcome Screen)
```tsx
<div className="inline-block bg-sky-300 p-6 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000] rotate-3 mb-6">
    <IconComponent size={52} className="text-black" />
</div>
```

#### Tactile Oyuncak Butonlar
```tsx
<button
    className="w-full px-8 py-5 bg-yellow-400 text-black border-4 border-black rounded-2xl text-2xl font-black uppercase tracking-widest shadow-[8px_8px_0_#000] hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3"
>
    <Play size={28} fill="currentColor" /> Başla
</button>
```

---

### 🎯 Çocuk Dostu Geri Bildirim Overlay

```tsx
const SUCCESS_MESSAGES = ["Harikasın! 🎮", "Süpersin! ⭐", "Muhteşem! 🌟"];
const FAIL_MESSAGES = ["Tekrar dene! 💪", "Düşün ve bul! 🧐"];

// Feedback Overlay (Tactile Style)
<AnimatePresence>
    {showFeedback && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 p-4"
        >
            <motion.div
                initial={{ scale: 0.5, y: 100 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.5, y: 100 }}
                className={`px-10 py-8 rounded-[3rem] text-center border-8 border-black shadow-[16px_16px_0_#000] rotate-2 max-w-sm w-full ${
                    isCorrect ? 'bg-emerald-300' 
                              : 'bg-rose-400'
                }`}
            >
                <div className="inline-block bg-white p-4 rounded-full border-4 border-black mb-4 shadow-[4px_4px_0_#000]">
                    {isCorrect ? <CheckCircle2 size={56} className="text-emerald-500" /> : <XCircle size={56} className="text-rose-500" />}
                </div>
                <p className="text-3xl font-black text-black uppercase tracking-tight drop-shadow-[2px_2px_0_#fff]">{feedbackMessage}</p>
            </motion.div>
        </motion.div>
    )}
</AnimatePresence>
```

---

## 🎨 Renk Paleti ve Tasarım Standardı

Yeni oyunlarda aşağıdaki **paylaşımlı sabitler** doğrudan kullanılır — ayrıca tanımlama gerekmez:

```ts
import {
    ARCADE_COLORS,        // string[] — tüm renk hex'leri
    ARCADE_COLOR_NAMES,   // Record<string,string> — hex → Türkçe isim
    ARCADE_PALETTE,       // Nesne: ARCADE_PALETTE.red.hex, .name
    ARCADE_FEEDBACK_TEXTS // SUCCESS_MESSAGES, ERROR_MESSAGES dizileri
} from '../../Shared/ArcadeConstants';
```

> Detaylı renk tablosu ve tasarım standartları için `standardize-arcade-game` skill'ine bak.

---

### 📍 TUZÖ Badge (Toy-Box Style)

```tsx
<div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-200 border-2 border-black rounded-xl shadow-[2px_2px_0_#000] rotate-1">
    <span className="text-[10px] font-black text-black uppercase tracking-wider">TUZÖ</span>
    <span className="text-[10px] font-bold text-black">5.X.X Beceri Adı</span>
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

- `src/components/Arcade/Games/RenkliBalon/` — Pilot standardizasyon oyunu
- `src/components/Arcade/Shared/` — Paylaşımlı bileşenler
- `src/components/Arcade/README.md`
- **Bileşen mimarisi için:** `.agent/skills/standardize-arcade-game/SKILL.md`

---

## Adım 6: YouTube İçerik Paketi

Her yeni arcade oyunu için YouTube tanıtım içeriği oluştur.

### Başlık Formülü

```
BİLSEM Zeka Arcade: [Oyun Adı] 🎮[emoji] [Kısa Kanca] | [TUZÖ Beceri Adı]
```

**Kurallar:**
- Maks 70 karakter (mobil uyum)
- İlk 40 karakterde ana kanca
- En az 1 emoji
- "BİLSEM Zeka" veya "Zeka Arcade" başta
- TUZÖ beceri adı sonda

**3 alternatif başlık üret**, farklı açılardan:
1. Oyun mekaniği odaklı
2. Zorluk/tuzak odaklı
3. Eğlence/aksiyon odaklı

### Açıklama Şablonu

```
🎮 BİLSEM Zeka Arcade: [Oyun Adı] — [Bir cümlelik oyun açıklaması]

BİLSEM Zeka Arcade'in premium oyunlarından! [Oyuna özgü 1-2 cümle açıklama]

⚡ Özellikler:
• [Oyuna özgü özellik 1]
• [Oyuna özgü özellik 2]
• [Oyuna özgü özellik 3]
• XP ile açılan premium içerik
• TUZÖ [X.X.X Beceri Adı] müfredatına uygun

🎯 TUZÖ Beceri: [X.X.X Beceri Adı]
🎮 Kategori: Zeka Arcade — [Memory/Spatial/Logic/Flexibility]
💰 XP Maliyeti: [30-50] XP

🔗 Hemen Oyna: https://www.bilsemc2.com/bilsem-zeka
🌐 Platform: https://www.bilsemc2.com

#BİLSEM #ZekaArcade #BİLSEMZeka #[OyunaÖzgüHashtag] #[BeceriHashtag] #ZekaOyunları #TUZÖ #BİLSEMHazırlık #BilsemC2
```

### Küçük Resim (Thumbnail) AI İstemleri

Her oyun için **3 farklı thumbnail istemi** üret:

**İstem 1 — Oyun Mekaniği Odaklı:**
```
YouTube thumbnail, [renk] solid background with thick black borders, [oyunun ana görselini tanımla],
bold Turkish text "[KISA BAŞLIK]" in [renk] with heavy black drop shadow, tactile toy-box style,
clean neo-brutalist design, 1280x720
```

**İstem 2 — Aksiyon/Eğlence Odaklı:**
```
YouTube thumbnail, vibrant [renk] solid background, [oyun karakterleri/elementleri aksiyon pozunda],
bold Turkish text "[KANCA]" in white with thick black outline and offset shadow, dynamic composition, playful toy UI elements,
1280x720
```

**İstem 3 — Premium/XP Odaklı:**
```
YouTube thumbnail, bright [renk] background with bold geometric accents, [oyun elementleri],
"PREMIUM" badge with thick borders, XP coin icon, bold Turkish text "[OYUN ADI]", tactile arcade feel,
flat lighting, 1280x720
```

**Thumbnail Kuralları:**
- Çözünürlük: 1280x720
- Türkçe karakter desteği belirt
- Çocuk dostu stil
- Metin max 5 kelime (okunabilirlik)
- Arcade/oyun atmosferi yansıt
