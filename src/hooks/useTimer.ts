import { useState, useEffect, useCallback } from 'react';

export interface TimerState {
    timeLeft: number;
    isRunning: boolean;
}

export interface TimerActions {
    startTimer: () => void;
    stopTimer: () => void;
    resetTimer: (time?: number) => void;
}

export function useTimer(initialTime: number = 60): [TimerState, TimerActions] {
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isRunning && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isRunning, timeLeft]);

    const startTimer = useCallback(() => {
        setIsRunning(true);
    }, []);

    const stopTimer = useCallback(() => {
        setIsRunning(false);
    }, []);

    const resetTimer = useCallback((time?: number) => {
        setTimeLeft(time || initialTime);
        setIsRunning(false);
    }, [initialTime]);

    return [
        { timeLeft, isRunning },
        { startTimer, stopTimer, resetTimer }
    ];
}
