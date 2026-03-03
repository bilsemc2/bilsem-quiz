import type { AdaptiveQuestionRequest, DifficultyLevel, SessionPerformance } from '../../model/types';

const clampDifficulty = (value: number): DifficultyLevel => {
    if (value <= 1) return 1;
    if (value >= 5) return 5;
    return value as DifficultyLevel;
};

const baseDifficultyFromAbility = (overallScore: number): DifficultyLevel => {
    if (overallScore >= 85) return 5;
    if (overallScore >= 70) return 4;
    if (overallScore >= 55) return 3;
    if (overallScore >= 35) return 2;
    return 1;
};

const speedAdjustment = (performance: SessionPerformance): number => {
    if (performance.targetResponseMs <= 0) {
        return 0;
    }

    const ratio = performance.averageResponseMs / performance.targetResponseMs;
    if (ratio < 0.8) return 1;
    if (ratio > 1.4) return -1;
    return 0;
};

const accuracyAdjustment = (performance: SessionPerformance): number => {
    if (performance.recentAccuracy >= 0.85 && performance.streakCorrect >= 3) return 1;
    if (performance.recentAccuracy <= 0.45 || performance.consecutiveWrong >= 2) return -1;
    return 0;
};

export const calculateTargetDifficulty = (request: AdaptiveQuestionRequest): DifficultyLevel => {
    const base = baseDifficultyFromAbility(request.abilitySnapshot.overallScore);
    const adjusted = base + accuracyAdjustment(request.sessionPerformance) + speedAdjustment(request.sessionPerformance);
    return clampDifficulty(adjusted);
};

export const updateAbilityScore = (input: {
    currentScore: number;
    wasCorrect: boolean;
    responseMs: number;
    targetResponseMs: number;
}): number => {
    const correctnessDelta = input.wasCorrect ? 2.5 : -3;
    const speedRatio = input.targetResponseMs > 0 ? input.responseMs / input.targetResponseMs : 1;
    const speedDelta = speedRatio < 0.85 ? 1 : speedRatio > 1.3 ? -1 : 0;
    const nextScore = input.currentScore + correctnessDelta + speedDelta;
    return Math.max(0, Math.min(100, Number(nextScore.toFixed(2))));
};
