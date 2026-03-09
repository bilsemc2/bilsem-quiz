import React from 'react';
import { SoundContext } from '@/contexts/sound/soundContext';
import { useSoundController } from '@/hooks/useSoundController';

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const controller = useSoundController();

    return (
        <SoundContext.Provider value={controller}>
            {children}
        </SoundContext.Provider>
    );
};
