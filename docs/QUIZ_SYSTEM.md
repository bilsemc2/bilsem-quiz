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
git commit -m ‘msg’
git commit -m feat: Matris bölümü için 212-222 arası soru görselleri eklendi
git push origin master 

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


/quiz de sorular nasıl geliyor

Soruların nasıl geldiğini kontrol etmek için önce questions.ts dosyasının içeriğine ve sonra bu soruların nasıl kullanıldığına bakalım.

Analyzed

questions.ts:(1-101)
Şimdi de QuizizzSurprise.tsx dosyasına bakalım:

Analyzed

QuizizzSurprise.tsx:(1-101)
Projenizde soruların yapılandırması questions.ts dosyasında tanımlanmış. Şu anda görünen yapılandırmaya göre:

Toplam 314 soru bulunuyor
Sorular "Matris" kategorisinde toplanmış
Soru görselleri images/questions/Matris dizininde bulunuyor
Ancak soruların tam olarak nasıl yüklendiğini ve quiz akışının nasıl işlediğini görebilmek için quiz bileşeninin kodunu da incelememiz gerekiyor. Quiz ile ilgili ana bileşeni bulmama izin verin:

Searched for files in
bilsem-quiz/src
6 results
Quiz sayfasının ana mantığını görmek için QuizPage.tsx dosyasını inceleyelim:

Analyzed

QuizPage.tsx:(1-101)
Quiz sistemi şu şekilde çalışıyor:

Sorular iki şekilde gelebilir:
Ödev olarak atanan sorular: Bu durumda sorular localStorage'dan yüklenir
Normal quiz soruları: generateQuiz() fonksiyonu ile oluşturulur ve rastgele 10 soru seçilir
Quiz özellikleri:
Her soru için 60 saniye süre var
Sorular resim formatında geliyor (images/questions/Matris dizininden)
Her sorunun seçenekleri ve doğru cevabı var
Bazı soruların video çözümleri de olabilir
Soru akışı:
Her soru gösterildiğinde süre başlar
Kullanıcı bir seçenek seçtiğinde veya süre bittiğinde cevap kontrol edilir
Doğru/yanlış durumuna göre ses efekti çalınır
Cevaplar kaydedilir ve quiz sonunda toplam skor hesaplanır
Soruları oluşturan generateQuiz fonksiyonunu da incelemek ister misiniz? Bu fonksiyon soruların nasıl yüklendiğini daha detaylı gösterecektir.

Me

evet lütfen

generateQuiz fonksiyonunu bulalım:

Searched for files in
bilsem-quiz/src/utils
1 result
quizGenerator.ts dosyasının içeriğine bakalım:

Analyzed

quizGenerator.ts:(1-101)
generateQuiz fonksiyonunun tamamını görelim:

Analyzed code item

quizGenerator.ts:generateQuiz
Şimdi soruların nasıl oluşturulduğunu detaylıca açıklayayım:

Soru Dosyaları:
Sorular /public/images/questions/Matris/ dizininde .webp formatında bulunuyor
Her soru Soru-X.webp formatında (X soru numarası)
Seçenek Dosyaları:
Seçenekler /public/images/options/Matris/ dizininde bulunuyor
Her soru için A'dan E'ye kadar 5 seçenek var
Doğru cevap dosyası Soru-cevap-XY.webp formatında (X soru numarası, Y seçenek harfi)
Diğer seçenekler Soru-XY.webp formatında
Quiz Oluşturma Süreci:
Tüm soru dosyaları okunur ve sıralanır
Her soru için:
Soru görseli atanır
Seçenekler bulunur (A, B, C, D, E)
Doğru cevap belirlenir (-cevap- içeren dosya)
Seçenekler karıştırılır
Varsa video çözümü eklenir
Video Çözümleri:
Bazı sorular için YouTube video çözümleri var
Bu çözümler questionVideoMap içinde tanımlanmış
Örnek bir soru yapısı şöyle:

Code
CopyInsert
{
    id: "1",
    questionImageUrl: "images/questions/Matris/Soru-1.webp",
    options: [
        { id: "1A", imageUrl: "images/options/Matris/1/Soru-1A.webp", text: "" },
        { id: "1B", imageUrl: "images/options/Matris/1/Soru-cevap-1B.webp", text: "" },
        // ... diğer seçenekler
    ],
    correctOptionId: "1B",
    solutionVideo: {
        url: "https://www.youtube.com/embed/...",
        title: "1. Soru Çözümü"
    }
}
Me

xp kontrolünü nasıl alıyoruz

XP kontrolünü incelemek için önce XPWarning.tsx dosyasına bakalım:

Analyzed

XPWarning.tsx:(1-51)
XP kontrolü şu şekilde yapılıyor:

XPWarning bileşeni kullanıcının mevcut XP'sini (currentXP) ve gerekli XP miktarını (requiredXP) alıyor
Bu bileşen bir ilerleme çubuğu gösteriyor ve kullanıcıya ne kadar daha XP'ye ihtiyacı olduğunu bildiriyor
Şimdi XP'nin nasıl kontrol edildiğini ve saklandığını görmek için QuizizzSurprise.tsx dosyasına bakalım, çünkü orada XP kontrolü yapıldığını görmüştük:

Analyzed

QuizizzSurprise.tsx:(1-101)
XP sistemi şu şekilde çalışıyor:

XP Gereksinimleri:
Sabit bir REQUIRED_XP = 100 değeri var
Kullanıcının XP'si Supabase veritabanında profiles tablosunda experience sütununda tutuluyor
XP Kontrolü:
Kullanıcı giriş yaptığında fetchUserProfile fonksiyonu çağrılıyor
Bu fonksiyon Supabase'den kullanıcının profilini ve XP'sini çekiyor
Eğer kullanıcının XP'si yetersizse showXPWarning true olarak ayarlanıyor
XP Kazanma:
Kullanıcılar quiz çözerek XP kazanabiliyorlar
XP güncellemeleri Supabase veritabanında yapılıyor




Analyzed

QuizPage.tsx:(201-301)
İşte XP sisteminin tam çalışma mantığı:

XP Kazanma:
Quiz tamamlandığında handleQuizComplete fonksiyonu çalışıyor
calculateScore fonksiyonu ile doğru cevap sayısına göre kazanılacak XP hesaplanıyor
Kullanıcının mevcut XP'si veritabanından çekiliyor
Yeni XP miktarı hesaplanıp veritabanında güncelleniyor
XP Güncelleme:
Code
CopyInsert
const { error: updateError } = await supabase
    .from('profiles')
    .update({
        points: (userData?.points || 0) + points,
        experience: (userData?.experience || 0) + xp
    })
    .eq('id', user.id);
XP Kontrolü:
Özellikler için gereken minimum XP miktarı REQUIRED_XP = 100
Kullanıcının XP'si bu değerin altındaysa XP uyarısı gösteriliyor
XP uyarısı, kullanıcıya ne kadar daha XP'ye ihtiyacı olduğunu gösteriyor
XP Takibi:
Her quiz sonucu quiz_results tablosuna kaydediliyor
Kullanıcının toplam XP'si profiles tablosunda tutuluyor
Quiz sonuçları ve kazanılan XP konsola yazdırılıyor (debug için)
calculateScore fonksiyonunu da görmek ister misiniz? Bu fonksiyon XP miktarının nasıl hesaplandığını gösterecektir.

config/question.ts