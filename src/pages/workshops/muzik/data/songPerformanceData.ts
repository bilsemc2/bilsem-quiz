import { TargetNote } from './targetNotes';

export interface SongPart {
    name: string;
    notes: TargetNote[];
}

export const songParts: SongPart[] = [
    {
        name: "daha dün annemizin",
        notes: [
            { note: 'C4', duration: 0.4 }, { note: 'C4', duration: 0.4 }, { note: 'C5', duration: 0.4 }, { note: 'C5', duration: 0.4 },
            { note: 'A4', duration: 0.4 }, { note: 'A4', duration: 0.4 }, { note: 'C5', duration: 0.8 }
        ]
    },
    {
        name: "kollarında yaşarken",
        notes: [
            { note: 'F4', duration: 0.4 }, { note: 'F4', duration: 0.4 }, { note: 'C5', duration: 0.4 }, { note: 'C5', duration: 0.4 },
            { note: 'D4', duration: 0.4 }, { note: 'D4', duration: 0.4 }, { note: 'C4', duration: 0.8 }
        ]
    },
    {
        name: "çiçekli bahçemizin",
        notes: [
            { note: 'C4', duration: 0.4 }, { note: 'C4', duration: 0.4 }, { note: 'C5', duration: 0.4 }, { note: 'C5', duration: 0.4 },
            { note: 'A4', duration: 0.4 }, { note: 'A4', duration: 0.4 }, { note: 'C5', duration: 0.8 }
        ]
    },
    {
        name: "yollarında koşarken",
        notes: [
            { note: 'F4', duration: 0.4 }, { note: 'F4', duration: 0.4 }, { note: 'C5', duration: 0.4 }, { note: 'C5', duration: 0.4 },
            { note: 'D4', duration: 0.4 }, { note: 'D4', duration: 0.4 }, { note: 'C4', duration: 0.8 }
        ]
    },
    {
        name: "şimdi okullu olduk",
        notes: [
            { note: 'C5', duration: 0.4 }, { note: 'C5', duration: 0.4 }, { note: 'F4', duration: 0.4 }, { note: 'F4', duration: 0.4 },
            { note: 'C5', duration: 0.4 }, { note: 'C5', duration: 0.4 }, { note: 'D4', duration: 0.8 }
        ]
    },
    {
        name: "sınıfları doldurduk",
        notes: [
            { note: 'C5', duration: 0.4 }, { note: 'C5', duration: 0.4 }, { note: 'F4', duration: 0.4 }, { note: 'F4', duration: 0.4 },
            { note: 'C5', duration: 0.4 }, { note: 'C5', duration: 0.4 }, { note: 'D4', duration: 0.8 }
        ]
    },
    {
        name: "sevinçliyiz hepimiz",
        notes: [
            { note: 'C4', duration: 0.4 }, { note: 'C4', duration: 0.4 }, { note: 'C5', duration: 0.4 }, { note: 'C5', duration: 0.4 },
            { note: 'A4', duration: 0.4 }, { note: 'A4', duration: 0.4 }, { note: 'C5', duration: 0.8 }
        ]
    },
    {
        name: "yaşasın okulumuz",
        notes: [
            { note: 'F4', duration: 0.4 }, { note: 'F4', duration: 0.4 }, { note: 'C5', duration: 0.4 }, { note: 'C5', duration: 0.4 },
            { note: 'D4', duration: 0.4 }, { note: 'D4', duration: 0.4 }, { note: 'C4', duration: 0.8 }
        ]
    }
];
