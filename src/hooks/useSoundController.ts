import { useCallback, useEffect, useRef, useState } from 'react';
import { SOUND_URLS, type AppSoundName } from '@/features/sound/model/soundCatalog';
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
    const preloadedAudioRef = useRef<Partial<Record<AppSoundName, HTMLAudioElement>>>({});
    const volumeRef = useRef(volume);
    const mutedRef = useRef(isMuted);

    useEffect(() => {
        volumeRef.current = volume;
    }, [volume]);

    useEffect(() => {
        mutedRef.current = isMuted;
    }, [isMuted]);

    useEffect(() => {
        const preloadedAudio: Partial<Record<AppSoundName, HTMLAudioElement>> = {};

        (Object.entries(SOUND_URLS) as [AppSoundName, string][]).forEach(([soundName, soundUrl]) => {
            const audio = new Audio(soundUrl);
            audio.preload = 'auto';
            audio.volume = volumeRef.current / 100;
            preloadedAudio[soundName] = audio;
        });

        preloadedAudioRef.current = preloadedAudio;

        return () => {
            Object.values(preloadedAudio).forEach((audio) => {
                if (!audio) {
                    return;
                }

                audio.pause();
                audio.currentTime = 0;
            });
            preloadedAudioRef.current = {};
        };
    }, []);

    useEffect(() => {
        Object.values(preloadedAudioRef.current).forEach((audio) => {
            if (!audio) {
                return;
            }

            audio.volume = volume / 100;
        });
    }, [volume]);

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

        const sourceAudio = preloadedAudioRef.current[soundName];
        const playbackAudio = new Audio(sourceAudio?.src ?? SOUND_URLS[soundName]);
        playbackAudio.volume = volumeRef.current / 100;

        void playbackAudio.play().catch((error) => {
            console.warn(`Error playing sound ${soundName}:`, error);
        });
    }, []);

    return {
        volume,
        setVolume,
        isMuted,
        setIsMuted,
        playSound
    };
};
