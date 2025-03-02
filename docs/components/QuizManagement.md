# Quiz Yönetim Bileşeni (QuizManagement)

## Genel Bakış
QuizManagement bileşeni, quiz oluşturma ve yönetme işlemlerini kolaylaştıran kapsamlı bir React komponentidir. Material-UI (MUI) kullanılarak geliştirilmiş modern ve kullanıcı dostu bir arayüz sunar.

## Özellikler

### Ana Özellikler
- Quiz oluşturma ve düzenleme
- Soru seçme ve çıkarma
- Detaylı soru önizleme
- Sayfalama sistemi
- Lazy loading ile optimize edilmiş resim yükleme
- Supabase veritabanı entegrasyonu

### Arayüz Bileşenleri
1. **Quiz Bilgi Formu**
   - Quiz başlığı giriş alanı
   - Quiz açıklaması giriş alanı

2. **Soru Kartları**
   - Grid yapısında düzenlenmiş soru kartları
   - Her kartta:
     - Soru numarası
     - Soru görseli
     - Doğru cevap etiketi
     - Ekle/Çıkar butonu
     - Önizleme butonu

3. **Önizleme Penceresi**
   - Tam boyut soru görseli
   - Tüm seçeneklerin görselleri
   - Doğru cevap vurgulaması

## Teknik Detaylar

### Veri Yapısı
```typescript
interface QuestionPreview {
  number: number;
  questionImage: string;
  options: {
    letter: string;
    optionImage: string;
    answerImage: string;
  }[];
  correctAnswer?: string;
}
```

### Temel Fonksiyonlar

#### `loadQuestions`
- Soruları yükler
- Doğru cevapları tespit eder
- Hata kontrolü yapar

#### `handlePreview`
- Soru önizleme penceresini açar
- Seçenekleri ve doğru cevabı gösterir

#### `handleQuestionSelect`
- Soruları seçme/çıkarma işlemlerini yönetir
- Seçili soru listesini günceller

#### `handleCreateQuiz`
- Form validasyonu yapar
- Seçili sorularla yeni quiz oluşturur
- Supabase'e kayıt işlemini gerçekleştirir

### Optimizasyon Özellikleri
- Webp formatında resimler
- Lazy loading implementasyonu
- Blur efekti ile yükleme animasyonu
- Responsive tasarım

## Kullanım

### Gerekli Paketler
```json
{
  "@mui/material": "^5.x.x",
  "@mui/icons-material": "^5.x.x",
  "react-lazy-load-image-component": "^1.x.x",
  "@supabase/supabase-js": "^2.x.x"
}
```

### Örnek Kullanım
```tsx
import { QuizManagement } from './components/QuizManagement';

function App() {
  return (
    <div>
      <QuizManagement />
    </div>
  );
}
```

## Stil ve Görünüm
- Material Design prensipleri
- Responsive grid sistemi
- Seçili sorular için yeşil çerçeve vurgusu
- Doğru cevaplar için yeşil etiket
- Önizlemede vurgulanan doğru cevap gösterimi

## Veritabanı Yapısı


## Notlar
- Tüm resim dosyaları webp formatında olmalıdır
- Soru görselleri `/images/questions/Matris/Soru-[Soru Numarası].webp` dizininde bulunur.
- Seçenek görselleri `/images/options/Matris/[Soru Numarası]/Soru-[Soru Numarası][Letter].webp` dizininde bulunmalıdır
- Doğru cevap seçeneğinde Soru--cevap-[Soru Numarası][Letter].webp olarak bulunur.
- Her quiz en az bir soru içermelidir
- Quiz başlığı zorunludur
