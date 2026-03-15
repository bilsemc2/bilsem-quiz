import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppSoundName } from '@/features/sound/model/soundCatalog';
import { playAppSound } from '@/features/sound/model/soundEngine';
import {
    createSoundPreferences,
    DEFAULT_SOUND_MUTED,
    DEFAULT_SOUND_VOLUME,
    readSoundPreferences,
    writeSoundPreferences
} from '@/features/sound/model/soundPreferencesModel';
import type { SoundContextValue } from '@/contexts/sound/soundContext';

const canUseLocalStorage = () => (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
);

const readInitialPreferences = () => {
    if (!canUseLocalStorage()) {
        return createSoundPreferences({
            storedVolume: String(DEFAULT_SOUND_VOLUME),
            storedMuted: String(DEFAULT_SOUND_MUTED)
        });
    }

    return readSoundPreferences(window.localStorage);
};

export const useSoundController = (): SoundContextValue => {
    const initialPreferencesRef = useRef(readInitialPreferences());
    const [volume, setVolume] = useState(initialPreferencesRef.current.volume);
    const [isMuted, setIsMuted] = useState(initialPreferencesRef.current.isMuted);
    const volumeRef = useRef(volume);
    const mutedRef = useRef(isMuted);

    useEffect(() => {
        volumeRef.current = volume;
    }, [volume]);

    useEffect(() => {
        mutedRef.current = isMuted;
    }, [isMuted]);

    useEffect(() => {
        if (!canUseLocalStorage()) {
            return;
        }

        writeSoundPreferences(window.localStorage, {
            volume,
            isMuted
        });
    }, [volume, isMuted]);

    const playSound = useCallback((soundName: AppSoundName) => {
        if (mutedRef.current) {
            return;
        }

        void playAppSound(soundName, volumeRef.current);
    }, []);

    return {
        volume,
        setVolume,
        isMuted,
        setIsMuted,
        playSound
    };
};
