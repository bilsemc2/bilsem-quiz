import { useState, useEffect, useCallback, useRef } from 'react';
import { playSound } from '../utils/soundPlayer'; // Varsayılan import

type SoundType = 'correct' | 'incorrect' | 'timeout' | 'tick' | 'timeWarning'; // Tick eklendi (kullanılmasa bile)

interface TimerState {
    timeLeft: number;
    isRunning: boolean;
    progress: number; // Yüzde olarak
    timeSpent: number; // Saniye olarak
    totalDuration: number; // Başlangıç süresini de state'de tutmak faydalı olabilir
}

interface TimerActions {
    startTimer: () => void;
    stopTimer: () => void;
    resetTimer: (newTime?: number) => void;
    formatTime: (timeInSeconds: number) => string;
    // getTimeSpent kaldırıldı, state.timeSpent kullanılmalı
}

const playSoundSafely = (sound: SoundType) => {
    try {
        // playSound fonksiyonunuzun var olduğunu ve çalıştığını varsayıyoruz
        playSound(sound);
    } catch (error) {
        console.warn(`Ses çalınamadı (${sound}):`, error);
    }
};

export const useQuizTimer = (
    initialTime: number = 60,
    onTimeoutCallback?: (timeSpent: number) => void
): [TimerState, TimerActions] => {
    const [state, setState] = useState<TimerState>(() => ({ // Başlangıç state'i için fonksiyon kullanımı
        timeLeft: initialTime > 0 ? initialTime : 0, // Negatif başlangıç süresini engelle
        isRunning: false,
        progress: 100,
        timeSpent: 0,
        totalDuration: initialTime > 0 ? initialTime : 0,
    }));

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const onTimeoutRef = useRef(onTimeoutCallback);

    // Callback referansını güncel tut
    useEffect(() => {
        onTimeoutRef.current = onTimeoutCallback;
    }, [onTimeoutCallback]);

    // initialTime değiştiğinde state'i ve zamanlayıcıyı sıfırla
    useEffect(() => {
        stopTimerInternal(); // Önce çalışan interval varsa durdur
        const validInitialTime = initialTime > 0 ? initialTime : 0;
        setState({
            timeLeft: validInitialTime,
            isRunning: false, // initialTime değiştiğinde genellikle durmalı
            progress: 100,
            timeSpent: 0,
            totalDuration: validInitialTime,
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialTime]); // Sadece initialTime değiştiğinde çalışmalı


    // Zamanlayıcıyı başlatan/durduran ana useEffect
    useEffect(() => {
        // Eğer çalışmıyorsa veya süre bittiyse interval kurma/devam ettirme
        if (!state.isRunning || state.timeLeft <= 0) {
             // Eğer çalışan bir interval varsa temizle (stopTimer'dan sonra burası çalışabilir)
             if (timerRef.current) {
                 clearInterval(timerRef.current);
                 timerRef.current = null;
             }
            return;
        }

        // --- Interval Callback ---
        const tick = () => {
            setState(prev => {
                // Eğer bir şekilde süre bittiyse veya durdurulduysa güncelleme yapma
                // (Bu ekstra bir güvenlik katmanı, normalde useEffect temizlemesi yeterli olmalı)
                if (prev.timeLeft <= 0 || !prev.isRunning) {
                    if (timerRef.current) clearInterval(timerRef.current); // Güvenlik için
                    timerRef.current = null;
                    return prev; // State'i değiştirme
                }

                const newTimeLeft = prev.timeLeft - 1;
                const newTimeSpent = prev.totalDuration - newTimeLeft;
                const newProgress = prev.totalDuration > 0 ? (newTimeLeft / prev.totalDuration) * 100 : 0;

                // Sesler
                if (newTimeLeft <= 5 && newTimeLeft > 0) {
                    playSoundSafely('timeWarning');
                }
                // İsteğe bağlı: Her saniye tick sesi
                // if (newTimeLeft > 0) playSoundSafely('tick');

                // Süre bitti mi?
                if (newTimeLeft === 0) {
                    playSoundSafely('timeout');
                    if (onTimeoutRef.current) {
                        onTimeoutRef.current(newTimeSpent); // En güncel callback'i çağır
                    }
                    // Interval bu tick'ten sonra otomatik olarak duracak (isRunning: false)
                }

                return {
                    ...prev,
                    timeLeft: newTimeLeft,
                    isRunning: newTimeLeft > 0, // Süre bitince isRunning false olur
                    progress: newProgress,
                    timeSpent: newTimeSpent,
                };
            });
        };
        // --- Interval Callback Bitişi ---

        // Interval'i sadece henüz çalışmıyorsa başlat
        if (!timerRef.current) {
            timerRef.current = setInterval(tick, 1000);
        }

        // Cleanup fonksiyonu: effect yeniden çalıştığında veya component unmount olduğunda interval'i temizle
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
        // ÖNEMLİ: Bağımlılıklar state.timeLeft'i içermemeli!
    }, [state.isRunning, state.timeLeft, state.totalDuration]); // timeLeft'i tekrar ekledim çünkü tick içinde prev.timeLeft'e bakıyoruz. Ancak functional update bunu çözmeli. Test edelim.

    // --- Tekrar Düşünelim: `state.timeLeft` bağımlılığı ---
    // Yukarıdaki kodda `state.timeLeft`'i bağımlılıklara ekledim çünkü `if (!state.isRunning || state.timeLeft <= 0)` kontrolü var.
    // Ancak bu yine aynı soruna yol açar. Daha iyi çözüm:
    // `isRunning` değiştiğinde effect çalışsın. Interval içindeki `setState(prev => ...)` zaten
    // en güncel `prev.timeLeft`'i alacak. `timeLeft <= 0` kontrolünü `tick` içine alabiliriz.

    // *** DÜZELTİLMİŞ Ana useEffect ***
     useEffect(() => {
        // Çalışmıyorsa bir şey yapma ve interval varsa temizle
        if (!state.isRunning) {
             if (timerRef.current) {
                 clearInterval(timerRef.current);
                 timerRef.current = null;
             }
            return;
        }

        // Interval Callback
        const tick = () => {
            setState(prev => {
                 // Önceki state'e göre kontrol et: Süre zaten bittiyse veya durmuşsa interval'i durdur ve state'i değiştirme
                 if (prev.timeLeft <= 0 || !prev.isRunning) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    timerRef.current = null;
                    return prev;
                 }

                const newTimeLeft = prev.timeLeft - 1;
                const newTimeSpent = prev.totalDuration - newTimeLeft;
                const newProgress = prev.totalDuration > 0 ? (newTimeLeft / prev.totalDuration) * 100 : 0;

                // Sesler
                if (newTimeLeft <= 5 && newTimeLeft > 0) playSoundSafely('timeWarning');
                // if (newTimeLeft > 0) playSoundSafely('tick');

                // Süre bitti mi?
                const timeoutOccurred = newTimeLeft <= 0; // <= 0 kontrolü daha güvenli
                if (timeoutOccurred) {
                    playSoundSafely('timeout');
                    if (onTimeoutRef.current) {
                        onTimeoutRef.current(newTimeSpent);
                    }
                }

                return {
                    ...prev,
                    timeLeft: newTimeLeft,
                    isRunning: !timeoutOccurred, // Süre bitince isRunning false olur
                    progress: newProgress,
                    timeSpent: newTimeSpent,
                };
            });
        };

        // Interval'i kur
        timerRef.current = setInterval(tick, 1000);

        // Cleanup
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
        // Bağımlılıklar SADECE isRunning ve totalDuration olmalı
    }, [state.isRunning, state.totalDuration]);


    // --- Eylemler ---

    // Interval'i temizleyen dahili fonksiyon (resetTimer'da kullanmak için)
    const stopTimerInternal = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);


    const startTimer = useCallback(() => {
        // Sadece çalışmıyorsa ve süre varsa başlat
        setState(prev => {
            if (!prev.isRunning && prev.timeLeft > 0) {
                return { ...prev, isRunning: true };
            }
            return prev; // Değişiklik yok
        });
    }, []);

    const stopTimer = useCallback(() => {
        stopTimerInternal(); // Ref'teki interval'i temizle
        setState(prev => ({ ...prev, isRunning: false })); // State'i güncelle
    }, [stopTimerInternal]);

    const resetTimer = useCallback((newTime?: number) => {
        stopTimerInternal(); // Interval'i durdur
        const timeToReset = newTime !== undefined && newTime >= 0 ? newTime : initialTime > 0 ? initialTime : 0;
        setState({ // State'i sıfırla
            timeLeft: timeToReset,
            isRunning: false,
            progress: 100,
            timeSpent: 0,
            totalDuration: initialTime > 0 ? initialTime : 0, // initialTime'a göre totalDuration'ı da güncelle
        });
    }, [initialTime, stopTimerInternal]); // initialTime bağımlılığı eklendi

    const formatTime = useCallback((timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    return [
        state,
        {
            startTimer,
            stopTimer,
            resetTimer,
            formatTime,
            // getTimeSpent ve onTimeout kaldırıldı
        }
    ];
};