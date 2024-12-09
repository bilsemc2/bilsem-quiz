export interface ScoreResult {
    points: number;
    xp: number;
}

export const calculateScore = (totalQuestions: number, correctAnswers: number): ScoreResult => {
    const POINTS_PER_CORRECT_ANSWER = 10;
    const XP_PERCENTAGE = 0.10; // 10%

    const points = correctAnswers * POINTS_PER_CORRECT_ANSWER;
    const xp = Math.floor(points * XP_PERCENTAGE);

    return {
        points,
        xp
    };
};
