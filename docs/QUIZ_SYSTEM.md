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

## Quiz Oluşturma Süreci

### 1. Soru Yükleme
- Sorular `/public/images/questions/Matris/` klasöründen otomatik olarak yüklenir
- Her soru için seçenekler `/public/images/options/Matris/[soru_no]/` klasöründen yüklenir
- Doğru cevap, dosya adında `-cevap-` içeren seçenek olarak belirlenir

### 2. Quiz Oluşturma
- Her quiz için mevcut soru havuzundan rastgele 10 soru seçilir
- Seçeneklerin sırası her defasında karıştırılır
- Her soru için video çözümü eklenebilir (opsiyonel)

## Quiz Sayfası Özellikleri

### Zaman Yönetimi
- Her soru için 60 saniye süre verilir
- Son 10 saniyede sesli uyarı yapılır
- Süre dolduğunda otomatik olarak sonraki soruya geçilir

### Ses Efektleri
- Doğru cevap: Olumlu ses efekti
- Yanlış cevap: Olumsuz ses efekti
- Süre uyarısı: Uyarı sesi
- Sonraki soru: Geçiş sesi

### Otomatik İlerleme
- Her cevaptan 2 saniye sonra otomatik olarak sonraki soruya geçilir
- Son soruda "Testi Bitir" butonu gösterilir

### Video Çözümleri
- Her soru için YouTube üzerinden video çözümü eklenebilir
- Video ID'leri `quizGenerator.ts` içinde `questionVideoMap` objesinde tanımlanır
- Çözüm videoları quiz tamamlandıktan sonra gösterilir

## Puan Sistemi

### Puan Hesaplama
- Her doğru cevap için puan ve XP kazanılır
- Puanlar Supabase veritabanında saklanır
- Kullanıcının toplam puanı profilinde görüntülenir

### Lider Tablosu
- En yüksek puanlı kullanıcılar ana sayfadaki lider tablosunda gösterilir
- Lider tablosu her 30 saniyede bir güncellenir

## Yeni Soru Ekleme Kılavuzu

1. **Soru Hazırlama**
   - Soru resmini hazırlayın (webp formatında)
   - 5 adet seçenek resmi hazırlayın (webp formatında)
   - Doğru cevabın dosya adında `-cevap-` olmalı

2. **Dosyaları Yükleme**
   - Soru resmini `/public/images/questions/Matris/` klasörüne ekleyin
   - Seçenek resimlerini `/public/images/options/Matris/[soru_no]/` klasörüne ekleyin

3. **Video Çözümü (Opsiyonel)**
   ```typescript
   const questionVideoMap = {
     '[soru_no]': {
       videoId: '[youtube_video_id]',
       title: 'Matris - Soru [no] Video Çözümü'
     }
   };
   ```

## Teknik Detaylar

### Kullanılan Dosyalar
- `src/utils/quizGenerator.ts`: Quiz oluşturma mantığı
- `src/pages/QuizPage.tsx`: Quiz sayfası ve kullanıcı etkileşimi
- `src/utils/scoreCalculator.ts`: Puan hesaplama sistemi

### Veritabanı
- Supabase kullanılıyor
- Kullanıcı puanları ve deneyim puanları `profiles` tablosunda saklanıyor
- Quiz sonuçları ve kullanıcı istatistikleri kaydediliyor

### Veritabanı İlişkileri

#### Quiz Results Tablosu
- `quiz_results` tablosu `auth.users` tablosuna bağlıdır (profiles tablosuna değil)
- İlişki `user_id` kolonu üzerinden kurulmuştur
- Her quiz sonucu bir kullanıcıya aittir
- Kullanıcı silindiğinde, o kullanıcıya ait tüm quiz sonuçları da silinir (CASCADE)

#### Quizzes Tablosu
```sql
-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    grade SMALLINT CHECK (grade IN (1, 2, 3)),
    subject TEXT
);

-- Add RLS policies
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Allow admins to do everything
CREATE POLICY admin_all ON quizzes
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Allow all authenticated users to view active quizzes
CREATE POLICY view_active_quizzes ON quizzes
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at
CREATE TRIGGER update_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

Quiz tablosu özellikleri:
- Her quiz'in benzersiz bir UUID'si vardır
- Quiz başlığı ve açıklaması metin olarak saklanır
- Sorular JSONB formatında saklanır (daha esnek bir yapı için)
- Aktif/pasif durumu boolean ile kontrol edilir
- Oluşturan kullanıcı referansı tutulur
- Oluşturma ve güncelleme tarihleri otomatik olarak yönetilir
- Sınıf ve konu bilgileri eklenmiştir

Güvenlik Politikaları:
1. Admin kullanıcılar tüm quiz'ler üzerinde tam yetkiye sahiptir
2. Normal kullanıcılar sadece aktif quiz'leri görüntüleyebilir
3. Row Level Security (RLS) ile veri güvenliği sağlanır
