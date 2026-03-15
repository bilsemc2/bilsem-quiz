import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildSystemQuizStats,
    buildSystemUserStats,
    loadSystemStatsSummary
} from '../../../../src/features/admin/model/systemStatsUseCases.ts';

test('buildSystemQuizStats aggregates quiz totals and top scorers', () => {
    const stats = buildSystemQuizStats([
        {
            score: 80,
            questions_answered: 10,
            correct_answers: 8,
            completed_at: '2026-03-10T10:00:00.000Z',
            profiles: [{ full_name: 'Ada', email: 'ada@example.com' }]
        },
        {
            score: 95,
            questions_answered: 10,
            correct_answers: 9,
            completed_at: '2026-03-11T10:00:00.000Z',
            profiles: { full_name: null, email: null }
        }
    ]);

    assert.equal(stats.totalQuizzes, 2);
    assert.equal(stats.totalQuestionsAnswered, 20);
    assert.equal(stats.totalCorrectAnswers, 17);
    assert.equal(stats.averageScore, 87.5);
    assert.equal(Math.round(stats.accuracyRate), 85);
    assert.equal(stats.topScorers[0].name, 'İsimsiz');
    assert.deepEqual(Object.values(stats.quizzesByDay), [1, 1]);
});

test('buildSystemUserStats normalizes nullable numeric fields', () => {
    const stats = buildSystemUserStats([
        { points: 12, experience: 20 },
        { points: null, experience: 0 }
    ]);

    assert.equal(stats.totalUsers, 2);
    assert.equal(stats.totalPoints, 12);
    assert.equal(stats.totalExperience, 20);
    assert.equal(stats.averagePoints, 6);
    assert.equal(stats.accuracyRate, 60);
});

test('loadSystemStatsSummary delegates to the repository', async () => {
    const summary = await loadSystemStatsSummary({
        listQuizResults: async () => [
            {
                score: 100,
                questions_answered: 5,
                correct_answers: 5,
                completed_at: '2026-03-12T10:00:00.000Z',
                profiles: { full_name: 'Bora', email: 'bora@example.com' }
            }
        ],
        listUserProgress: async () => [{ points: 40, experience: 50 }]
    });

    assert.equal(summary.quizStats.totalQuizzes, 1);
    assert.equal(summary.userStats.totalUsers, 1);
    assert.equal(summary.userStats.totalPoints, 40);
});
