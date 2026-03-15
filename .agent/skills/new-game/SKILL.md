---
name: Yeni Oyun Ekleme
description: Oyun turune gore dogru skill'e yonlendirir (Arcade veya BrainTrainer)
---

# Yeni Oyun Ekleme Skill'i

Bu skill, yeni bir oyun eklemek icin **dogru mimariyi secmenize** yardimci olur. Projede iki farkli oyun mimarisi vardir. Oyunun turune gore asagidaki skill'lerden birini kullanin.

---

## Karar Akisi

| Soru | Arcade | BrainTrainer |
|------|--------|--------------|
| XP modeli? | XP harcar (jeton) | XP kazandirir |
| Giris akisi? | Hub uzerinden CoinToss | Direkt erisim |
| Hedef kitle? | Eglence odakli, cocuk dostu | Kognitif degerlendirme, sinav hazirlik |
| UI kabugu? | `KidGameShell` + `KidGameFeedbackBanner` + `KidGameStatusOverlay` | `BrainTrainerShell` + `useGameEngine` |
| Konum? | `src/components/Arcade/Games/` | `src/components/BrainTrainer/` |
| Routing? | `src/routes/arcadeRoutes.tsx` | `src/routes/gameRoutes.tsx` |

---

## Arcade Oyunu Eklemek Istiyorsaniz

Asagidaki skill'leri sirasiyla okuyun:

1. **`.agent/skills/standardize-arcade-game/SKILL.md`** — Bilesen mimarisi, KidGameShell kullanimi, lifecycle guvenligi, ses ve viewport
2. **`.agent/skills/new-arcade-game/SKILL.md`** — Routing, hub listesi, XP, veritabani kayit adimlari

Temel bilesenler:
- `KidGameShell` — `src/components/kid-ui/KidGameShell.tsx`
- `KidGameFeedbackBanner` — `src/components/kid-ui/KidGameFeedbackBanner.tsx`
- `KidGameStatusOverlay` — `src/components/kid-ui/KidGameStatusOverlay.tsx`
- `useArcadeSoundEffects` — `src/components/Arcade/Shared/useArcadeSoundEffects.ts`
- `useGameViewportFocus` — `src/hooks/useGameViewportFocus.ts`
- `KidButton`, `KidCard`, `KidBadge` — `src/components/kid-ui/index.ts`

---

## BrainTrainer Oyunu Eklemek Istiyorsaniz

Asagidaki skill'i okuyun:

- **`.agent/skills/new-brain-trainer/SKILL.md`** — Folder yapisi, logic.ts + controller + shell kaliplari, kayit adimlari

Temel bilesenler:
- `useGameEngine` — `src/components/BrainTrainer/shared/useGameEngine.ts`
- `BrainTrainerShell` — `src/components/BrainTrainer/shared/BrainTrainerShell.tsx`
- `useGameFeedback` — `src/hooks/useGameFeedback.ts`

---

## Katman Kurallari (Her Iki Tur Icin Gecerli)

- **UI katmani** (pages, components) `@/lib/supabase` dogrudan import edemez
- **Veri akisi:** UI -> feature use case -> repository -> Supabase
- **AI cagrilari:** Yalnizca `src/server/ai/` icerisinden
- **Repository hata yonetimi:** query = guvenli varsayilan, mutation = throw

---

## Tasarim Sistemi (Her Iki Tur Icin Gecerli)

- Font: `font-nunito`
- Renkler: `cyber-blue`, `cyber-pink`, `cyber-emerald`, `cyber-gold`, `cyber-yellow`, `cyber-purple`
- Golgeler: `shadow-neo-xs`, `shadow-neo-sm`, `shadow-neo-md`, `shadow-neo-lg`
- Karanlik mod: Her eleman icin `dark:` varyanti zorunlu
- Detaylar icin: `.agent/skills/frontend-design/SKILL.md`