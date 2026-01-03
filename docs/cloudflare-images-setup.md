# Cloudflare Images Kurulum Rehberi

> Deyimler görselleri için görüntü optimizasyonu ve CDN çözümü

## 📊 Mevcut Durum ve Hedef

| Metrik | Mevcut | Hedef |
|--------|--------|-------|
| Resim sayısı | 10,413 | 10,413 |
| Tek resim boyutu | ~5 MB | ~200-400 KB |
| Toplam boyut | ~52 GB | ~2-4 GB |
| Azalma oranı | - | **%92-96** |

---

## 💰 Fiyatlandırma

- **$5/ay** = 100,000 resim depolama + 100,000 görüntüleme
- Ekstra: $1/100,000 resim veya görüntüleme
- **10,413 resim için tahmini maliyet: ~$5-10/ay**

---

## 📝 Kurulum Adımları

### 1. Cloudflare Hesabı ve Images Aktivasyonu

1. [dash.cloudflare.com](https://dash.cloudflare.com) adresine gidin
2. Hesap oluşturun (ücretsiz)
3. Sol menüden **Images** seçin
4. **Enable Images** butonuna tıklayın
5. Ödeme bilgilerinizi girin

### 2. Account ID'yi Bulma

1. Dashboard'da sağ üstte **Account ID** görünür
2. Bu ID'yi not edin: `_____________________`

### 3. API Token Oluşturma

1. Sağ üst köşede profil ikonuna tıklayın
2. **My Profile** → **API Tokens** → **Create Token**
3. **Create Custom Token** seçin
4. Ayarlar:
   - Token name: `Deyimler Images Upload`
   - Permissions: `Account` → `Cloudflare Images` → `Edit`
5. **Continue to summary** → **Create Token**
6. Token'ı güvenli bir yere kaydedin (bir kez gösterilir!)

---

## 🖼️ Image Variants (Boyut Ayarları)

Cloudflare Dashboard'dan **Images** → **Variants** bölümünde şu boyutları oluşturun:

| Variant Adı | Boyut | Kullanım Alanı |
|-------------|-------|----------------|
| `thumbnail` | 200x200 | Liste görünümü |
| `medium` | 600x600 | Detay sayfası |
| `public` | 1200x1200 | Tam boyut |

---

## 📤 Toplu Yükleme Scripti

### Bash Script (Terminal)

```bash
#!/bin/bash

# Ayarları düzenleyin
ACCOUNT_ID="your_account_id_here"
API_TOKEN="your_api_token_here"
FOLDER="/path/to/deyimler/images"

# Sayaç
count=0
total=$(ls -1 "$FOLDER"/*.png 2>/dev/null | wc -l)

echo "Toplam $total resim yüklenecek..."

for file in "$FOLDER"/*.png; do
  if [ -f "$file" ]; then
    filename=$(basename "$file" .png)
    count=$((count + 1))
    
    echo "[$count/$total] Yükleniyor: $filename"
    
    response=$(curl -s -X POST \
      "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/images/v1" \
      -H "Authorization: Bearer $API_TOKEN" \
      -F "file=@$file" \
      -F "id=$filename")
    
    # Başarı kontrolü
    success=$(echo "$response" | grep -o '"success":true')
    if [ -n "$success" ]; then
      echo "  ✓ Başarılı"
    else
      echo "  ✗ Hata: $response"
    fi
    
    # Rate limit için kısa bekleme
    sleep 0.5
  fi
done

echo "Tamamlandı! $count resim yüklendi."
```

### Scripti Çalıştırma

```bash
# Scripti kaydedin
nano upload-images.sh

# Çalıştırılabilir yapın
chmod +x upload-images.sh

# Çalıştırın
./upload-images.sh
```

---

## 🔗 React'te Kullanım

### Ortam Değişkenleri (.env)

```env
VITE_CLOUDFLARE_ACCOUNT_HASH=your_account_hash
```

### URL Formatı

```tsx
// Cloudflare Images URL yapısı
const getImageUrl = (imageId: string, variant: 'thumbnail' | 'medium' | 'public' = 'medium') => {
  const accountHash = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_HASH;
  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`;
};

// Kullanım
<img 
  src={getImageUrl('acele-isle-seytan-karisir', 'thumbnail')} 
  alt="Acele işe şeytan karışır"
  loading="lazy"
/>
```

### Deyimler Bileşeninde Örnek

```tsx
interface Deyim {
  id: string;
  deyim: string;
  anlam: string;
  imageId: string; // Cloudflare image ID
}

const DeyimCard = ({ deyim }: { deyim: Deyim }) => {
  const accountHash = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_HASH;
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <img
        src={`https://imagedelivery.net/${accountHash}/${deyim.imageId}/medium`}
        alt={deyim.deyim}
        loading="lazy"
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-bold text-lg">{deyim.deyim}</h3>
        <p className="text-gray-600 text-sm">{deyim.anlam}</p>
      </div>
    </div>
  );
};
```

---

## ⚡ Cloudflare Images Avantajları

| Özellik | Açıklama |
|---------|----------|
| **Otomatik Format** | WebP/AVIF tarayıcıya göre otomatik |
| **Otomatik Sıkıştırma** | 5 MB PNG → ~200 KB otomatik |
| **Global CDN** | 200+ lokasyonda cache |
| **Lazy Resize** | URL'de boyut variant belirtme |
| **HTTPS** | Otomatik SSL sertifikası |

---

## 📋 Kontrol Listesi

- [ ] Cloudflare hesabı oluşturuldu
- [ ] Images aktive edildi
- [ ] Account ID not edildi
- [ ] API Token oluşturuldu
- [ ] Image variants tanımlandı (thumbnail, medium, public)
- [ ] .env dosyasına VITE_CLOUDFLARE_ACCOUNT_HASH eklendi
- [ ] Upload scripti çalıştırıldı
- [ ] React bileşenlerinde entegrasyon yapıldı

---

## 🔧 Sorun Giderme

### Rate Limiting
Çok hızlı yükleme yaparken 429 hatası alabilirsiniz. Script'e `sleep 1` ekleyin.

### Dosya Boyutu Limiti
Cloudflare Images maksimum 10 MB dosya kabul eder. 5 MB ortalama ile sorun yok.

### API Hatası
Token yetkilerini kontrol edin - `Cloudflare Images: Edit` yetkisi gerekli.
