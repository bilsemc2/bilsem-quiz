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
}
```

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
