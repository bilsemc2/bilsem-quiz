import { createContext, useRef, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import * as Tone from 'tone';

interface AudioContextType {
    playNote: (noteInput: string, duration?: string | number, time?: number) => void;
    getAudioContext: () => Tone.BaseContext | null;
    startAudioContext: () => Promise<boolean>;
    isSamplerReady: boolean;
    isLoading: boolean;
    loadingProgress: number;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const AVAILABLE_SAMPLES: Record<string, string> = {
    'C1': 'C1vL.mp3', 'C2': 'C2vL.mp3', 'C3': 'C3vL.mp3', 'C4': 'C4vL.mp3',
    'C5': 'C5vL.mp3', 'C6': 'C6vL.mp3', 'C7': 'C7vL.mp3', 'C8': 'C8vL.mp3',
    'D1': 'D1vL.mp3', 'D2': 'D2vL.mp3', 'D3': 'D3vL.mp3', 'D4': 'D4vL.mp3',
    'D5': 'D5vL.mp3', 'D6': 'D6vL.mp3', 'D7': 'D7vL.mp3',
    'F1': 'F1vL.mp3', 'F2': 'F2vL.mp3', 'F3': 'F3vL.mp3', 'F4': 'F4vL.mp3',
    'F5': 'F5vL.mp3', 'F6': 'F6vL.mp3', 'F7': 'F7vL.mp3',
    'A0': 'A0vL.mp3', 'A1': 'A1vL.mp3', 'A2': 'A2vL.mp3', 'A3': 'A3vL.mp3',
    'A4': 'A4vL.mp3', 'A5': 'A5vL.mp3', 'A6': 'A6vL.mp3', 'A7': 'A7vL.mp3',
    'B0': 'B0vH.mp3', 'B1': 'B1vH.mp3', 'B2': 'B2vH.mp3', 'B3': 'B3vH.mp3',
    'B4': 'B4vH.mp3', 'B5': 'B5vH.mp3', 'B6': 'B6vH.mp3', 'B7': 'B7vH.mp3'
};

export function AudioProvider({ children }: { children: ReactNode }) {
    const samplerRef = useRef<Tone.Sampler | null>(null);
    const [isSamplerReady, setIsSamplerReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);

    const startAudioContext = useCallback(async () => {
        if (isSamplerReady || isLoading) return true;

        try {
            setIsLoading(true);
            console.log("[Audio Provider] Activating AudioContext and loading samples...");

            await Tone.start();

            if (Tone.context.state === 'suspended') {
                await Tone.context.resume();
            }

            return new Promise<boolean>((resolve) => {
                const sampler = new Tone.Sampler({
                    urls: AVAILABLE_SAMPLES,
                    baseUrl: "/samples/piano/",
                    onload: () => {
                        console.log("[Audio Provider] Sampler ready");
                        setIsSamplerReady(true);
                        setIsLoading(false);
                        setLoadingProgress(100);
                        resolve(true);
                    },
                    onerror: (err) => {
                        console.error("[Audio Provider] Sampler error:", err);
                        setIsLoading(false);
                        resolve(false);
                    }
                }).toDestination();

                samplerRef.current = sampler;
            });
        } catch (error) {
            console.error("Audio Context Activation Error:", error);
            setIsLoading(false);
            return false;
        }
    }, [isSamplerReady, isLoading]);

    useEffect(() => {
        return () => {
            if (samplerRef.current) {
                samplerRef.current.dispose();
            }
        };
    }, []);

    const playNote = useCallback((noteInput: string, duration: string | number = "4n", time?: number) => {
        if (!isSamplerReady || !samplerRef.current) {
            console.warn('Sampler not ready, cannot play note:', noteInput);
            return;
        }

        try {
            const startTime = time || Tone.now();

            if (typeof noteInput === 'string') {
                samplerRef.current.triggerAttackRelease(noteInput, duration, startTime);
                console.log(`[Playback] Playing ${noteInput} at ${startTime.toFixed(3)}s for ${duration}s`);
            }
        } catch (error) {
            console.error(`Nota çalma hatası ${noteInput}:`, error);
        }
    }, [isSamplerReady]);

    const getAudioContext = useCallback(() => {
        if (Tone.context && Tone.context.state !== 'closed') {
            return Tone.context;
        }
        return null;
    }, []);

    return (
        <AudioContext.Provider value={{
            playNote,
            getAudioContext,
            startAudioContext,
            isSamplerReady,
            isLoading,
            loadingProgress
        }}>
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error('useAudio hook must be used within an AudioProvider');
    }
    return context;
}
