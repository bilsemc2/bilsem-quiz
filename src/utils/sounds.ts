import { sounds, SoundName } from '../config/sounds';

class SoundManager {
    private static instance: SoundManager;
    private audioElements: Map<SoundName, HTMLAudioElement>;
    private volume: number;
    private isMuted: boolean;

    private constructor() {
        this.audioElements = new Map();
        this.volume = 0.5;
        this.isMuted = false;
        this.initializeAudio();
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private initializeAudio() {
        Object.entries(sounds).forEach(([key, path]) => {
            const audio = new Audio(path);
            audio.preload = 'auto';
            audio.volume = this.volume;
            this.audioElements.set(key as SoundName, audio);

            // Log successful load
            audio.addEventListener('canplaythrough', () => {
                console.log(`Loaded sound: ${key}`);
            });

            // Log load errors
            audio.addEventListener('error', (e) => {
                console.error(`Error loading sound ${key}:`, e);
            });
        });
    }

    public setVolume(volume: number) {
        this.volume = volume / 100;
        console.log('Ses seviyesi ayarlandı:', this.volume);
        this.audioElements.forEach(audio => {
            audio.volume = this.volume;
        });
    }

    public setMuted(muted: boolean) {
        this.isMuted = muted;
        console.log('Sessiz mod:', this.isMuted);
    }

    public async playSound(soundName: SoundName) {
        if (this.isMuted) {
            console.log('Ses kapalı olduğu için çalınmadı');
            return;
        }

        if (!sounds[soundName]) {
            console.error('Ses dosyası bulunamadı:', soundName);
            return;
        }

        try {
            // Create a new audio instance for this play
            const playAudio = new Audio(sounds[soundName]);
            playAudio.volume = this.volume;
            await playAudio.play();
            console.log('Ses başarıyla çalındı:', soundName);
        } catch (error) {
            console.error('Ses çalınırken hata oluştu:', error);
            try {
                // Try an alternative approach with a delay
                const alternativeAudio = new Audio(sounds[soundName]);
                alternativeAudio.volume = this.volume;
                await new Promise(resolve => setTimeout(resolve, 100));
                await alternativeAudio.play();
                console.log('Ses başarıyla tekrar çalındı:', soundName);
            } catch (retryError) {
                console.error('Ses tekrar denenirken hata oluştu:', retryError);
            }
        }
    }

    public playTestSound() {
        console.log('Test sesi çalınıyor...');
        return this.playSound('correct');
    }
}

// Singleton instance
const soundManager = SoundManager.getInstance();

// Export functions
export const setGlobalVolume = (volume: number) => soundManager.setVolume(volume);
export const setGlobalMuted = (muted: boolean) => soundManager.setMuted(muted);

export function playSound(soundName: SoundName) {
    soundManager.playSound(soundName);
}

export function playTimeWarning() {
    soundManager.playSound('time-warning');
}

export function playTestSound() {
    soundManager.playSound('correct');
}
