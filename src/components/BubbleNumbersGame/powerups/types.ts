export type PowerUpType = 
  | 'timeFreeze'   // Zamanı dondur
  | 'doublePop'    // Çift patlama
  | 'slowMotion'   // Yavaş hareket
  | 'extraTime'    // Ekstra süre
  | 'hint';        // İpucu

export interface PowerUp {
  type: PowerUpType;
  duration: number;  // Saniye cinsinden süre (0 = anlık etki)
  cooldown: number; // Yeniden kullanım süresi
  icon: string;     // Emoji ikonu
  description: string;
}

export const POWER_UPS: Record<PowerUpType, PowerUp> = {
  timeFreeze: {
    type: 'timeFreeze',
    duration: 5,
    cooldown: 30,
    icon: '⏸️',
    description: '5 saniye süreyle zamanı dondur'
  },
  doublePop: {
    type: 'doublePop',
    duration: 10,
    cooldown: 45,
    icon: '💥',
    description: '10 saniye süreyle çift puan kazan'
  },
  slowMotion: {
    type: 'slowMotion',
    duration: 8,
    cooldown: 35,
    icon: '🐌',
    description: '8 saniye süreyle baloncukları yavaşlat'
  },
  extraTime: {
    type: 'extraTime',
    duration: 0,
    cooldown: 60,
    icon: '⏰',
    description: 'Anında +10 saniye kazan'
  },
  hint: {
    type: 'hint',
    duration: 3,
    cooldown: 20,
    icon: '💡',
    description: 'Doğru baloncuğu 3 saniye süreyle göster'
  }
};
