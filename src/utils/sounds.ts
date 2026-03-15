import { playLegacySound } from '@/features/sound/model/soundEngine';
import type { SoundName } from '../config/sounds';

class SoundManager {
    private static instance: SoundManager;
    private volume: number;
    private isMuted: boolean;

    private constructor() {
        this.volume = 50;
        this.isMuted = false;
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    public setVolume(volume: number) {
        this.volume = volume;
    }

    public setMuted(muted: boolean) {
        this.isMuted = muted;
    }

    public async playSound(soundName: SoundName) {
        if (this.isMuted) {
            return;
        }

        await playLegacySound(soundName, this.volume);
    }

    public playTestSound() {
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
