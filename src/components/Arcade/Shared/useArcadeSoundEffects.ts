import { useCallback, useRef } from 'react';

import { useSound } from '@/contexts/sound/useSound';

import { getArcadeSoundName, getArcadeSoundThrottleMs, type ArcadeSoundEvent } from './arcadeSoundModel';

export const useArcadeSoundEffects = () => {
    const { playSound } = useSound();
    const lastPlayedAtRef = useRef<Partial<Record<ArcadeSoundEvent, number>>>({});

    const playArcadeSound = useCallback((event: ArcadeSoundEvent) => {
        const now = Date.now();
        const lastPlayedAt = lastPlayedAtRef.current[event] ?? 0;
        const throttleMs = getArcadeSoundThrottleMs(event);

        if (now - lastPlayedAt < throttleMs) {
            return;
        }

        lastPlayedAtRef.current[event] = now;
        playSound(getArcadeSoundName(event));
    }, [playSound]);

    return { playArcadeSound };
};
