import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

interface XPContextType {
    secondsActive: number;
    lastXPGainAt: number;
}

const XPContext = createContext<XPContextType>({
    secondsActive: 0,
    lastXPGainAt: 0,
});

export const XPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, handleXPGain, loading } = useAuth();

    // Sayaç durumu (0-59)
    const [secondsActive, setSecondsActive] = useState(() => {
        const saved = localStorage.getItem('xp_seconds_active');
        return saved ? Math.min(parseInt(saved, 10), 59) : 0;
    });

    // En son XP kazanma zamanı (Unix timestamp)
    const [lastXPGainAt, setLastXPGainAt] = useState(() => {
        const saved = localStorage.getItem('xp_last_gain_at');
        if (saved) return parseInt(saved, 10);

        // Eğer kayıtlı bir zaman yoksa, mevcut 'ilerlemeyi' (secondsActive) 
        // hesaba katarak geçmişe yönelik bir başlangıç zamanı oluşturur.
        // Bu sayede sayfa açıldığında 50. saniyedeyse, son kazanım 50sn önce yapılmış gibi görünür.
        const initialSeconds = parseInt(localStorage.getItem('xp_seconds_active') || '0', 10);
        return Date.now() - (initialSeconds * 1000);
    });

    const XP_INTERVAL = 60;
    const prevSeconds = useRef(secondsActive);

    // Her saniye sayacı artır
    useEffect(() => {
        if (loading || !user) return;

        const timer = setInterval(() => {
            setSecondsActive((prev) => {
                const next = prev + 1;
                if (next >= XP_INTERVAL) {
                    return 0;
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [user, loading]);

    // XP Kazanım Takibi
    useEffect(() => {
        if (loading || !user) return;

        // Sayaç 59'dan 0'a geçtiğinde veya 0 olduğunda ve üzerinden yeterli süre geçtiğinde...
        if (secondsActive === 0 && prevSeconds.current !== 0) {
            const now = Date.now();
            const timeSinceLastGain = now - lastXPGainAt;

            // Güvenlik: 45 saniyeden önce tekrar XP vermeyi engelle (drift/lag payı ile)
            if (timeSinceLastGain > 45000) {
                if (handleXPGain) {
                    console.log(`[XP] Cycle Complete. Gaining XP. Interval: ${timeSinceLastGain / 1000}s`);
                    handleXPGain();
                    setLastXPGainAt(now);
                }
            } else {
                console.log(`[XP] Cycle Skip. Too frequent: ${timeSinceLastGain / 1000}s`);
            }
        }

        prevSeconds.current = secondsActive;
    }, [secondsActive, user, loading, handleXPGain, lastXPGainAt]);

    // Durumu localStorage'a kaydet
    useEffect(() => {
        if (user && !loading) {
            localStorage.setItem('xp_seconds_active', secondsActive.toString());
            localStorage.setItem('xp_last_gain_at', lastXPGainAt.toString());
        }
    }, [secondsActive, lastXPGainAt, user, loading]);

    return (
        <XPContext.Provider value={{ secondsActive, lastXPGainAt }}>
            {children}
        </XPContext.Provider>
    );
};

export const useXP = () => useContext(XPContext);
