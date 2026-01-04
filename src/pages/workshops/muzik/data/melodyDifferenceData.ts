import { TargetNote } from './targetNotes';

export interface MelodyDifferenceSet {
    id: number;
    melodies: TargetNote[][];
    differentIndex: number;
}

export const melodyDifferenceSets: MelodyDifferenceSet[] = [
    {
        id: 1,
        melodies: [
            [{ note: 'C4', duration: 0.4 }, { note: 'D4', duration: 0.4 }, { note: 'E4', duration: 0.6 }],
            [{ note: 'C4', duration: 0.4 }, { note: 'E4', duration: 0.4 }, { note: 'D4', duration: 0.6 }],
            [{ note: 'C4', duration: 0.4 }, { note: 'D4', duration: 0.4 }, { note: 'E4', duration: 0.6 }]
        ],
        differentIndex: 1
    },
    {
        id: 2,
        melodies: [
            [{ note: 'G4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'G4', duration: 0.5 }],
            [{ note: 'G4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'E4', duration: 0.5 }],
            [{ note: 'G4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'E4', duration: 0.5 }]
        ],
        differentIndex: 0
    },
    {
        id: 3,
        melodies: [
            [{ note: 'A4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'F4', duration: 0.5 }],
            [{ note: 'A4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'F4', duration: 0.5 }],
            [{ note: 'A4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'G4', duration: 0.5 }]
        ],
        differentIndex: 2
    },
    {
        id: 4,
        melodies: [
            [{ note: 'C4', duration: 0.4 }, { note: 'D4', duration: 0.4 }, { note: 'F4', duration: 0.4 }],
            [{ note: 'C4', duration: 0.4 }, { note: 'D4', duration: 0.4 }, { note: 'F4', duration: 0.4 }],
            [{ note: 'C4', duration: 0.4 }, { note: 'F4', duration: 0.4 }, { note: 'D4', duration: 0.4 }]
        ],
        differentIndex: 2
    }
];
