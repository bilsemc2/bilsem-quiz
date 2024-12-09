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
