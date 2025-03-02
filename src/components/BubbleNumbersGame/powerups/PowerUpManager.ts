import { PowerUpType, POWER_UPS } from './types';

export class PowerUpManager {
  private activePowerUps: Map<PowerUpType, number> = new Map(); // type -> bitiş zamanı
  private cooldowns: Map<PowerUpType, number> = new Map();      // type -> kullanılabilir zaman
  
  constructor() {
    // Cooldown'ları sıfırla
    Object.keys(POWER_UPS).forEach(type => {
      this.cooldowns.set(type as PowerUpType, 0);
    });
  }

  // Güçlendirici kullanılabilir mi?
  canUsePowerUp(type: PowerUpType, currentTime: number): boolean {
    return (this.cooldowns.get(type) || 0) <= currentTime;
  }

  // Güçlendirici aktif mi?
  isPowerUpActive(type: PowerUpType, currentTime: number): boolean {
    const endTime = this.activePowerUps.get(type);
    return endTime !== undefined && endTime > currentTime;
  }

  // Güçlendirici kullan
  activatePowerUp(type: PowerUpType, currentTime: number): void {
    const powerUp = POWER_UPS[type];
    
    // Cooldown'u ayarla
    this.cooldowns.set(type, currentTime + powerUp.cooldown);
    
    // Süreli etki varsa aktifleştir
    if (powerUp.duration > 0) {
      this.activePowerUps.set(type, currentTime + powerUp.duration);
    }
  }

  // Güçlendirici kalan süre (saniye)
  getRemainingTime(type: PowerUpType, currentTime: number): number {
    const endTime = this.activePowerUps.get(type);
    if (!endTime) return 0;
    return Math.max(0, endTime - currentTime);
  }

  // Cooldown kalan süre (saniye)
  getRemainingCooldown(type: PowerUpType, currentTime: number): number {
    const cooldownEnd = this.cooldowns.get(type);
    if (!cooldownEnd) return 0;
    return Math.max(0, cooldownEnd - currentTime);
  }

  // Tüm aktif güçlendiricileri getir
  getActivePowerUps(currentTime: number): PowerUpType[] {
    return Array.from(this.activePowerUps.entries())
      .filter(([_, endTime]) => endTime > currentTime)
      .map(([type]) => type as PowerUpType);
  }
}
