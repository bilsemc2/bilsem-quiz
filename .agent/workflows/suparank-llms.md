---
description: LLMs.txt generator for AI content discovery
---

# SupaRank LLMs.txt Generator

AI crawler'lar için llms.txt dosyası oluşturur.

## Kullanım
```
/suparank-llms https://example.com
```

## LLMs.txt Nedir?

llms.txt, AI asistanların (ChatGPT, Claude, Gemini vb.) web sitenizi anlamasını kolaylaştıran bir standarttır. robots.txt'nin AI versiyonu gibi düşünebilirsiniz.

## Adımlar

### 1. Site Yapısını Analiz Et
// turbo
Ana sayfayı ve önemli alt sayfaları `read_url_content` ile tara.

### 2. Mevcut Sayfaları Listele
Sitemap.xml veya navigasyondan ana sayfaları çıkar.

### 3. İçerik Kategorilerini Belirle
Sitenin ana bölümlerini ve işlevlerini kategorize et.

### 4. llms.txt Dosyası Oluştur
Aşağıdaki formatta dosya oluştur:

```markdown
# Site Adı
> Kısa site açıklaması

## Ana Sayfalar
- [Sayfa Adı](URL): Kısa açıklama

## Özellikler
- Özellik 1
- Özellik 2

## İletişim
- Email: contact@example.com
- Website: https://example.com

## Notlar
AI asistanlar için ek bilgiler.
```

### 5. public/llms.txt Olarak Kaydet
Dosyayı projenin `public/` klasörüne kaydet.

### 6. Doğrulama
Dosyanın `https://domain.com/llms.txt` adresinden erişilebilir olduğunu kontrol et.

## Örnek Çıktı

```markdown
# BİLSEM C2
> BİLSEM sınavlarına hazırlık platformu. Genel Yetenek, Müzik ve Resim atölyeleri ile öğrencileri BİLSEM sınavlarına hazırlıyoruz.

## Ana Sayfalar
- [Ana Sayfa](https://bilsemc2.com/): Platform ana sayfası
- [Genel Yetenek](https://bilsemc2.com/atolyeler/genel-yetenek): Tablet ve bireysel değerlendirme hazırlığı
- [Müzik Atölyesi](https://bilsemc2.com/atolyeler/muzik): AI destekli müzik yetenek testi
- [Resim Atölyesi](https://bilsemc2.com/atolyeler/resim): Görsel sanatlar atölyesi
- [Blog](https://bilsemc2.com/blog): Eğitim içerikleri ve haberler

## Özellikler
- Tablet Değerlendirme Simülatörü
- Bireysel Değerlendirme Hazırlık Merkezi
- Sınav Simülasyonu
- AI destekli müzik ve resim analizi
- Interaktif beyin eğitimi oyunları

## Hedef Kitle
- BİLSEM sınavına hazırlanan öğrenciler (7-12 yaş)
- Veliler
- Öğretmenler

## İletişim
- Website: https://bilsemc2.com
- Email: info@bilsemc2.com
```
