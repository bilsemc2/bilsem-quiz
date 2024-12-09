export interface QuizOption {
    id: string;
    imageUrl: string;
    text: string;
}

export interface QuizQuestion {
    id: string;
    questionImageUrl: string;
    question: string;
    options: QuizOption[];
    correctOptionId: string;
    grade: 1 | 2 | 3;
    subject: string;
}

export interface Quiz {
    id: string;
    title: string;
    description: string;
    questions: QuizQuestion[];
    grade: 1 | 2 | 3;
    subject: string;
}
