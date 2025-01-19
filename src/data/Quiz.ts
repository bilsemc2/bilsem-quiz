import { Quiz, generateQuiz } from '../utils/quizGenerator';

export interface Quiz {
    id: string;
    title: string;
    description: string;
    grade: number;
    subject: string;
    questions: Question[];
}

export interface Question {
    id: string;
    questionImageUrl: string;
    question: string;
    options: Array<{
        id: string;
        imageUrl: string;
        text: string;
    }>;
    correctOptionId: string;
    grade: number;
    subject: string;
    solutionVideo?: {
        url: string;
        title: string;
    };
}

export interface Option {
    id: string;
    imageUrl: string;
    text: string;
}

// Fisher-Yates (Knuth) Shuffle algoritması
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Generate quiz data automatically
export const quiz: Quiz = {
    id: '1',
    title: 'Bilsemc2- Yetenek ve Zeka',
    description: 'Yetenek ve Zeka Soruları',
    grade: 1,
    subject: 'Yetenek ve Zeka',
    questions: shuffleArray(generateQuiz().questions).map(question => ({
        ...question,
        options: shuffleArray(question.options)
    }))
};
