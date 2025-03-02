# 📝 QuizCard Bileşeni Dokümantasyonu

## 📋 Genel Bakış
QuizCard, Bilsem Quiz uygulamasının temel soru kartı bileşenidir. Öğrencilere interaktif bir quiz deneyimi sunar.

## 🎯 Özellikler

### ⏱️ Zamanlayıcı
- 60 saniyelik geri sayım
- Renk kodlu ilerleyiş çubuğu:
  - 🟢 Normal süre (30-60 saniye)
  - 🟡 Uyarı süresi (10-30 saniye)
  - 🔴 Kritik süre (0-10 saniye)
- Sesli uyarılar:
  - Son 10 saniyede uyarı sesi
  - Son 5 saniyede tik sesi

### 🖼️ Görsel Öğeler
- Soru görseli görüntüleme
- Tıklanabilir büyütme özelliği
- Modal görünümü
- Hover efektleri ve animasyonlar

### ✅ Cevaplama Sistemi
- Görsel seçenekler
- Anlık geri bildirim
- Doğru/yanlış renk kodlaması
- 1 saniyelik bekleme süresi
- Otomatik sonraki soruya geçiş

## 💻 Teknik Detaylar

### Props
```typescript
interface QuizCardProps {
    question: QuizQuestion;
    onAnswer: (isCorrect: boolean, timeLeft: number, selectedOptionId: string) => void;
}
```

### State Yönetimi
```typescript
const [selectedOption, setSelectedOption] = useState<string | null>(null);
const [showResult, setShowResult] = useState(false);
const [timeLeft, setTimeLeft] = useState(60);
const [showEnlargedImage, setShowEnlargedImage] = useState(false);
```

### Ana Fonksiyonlar

#### handleTimeOut
- Süre bitiminde otomatik işlem
- Rastgele yanlış cevap seçimi
- Ses efekti çalma

#### handleOptionClick
- Seçenek seçme işlemi
- Seçim durumu kontrolü
- UI güncelleme

#### handleSubmit
- Cevap doğrulama
- Ses efekti çalma
- Sonuç gösterimi
- Sonraki soruya geçiş

#### getOptionClassName
- Dinamik stil yönetimi
- Durum bazlı renk kodlaması
- Hover ve seçim efektleri

## 🎨 Stil ve Görünüm

### Zamanlayıcı Stili
```css
.timer-bar {
  width: 150px;
  height: 2px;
  border-radius: full;
  transition: all 300ms;
}
```

### Seçenek Kartları
```css
.option-card {
  max-width: 300px;
  padding: 1rem;
  border-radius: 0.75rem;
  transition: all 300ms;
}
```

## 🔊 Ses Sistemi
- useSound hook kullanımı
- Duruma özel ses efektleri:
  - ✅ Doğru cevap
  - ❌ Yanlış cevap
  - ⏰ Zamanlayıcı
  - ⚠️ Uyarı

## 🔄 Yaşam Döngüsü

1. **Başlangıç**
   - Timer başlatılır
   - Soru ve seçenekler gösterilir

2. **Kullanıcı Etkileşimi**
   - Seçenek seçme
   - Cevap onaylama
   - Görsel büyütme

3. **Sonuç**
   - Doğru/yanlış gösterimi
   - Ses efekti
   - Sonraki soruya geçiş

## 📱 Responsive Tasarım
- Mobil uyumlu görünüm
- Esnek seçenek kartları
- Uyarlanabilir görsel boyutları

## 🛠️ Geliştirici Notları
1. Yeni ses efekti eklerken useSound hook'unu güncellemeyi unutmayın
2. Zamanlayıcı süresini değiştirirken ilgili renk kodlarını da güncelleyin
3. Görsel boyutlarını değiştirirken responsive tasarımı kontrol edin

## 🔜 Gelecek Geliştirmeler
- [ ] Çoklu dil desteği
- [ ] Özel tema seçenekleri
- [ ] İlerleme göstergesi
- [ ] İpucu sistemi
- [ ] Sessize alma özelliği
