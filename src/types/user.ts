export interface User {
    id: string;
    email: string;
    full_name: string;
    points: number;
    experience: number;
    is_admin: boolean;
    created_at: string;
}

export interface UserStats {
    totalQuizzes: number;
    averageScore: number;
    bestScore: number;
    totalQuestionsAnswered: number;
    correctAnswers: number;
    level: number;
    experience: number;
    nextLevelExperience: number;
    points: number;
    quizHistory: {
        date: string;
        score: number;
        totalQuestions: number;
    }[];
}
