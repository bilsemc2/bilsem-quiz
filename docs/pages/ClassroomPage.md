# BilsemC2 Quiz Uygulaması Özellikleri

## Sınıf Sayfası (ClassroomPage)

### Genel Bakış
Sınıf sayfası, öğrencilerin sınıf içi aktiviteleri takip edebilecekleri ana sayfadır. Bu sayfa üzerinden duyurular, ödevler ve sınıf arkadaşlarının durumları görüntülenebilir.

### Ana Bileşenler

#### 1. Duyurular (Announcements)
- Sınıf ile ilgili önemli duyuruların listesi
- Her duyuru için başlık, içerik ve tarih bilgisi
- Kronolojik sıralama

#### 2. Ödevler (Assignments)
- Aktif ve tamamlanmış ödevlerin listesi
- Her ödev için:
  - Başlık ve açıklama
  - Atanma tarihi
  - Durum (beklemede/tamamlandı)
  - Puan durumu
  - İlgili quiz soruları

#### 3. Sınıf Üyeleri (ClassMembers)
- Sınıftaki tüm öğrencilerin listesi
- Her üye için:
  - İsim
  - Profil resmi
  - Toplam puanı

### Güvenlik Özellikleri
- Oturum kontrolü
- Sınıfa özel erişim yetkilendirmesi
- Yetkisiz erişim durumunda otomatik yönlendirme

### Teknik Özellikler
- Gerçek zamanlı veri senkronizasyonu
- Supabase veritabanı entegrasyonu
- Hata yönetimi ve bildirimler
- Yükleme durumu göstergeleri

## Quiz Sistemi

### Genel Özellikler
- 60 saniyelik zaman sınırı
- Sesli geri bildirimler:
  - Son 10 saniye uyarısı
  - Son 5 saniyede tik sesi
  - Doğru/yanlış cevap sesleri
- Otomatik süre bitimi kontrolü

### Soru Yapısı
- Toplam 438 soru
- Matris kategorisi
- Görsel sorular için büyütme özelliği

### Puan Sistemi
- Doğru/yanlış cevap takibi
- Zaman bazlı puanlama
- Sınıf içi sıralama

## Kullanıcı Arayüzü
- Modern ve duyarlı tasarım
- Yükleme animasyonları
- Hata bildirimleri
- Kolay gezinme

## Veritabanı Yapısı
- Sınıf bilgileri
- Öğrenci profilleri
- Ödev kayıtları
- Quiz sonuçları
