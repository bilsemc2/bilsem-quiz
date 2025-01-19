# Sınıfa Giriş Özelliği

## Genel Bakış

Sınıfa Giriş özelliği, öğrencilerin kendi sınıf ortamlarına hızlı ve kolay bir şekilde erişmelerini sağlar. Bu özellik, profil sayfasında bulunan "Sınıfa Gir" butonu aracılığıyla kullanılır.

## Teknik Detaylar

### Veritabanı İlişkileri

```sql
-- Sınıf-Öğrenci ilişki tablosu
CREATE TABLE public.class_students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES public.classes(id),
    student_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sınıflar tablosu
CREATE TABLE public.classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grade INTEGER NOT NULL,
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES auth.users(id)
);
```

### Uygulama Mantığı

```typescript
const handleClassroomEntry = async () => {
    try {
        // Kullanıcının sınıf kaydını kontrol et
        const { data: classData, error: classError } = await supabase
            .from('class_students')
            .select(`
                class:classes (
                    id,
                    grade
                )
            `)
            .eq('student_id', user?.id)
            .single();

        if (classError || !classData?.class) {
            toast.error('Sınıf bilginiz bulunamadı. Lütfen profilinizi güncelleyin.');
            return;
        }

        // Sınıf sayfasına yönlendir
        navigate(`/classroom/${classData.class.grade}`);
    } catch (error) {
        console.error('Sınıf bilgisi alınırken hata:', error);
        toast.error('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
};
```

## Kullanıcı Arayüzü

"Sınıfa Gir" butonu profil sayfasında bulunur ve şu özelliklere sahiptir:
- Mavi arka plan (`bg-blue-600`)
- Hover durumunda koyu mavi (`hover:bg-blue-700`)
- Beyaz metin rengi
- Yuvarlak köşeler
- Gölge efekti
- Sağ ok ikonu

```tsx
<button
    onClick={handleClassroomEntry}
    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 flex items-center space-x-2"
>
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
    <span>Sınıfa Gir</span>
</button>
```

## Hata Yönetimi

1. **Sınıf Bulunamadığında**
   - Kullanıcıya "Sınıf bilginiz bulunamadı" mesajı gösterilir
   - Profil güncelleme önerilir

2. **Sistem Hatası**
   - Hata konsola loglanır
   - Kullanıcıya genel hata mesajı gösterilir
   - Tekrar deneme önerilir

## Güvenlik

- Sadece giriş yapmış kullanıcılar bu özelliği kullanabilir
- Her öğrenci sadece kendi sınıfına erişebilir
- Sınıf bilgisi veritabanında doğrulanır

## Bağımlılıklar

- @supabase/supabase-js (Veritabanı işlemleri)
- react-router-dom (Sayfa yönlendirme)
- sonner (Toast bildirimleri)
- Tailwind CSS (Stil)

## Gelecek Geliştirmeler

1. Birden fazla sınıfa kayıtlı öğrenciler için sınıf seçim menüsü
2. Sınıf değiştirme özelliği
3. Son giriş yapılan sınıfı hatırlama
4. Sınıf önizleme
5. Hızlı erişim için ana sayfaya sınıf kısayolları
