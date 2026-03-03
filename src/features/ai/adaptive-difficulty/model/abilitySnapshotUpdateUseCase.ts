import type { AbilityDimension, AbilitySnapshot, SessionPerformance } from '../../model/types';
import { updateAbilityScore } from './difficultyEngine.ts';

interface UpdateAbilitySnapshotFromSessionInput {
    snapshot: AbilitySnapshot;
    topic: string;
    sessionPerformance: SessionPerformance;
    totalQuestions: number;
    correctAnswers: number;
}

const clampScore = (value: number): number => {
    if (!Number.isFinite(value)) return 50;
    return Math.max(0, Math.min(100, Number(value.toFixed(2))));
};

const getPrimaryDimensions = (topic: string): AbilityDimension[] => {
    const normalized = topic.toLocaleLowerCase('tr-TR');

    if (normalized.includes('hafıza') || normalized.includes('memory')) {
        return ['memory', 'attention'];
    }
    if (normalized.includes('sözel') || normalized.includes('verbal')) {
        return ['verbal', 'logic'];
    }
    if (normalized.includes('uzamsal') || normalized.includes('spatial') || normalized.includes('görsel')) {
        return ['spatial', 'attention'];
    }
    if (normalized.includes('hız') || normalized.includes('processing')) {
        return ['processing_speed', 'attention'];
    }

    return ['logic', 'attention'];
};

const applySessionToOverall = (input: {
    currentScore: number;
    sessionPerformance: SessionPerformance;
    totalQuestions: number;
    correctAnswers: number;
}): number => {
    const answered = Math.max(0, Math.round(input.totalQuestions));
    const correct = Math.max(0, Math.min(answered, Math.round(input.correctAnswers)));
    const wrong = Math.max(0, answered - correct);

    let score = input.currentScore;

    for (let i = 0; i < correct; i += 1) {
        score = updateAbilityScore({
            currentScore: score,
            wasCorrect: true,
            responseMs: input.sessionPerformance.averageResponseMs,
            targetResponseMs: input.sessionPerformance.targetResponseMs
        });
    }

    for (let i = 0; i < wrong; i += 1) {
        score = updateAbilityScore({
            currentScore: score,
            wasCorrect: false,
            responseMs: input.sessionPerformance.averageResponseMs,
            targetResponseMs: input.sessionPerformance.targetResponseMs
        });
    }

    return clampScore(score);
};

export const createDefaultAbilitySnapshot = (userId: string): AbilitySnapshot => ({
    userId,
    overallScore: 50,
    dimensions: {
        memory: 50,
        logic: 50,
        attention: 50,
        verbal: 50,
        spatial: 50,
        processing_speed: 50
    },
    updatedAtISO: new Date().toISOString()
});

export const updateAbilitySnapshotFromSession = (
    input: UpdateAbilitySnapshotFromSessionInput
): AbilitySnapshot => {
    const simulatedOverall = applySessionToOverall({
        currentScore: input.snapshot.overallScore,
        sessionPerformance: input.sessionPerformance,
        totalQuestions: input.totalQuestions,
        correctAnswers: input.correctAnswers
    });

    const nextOverall = clampScore((input.snapshot.overallScore * 0.7) + (simulatedOverall * 0.3));
    const overallDelta = nextOverall - input.snapshot.overallScore;
    const primaryDimensions = getPrimaryDimensions(input.topic);

    const nextDimensions = { ...input.snapshot.dimensions };
    (Object.keys(nextDimensions) as AbilityDimension[]).forEach((dimension) => {
        const multiplier = primaryDimensions.includes(dimension) ? 0.8 : 0.25;
        nextDimensions[dimension] = clampScore(nextDimensions[dimension] + (overallDelta * multiplier));
    });

    return {
        ...input.snapshot,
        overallScore: nextOverall,
        dimensions: nextDimensions,
        updatedAtISO: new Date().toISOString()
    };
};
