export interface WordSearchGame {
    id: string;
    grid: string[][];
    words: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    timeLimit: number; // saniye cinsinden
}

export interface MatchingGame {
    id: string;
    pairs: Array<{
        id: string;
        word: string;
        match: string;
    }>;
    difficulty: 'easy' | 'medium' | 'hard';
    timeLimit: number;
}

export interface MissingWordGame {
    id: string;
    text: string;
    missingWords: string[];
    options: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    timeLimit: number;
}

export const WORD_SEARCH_GAMES: WordSearchGame[] = [
    {
        id: 'ws-1',
        grid: [
            ['K', 'İ', 'T', 'A', 'P'],
            ['A', 'N', 'E', 'M', 'L'],
            ['L', 'E', 'M', 'A', 'K'],
            ['E', 'M', 'A', 'S', 'A'],
            ['M', 'E', 'K', 'T', 'P']
        ],
        words: ['KİTAP', 'KALEM', 'MASA'],
        difficulty: 'easy',
        timeLimit: 120
    },
    {
        id: 'ws-2',
        grid: [
            ['B', 'İ', 'L', 'G', 'İ', 'S', 'A', 'Y', 'A', 'R'],
            ['K', 'L', 'A', 'V', 'Y', 'E', 'F', 'A', 'R', 'E'],
            ['E', 'K', 'R', 'A', 'N', 'M', 'O', 'U', 'S', 'E'],
            ['T', 'A', 'B', 'L', 'E', 'T', 'N', 'B', 'O', 'K'],
            ['M', 'O', 'N', 'İ', 'T', 'Ö', 'R', 'K', 'A', 'M']
        ],
        words: ['BİLGİSAYAR', 'KLAVYE', 'FARE', 'TABLET', 'MONİTÖR'],
        difficulty: 'medium',
        timeLimit: 180
    }
];

export const MATCHING_GAMES: MatchingGame[] = [
    {
        id: 'match-1',
        pairs: [
            { id: '1', word: 'Güneş', match: '☀️' },
            { id: '2', word: 'Ay', match: '🌙' },
            { id: '3', word: 'Yıldız', match: '⭐' },
            { id: '4', word: 'Bulut', match: '☁️' },
            { id: '5', word: 'Yağmur', match: '🌧️' }
        ],
        difficulty: 'easy',
        timeLimit: 60
    },
    {
        id: 'match-2',
        pairs: [
            { id: '1', word: 'Türkiye', match: 'Ankara' },
            { id: '2', word: 'Fransa', match: 'Paris' },
            { id: '3', word: 'İtalya', match: 'Roma' },
            { id: '4', word: 'Almanya', match: 'Berlin' },
            { id: '5', word: 'İspanya', match: 'Madrid' },
            { id: '6', word: 'İngiltere', match: 'Londra' }
        ],
        difficulty: 'medium',
        timeLimit: 90
    }
];

export const MISSING_WORD_GAMES: MissingWordGame[] = [
    {
        id: 'mw-1',
        text: 'Küçük _____ bahçede _____ oynarken aniden _____ başladı.',
        missingWords: ['çocuk', 'top', 'yağmur'],
        options: ['çocuk', 'top', 'yağmur', 'köpek', 'güneş', 'rüzgar'],
        difficulty: 'easy',
        timeLimit: 60
    },
    {
        id: 'mw-2',
        text: 'Bilim insanları yeni bir _____ keşfettiklerini ve bu _____ sayesinde _____ tedavisinde önemli gelişmeler kaydedileceğini açıkladılar.',
        missingWords: ['molekül', 'buluş', 'kanser'],
        options: ['molekül', 'buluş', 'kanser', 'protein', 'yöntem', 'hastalık', 'araştırma', 'tedavi', 'ilaç'],
        difficulty: 'medium',
        timeLimit: 90
    }
];
