# Arcade Migration Checklist

Bu belge, bir arcade oyununu ortak cocuk oyun standardina tasirken izlenecek minimum kontrol listesini tanimlar.
Amac sadece kodu tasimak degil, oyunun gercek davranisini da dogrulamaktir.

## Ne Zaman Kullanilir

- Eski bir oyunu `KidGameShell` yapisina tasirken
- Oyun ici buyuk UI refactor yaparken
- Scroll, overlay, baslatma, odak, animasyon ya da gorunen metin akisini degistirirken

## 1. Tasima Oncesi

- Oyunun mevcut route'unu not et
- Oyun icindeki temel fazlari cikar
  - ornek: `idle`, `watching`, `popping`, `guessing`, `result`
- Oyun icindeki kritik mekanikleri ayikla
  - seviye artisi
  - can kaybi
  - puan hesabi
  - animasyon ya da zamanlama zinciri
- Mevcut dosyada dogrudan `window.scrollTo`, yerel overlay, legacy banner ya da duzensiz gorunen metin var mi kontrol et

## 2. Kod Tasimasi

- `KidGameShell` kullan
- `KidGameStatusOverlay` kullan
- Gecici mesajlar icin `KidGameFeedbackBanner` kullan
- `useGameViewportFocus` ekle
- `playAreaRef` bagla
- Baslat, tekrar, sonraki seviye ve ayni seviyede dene akislari `focusPlayArea()` ile oyun alanina donsun
- Gorunen metinleri Turkce karakterlerle normalize et
- Mümkünse oyun mantigini saf helper dosyasina ayir

## 3. Zorunlu Kod Kontrolleri

- Route kaydi bozulmamis olmali
- Oyun katalog kaydi bozulmamis olmali
- `ArcadeGameShell` importu kalmamali
- `ArcadeFeedbackBanner` importu kalmamali
- `window.scrollTo(0, 0)` kalmamali
- Baslangic ve sonuc overlay'leri ortak dille calismali

## 4. Test Katmani

Her migration turunda minimum su koruma eklenmeli:

- Logic test
  - oyunun en riskli saf kurali icin
  - ornek: seviye konfigurasyonu, cevap kontrolu, zamanlama yardimcilari, benzersiz id uretimi
- Smoke test
  - route kaydi
  - katalog kaydi
  - en temel oynanabilir akisin veri seviyesinde ayakta kalmasi
- Gerekirse UX convention smoke korumasi
  - ortak shell kurallarina bagliysa `tests/smoke/gameUxConventions.test.ts` guncellenmeli

## 5. Manuel Oyun Kontrolu

Bu kisim zorunlu. Oyun gercekten acilip kisa bir tur denenmeden migration tamamlanmis sayilmaz.

- Route'u ac
- Baslangic overlay'i gorunuyor mu bak
- `Oyuna Basla` deyince ekran oyun alanina geliyor mu bak
- Oyun tahtasi ilk bakista gorunur mu bak
- Bir tam tur oyna
- Dogru cevap / yanlis cevap davranisini gor
- Seviye artisi ya da oyun sonu akisini gor
- Gecici feedback banner'i gor
- Mobil benzeri dar genislikte tasma ya da ustte takilma var mi bak
- Gorunen metinlerde bozuk Turkce karakter var mi bak

## 6. Oyun Mekanigi Ozel Kontrolu

Her oyunda asagidaki maddelerden uygun olanlar ayrica kontrol edilmeli:

- Animasyon zinciri tekil mi
- Zamanlayicilar temizleniyor mu
- Bir hedefe basinca birden fazla oge etkileniyor mu
- Secim tekrarinda telemetry ya da skor sisiyor mu
- Seviye belirli bir noktadan sonra yanlislikla kolaylasiyor mu
- Gizlenen oge, secenek ve dogru cevap birbiriyle tutarli mi

## 7. Kapatma Kosullari

Bir migration ancak su dort kosul birlikte saglanirsa tamamlandi kabul edilir:

- `typecheck` gecer
- `lint` gecer
- ilgili logic test ve smoke test gecer
- kisa manuel oyun kontrolu yapildi notu dusulur

## 8. PR Notu Sablonu

PR ya da turn kapanisinda su dort baslik net yazilmali:

- hangi oyun tasindi
- hangi ortak bilesenler eklendi ya da kullanildi
- hangi testler eklendi
- hangi manuel kontroller yapildi
