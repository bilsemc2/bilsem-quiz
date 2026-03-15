# Cocuk Oyun Tasarim Sablonu

Bu dokuman, cocuk odakli oyun ekranlarinda ortak bir dil kullanmak icin referans sablonu tanimlar. Amac yeni oyun eklerken her ekrani yeniden tasarlamak yerine ayni iskelet, ayni geri bildirim dili ve ayni dikkat hiyerarsisi ile ilerlemektir.

## Hedef

- Cocuk kullanicinin ilk 3 saniyede ne yapacagini anlamasi
- Tek ekranda tek ana gorev
- Buyuk dokunma alanlari ve dusuk metin yogunlugu
- Oyunlar arasinda ayni HUD, ayni durum ekranlari, ayni renk semantigi

## Sayfa Iskeleti

Her oyun mumkun oldugunca su bolgeleri kullanir:

1. Ust kontrol alani
   - geri donus
   - oyun rozetleri
2. Hero/HUD alani
   - oyun adi
   - kisa yonerge
   - seviye, hedef, puan, sure gibi en fazla 4 ana metrik
   - sag ustte hizli aksiyonlar: ses, duraklat, yardim
3. Ana oyun alani
   - tek odak, buyuk etkilesim alani
4. Destek alani
   - guclendiriciler
   - ipucu
   - yardimci aciklama
5. Durum katmani
   - duraklatildi
   - bolum tamamlandi
   - oyun bitti

## Gorsel Kurallar

- Basliklar guclu ama okunakli olmali; govde metni sade kalmali.
- Renk semantigi sabit kalmali:
  - basari: yesil
  - bilgi/hedef: mavi
  - dikkat: turuncu
  - hata/tehlike: pembe-kirmizi
  - odul: sari-altin
- Her etkileşim alaninda belirgin sinir, yumusak kose ve yukselti hissi olmali.
- Hareket sakin ama canli olmali; surekli titreyen veya yorucu animasyonlardan kacin.
- Bir ekranda ayni anda birden fazla parlak vurgu yarismamali.

## Etkilesim Kurallari

- Ana eylem tek ve buyuk olmali.
- Ikincil eylemler ikon ya da kucuk buton boyutunda kalmali.
- Geri bildirim 1 adimlik olmali:
  - dogruysa hemen kutla
  - yanlissa kisa ve sakin uyar
- Ceza varsa hem gorsel hem metinsel olarak acik olmalı.
- Mobilde scroll gerekiyorsa yalnizca destek alanina tasinmali; ana oyun alani sabit ve okunakli kalmali.

## Ortak Bilesenler

Bu sablonun temel bileseni [KidGameShell](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/kid-ui/KidGameShell.tsx).
Durum katmani icin paylasilan overlay bileseni [KidGameStatusOverlay.tsx](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/kid-ui/KidGameStatusOverlay.tsx).

Beklenen kullanim parcasi:

```tsx
<KidGameShell
  title="Baloncuk Avi"
  subtitle="Dogru islemi sec, puanini buyut."
  instruction="Hedef sayiyi veren baloncuga dokun."
  onBack={handleBack}
  badges={[{ label: 'Matematik Oyunu', variant: 'difficulty' }]}
  stats={[
    { label: 'Seviye', value: level, tone: 'emerald' },
    { label: 'Puan', value: score, tone: 'blue' },
  ]}
  toolbar={<GameControls />}
  supportArea={<PowerUps />}
  supportTitle="Guc Destekleri"
  overlay={<GameOverlay />}
>
  <GameBoard />
</KidGameShell>
```

## Uygulama Notu

- Yeni oyunlarda once `KidGameShell` kullanimi denenmeli.
- Oyun kendine ozel HUD gerekiyorsa shell icindeki `stats`, `toolbar` ve `supportArea` slotlari tercih edilmeli.
- Davranis sozlesmesi icin [game-ux-conventions.md](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/docs/game-ux-conventions.md) takip edilmeli.
- Tasima sonrasi teknik ve manuel kontrol listesi icin [arcade-migration-checklist.md](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/docs/arcade-migration-checklist.md) takip edilmeli.
- Bu sablonun ilk referans uygulamasi [BubbleNumbersGame.tsx](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/BubbleNumbersGame/BubbleNumbersGame.tsx) dosyasidir.
- Arcade tarafinda ayni yaklasimin ikinci ornegi [ChromaBreak.tsx](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/Arcade/Games/chromabreak/ChromaBreak.tsx) dosyasidir.
- Rota ve kesif odakli ucuncu uygulama [LabirentUstasi.tsx](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/Arcade/Games/labirent/LabirentUstasi.tsx) dosyasidir.
- Gorsel hafiza odakli dorduncu uygulama [ChromaHafiza.tsx](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/Arcade/Games/ChromaHafiza/ChromaHafiza.tsx) dosyasidir.
- Kesif ve enerji yonetimi odakli besinci uygulama [DarkMaze.tsx](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/Arcade/Games/DarkMaze/DarkMaze.tsx) dosyasidir.
- Kural degisimi ve dikkat esnekligi odakli altinci uygulama [KartDedektifi.tsx](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/Arcade/Games/KartDedektifi/KartDedektifi.tsx) dosyasidir.
- Balon oruntusu ve hedef secimi odakli yedinci uygulama [OruntuluTop.tsx](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/Arcade/Games/OruntuluTop/OruntuluTop.tsx) dosyasidir.
- Renk-sayi hafizasi odakli sekizinci uygulama [NeseliBalonlar.tsx](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/Arcade/Games/NeseliBalonlar/NeseliBalonlar.tsx) dosyasidir.
- Ters yon ve ketleyici kontrol odakli dokuzuncu uygulama [TersNavigator.tsx](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/Arcade/Games/TersNavigator/TersNavigator.tsx) dosyasidir.
- Ayna simetrisi ve yansima odakli onuncu uygulama [AynaUstasi.tsx](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/Arcade/Games/Ayna/AynaUstasi.tsx) dosyasidir.
- Renk hedefleme ve gorsel bellek odakli on birinci uygulama [RenkliLambalar.tsx](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/Arcade/Games/RenkliLambalar/RenkliLambalar.tsx) dosyasidir.
- Oruntu, renk ve hizli hedef secimi odakli on ikinci uygulama [RenkliBalon.tsx](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/Arcade/Games/RenkliBalon/RenkliBalon.tsx) dosyasidir.
- Rota cizimi ve uzamsal hafiza odakli on ucuncu uygulama [YolBulmaca.tsx](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/Arcade/Games/YolBulmaca/YolBulmaca.tsx) dosyasidir.
- Kosullu mantik ve dikkat odakli on dorduncu uygulama [SevimliMantik.tsx](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/Arcade/Games/SevimliMantik/SevimliMantik.tsx) dosyasidir.
- Katlama, delme ve simetri kesfi odakli on besinci uygulama [KraftOrigami.tsx](/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/Arcade/Games/paper/KraftOrigami.tsx) dosyasidir.
