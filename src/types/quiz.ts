export interface QuizOption {
    id: string;
    text: string;
    imageUrl?: string;
    isCorrect: boolean;
}

export interface QuizQuestion {
    id: string;
    questionImageUrl?: string;
    question: string;
    options: QuizOption[];
    correctOptionId: string;
    points: number;
    grade?: number;
    subject?: string;
    type?: 'multiple_choice' | 'text' | 'true_false';
    difficulty?: number;
    solutionVideo?: {
        videoId: string;
    };
}

export interface BaseQuiz {
    id: string;
    title: string;
    description: string;
    questions: QuizQuestion[];
    grade?: number;
    subject?: string;
    status: string;
    created_by: string;
    is_active: boolean;
}

export interface Quiz extends BaseQuiz {
    isAssignment?: boolean;
}

export interface Answer {
    questionId: string;
    selectedOption: string;
    isCorrect: boolean;
    timeSpent: number;
    questionNumber: number;
    correctOption: string;
    questionImage: string;
    isTimeout: boolean;
    solutionVideo: string | null;
    timestamp: string;
    options: {
        id: string;
        text: string;
        imageUrl: string;
        isCorrect: boolean;
    }[];
}

export interface Question extends QuizQuestion {}
