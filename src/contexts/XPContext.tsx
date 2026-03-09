import React from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { XPContext } from '@/contexts/xp/xpContext';
import { useTimedXPController } from '@/hooks/useTimedXPController';

export const XPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading, refreshProfile } = useAuth();
    const controller = useTimedXPController({
        userId: user?.id,
        enabled: Boolean(user) && !loading,
        onTimedXPGain: refreshProfile
    });

    return (
        <XPContext.Provider value={controller}>
            {children}
        </XPContext.Provider>
    );
};
