# Game UX Conventions

Bu belge, `KidGameShell` ve `BrainTrainerShell` kullanan oyunlar icin ortak davranis sozlesmesini tanimlar.

## Zorunlu Kurallar

1. Baslat, tekrar oyna, sonraki seviye ve ayni seviyede yeniden dene aksiyonlari oyun alanini gorunur hale getirmelidir.
2. `KidGameShell` kullanan oyunlar ortak `useGameViewportFocus` helper'ini dogrudan kullanmalidir.
3. `BrainTrainerShell` kullanan oyunlar ortak viewport odagini shell icindeki `useGameViewportFocus` baglantisi uzerinden almalidir.
4. Oyun alani referansi `KidGameShell` icindeki `playAreaRef` prop'u ya da `BrainTrainerShell` icindeki ortak play area ref'i uzerinden baglanmalidir.
5. Kullaniciya gorunen metinlerde UTF-8 Turkce karakterler korunmalidir.
6. Gorunen metinlerde ASCII gecici kopyalar ya da bozuk encoding kalintilari birakilmamalidir.
7. Gecici dogru, hata ve uyari mesajlari ortak `KidGameFeedbackBanner` bileseniyle ya da BrainTrainer tarafinda paylasilan feedback katmaniyla gosterilmelidir.
8. Arcade oyunlari ortak `useArcadeSoundEffects` helper'i uzerinden yumusak ses olaylarini kullanmalidir.

## Ortak Uygulama Kalibi

```tsx
const { playAreaRef, focusPlayArea } = useGameViewportFocus();

const startGame = useCallback(() => {
  setPhase('playing');
  focusPlayArea();
}, [focusPlayArea]);

return (
  <KidGameShell
    playAreaRef={playAreaRef}
    overlay={<KidGameStatusOverlay ... />}
  >
    <GameBoard />
  </KidGameShell>
);
```

## BrainTrainer Shared Focus

- `BrainTrainerShell`, oyun fazi `playing` oldugunda ortak `useGameViewportFocus` helper'i ile oyun alanini gorunur hale getirmelidir.
- `useGameEngine` ve oyun controller'lari `window.scrollTo(0, 0)` gibi tepeye reset davranislarini kullanmamalidir.
- Ozel welcome ekranlari da `handleStart` uzerinden ayni odak davranisina girmelidir.

## Standart Kapsami

- Overlay dili
- Gecici geri bildirim banner dili
- Baslangic ve yeniden baslatma akisi
- Oyun alanina scroll/odak davranisi
- Turkce gorunen metin kalitesi
- Cocuk dostu kisa yonlendirme dili
- Ortak yumusak ses olaylari

## Ses Standardi

- `start` -> yumusak baslangic tiklamasi
- `launch` -> hareketi baslatan yumusak kaydirma/firlatma sesi
- `hit` -> kisa ve yormayan pop sesi
- `success` -> tek adimli dogru cevap sesi
- `reward` -> bonus, combo veya surpriz odul sesi
- `levelUp` -> bolum tamamlama / seviye gecis sesi
- `fail` -> yumusak hata sesi

Bu sesler `src/components/Arcade/Shared/useArcadeSoundEffects.ts` ve
`src/components/Arcade/Shared/arcadeSoundModel.ts` uzerinden standardize edilmelidir.

## Istisna Kurali

Sadece oyunun mekanigi bunu gerektiriyorsa standarttan sapilabilir.
Bu durumda sapma dosya icinde kisa bir yorumla ya da ilgili PR notunda aciklanmalidir.

Migration sirasinda adim adim kontrol listesi icin [arcade-migration-checklist.md](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/docs/arcade-migration-checklist.md) takip edilmelidir.
