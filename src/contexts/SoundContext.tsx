import React, { createContext, useContext, useState, useEffect } from 'react';

interface SoundContextType {
    volume: number;
    setVolume: (volume: number) => void;
    isMuted: boolean;
    setIsMuted: (muted: boolean) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [volume, setVolume] = useState(() => {
        const savedVolume = localStorage.getItem('quizSoundVolume');
        return savedVolume ? Number(savedVolume) : 50;
    });
    
    const [isMuted, setIsMuted] = useState(() => {
        const savedMuted = localStorage.getItem('quizSoundMuted');
        return savedMuted ? savedMuted === 'true' : false;
    });

    useEffect(() => {
        localStorage.setItem('quizSoundVolume', volume.toString());
    }, [volume]);

    useEffect(() => {
        localStorage.setItem('quizSoundMuted', isMuted.toString());
    }, [isMuted]);

    return (
        <SoundContext.Provider value={{ volume, setVolume, isMuted, setIsMuted }}>
            {children}
        </SoundContext.Provider>
    );
};

export const useSound = () => {
    const context = useContext(SoundContext);
    if (context === undefined) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
};
