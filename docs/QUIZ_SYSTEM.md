# Quiz Sistemi Dokümantasyonu
Bana açıklama yaparken her zaman Türkçe açıklama yap.
## Genel Bakış

Bilsem Quiz uygulamasının quiz sistemi, resim tabanlı sorular ve seçeneklerle çalışan, otomatik puanlama ve video çözümleri sunan bir yapıya sahiptir.

## Dosya Yapısı

### Klasör Organizasyonu
```
public/
├── images/
│   ├── questions/
│   │   └── Matris/
│   │       ├── Soru-1.webp
│   │       ├── Soru-2.webp
│   │       └── ...
│   └── options/
│       └── Matris/
│           ├── 1/
│           │   ├── Soru-1A.webp
│           │   ├── Soru-1B.webp
│           │   ├── Soru-1C.webp
│           │   ├── Soru-1D.webp
│           │   └── Soru-cevap-1E.webp
│           └── ...
```

### Dosya İsimlendirme Kuralları
- **Sorular:** `Soru-[numara].webp` (örn: `Soru-1.webp`)
- **Seçenekler:** `Soru-[numara][A-E].webp` (örn: `Soru-1A.webp`)
- **Doğru Cevap:** `Soru-cevap-[numara][A-E].webp` (örn: `Soru-cevap-1C.webp`)


// Soru görseli
filePath = `images/questions/Matris/Soru-${questionNumber}.webp`;

// Yanlış cevap görseli
filePath = `images/options/Matris/${questionNumber}/Soru-${questionNumber}${optionLetter}.webp`;

// Doğru cevap görseli
filePath = `images/options/Matris/${questionNumber}/Soru-cevap-${questionNumber}${optionLetter}.webp`;

Ana sayfadaki toplam soru sayısı src/config/questions.ts dosyasındaki QUESTIONS_CONFIG yapılandırmasından geliyor. Bu yapılandırmada categories.Matris.totalQuestions değeri 20 olarak ayarlanmış durumda.

QuestionCount.tsx bileşeni bu değeri QUESTIONS_CONFIG.categories.Matris.totalQuestions'dan alıp görüntülüyor. Eğer toplam soru sayısını değiştirmek isterseniz, questions.ts dosyasındaki bu değeri güncellemeniz yeterli olacaktır.

Örneğin, toplam soru sayısını 30 yapmak isterseniz, questions.ts dosyasında şu değişikliği yapabilirsiniz:

typescript
CopyInsert
categories: {
  Matris: {
    totalQuestions: 30,  // Bu değeri değiştirin
    path: 'images/questions/Matris'
  }

  git add .
git commit -m "Değişiklik açıklaması" 
git commit -m feat: Matris bölümü için 212-222 arası soru görselleri eklendi
git push

outing ayarlarını kontrol et
oluşturduğumuz /*create* sayfası için bir route ekle. App.tsx dosyasını düzenle
NavBar'a *create* sayfası için bir link ekle
$ npm run dev


Bulmaca tahtası:
-- Cron extension'ı aktifleştir
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Her gün gece yarısı çalışacak job
SELECT cron.schedule('0 0 * * *', $$
  DELETE FROM duels 
  WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '24 hours'
$$);

Sorunun asıl kaynağını buldum! professionMap objesinde "İnşaat İşçisi" ve "Astronot" meslekleri eksik. Bu yüzden bu meslekler için doğru resim yolları oluşturulamıyor.

questions.ts Soru sayısı ordan gir