# Quiz Liste Bileşeni (QuizList)

## Genel Bakış
QuizList bileşeni, oluşturulan quizleri listeleyen, düzenleme, silme ve önizleme işlemlerini sağlayan bir React komponentidir. Material-UI (MUI) kullanılarak geliştirilmiş, kullanıcı dostu bir arayüz sunar.

## Özellikler

### Ana Özellikler
- Quiz listesini tablo formatında görüntüleme
- Sayfalama sistemi
- Quiz düzenleme
- Quiz silme
- Quiz önizleme
- Aktif/Pasif durumu değiştirme

### Arayüz Bileşenleri
1. **Quiz Tablosu**
   - Başlık
   - Açıklama
   - Soru Sayısı
   - Durum (Aktif/Pasif)
   - Oluşturulma Tarihi
   - İşlem Butonları

2. **Düzenleme Modalı**
   - Quiz başlığı düzenleme
   - Quiz açıklaması düzenleme

3. **Önizleme Modalı**
   - Quiz başlığı
   - Tüm soruların detaylı görünümü
   - Doğru cevap vurgulaması

## Teknik Detaylar

### Veri Yapısı
```typescript
interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Array<{
    number: number;
    correctAnswer: string;
  }>;
  is_active: boolean;
  created_at: string;
  created_by: string;
}
```

### Temel Fonksiyonlar

#### `fetchQuizzes`
- Supabase'den quiz listesini çeker
- Oluşturulma tarihine göre sıralar
- Hata yönetimi yapar

#### `handleEditClick` ve `handleEditSave`
- Quiz düzenleme modalını açar
- Değişiklikleri Supabase'e kaydeder
- Yerel state'i günceller

#### `handleDeleteQuiz`
- Quiz silme işlemini gerçekleştirir
- Kullanıcıdan onay alır
- Supabase'den ve yerel state'den siler

#### `handleToggleActive`
- Quiz'in aktif/pasif durumunu değiştirir
- Supabase'i günceller
- Yerel state'i günceller

#### `handlePreviewClick`
- Quiz önizleme modalını açar
- Soru ve seçenek görsellerini hazırlar
- Doğru cevapları işaretler

### Sayfalama Özellikleri
- Sayfa başına 5, 10 veya 25 kayıt gösterme
- Sayfa değiştirme
- Toplam kayıt sayısı gösterimi

## Görsel Özellikler
- Responsive tablo tasarımı
- Aktif/Pasif durumu için renkli chip'ler
- Doğru cevaplar için yeşil vurgulama
- İşlem butonları için tooltip'ler
- Yükleme durumu için progress indicator

## Veritabanı Etkileşimi

### Supabase Sorguları
```typescript
// Quiz Listesi Çekme
const { data, error } = await supabase
  .from('quizzes')
  .select('*')
  .order('created_at', { ascending: false });

// Quiz Güncelleme
const { error } = await supabase
  .from('quizzes')
  .update({ title, description })
  .eq('id', quizId);

// Quiz Silme
const { error } = await supabase
  .from('quizzes')
  .delete()
  .eq('id', quizId);
```

## Hata Yönetimi
- Yükleme durumları için loading state
- Hata mesajları için error state
- Kullanıcı dostu hata gösterimi
- İşlem onayları için alert'ler

## Kullanım

### Gerekli Paketler
```json
{
  "@mui/material": "^5.x.x",
  "@mui/icons-material": "^5.x.x",
  "@supabase/supabase-js": "^2.x.x"
}
```

### Örnek Kullanım
```tsx
import { QuizList } from './components/QuizList';

function AdminPanel() {
  return (
    <div>
      <QuizList />
    </div>
  );
}
```

## Notlar
- Tüm tarihler Türkiye tarih formatında gösterilir
- Silme işlemi geri alınamaz
- Aktif/Pasif durumu anlık olarak değişir
- Önizlemede tüm soru görselleri webp formatında olmalıdır

## Veritabanı Yapısı

### Quiz-Sınıf İlişkileri (`quiz_class_assignments`)

```sql
CREATE TABLE public.quiz_class_assignments (
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    PRIMARY KEY (quiz_id, class_id)
);
```

### Güvenlik Politikaları

```sql
-- Okuma politikası
CREATE POLICY "quiz_class_assignments_select_policy"
    ON public.quiz_class_assignments FOR SELECT
    USING (true);

-- Yazma politikası
CREATE POLICY "quiz_class_assignments_insert_policy"
    ON public.quiz_class_assignments FOR INSERT
    WITH CHECK (true);

-- Silme politikası
CREATE POLICY "quiz_class_assignments_delete_policy"
    ON public.quiz_class_assignments FOR DELETE
    USING (true);
```

## Kullanım

### Quiz'i Sınıflara Atama

```typescript
const handleAssignSave = async () => {
  // 1. Kullanıcı bilgisini al
  const { data: { user } } = await supabase.auth.getUser();
  
  // 2. Eski atamaları sil
  await supabase
    .from('quiz_class_assignments')
    .delete()
    .eq('quiz_id', quizId);
    
  // 3. Yeni atamaları ekle
  await supabase
    .from('quiz_class_assignments')
    .insert(selectedClasses.map(classId => ({
      quiz_id: quizId,
      class_id: classId,
      assigned_by: user.id
    })));
};
```

### Quiz Atamalarını Yükleme

```typescript
const loadQuizAssignments = async (quizId: string) => {
  const { data } = await supabase
    .from('quiz_class_assignments')
    .select('class_id')
    .eq('quiz_id', quizId);
    
  return data?.map(assignment => assignment.class_id) || [];
};
```

## Hata Yönetimi

- Tüm Supabase işlemlerinde hata kontrolü yapılır
- Hatalar console'a loglanır
- Kullanıcıya toast bildirimleri gösterilir

## Bağımlılıklar

- @supabase/supabase-js
- react-toastify
- @mui/material
- @mui/icons-material
