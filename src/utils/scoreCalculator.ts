export interface ScoreResult {
    points: number;
    xp: number;
}

export const calculateScore = (correctAnswers: number, totalQuestions: number): number => {
    const POINTS_PER_CORRECT_ANSWER = 10;
    return correctAnswers * POINTS_PER_CORRECT_ANSWER;
};
