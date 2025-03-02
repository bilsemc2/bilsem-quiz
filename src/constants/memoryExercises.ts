interface MemoryExercise {
    id: string;
    type: 'word' | 'number' | 'visual';
    content: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    displayTime: number; // milisaniye cinsinden
    description: string;
}

export const MEMORY_EXERCISES: MemoryExercise[] = [
    // Kelime Hafızası
    {
        id: 'word-1',
        type: 'word',
        content: ['kitap', 'kalem', 'defter', 'silgi', 'cetvel'],
        difficulty: 'easy',
        displayTime: 3000,
        description: '5 kelimeyi sırasıyla hatırlayın'
    },
    {
        id: 'word-2',
        type: 'word',
        content: ['bilgisayar', 'telefon', 'tablet', 'klavye', 'fare', 'monitör', 'hoparlör'],
        difficulty: 'medium',
        displayTime: 5000,
        description: '7 kelimeyi sırasıyla hatırlayın'
    },
    {
        id: 'word-3',
        type: 'word',
        content: ['mikroskop', 'teleskop', 'termometre', 'barometre', 'higrometre', 'anemometre', 'voltmetre', 'ampermetre', 'ohmmetre'],
        difficulty: 'hard',
        displayTime: 7000,
        description: '9 kelimeyi sırasıyla hatırlayın'
    },

    // Sayı Hafızası
    {
        id: 'number-1',
        type: 'number',
        content: ['12', '45', '78', '23', '56'],
        difficulty: 'easy',
        displayTime: 3000,
        description: '5 sayıyı sırasıyla hatırlayın'
    },
    {
        id: 'number-2',
        type: 'number',
        content: ['123', '456', '789', '234', '567', '890', '345'],
        difficulty: 'medium',
        displayTime: 5000,
        description: '7 üç basamaklı sayıyı sırasıyla hatırlayın'
    },
    {
        id: 'number-3',
        type: 'number',
        content: ['1234', '5678', '9012', '3456', '7890', '2345', '6789', '0123', '4567'],
        difficulty: 'hard',
        displayTime: 7000,
        description: '9 dört basamaklı sayıyı sırasıyla hatırlayın'
    },

    // Görsel Hafıza (emoji kullanarak basit görseller)
    {
        id: 'visual-1',
        type: 'visual',
        content: ['🐶', '🐱', '🐭', '🐹', '🐰'],
        difficulty: 'easy',
        displayTime: 3000,
        description: '5 hayvan emojisini sırasıyla hatırlayın'
    },
    {
        id: 'visual-2',
        type: 'visual',
        content: ['🍎', '🍌', '🍇', '🍊', '🍓', '🍉', '🍍'],
        difficulty: 'medium',
        displayTime: 5000,
        description: '7 meyve emojisini sırasıyla hatırlayın'
    },
    {
        id: 'visual-3',
        type: 'visual',
        content: ['⚽️', '🏀', '🏈', '⚾️', '🎾', '🏐', '🏉', '🎱', '🏓'],
        difficulty: 'hard',
        displayTime: 7000,
        description: '9 spor emojisini sırasıyla hatırlayın'
    }
];
