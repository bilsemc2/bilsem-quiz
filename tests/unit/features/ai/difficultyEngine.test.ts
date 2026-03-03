import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateTargetDifficulty, updateAbilityScore } from '../../../../src/features/ai/adaptive-difficulty/model/difficultyEngine.ts';
import type { AdaptiveQuestionRequest } from '../../../../src/features/ai/model/types.ts';

const createRequest = (overrides: Partial<AdaptiveQuestionRequest> = {}): AdaptiveQuestionRequest => ({
    userId: 'u1',
    topic: 'mantik',
    locale: 'tr',
    abilitySnapshot: {
        userId: 'u1',
        overallScore: 60,
        dimensions: {
            memory: 60,
            logic: 60,
            attention: 60,
            verbal: 60,
            spatial: 60,
            processing_speed: 60
        },
        updatedAtISO: new Date().toISOString()
    },
    sessionPerformance: {
        recentAccuracy: 0.7,
        averageResponseMs: 4000,
        targetResponseMs: 4000,
        streakCorrect: 1,
        consecutiveWrong: 0
    },
    ...overrides
});

test('calculateTargetDifficulty increases on high performance', () => {
    const request = createRequest({
        abilitySnapshot: {
            ...createRequest().abilitySnapshot,
            overallScore: 72
        },
        sessionPerformance: {
            recentAccuracy: 0.9,
            averageResponseMs: 2800,
            targetResponseMs: 4000,
            streakCorrect: 4,
            consecutiveWrong: 0
        }
    });

    const difficulty = calculateTargetDifficulty(request);
    assert.equal(difficulty, 5);
});

test('calculateTargetDifficulty decreases on low performance', () => {
    const request = createRequest({
        abilitySnapshot: {
            ...createRequest().abilitySnapshot,
            overallScore: 58
        },
        sessionPerformance: {
            recentAccuracy: 0.3,
            averageResponseMs: 7000,
            targetResponseMs: 4000,
            streakCorrect: 0,
            consecutiveWrong: 3
        }
    });

    const difficulty = calculateTargetDifficulty(request);
    assert.equal(difficulty, 1);
});

test('updateAbilityScore adjusts score and clamps bounds', () => {
    const increased = updateAbilityScore({
        currentScore: 50,
        wasCorrect: true,
        responseMs: 2500,
        targetResponseMs: 4000
    });
    assert.equal(increased, 53.5);

    const clamped = updateAbilityScore({
        currentScore: 1,
        wasCorrect: false,
        responseMs: 9000,
        targetResponseMs: 4000
    });
    assert.equal(clamped, 0);
});
