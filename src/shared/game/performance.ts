export interface GameAttemptInput {
    isCorrect: boolean;
    responseMs?: number | null;
}

export interface GamePerformanceState {
    attempts: number;
    correctAnswers: number;
    wrongAnswers: number;
    accuracy: number;
    responseCount: number;
    responseMsTotal: number;
    averageResponseMs: number;
    streakCorrect: number;
    consecutiveWrong: number;
    bestStreak: number;
}

export const createEmptyGamePerformance = (): GamePerformanceState => ({
    attempts: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    accuracy: 0,
    responseCount: 0,
    responseMsTotal: 0,
    averageResponseMs: 0,
    streakCorrect: 0,
    consecutiveWrong: 0,
    bestStreak: 0
});

const normalizeResponseMs = (responseMs?: number | null): number | null => {
    if (typeof responseMs !== 'number' || !Number.isFinite(responseMs) || responseMs < 0) {
        return null;
    }

    return Math.round(responseMs);
};

export const applyGameAttempt = (
    current: GamePerformanceState,
    attempt: GameAttemptInput
): GamePerformanceState => {
    const responseMs = normalizeResponseMs(attempt.responseMs);
    const attempts = current.attempts + 1;
    const correctAnswers = current.correctAnswers + (attempt.isCorrect ? 1 : 0);
    const wrongAnswers = current.wrongAnswers + (attempt.isCorrect ? 0 : 1);
    const responseCount = current.responseCount + (responseMs === null ? 0 : 1);
    const responseMsTotal = current.responseMsTotal + (responseMs ?? 0);
    const streakCorrect = attempt.isCorrect ? current.streakCorrect + 1 : 0;
    const consecutiveWrong = attempt.isCorrect ? 0 : current.consecutiveWrong + 1;

    return {
        attempts,
        correctAnswers,
        wrongAnswers,
        accuracy: attempts > 0 ? Math.round((correctAnswers / attempts) * 100) : 0,
        responseCount,
        responseMsTotal,
        averageResponseMs: responseCount > 0 ? Math.round(responseMsTotal / responseCount) : 0,
        streakCorrect,
        consecutiveWrong,
        bestStreak: Math.max(current.bestStreak, streakCorrect)
    };
};

export const buildGamePerformanceMetadata = (
    performance?: GamePerformanceState | null
): Record<string, number> => {
    if (!performance) {
        return {};
    }

    return {
        accuracy: performance.accuracy,
        average_response_ms: performance.averageResponseMs,
        streak_correct: performance.streakCorrect,
        best_streak: performance.bestStreak,
        attempts: performance.attempts,
        correct_answers: performance.correctAnswers,
        wrong_answers: performance.wrongAnswers
    };
};
