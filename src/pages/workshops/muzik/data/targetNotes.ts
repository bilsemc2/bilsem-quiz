// src/pages/workshops/muzik/data/targetNotes.ts

export const NOTE_FREQUENCIES: Record<string, number> = {
    // Oktav 3
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
    'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    // Oktav 4
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
    'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    // Oktav 5
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
    'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77
};

export const AVAILABLE_NOTES = [
    'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
    'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
    'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5'
];

export interface TargetNote {
    note: string;
    duration: number;
}

export interface TargetDyad {
    id: number;
    notes: [string, string];
    duration: number;
}

export interface TargetTriad {
    id: number;
    notes: [string, string, string];
    duration: number;
    name: string;
}

export interface TargetMelody {
    id: number;
    name: string;
    melody: TargetNote[];
}

export const POSSIBLE_TARGET_NOTES: TargetNote[] = [
    { note: 'C4', duration: 1.0 }, { note: 'D4', duration: 0.8 },
    { note: 'E4', duration: 1.2 }, { note: 'F4', duration: 1.0 },
    { note: 'G4', duration: 0.8 }, { note: 'A4', duration: 1.0 },
    { note: 'B4', duration: 1.2 },
    { note: 'C5', duration: 1.0 },
    { note: 'G3', duration: 1.5 },
    { note: 'F4', duration: 0.9 },
    { note: 'B4', duration: 1.1 },
];

export const POSSIBLE_TARGET_DYADS: TargetDyad[] = [
    { id: 1, notes: ['C4', 'E4'], duration: 2 },
    { id: 2, notes: ['G4', 'B4'], duration: 2 },
    { id: 3, notes: ['C4', 'G4'], duration: 2 },
    { id: 4, notes: ['A4', 'C5'], duration: 2 },
    { id: 5, notes: ['F4', 'A4'], duration: 2 },
    { id: 6, notes: ['D4', 'F4'], duration: 2 },
];

export const POSSIBLE_TARGET_TRIADS: TargetTriad[] = [
    { id: 1, notes: ['C4', 'E4', 'G4'], duration: 5, name: 'Do Majör' },
    { id: 2, notes: ['D4', 'F4', 'A4'], duration: 5, name: 'Re Minör' },
    { id: 3, notes: ['E4', 'G4', 'B4'], duration: 5, name: 'Mi Minör' },
    { id: 4, notes: ['F4', 'A4', 'C5'], duration: 5, name: 'Fa Majör' },
    { id: 5, notes: ['G4', 'B4', 'D5'], duration: 5, name: 'Sol Majör' },
    { id: 6, notes: ['A4', 'C5', 'E5'], duration: 5, name: 'La Minör' },
    { id: 7, notes: ['C4', 'E4', 'A4'], duration: 5, name: 'La Minör 1. Çevrim' },
    { id: 8, notes: ['G3', 'C4', 'E4'], duration: 5, name: 'Do Majör 2. Çevrim' },
];

export const POSSIBLE_TARGET_MELODIES: TargetMelody[] = [
    {
        id: 1,
        name: "Do-Re-Mi",
        melody: [{ note: 'C4', duration: 0.5 }, { note: 'D4', duration: 0.5 }, { note: 'E4', duration: 0.6 }]
    },
    {
        id: 2,
        name: "Mi-Re-Do",
        melody: [{ note: 'E4', duration: 0.6 }, { note: 'D4', duration: 0.5 }, { note: 'C4', duration: 0.7 }]
    },
    {
        id: 3,
        name: "Sol-La-Sol-Mi",
        melody: [{ note: 'G4', duration: 0.4 }, { note: 'A4', duration: 0.4 }, { note: 'G4', duration: 0.4 }, { note: 'E4', duration: 0.6 }]
    },
    {
        id: 4,
        name: "Do-Mi-Sol-Do",
        melody: [{ note: 'C4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'C5', duration: 0.7 }]
    }
];

export function getRandomNote(): string {
    const randomIndex = Math.floor(Math.random() * AVAILABLE_NOTES.length);
    return AVAILABLE_NOTES[randomIndex];
}

export function generateRandomMelody(noteCount = 10): TargetNote[] {
    const melody: TargetNote[] = [];
    for (let i = 0; i < noteCount; i++) {
        melody.push({
            note: getRandomNote(),
            duration: Math.round((0.3 + Math.random() * 0.4) * 10) / 10
        });
    }
    return melody;
}
