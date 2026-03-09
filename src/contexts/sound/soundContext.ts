import { createContext } from 'react';
import type { AppSoundName } from '@/features/sound/model/soundCatalog';

export interface SoundContextValue {
    volume: number;
    setVolume: (volume: number) => void;
    isMuted: boolean;
    setIsMuted: (muted: boolean) => void;
    playSound: (soundName: AppSoundName) => void;
}

export const SoundContext = createContext<SoundContextValue | null>(null);
