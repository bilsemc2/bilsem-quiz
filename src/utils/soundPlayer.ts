import { playLegacySound } from '@/features/sound/model/soundEngine';

export function playSound(type: 'correct' | 'incorrect' | 'timeout' | 'tick' | 'timeWarning') {
    void playLegacySound(type, 50);
}

export function playTimeWarning() {
    void playLegacySound('timeWarning', 50);
}
