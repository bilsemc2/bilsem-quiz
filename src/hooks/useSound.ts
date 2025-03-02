import { useCallback, useEffect, useRef } from 'react';

type SoundType = 'correct' | 'incorrect' | 'tick' | 'timeWarning';

const SOUND_URLS = {
    correct: '/sounds/correct.mp3',
    incorrect: '/sounds/incorrect.mp3',
    tick: '/sounds/tick.mp3',
    timeWarning: '/sounds/time-warning.mp3',
};

export const useSound = () => {
    const audioRefs = useRef<{ [key in SoundType]?: HTMLAudioElement }>({});

    useEffect(() => {
        // Preload all sounds
        Object.entries(SOUND_URLS).forEach(([key, url]) => {
            const audio = new Audio(url);
            audio.preload = 'auto';
            audioRefs.current[key as SoundType] = audio;
        });

        // Cleanup
        return () => {
            Object.values(audioRefs.current).forEach(audio => {
                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
        };
    }, []);

    const playSound = useCallback((type: SoundType) => {
        const audio = audioRefs.current[type];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(error => {
                console.warn(`Error playing sound: ${error}`);
            });
        }
    }, []);

    return { playSound };
};
