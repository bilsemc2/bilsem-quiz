// Ses URL'leri
export const SOUND_URLS = {
  pop: '/sounds/pop.mp3',     // Baloncuk patlatma
  wrong: '/sounds/wrong.mp3', // Yanlış baloncuk
};

// Ses yönetimi
class SoundManager {
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private muted: boolean = false;

  constructor() {
    // Sesleri önceden yükle
    Object.entries(SOUND_URLS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      this.sounds[key] = audio;
    });
  }

  play(soundName: keyof typeof SOUND_URLS) {
    if (this.muted) return;

    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Tarayıcı otomatik oynatmaya izin vermeyebilir
        console.log('Ses oynatılamadı:', soundName);
      });
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    // Tüm sesleri durdur
    if (muted) {
      Object.values(this.sounds).forEach(sound => {
        sound.pause();
        sound.currentTime = 0;
      });
    }
  }

  getMuted() {
    return this.muted;
  }
}

// Singleton instance
export const soundManager = new SoundManager();
