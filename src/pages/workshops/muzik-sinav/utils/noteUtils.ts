/**
 * Note ↔ Frequency conversion utilities.
 * Standard tuning: A4 = 440 Hz
 */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const A4_FREQ = 440;
const A4_MIDI = 69;

/**
 * Convert a MIDI note number to frequency.
 */
export function midiToFrequency(midi: number): number {
    return A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12);
}

/**
 * Convert frequency to the nearest MIDI note number.
 */
export function frequencyToMidi(freq: number): number {
    return Math.round(12 * Math.log2(freq / A4_FREQ) + A4_MIDI);
}

/**
 * Convert a note name (e.g. "C4", "A#3") to frequency.
 */
export function noteNameToFrequency(name: string): number {
    const match = name.match(/^([A-G]#?)(\d)$/);
    if (!match) return 0;
    const [, note, octaveStr] = match;
    const octave = parseInt(octaveStr);
    const noteIndex = NOTE_NAMES.indexOf(note);
    if (noteIndex === -1) return 0;
    const midi = (octave + 1) * 12 + noteIndex;
    return midiToFrequency(midi);
}

/**
 * Convert frequency to note name (e.g. 440 → "A4").
 */
export function frequencyToNoteName(freq: number): string {
    if (freq <= 0) return '—';
    const midi = frequencyToMidi(freq);
    const noteIndex = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/**
 * Calculate cents deviation from target frequency.
 */
export function centsDifference(targetFreq: number, detectedFreq: number): number {
    if (targetFreq <= 0 || detectedFreq <= 0) return 0;
    return Math.round(1200 * Math.log2(detectedFreq / targetFreq));
}

/**
 * Get a random note within a given octave range.
 */
export function getRandomNote(minOctave: number = 3, maxOctave: number = 5): string {
    const octave = minOctave + Math.floor(Math.random() * (maxOctave - minOctave + 1));
    const noteIndex = Math.floor(Math.random() * 7); // Only natural notes
    const naturalNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    return `${naturalNotes[noteIndex]}${octave}`;
}

/**
 * Get a random melody (sequence of notes) of given length.
 */
export function getRandomMelody(length: number, octave: number = 4): string[] {
    const notes: string[] = [];
    const naturalNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    for (let i = 0; i < length; i++) {
        const noteIndex = Math.floor(Math.random() * naturalNotes.length);
        notes.push(`${naturalNotes[noteIndex]}${octave}`);
    }
    return notes;
}

/**
 * Generate a random rhythm pattern (array of beat intervals in ms).
 */
export function getRandomRhythm(beats: number, baseTempo: number = 120): number[] {
    const beatInterval = 60000 / baseTempo; // ms per beat
    const pattern: number[] = [];
    let time = 0;
    for (let i = 0; i < beats; i++) {
        pattern.push(Math.round(time));
        // Vary between half, full and double beats
        const multipliers = [0.5, 1, 1, 1, 2];
        time += beatInterval * multipliers[Math.floor(Math.random() * multipliers.length)];
    }
    return pattern;
}
