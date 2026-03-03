/**
 * useAudio — Manages Tone.js piano sampler for note playback.
 * Supports single notes, chords, melodies, and rhythm patterns.
 */

import { useCallback, useRef, useState } from 'react';
import * as Tone from 'tone';

export function useAudio() {
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const synthRef = useRef<Tone.PolySynth | null>(null);

    const init = useCallback(async () => {
        if (isReady) return;
        await Tone.start();
        synthRef.current = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.8 },
            volume: -6,
        }).toDestination();
        setIsReady(true);
    }, [isReady]);

    const playNote = useCallback(
        async (note: string, duration: string = '4n') => {
            await init();
            if (!synthRef.current) return;
            setIsPlaying(true);
            synthRef.current.triggerAttackRelease(note, duration);
            const ms = Tone.Time(duration).toMilliseconds();
            setTimeout(() => setIsPlaying(false), ms);
        },
        [init]
    );

    const playChord = useCallback(
        async (notes: string[], duration: string = '2n') => {
            await init();
            if (!synthRef.current) return;
            setIsPlaying(true);
            synthRef.current.triggerAttackRelease(notes, duration);
            const ms = Tone.Time(duration).toMilliseconds();
            setTimeout(() => setIsPlaying(false), ms);
        },
        [init]
    );

    const playMelody = useCallback(
        async (notes: string[], noteDuration: number = 0.6) => {
            await init();
            if (!synthRef.current) return;
            setIsPlaying(true);
            const now = Tone.now();
            notes.forEach((note, i) => {
                synthRef.current!.triggerAttackRelease(note, '4n', now + i * noteDuration);
            });
            setTimeout(() => setIsPlaying(false), notes.length * noteDuration * 1000);
        },
        [init]
    );

    const playRhythm = useCallback(
        async (beatTimesMs: number[], note: string = 'C5') => {
            await init();
            if (!synthRef.current) return;
            setIsPlaying(true);
            const now = Tone.now();
            beatTimesMs.forEach((time) => {
                synthRef.current!.triggerAttackRelease(note, '16n', now + time / 1000);
            });
            const total = Math.max(...beatTimesMs) + 200;
            setTimeout(() => setIsPlaying(false), total);
        },
        [init]
    );

    const playClick = useCallback(async () => {
        await init();
        if (!synthRef.current) return;
        synthRef.current.triggerAttackRelease('G5', '32n');
    }, [init]);

    return { isReady, isPlaying, init, playNote, playChord, playMelody, playRhythm, playClick };
}
