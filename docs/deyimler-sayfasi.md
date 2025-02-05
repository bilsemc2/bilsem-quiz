# Deyimler Dünyası Sayfası Dokümantasyonu

## Genel Bakış
Deyimler Dünyası, öğrencilerin Türkçe deyimleri interaktif bir şekilde öğrenmelerini sağlayan bir eğitim modülüdür. Sayfa, hem liste görünümü hem de oyun modu sunarak öğrenmeyi eğlenceli hale getirir.

## Özellikler

### 1. Yetkilendirme Sistemi
- Kullanıcı girişi zorunludur (`useAuth` hook'u ile kontrol)
- Minimum 1000 XP gereksinimi
- XP kontrolü için `useXPCheck` hook'u kullanılır
- Yetersiz XP'si olan kullanıcılar için özel uyarı ekranı

### 2. Modlar
#### Liste Modu
- Tüm deyimleri kartlar halinde görüntüleme
- Her kartta:
  - Deyim
  - Açıklama
  - Örnek kullanım
- Arama fonksiyonu (deyim veya açıklamaya göre filtreleme)

#### Oyun Modu
- Deyim gösterip anlamını seçtirme
- 4 şıklı çoktan seçmeli format
- Anlık geri bildirim
- Skor takibi
- Her doğru cevap için XP ödülü

### 3. XP Sistemi
- Her doğru cevap için 10 XP
- XP güncellemeleri Supabase'de `profiles` tablosunda saklanır
- Başarılı XP kazanımı için toast bildirimleri
- Hata durumları için kullanıcı bilgilendirmesi

### 4. UI/UX Özellikleri
- Gradient arka planlar
- Animasyonlu geçişler
- Hover efektleri
- Toast bildirimleri
- Responsive tasarım

## Güvenlik

### Row Level Security (RLS)

1. **Okuma Politikası**
   - Sadece oturum açmış kullanıcılar erişebilir
   - Minimum 1000 XP gereksinimi
   - Sadece SELECT işlemlerine izin verilir

2. **Admin Politikası**
   - Admin rolüne sahip kullanıcılar tüm işlemleri yapabilir
   - INSERT, UPDATE, DELETE ve SELECT yetkilerine sahip
   - Yeni deyim ekleme, düzenleme ve silme yetkisi

## Veri Yapısı

### Deyim Interface'i
\`\`\`typescript
interface Deyim {
  id: number;
  deyim: string;
  aciklama: string;
  ornek: string | null;
}
\`\`\`

### Supabase Tabloları
1. `deyimler` tablosu
   - id: number
   - deyim: string
   - aciklama: string
   - ornek: string (nullable)

2. `profiles` tablosu (XP için)
   - id: string (user id)
   - experience: number

## Gelecek Geliştirmeler

### 1. Görsel İyileştirmeler
- Her deyim için ilgili görsel/illüstrasyon
- Deyimi anlatan kısa animasyonlar
- İnfografik tarzı görseller

### 2. Etkileşimli Alıştırmalar
- Deyimi cümle içinde kullanma alıştırmaları
- Boşluk doldurma egzersizleri
- Eşleştirme oyunları
- Hikaye tamamlama aktiviteleri

### 3. Multimedya İçerikler
- Deyimlerin sesli okunuşu
- Örnek diyaloglar
- Kısa video anlatımlar

### 4. Gamification
- Günlük XP limiti
- Bonus XP fırsatları (art arda doğru cevaplar)
- XP çarpanları (hafta sonu 2x XP)
- Başarı rozetleri
- Özel ödüller

### 5. Sosyal Özellikler
- Arkadaşlarla yarışma modu
- Skor tablosu
- Deyim paylaşma özelliği
- Grup çalışması aktiviteleri

## Kullanılan Teknolojiler
- React
- TypeScript
- Supabase (Veritabanı ve Kimlik Doğrulama)
- Framer Motion (Animasyonlar)
- Lucide React (İkonlar)
- React Hot Toast (Bildirimler)

## Notlar
- XP sistemi profiles tablosunda tutulur
- Minimum XP gereksinimi: 1000
- Her doğru cevap: +10 XP
- Oyun modu soruları rastgele seçilir
- Yanlış cevaplarda XP kaybı yok
