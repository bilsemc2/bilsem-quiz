import { playLegacySound } from '@/features/sound/model/soundEngine';

// Ses yönetimi
class SoundManager {
  private muted: boolean = false;

  play(soundName: 'flip' | 'match' | 'win') {
    if (this.muted) return;
    void playLegacySound(soundName, 50);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  getMuted() {
    return this.muted;
  }
}

// Singleton instance
export const soundManager = new SoundManager();
