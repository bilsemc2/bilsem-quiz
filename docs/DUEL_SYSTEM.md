# Düello Sistemi

## Genel Bakış
Düello sistemi, öğrencilerin birbirleriyle yarışarak öğrenmelerini sağlayan interaktif bir özelliktir. Öğrenciler birbirlerine düello daveti gönderebilir, sorulara cevap verebilir ve sonuçları görebilirler.

## Düello Durumları

### 1. Bekleyen Düellolar
- **Status: `pending`**
- Henüz kabul edilmemiş düello davetleri
- Düello başlatan kişi rakibinin kabul etmesini bekler
- Karşı taraf düelloyu kabul edebilir veya reddedebilir

### 2. Devam Eden Düellolar
- **Status: `in_progress`**
- Karşı taraf düelloyu kabul etmiş
- En az bir taraf cevap vermiş
- Diğer tarafın cevabı bekleniyor
- Her iki taraf da cevap verene kadar bu durumda kalır

### 3. Tamamlanan Düellolar
- **Status: `completed`**
- Her iki taraf da cevap vermiş
- Sonuç belirlenmiş (kazanan, kaybeden veya berabere)
- Tamamlanma tarihi kaydedilmiş

## Düello Akışı

1. **Düello Başlatma**
   - Rakip seçilir
   - Rastgele bir soru atanır
   - Düello `pending` durumunda oluşturulur
   - Karşı tarafa bildirim gider

2. **Düello Kabul Edildiğinde**
   - Durum `in_progress` olur
   - Her iki tarafa da soru gösterilir
   - Süre başlar (30 saniye)

3. **Cevaplama Süreci**
   - Her kullanıcı soruyu bir kez cevaplayabilir
   - Cevap verildikten sonra değiştirilemez
   - Süre dolduğunda otomatik yanlış sayılır

4. **Sonuç Belirleme**
   - Her iki taraf cevapladığında sonuç belirlenir:
     - İki taraf da doğru: Berabere
     - Bir taraf doğru diğeri yanlış: Doğru cevaplayan kazanır
     - İki taraf da yanlış: Berabere

## Veri Yapısı

```typescript
interface Duel {
  id: string;
  status: 'pending' | 'in_progress' | 'completed';
  challenger_id: string;     // Düelloyu başlatan
  challenged_id: string;     // Rakip
  question_data: {
    id: number;
    text: string;
    questionImageUrl: string;
    options: string[];
    correctOptionId: string;
    solutionVideo?: string;
  };
  created_at: string;
  completed_at?: string;
  challenger_answer?: string;
  challenged_answer?: string;
  result?: 'challenger_won' | 'challenged_won' | 'draw';
}
```

## Otomatik Güncellemeler

1. **Polling (5 saniyede bir)**
   - Aktif düellolar kontrol edilir
   - Düello listesi güncellenir
   - Yeni düello varsa gösterilir

2. **Realtime Subscription**
   - Düello değişikliklerini anlık takip eder
   - Yeni düello geldiğinde
   - Durum değiştiğinde
   - Cevap verildiğinde

## Güvenlik ve Kısıtlamalar

1. **Cevap Verme**
   - Her kullanıcı sadece bir kez cevap verebilir
   - Süre dolduktan sonra cevap verilemez
   - Cevap verildikten sonra değiştirilemez

2. **Düello Başlatma**
   - Kullanıcı yeterli XP'ye sahip olmalı
   - Aynı kişiye aynı anda birden fazla düello gönderilemez
   - Sadece arkadaş listesindeki kişilere düello gönderilebilir
