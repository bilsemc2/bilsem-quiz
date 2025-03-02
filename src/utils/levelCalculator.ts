/**
 * Seviye hesaplama algoritması
 * 
 * Bu modül, kullanıcıların deneyim puanlarına (XP) göre seviyelerini,
 * ilerleme yüzdelerini ve bir sonraki seviye için gereken XP miktarını hesaplar.
 */

interface LevelInfo {
  currentLevel: number;        // Mevcut seviye
  levelProgress: number;       // Bu seviyedeki ilerleme yüzdesi (0-100)
  currentXP: number;           // Toplam XP
  nextLevelXP: number;         // Bir sonraki seviye için gereken toplam XP
  requiredXP: number;          // Sonraki seviyeye geçmek için gereken kalan XP
}

/**
 * Temel seviye formülü:
 * Her seviye için gereken XP = BASE_XP * (GROWTH_FACTOR^(level-1))
 * 
 * Bu formül her seviyede gereken XP miktarını üstel olarak artırır,
 * böylece ilerleyen seviyelerde daha fazla çaba gerekir.
 */
const BASE_XP = 100;            // 1. seviye için gereken temel XP
const GROWTH_FACTOR = 1.3;      // Her seviyede XP gereksiniminin artış faktörü
const MAX_LEVEL = 100;          // Maksimum seviye sınırı

/**
 * Belirli bir seviye için gereken toplam XP miktarını hesaplar
 * 
 * @param level - Hesaplanacak seviye
 * @returns Seviyeye ulaşmak için gereken toplam XP
 */
export const xpRequiredForLevel = (level: number): number => {
  if (level <= 1) return 0;
  
  let totalXP = 0;
  
  // 1. seviyeden başlayarak istenen seviyeye kadar her seviye için XP topla
  for (let i = 1; i < level; i++) {
    const levelXP = Math.floor(BASE_XP * Math.pow(GROWTH_FACTOR, i - 1));
    totalXP += levelXP;
  }
  
  return totalXP;
};

/**
 * Belirli bir XP miktarı için seviye ve ilerleme bilgilerini hesaplar
 * 
 * @param totalXP - Kullanıcının toplam XP'si
 * @returns Seviye bilgisi (seviye, ilerleme, vb.)
 */
export const calculateLevelInfo = (totalXP: number): LevelInfo => {
  // XP negatif olamaz
  const xp = Math.max(0, totalXP);
  
  // Seviye hesaplama
  let currentLevel = 1;
  let xpForCurrentLevel = 0;
  
  // Kullanıcının XP'sine göre seviyesini bul
  for (let level = 1; level <= MAX_LEVEL; level++) {
    const requiredXP = xpRequiredForLevel(level + 1);
    
    if (xp < requiredXP) {
      currentLevel = level;
      xpForCurrentLevel = xpRequiredForLevel(level);
      break;
    }
  }
  
  // Sonraki seviyeye geçmek için gereken toplam XP
  const nextLevelXP = xpRequiredForLevel(currentLevel + 1);
  
  // Bu seviyede şu ana kadar kazanılan XP
  const currentLevelXP = xp - xpForCurrentLevel;
  
  // Bu seviyeyi tamamlamak için gereken toplam XP
  const xpForNextLevel = nextLevelXP - xpForCurrentLevel;
  
  // Bu seviyedeki ilerleme yüzdesi
  const levelProgress = Math.min(100, Math.floor((currentLevelXP / xpForNextLevel) * 100));
  
  // Bir sonraki seviyeye geçmek için gereken kalan XP
  const requiredXP = nextLevelXP - xp;
  
  return {
    currentLevel,
    levelProgress,
    currentXP: xp,
    nextLevelXP,
    requiredXP
  };
};

/**
 * Kullanıcının seviyesine göre rozet (badge) döndürür
 * 
 * @param level - Kullanıcı seviyesi
 * @returns Seviyeye uygun rozet emoji
 */
export const getLevelBadge = (level: number): string => {
  if (level < 5) return "🌱"; // Filiz
  if (level < 10) return "🌿"; // Fidan
  if (level < 15) return "🌲"; // Ağaç
  if (level < 20) return "🥉"; // Bronz
  if (level < 30) return "🥈"; // Gümüş
  if (level < 40) return "🥇"; // Altın
  if (level < 50) return "💎"; // Elmas
  if (level < 70) return "🏆"; // Kupa
  if (level < 90) return "👑"; // Taç
  return "🌟"; // Yıldız (En üst seviye)
};

/**
 * Kullanıcı seviyesine göre başlık/unvan döndürür
 * 
 * @param level - Kullanıcı seviyesi
 * @returns Seviyeye uygun başlık
 */
export const getLevelTitle = (level: number): string => {
  if (level < 5) return "Çaylak";
  if (level < 10) return "Acemi";
  if (level < 15) return "Öğrenci";
  if (level < 20) return "Bilgili";
  if (level < 30) return "Uzman";
  if (level < 40) return "Usta";
  if (level < 50) return "Üstat";
  if (level < 70) return "Efsane";
  if (level < 90) return "Bilge";
  return "Efendi";
};
