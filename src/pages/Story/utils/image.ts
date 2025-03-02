export async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    // Birden fazla CORS proxy seçeneği
    const proxyUrls = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://cors-anywhere.herokuapp.com/${url}`
    ];
    
    let lastError = null;
    
    // Her proxy'yi sırayla dene
    for (const proxyUrl of proxyUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(proxyUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'image/*'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        
        if (blob.size === 0) {
          throw new Error('Boş yanıt');
        }
        
        if (!blob.type.startsWith('image/')) {
          throw new Error('Geçersiz resim formatı');
        }
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        lastError = error;
        console.warn(`Proxy başarısız (${proxyUrl}):`, error);
        continue; // Sonraki proxy'yi dene
      }
    }
    
    // Tüm proxy'ler başarısız olduysa
    throw new Error(`Resim yüklenemedi: ${lastError?.message || 'Bilinmeyen hata'}`);
  } catch (error) {
    console.error('Resim yükleme hatası:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Resim yükleme zaman aşımına uğradı');
    }

    throw error;
  }
}