import { useState, useEffect, useCallback, useRef } from 'react';
import { playSound } from '../utils/soundPlayer';

interface TimerState {
    timeLeft: number;
    isRunning: boolean;
    progress: number;
    timeSpent: number;
}

interface TimerActions {
    startTimer: () => void;
    stopTimer: () => void;
    resetTimer: (newTime?: number) => void;
    formatTime: (time: number) => string;
    getTimeSpent: () => number;
    onTimeout?: (timeSpent: number) => void;
}

const playSoundSafely = (sound: 'correct' | 'incorrect' | 'timeout' | 'tick' | 'timeWarning') => {
    try {
        playSound(sound);
    } catch (error) {
        console.warn('Ses çalınamadı:', error);
    }
};

export const useQuizTimer = (
    initialTime: number = 60,
    onTimeoutCallback?: (timeSpent: number) => void
): [TimerState, TimerActions] => {
    const [state, setState] = useState<TimerState>({
        timeLeft: initialTime,
        isRunning: false,
        progress: 100,
        timeSpent: 0
    });

    // Timer'ı ref olarak tutuyoruz
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isRunningRef = useRef(false);
    const onTimeoutRef = useRef(onTimeoutCallback);

    // onTimeout callback'ini güncelle
    useEffect(() => {
        onTimeoutRef.current = onTimeoutCallback;
    }, [onTimeoutCallback]);

    // Timer'ı başlat/durdur
    useEffect(() => {
        const updateTimer = () => {
            if (!isRunningRef.current || state.timeLeft <= 0) return;

            const newTimeLeft = state.timeLeft - 1;
            const newProgress = (newTimeLeft / initialTime) * 100;
            const newTimeSpent = initialTime - newTimeLeft;

            // Son 5 saniye uyarısı
            if (newTimeLeft <= 5 && newTimeLeft > 0) {
                playSoundSafely('timeWarning');
            }

            // Süre bitti
            if (newTimeLeft === 0) {
                playSoundSafely('timeout');
                if (onTimeoutRef.current) {
                    onTimeoutRef.current(newTimeSpent);
                }
                isRunningRef.current = false;
            }

            setState({
                timeLeft: newTimeLeft,
                isRunning: newTimeLeft > 0,
                progress: newProgress,
                timeSpent: newTimeSpent
            });
        };

        if (state.isRunning && !timerRef.current) {
            isRunningRef.current = true;
            timerRef.current = setInterval(updateTimer, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [state.isRunning, state.timeLeft, initialTime]);

    const startTimer = useCallback(() => {
        setState(prev => ({ ...prev, isRunning: true }));
    }, []);

    const stopTimer = useCallback(() => {
        isRunningRef.current = false;
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setState(prev => ({ ...prev, isRunning: false }));
    }, []);

    const resetTimer = useCallback((newTime: number = initialTime) => {
        stopTimer();
        setState({
            timeLeft: newTime,
            isRunning: false,
            progress: 100,
            timeSpent: 0
        });
    }, [initialTime, stopTimer]);

    const formatTime = useCallback((time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    const getTimeSpent = useCallback(() => state.timeSpent, [state.timeSpent]);

    return [
        state,
        {
            startTimer,
            stopTimer,
            resetTimer,
            formatTime,
            getTimeSpent,
            onTimeout: onTimeoutCallback
        }
    ];
};