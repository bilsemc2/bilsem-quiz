import React, { createContext, useContext, useEffect, useState } from 'react';
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
    const { user, handleXPGain } = useAuth();
    const [secondsActive, setSecondsActive] = useState(() => {
        const saved = localStorage.getItem('xp_seconds_active');
        return saved ? parseInt(saved, 10) : 0;
    });
    const [lastXPGainAt, setLastXPGainAt] = useState(() => {
        const saved = localStorage.getItem('xp_last_gain_at');
        return saved ? parseInt(saved, 10) : 0;
    });
    const XP_INTERVAL = 60;

    useEffect(() => {
        if (!user) {
            setSecondsActive(0);
            return;
        }

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
    }, [user]);

    // Save secondsActive and lastXPGainAt to localStorage
    useEffect(() => {
        if (user) {
            localStorage.setItem('xp_seconds_active', secondsActive.toString());
            localStorage.setItem('xp_last_gain_at', lastXPGainAt.toString());
        }
    }, [secondsActive, lastXPGainAt, user]);

    // Side effect to handle XP gain when secondsActive resets to 0
    useEffect(() => {
        if (secondsActive === 0 && user && lastXPGainAt > 0) {
            const now = Date.now();
            // 50 saniyeden fazla geçmişse (tolerans payı ile 1 dakikayı temsil eder)
            if (now - lastXPGainAt > 50000) {
                if (handleXPGain) {
                    handleXPGain();
                    setLastXPGainAt(now);
                }
            }
        }
    }, [secondsActive, user, handleXPGain, lastXPGainAt]);

    return (
        <XPContext.Provider value={{ secondsActive, lastXPGainAt }}>
            {children}
        </XPContext.Provider>
    );
};

export const useXP = () => useContext(XPContext);
