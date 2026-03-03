import assert from 'node:assert/strict';
import test from 'node:test';
import {
    createDefaultAbilitySnapshot,
    updateAbilitySnapshotFromSession
} from '../../../../src/features/ai/adaptive-difficulty/model/abilitySnapshotUpdateUseCase.ts';

test('updateAbilitySnapshotFromSession increases overall and primary dimensions on strong session', () => {
    const base = createDefaultAbilitySnapshot('u1');
    const next = updateAbilitySnapshotFromSession({
        snapshot: base,
        topic: 'analitik düşünme',
        sessionPerformance: {
            recentAccuracy: 0.9,
            averageResponseMs: 2800,
            targetResponseMs: 4500,
            streakCorrect: 4,
            consecutiveWrong: 0
        },
        totalQuestions: 10,
        correctAnswers: 9
    });

    assert.ok(next.overallScore > base.overallScore);
    assert.ok(next.dimensions.logic > base.dimensions.logic);
    assert.ok(next.dimensions.attention > base.dimensions.attention);
});

test('updateAbilitySnapshotFromSession decreases scores on weak session and keeps bounds', () => {
    const base = {
        ...createDefaultAbilitySnapshot('u2'),
        overallScore: 96,
        dimensions: {
            memory: 97,
            logic: 96,
            attention: 95,
            verbal: 94,
            spatial: 93,
            processing_speed: 92
        }
    };

    const next = updateAbilitySnapshotFromSession({
        snapshot: base,
        topic: 'hafıza ve sınıflama',
        sessionPerformance: {
            recentAccuracy: 0.2,
            averageResponseMs: 9000,
            targetResponseMs: 4500,
            streakCorrect: 0,
            consecutiveWrong: 5
        },
        totalQuestions: 10,
        correctAnswers: 1
    });

    assert.ok(next.overallScore < base.overallScore);
    assert.ok(next.dimensions.memory < base.dimensions.memory);
    assert.ok(next.dimensions.attention < base.dimensions.attention);

    const allScores = [
        next.overallScore,
        next.dimensions.memory,
        next.dimensions.logic,
        next.dimensions.attention,
        next.dimensions.verbal,
        next.dimensions.spatial,
        next.dimensions.processing_speed
    ];

    allScores.forEach((score) => {
        assert.ok(score >= 0 && score <= 100);
    });
});
