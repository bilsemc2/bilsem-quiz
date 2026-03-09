import assert from 'node:assert/strict';
import test from 'node:test';
import { updateAbilitySnapshotFromSession } from '../../../../src/features/ai/adaptive-difficulty/model/abilitySnapshotUpdateUseCase.ts';
import { calculateTargetDifficulty } from '../../../../src/features/ai/adaptive-difficulty/model/difficultyEngine.ts';
import type { AbilitySnapshot, SessionPerformance } from '../../../../src/features/ai/model/types.ts';

const createSnapshot = (overallScore: number = 60): AbilitySnapshot => ({
    userId: 'user-1',
    overallScore,
    dimensions: {
        memory: overallScore,
        logic: overallScore,
        attention: overallScore,
        verbal: overallScore,
        spatial: overallScore,
        processing_speed: overallScore
    },
    updatedAtISO: '2026-03-07T10:00:00.000Z'
});

const strongPerformance: SessionPerformance = {
    recentAccuracy: 0.92,
    averageResponseMs: 2500,
    targetResponseMs: 4000,
    streakCorrect: 4,
    consecutiveWrong: 0
};

const weakPerformance: SessionPerformance = {
    recentAccuracy: 0.32,
    averageResponseMs: 7100,
    targetResponseMs: 4000,
    streakCorrect: 0,
    consecutiveWrong: 3
};

const runReplay = (
    initialSnapshot: AbilitySnapshot,
    performances: SessionPerformance[],
    topic: string
) => {
    const difficulties: number[] = [];
    let snapshot = initialSnapshot;

    for (const sessionPerformance of performances) {
        difficulties.push(
            calculateTargetDifficulty({
                userId: snapshot.userId,
                topic,
                locale: 'tr',
                abilitySnapshot: snapshot,
                sessionPerformance
            })
        );

        snapshot = updateAbilitySnapshotFromSession({
            snapshot,
            topic,
            sessionPerformance,
            totalQuestions: 12,
            correctAnswers: Math.round(sessionPerformance.recentAccuracy * 12)
        });
    }

    return {
        finalSnapshot: snapshot,
        difficulties
    };
};

test('adaptive difficulty replay trends upward across sustained strong sessions', () => {
    const replay = runReplay(
        createSnapshot(58),
        [strongPerformance, strongPerformance, strongPerformance],
        'gorsel hafiza'
    );

    assert.ok(replay.finalSnapshot.overallScore > 58);
    assert.deepEqual(replay.difficulties, [5, 5, 5]);
    assert.ok(replay.finalSnapshot.dimensions.memory > 58);
    assert.ok(replay.finalSnapshot.dimensions.attention > 58);
});

test('adaptive difficulty replay trends downward after sustained weak sessions', () => {
    const replay = runReplay(
        createSnapshot(64),
        [weakPerformance, weakPerformance, weakPerformance],
        'sozel mantik'
    );

    assert.ok(replay.finalSnapshot.overallScore < 64);
    assert.deepEqual(replay.difficulties, [1, 1, 1]);
    assert.ok(replay.finalSnapshot.dimensions.verbal < 64);
    assert.ok(replay.finalSnapshot.dimensions.logic < 64);
});

test('adaptive difficulty replay always stays inside supported difficulty band', () => {
    const replay = runReplay(
        createSnapshot(50),
        [strongPerformance, weakPerformance, strongPerformance, weakPerformance],
        'islem hizi'
    );

    assert.ok(replay.difficulties.every((difficulty) => difficulty >= 1 && difficulty <= 5));
});
