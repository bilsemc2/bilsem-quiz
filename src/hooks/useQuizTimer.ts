import { useState, useEffect, useCallback } from 'react';
import { playSound } from '../utils/soundPlayer';

interface TimerState {
    timeLeft: number;
    isRunning: boolean;
    progress: number;
}

interface TimerActions {
    startTimer: () => void;
    stopTimer: () => void;
    resetTimer: (newTime?: number) => void;
    formatTime: (time: number) => string;
}

export const useQuizTimer = (
    initialTime: number = 60,
    onTimeout: () => void
): [TimerState, TimerActions] => {
    const [state, setState] = useState<TimerState>({
        timeLeft: initialTime,
        isRunning: false,
        progress: 100
    });

    useEffect(() => {
        setState(prev => ({
            ...prev,
            timeLeft: initialTime,
            progress: 100
        }));
    }, [initialTime]);

    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (state.isRunning && state.timeLeft > 0) {
            timer = setInterval(() => {
                setState(prev => {
                    const newTimeLeft = prev.timeLeft - 1;
                    const newProgress = (newTimeLeft / initialTime) * 100;

                    // Son 5 saniye uyarısı
                    if (newTimeLeft <= 5 && newTimeLeft > 0) {
                        playSound('timeWarning');
                    }

                    return {
                        ...prev,
                        timeLeft: newTimeLeft,
                        isRunning: newTimeLeft > 0,
                        progress: newProgress
                    };
                });

                // Süre bitti
                if (state.timeLeft === 1) {
                    playSound('timeout');
                    onTimeout();
                }
            }, 1000);
        }

        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [state.isRunning, state.timeLeft, onTimeout, initialTime]);

    const startTimer = useCallback(() => {
        setState(prev => ({ ...prev, isRunning: true }));
    }, []);

    const stopTimer = useCallback(() => {
        setState(prev => ({ ...prev, isRunning: false }));
    }, []);

    const resetTimer = useCallback((newTime: number = initialTime) => {
        setState({
            timeLeft: newTime,
            isRunning: false,
            progress: 100
        });
    }, [initialTime]);

    const formatTime = useCallback((time: number): string => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    return [
        state,
        { startTimer, stopTimer, resetTimer, formatTime }
    ];
};