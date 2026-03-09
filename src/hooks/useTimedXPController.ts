import { useEffect, useRef, useState } from 'react';
import { performXPTransaction } from '@/features/xp/model/xpUseCases';
import {
    createTimedXPState,
    getNextTimedXPSeconds,
    readTimedXPStateFromStorage,
    shouldGrantTimedXP,
    writeTimedXPStateToStorage
} from '@/features/xp/model/timedXPSessionModel';
import type { XPContextValue } from '@/contexts/xp/xpContext';

interface UseTimedXPControllerOptions {
    userId?: string;
    enabled: boolean;
    onTimedXPGain?: () => Promise<void>;
}

const canUseLocalStorage = () => (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
);

const readStoredTimedXPState = () => {
    if (!canUseLocalStorage()) {
        return createTimedXPState({
            storedSecondsActive: null,
            storedLastXPGainAt: null
        });
    }

    return readTimedXPStateFromStorage(window.localStorage);
};

export const useTimedXPController = ({
    userId,
    enabled,
    onTimedXPGain
}: UseTimedXPControllerOptions): XPContextValue => {
    const initialStateRef = useRef(readStoredTimedXPState());
    const [secondsActive, setSecondsActive] = useState(initialStateRef.current.secondsActive);
    const [lastXPGainAt, setLastXPGainAt] = useState(initialStateRef.current.lastXPGainAt);
    const previousSecondsRef = useRef(secondsActive);

    useEffect(() => {
        if (!enabled || !userId) {
            return;
        }

        const timerId = window.setInterval(() => {
            setSecondsActive((currentSeconds) => getNextTimedXPSeconds(currentSeconds));
        }, 1000);

        return () => {
            window.clearInterval(timerId);
        };
    }, [enabled, userId]);

    useEffect(() => {
        if (!enabled || !userId) {
            previousSecondsRef.current = secondsActive;
            return;
        }

        const now = Date.now();
        if (!shouldGrantTimedXP({
            secondsActive,
            previousSecondsActive: previousSecondsRef.current,
            lastXPGainAt,
            now
        })) {
            previousSecondsRef.current = secondsActive;
            return;
        }

        let isCancelled = false;

        const grantTimedXP = async () => {
            const result = await performXPTransaction({
                action: 'gain',
                amount: 1,
                reason: 'Zaman bazlı XP'
            });

            if (isCancelled) {
                return;
            }

            if (!result.success) {
                if (result.status !== 429) {
                    console.error('Timed XP gain failed:', result.error);
                }
                return;
            }

            setLastXPGainAt(now);

            if (!onTimedXPGain) {
                return;
            }

            try {
                await onTimedXPGain();
            } catch (error) {
                console.error('Timed XP profile refresh failed:', error);
            }
        };

        void grantTimedXP();
        previousSecondsRef.current = secondsActive;

        return () => {
            isCancelled = true;
        };
    }, [enabled, userId, secondsActive, lastXPGainAt, onTimedXPGain]);

    useEffect(() => {
        if (!enabled || !userId || !canUseLocalStorage()) {
            return;
        }

        writeTimedXPStateToStorage(window.localStorage, {
            secondsActive,
            lastXPGainAt
        });
    }, [enabled, userId, secondsActive, lastXPGainAt]);

    return {
        secondsActive,
        lastXPGainAt
    };
};
