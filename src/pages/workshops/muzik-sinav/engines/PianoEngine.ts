/**
 * PianoEngine — High-fidelity piano synthesis using Tone.js Sampler.
 *
 * Uses Salamander Grand Piano samples from a public CDN for realistic sound.
 * Falls back to Tone.PolySynth(FMSynth) if samples fail to load.
 */

import * as Tone from 'tone';

// Salamander Grand Piano — free CC-BY samples (subset of keys, Tone.js interpolates the rest)
const PIANO_SAMPLES_BASE = 'https://tonejs.github.io/audio/salamander/';
const SAMPLE_MAP: Record<string, string> = {
    A0: 'A0.mp3', C1: 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3',
    A1: 'A1.mp3', C2: 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
    A2: 'A2.mp3', C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
    A3: 'A3.mp3', C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
    A4: 'A4.mp3', C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
    A5: 'A5.mp3', C6: 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3',
    A6: 'A6.mp3', C7: 'C7.mp3', 'D#7': 'Ds7.mp3',
    A7: 'A7.mp3', C8: 'C8.mp3',
};

export class PianoEngine {
    private instrument: Tone.Sampler | Tone.PolySynth | null = null;
    private _ready = false;
    private _loading = false;
    private _usingSampler = false;

    get isReady(): boolean {
        return this._ready;
    }

    get isLoading(): boolean {
        return this._loading;
    }

    /**
     * Initialize the piano — loads samples from CDN.
     * Falls back to PolySynth if loading fails.
     */
    async init(): Promise<void> {
        if (this._ready || this._loading) return;
        this._loading = true;

        await Tone.start();

        try {
            const sampler = await new Promise<Tone.Sampler>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Sample load timeout')), 10000);
                const s = new Tone.Sampler({
                    urls: SAMPLE_MAP,
                    baseUrl: PIANO_SAMPLES_BASE,
                    release: 1,
                    onload: () => {
                        clearTimeout(timeout);
                        resolve(s);
                    },
                    onerror: (err) => {
                        clearTimeout(timeout);
                        reject(err);
                    },
                }).toDestination();
            });

            this.instrument = sampler;
            this._usingSampler = true;
            console.log('[PianoEngine] 🎹 Salamander piano samples loaded');
        } catch (err) {
            console.warn('[PianoEngine] Sampler failed, using PolySynth fallback:', err);
            this.instrument = new Tone.PolySynth(Tone.FMSynth, {
                envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 1 },
                modulationIndex: 2,
                harmonicity: 3,
            }).toDestination();
            this._usingSampler = false;
        }

        this._ready = true;
        this._loading = false;
    }

    /**
     * Play a single note.
     * @param note - e.g. "C4", "A#3"
     * @param duration - seconds (default 0.5)
     */
    playNote(note: string, duration = 0.5): void {
        if (!this.instrument || !this._ready) return;
        if (this._usingSampler) {
            (this.instrument as Tone.Sampler).triggerAttackRelease(note, duration);
        } else {
            (this.instrument as Tone.PolySynth).triggerAttackRelease(note, duration);
        }
    }

    /**
     * Play a chord (multiple notes simultaneously).
     */
    playChord(notes: string[], duration = 0.8): void {
        if (!this.instrument || !this._ready) return;
        if (this._usingSampler) {
            (this.instrument as Tone.Sampler).triggerAttackRelease(notes, duration);
        } else {
            (this.instrument as Tone.PolySynth).triggerAttackRelease(notes, duration);
        }
    }

    /**
     * Play a melody — sequence of notes with individual durations.
     * Returns a Promise that resolves when the melody finishes.
     */
    async playMelody(notes: string[], durations: number[]): Promise<void> {
        if (!this.instrument || !this._ready || notes.length === 0) return;
        const now = Tone.now();
        let offset = 0;

        for (let i = 0; i < notes.length; i++) {
            const dur = durations[i] ?? 0.5;
            if (this._usingSampler) {
                (this.instrument as Tone.Sampler).triggerAttackRelease(notes[i], dur, now + offset);
            } else {
                (this.instrument as Tone.PolySynth).triggerAttackRelease(notes[i], dur, now + offset);
            }
            offset += dur + 0.05; // small gap between notes
        }

        // Wait for the entire melody to finish
        return new Promise((resolve) => setTimeout(resolve, offset * 1000));
    }

    /**
     * Play a rhythm pattern using a percussive sound.
     * @param beats - array of beat timestamps in ms
     * @param tempo - BPM
     */
    async playRhythm(beats: number[], tempo: number): Promise<void> {
        if (!this.instrument || !this._ready) return;
        void tempo;
        const now = Tone.now();
        const percNote = 'C3'; // Low percussive tone

        for (const beat of beats) {
            const t = now + beat / 1000;
            if (this._usingSampler) {
                (this.instrument as Tone.Sampler).triggerAttackRelease(percNote, 0.1, t);
            } else {
                (this.instrument as Tone.PolySynth).triggerAttackRelease(percNote, 0.1, t);
            }
        }

        const totalMs = beats.length > 0 ? beats[beats.length - 1] + 200 : 0;
        return new Promise((resolve) => setTimeout(resolve, totalMs));
    }

    /**
     * Play a metronome click pattern.
     */
    async playMetronome(tempo: number, bars: number, beatsPerBar = 4): Promise<void> {
        if (!this.instrument || !this._ready) return;
        const beatInterval = 60000 / tempo;
        const totalBeats = bars * beatsPerBar;
        const beats: number[] = [];

        for (let i = 0; i < totalBeats; i++) {
            beats.push(i * beatInterval);
        }

        // Use different notes for downbeat vs upbeat
        const now = Tone.now();
        for (let i = 0; i < totalBeats; i++) {
            const note = i % beatsPerBar === 0 ? 'G5' : 'C5';
            const dur = i % beatsPerBar === 0 ? 0.15 : 0.08;
            const t = now + beats[i] / 1000;
            if (this._usingSampler) {
                (this.instrument as Tone.Sampler).triggerAttackRelease(note, dur, t);
            } else {
                (this.instrument as Tone.PolySynth).triggerAttackRelease(note, dur, t);
            }
        }

        const totalMs = totalBeats * beatInterval;
        return new Promise((resolve) => setTimeout(resolve, totalMs));
    }

    /**
     * Clean up all audio resources.
     */
    dispose(): void {
        this.instrument?.dispose();
        this.instrument = null;
        this._ready = false;
    }
}
