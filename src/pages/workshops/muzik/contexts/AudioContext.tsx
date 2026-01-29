
import React, { createContext, useRef, useCallback, useContext, useState, ReactNode } from 'react';
import * as Tone from 'tone';

interface AudioContextType {
    playNote: (note: string, duration?: string | number) => void;
    startAudioContext: () => Promise<boolean>;
    isSamplerReady: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isSamplerReady, setIsSamplerReady] = useState(false);
    const synthRef = useRef<Tone.Synth | null>(null);

    const startAudioContext = useCallback(async () => {
        await Tone.start();
        if (!synthRef.current) {
            synthRef.current = new Tone.Synth().toDestination();
        }
        setIsSamplerReady(true);
        console.log("Tone.js ses bağlamı başlatıldı.");
        return true;
    }, []);

    const playNote = useCallback((note: string, duration: string | number = "4n") => {
        if (!synthRef.current) return;
        synthRef.current.triggerAttackRelease(note, duration);
    }, []);

    return (
        <AudioContext.Provider value={{ playNote, startAudioContext, isSamplerReady }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) throw new Error("useAudio must be used within AudioProvider");
    return context;
};
