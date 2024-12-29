import { useState, useEffect, useCallback } from 'react';
import { playSound } from '../utils/soundPlayer';

interface TimerState {
    timeLeft: number;
    isRunning: boolean;
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
        isRunning: false
    });

    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (state.isRunning && state.timeLeft > 0) {
            timer = setInterval(() => {
                setState(prev => {
                    const newTimeLeft = prev.timeLeft - 1;
                    
                    // Son 5 saniye uyarısı
                    if (newTimeLeft <= 5 && newTimeLeft > 0) {
                        playSound('timeWarning');
                    }
                    
                    // Süre bitti
                    if (newTimeLeft === 0) {
                        playSound('timeout');
                        onTimeout();
                    }

                    return {
                        ...prev,
                        timeLeft: newTimeLeft,
                        isRunning: newTimeLeft > 0
                    };
                });
            }, 1000);
        }

        return () => clearInterval(timer);
    }, [state.isRunning, onTimeout]);

    const startTimer = useCallback(() => {
        setState(prev => ({ ...prev, isRunning: true }));
    }, []);

    const stopTimer = useCallback(() => {
        setState(prev => ({ ...prev, isRunning: false }));
    }, []);

    const resetTimer = useCallback((newTime: number = initialTime) => {
        setState({
            timeLeft: newTime,
            isRunning: false
        });
    }, [initialTime]);

    const formatTime = useCallback((time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    const actions: TimerActions = {
        startTimer,
        stopTimer,
        resetTimer,
        formatTime
    };

    return [state, actions];
};
