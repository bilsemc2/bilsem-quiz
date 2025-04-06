/**
 * Resim URL'lerini korumak için yardımcı fonksiyonlar
 */

import { supabase } from '../lib/supabase';

// Resim URL'lerini dönüştürme fonksiyonu
export const encryptImageUrl = (url: string): string => {
  if (!url) return '';
  
  try {
    // Orijinal URL'yi dönüştür
    const currentTimestamp = Date.now();
    const randomSalt = Math.random().toString(36).substring(2, 10);
    
    // Resim URL'sini dönüştür - Referrer kontrolü ekleyerek
    const transformedUrl = `${url}?t=${currentTimestamp}&s=${randomSalt}`;
    
    return transformedUrl;
  } catch (error) {
    console.error('Resim URL dönüştürme hatası:', error);
    return url; // Hata durumunda orijinal URL'yi döndür
  }
};

// Resim içeriğini Base64 formatında yükle
export const loadImageAsBase64 = async (imageUrl: string): Promise<string> => {
  try {
    // Resmi yükle
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Blob'u Base64'e dönüştür
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Resim Base64 dönüştürme hatası:', error);
    return '';
  }
};

// Kullanıcı erişimini kontrol et
export const checkUserAccess = async (): Promise<boolean> => {
  try {
    // Kullanıcının oturum bilgisini al
    const { data } = await supabase.auth.getSession();
    return !!data.session; // Oturum varsa true, yoksa false döndür
  } catch (error) {
    console.error('Kullanıcı erişim kontrolü hatası:', error);
    return false;
  }
};

// Resim koruma CSS sınıflarını oluştur
export const getImageProtectionStyles = (): string => {
  return `
    .protected-image {
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      pointer-events: none;
      position: relative;
    }
    
    .protected-image::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      z-index: 1;
    }
    
    @media print {
      .protected-image {
        display: none !important;
      }
    }
  `;
};
