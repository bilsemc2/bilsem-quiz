import assert from 'node:assert/strict';
import test from 'node:test';
import {
    applyGameAttempt,
    buildGamePerformanceMetadata,
    createEmptyGamePerformance
} from '../../../../src/shared/game/performance.ts';

test('applyGameAttempt updates accuracy, streak and averages', () => {
    const first = applyGameAttempt(createEmptyGamePerformance(), {
        isCorrect: true,
        responseMs: 1200
    });

    assert.equal(first.attempts, 1);
    assert.equal(first.correctAnswers, 1);
    assert.equal(first.accuracy, 100);
    assert.equal(first.averageResponseMs, 1200);
    assert.equal(first.streakCorrect, 1);
    assert.equal(first.bestStreak, 1);

    const second = applyGameAttempt(first, {
        isCorrect: false,
        responseMs: 1800
    });

    assert.equal(second.attempts, 2);
    assert.equal(second.wrongAnswers, 1);
    assert.equal(second.accuracy, 50);
    assert.equal(second.averageResponseMs, 1500);
    assert.equal(second.streakCorrect, 0);
    assert.equal(second.consecutiveWrong, 1);
    assert.equal(second.bestStreak, 1);
});

test('buildGamePerformanceMetadata normalizes the standard payload shape', () => {
    const metadata = buildGamePerformanceMetadata({
        attempts: 4,
        correctAnswers: 3,
        wrongAnswers: 1,
        accuracy: 75,
        responseCount: 4,
        responseMsTotal: 5200,
        averageResponseMs: 1300,
        streakCorrect: 2,
        consecutiveWrong: 0,
        bestStreak: 3
    });

    assert.deepEqual(metadata, {
        accuracy: 75,
        average_response_ms: 1300,
        streak_correct: 2,
        best_streak: 3,
        attempts: 4,
        correct_answers: 3,
        wrong_answers: 1
    });
});
