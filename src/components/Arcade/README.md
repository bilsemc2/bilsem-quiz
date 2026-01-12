# 🎮 Zeka Arcade - Geliştirici Kılavuzu

## Genel Bakış
Zeka Arcade, XP (Bilsem Parası) karşılığında oynanan yüksek kaliteli eğitici oyunların bulunduğu bölümdür.

## 📁 Klasör Yapısı
```
src/components/Arcade/
├── Games/                    # Oyun bileşenleri
│   ├── DarkMaze/            # Karanlık Labirent
│   │   ├── components/      # Alt bileşenler
│   │   ├── hooks/           # Özel hook'lar
│   │   ├── types.ts         # Tip tanımları
│   │   ├── constants.ts     # Sabitler
│   │   └── DarkMaze.tsx     # Ana bileşen
│   ├── RenkliBalon/         # Renkli Balon Avı
│   └── TersNavigator/       # Ters Navigator
├── ArcadeMachine.tsx        # Oyun kartı bileşeni
└── CoinToss.tsx             # Jeton atma animasyonu

src/pages/Arcade/
└── ArcadeHubPage.tsx        # Ana arcade sayfası

src/data/arcade/
└── games.tsx                # Oyun listesi ve metadata
```

## 🎯 Yeni Oyun Ekleme Adımları

### 1. Klasör Oluştur
```bash
mkdir -p src/components/Arcade/Games/YeniOyun/components
```

### 2. Temel Dosyaları Oluştur
- `types.ts` - Oyun state ve interface tanımları
- `constants.ts` - Sabitler (grid boyutu, süre, vb.)
- `YeniOyun.tsx` - Ana oyun bileşeni

### 3. `games.tsx`'e Ekle
```tsx
{
    id: 'yeni-oyun',
    title: "Yeni Oyun Adı",
    description: "Oyun açıklaması",
    cost: 30,  // XP maliyeti
    color: "from-blue-500 to-purple-600",
    icon: <IconComponent size={48} className="text-white" />,
    link: "/arcade/yeni-oyun"
}
```

### 4. `App.tsx`'e Route Ekle
```tsx
const YeniOyun = React.lazy(() => import('./components/Arcade/Games/YeniOyun/YeniOyun'));
// ...
<Route path="/arcade/yeni-oyun" element={<RequireAuth><YeniOyun /></RequireAuth>} />
```

### 5. Veritabanına XP Gereksinimi Ekle
Admin panelinden `/arcade/yeni-oyun` için XP gereksinimi ekle.

## 🔧 Önemli Hook'lar

### `useGamePersistence`
Oyun sonuçlarını `game_plays` tablosuna kaydeder.
```tsx
const { saveGamePlay } = useGamePersistence();

// Oyun bittiğinde:
saveGamePlay({
    game_id: 'oyun-id',
    score_achieved: score,
    duration_seconds: duration,
    metadata: { /* ek bilgiler */ }
});
```

## 🎨 UI Standartları

- **Arka Plan**: `bg-[#050505]` veya `bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950`
- **Kartlar**: `rounded-3xl` veya `rounded-[2rem]` border ile
- **Butonlar**: `shadow-[0_6px_0_#color]` 3D efekt
- **Animasyonlar**: Framer Motion kullan
- **Geri Butonu**: `/arcade` hub'a dönen link

## ⚡ XP Akışı

1. **Arcade Hub'dan Giriş**: 
   - `ArcadeMachine` → XP kontrolü → `CoinToss` animasyonu → `navigate(link, { state: { arcadeMode: true, autoStart: true } })`

2. **Direkt URL ile Giriş**:
   - `RequireAuth` → `xp_requirements` tablosundan kontrol → XP kesintisi

## 🎮 Mevcut Oyunlar

| Oyun | XP | Açıklama |
|------|-----|----------|
| Karanlık Labirent | 50 | Fenerle labirent çözme |
| Renkli Balon Avı | 30 | Örüntü + balon patlatma |
| Ters Navigator | 40 | Ters kontrol navigasyonu |

## 💡 Oyun Fikirleri

- **Hafıza Kartları** - Simon Says tarzı renk dizisi
- **Hızlı Matematik** - Düşen sayılarla hesaplama
- **Kelime Avı** - Harflerden kelime bulma
- **Kod Kırıcı** - Mastermind tarzı tahmin
- **Blok Yerleştirme** - Tetris/Tangram tarzı puzzle
