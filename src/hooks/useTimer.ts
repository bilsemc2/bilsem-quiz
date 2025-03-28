import { useState, useEffect, useCallback, useRef } from 'react';

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
    // Temel state'ler
    const [timeLeft, setTimeLeft] = useState<number>(initialTime);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    
    // Referanslar
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const pausedTimeRef = useRef<number>(initialTime);
    
    // Zamanlayıcıyı temizle
    const clearTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);
    
    // Zamanlayıcıyı başlat
    const startTimer = useCallback(() => {
        if (timeLeft <= 0) return;
        
        // Zaten çalışıyorsa tekrar başlatma
        if (isRunning) return;
        
        // Şu anki zamanı kaydet
        startTimeRef.current = Date.now();
        setIsRunning(true);
    }, [timeLeft, isRunning]);
    
    // Zamanlayıcıyı durdur
    const stopTimer = useCallback(() => {
        if (!isRunning) return;
        
        clearTimer();
        pausedTimeRef.current = timeLeft;
        setIsRunning(false);
    }, [isRunning, timeLeft, clearTimer]);
    
    // Zamanlayıcıyı sıfırla
    const resetTimer = useCallback((time?: number) => {
        clearTimer();
        const newTime = time !== undefined ? time : initialTime;
        pausedTimeRef.current = newTime;
        setTimeLeft(newTime);
        setIsRunning(false);
    }, [initialTime, clearTimer]);
    
    // Ana zamanlayıcı efekti
    useEffect(() => {
        if (!isRunning) return;
        
        clearTimer();
        
        // Her 100ms'de bir güncelle (daha hassas sayaç için)
        intervalRef.current = setInterval(() => {
            const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const newTimeLeft = Math.max(0, pausedTimeRef.current - elapsedSeconds);
            
            setTimeLeft(newTimeLeft);
            
            // Süre bittiyse durdur
            if (newTimeLeft <= 0) {
                clearTimer();
                setIsRunning(false);
            }
        }, 100); // 100ms aralıkla güncelleme daha akıcı bir deneyim sağlar
        
        return clearTimer;
    }, [isRunning, clearTimer]);
    
    return [
        { timeLeft, isRunning },
        { startTimer, stopTimer, resetTimer }
    ];
}
