import assert from 'node:assert/strict';
import test from 'node:test';
import { loadQuizizzDashboardData, toggleQuizizzCompletion } from '../../../../src/features/content/model/quizizzUseCases.ts';

test('loadQuizizzDashboardData returns empty lists when profile is missing', async () => {
    const result = await loadQuizizzDashboardData('u1', {
        getProfileByUserId: async () => null,
        listActiveCodesByGrade: async () => {
            throw new Error('should not be called');
        },
        listCompletedCodeIds: async () => {
            throw new Error('should not be called');
        },
        markCodeCompleted: async () => {},
        unmarkCodeCompleted: async () => {}
    });

    assert.equal(result.userGrade, null);
    assert.equal(result.isVip, false);
    assert.deepEqual(result.codes, []);
    assert.deepEqual(result.completedCodeIds, []);
});

test('loadQuizizzDashboardData normalizes grade and deduplicates completed ids', async () => {
    const result = await loadQuizizzDashboardData('u2', {
        getProfileByUserId: async () => ({ grade: 4, is_vip: true }),
        listActiveCodesByGrade: async (grade) => {
            assert.equal(grade, '4');
            return [
                {
                    id: 'c1',
                    code: 'ABC123',
                    subject: 'Math',
                    grade: '4',
                    scheduled_time: '2026-03-02T10:00:00Z',
                    is_active: true
                }
            ];
        },
        listCompletedCodeIds: async () => ['c1', 'c1', 'c2'],
        markCodeCompleted: async () => {},
        unmarkCodeCompleted: async () => {}
    });

    assert.equal(result.userGrade, '4');
    assert.equal(result.isVip, true);
    assert.equal(result.codes.length, 1);
    assert.deepEqual(result.completedCodeIds.sort(), ['c1', 'c2']);
});

test('toggleQuizizzCompletion does nothing for non-vip users', async () => {
    let called = false;
    const result = await toggleQuizizzCompletion(
        {
            userId: 'u3',
            codeId: 'c1',
            isVip: false,
            isCompleted: false
        },
        {
            markCodeCompleted: async () => {
                called = true;
            },
            unmarkCodeCompleted: async () => {
                called = true;
            }
        }
    );

    assert.equal(result.changed, false);
    assert.equal(result.isCompleted, false);
    assert.equal(called, false);
});

test('toggleQuizizzCompletion marks and unmarks completion', async () => {
    const calls: string[] = [];

    const markResult = await toggleQuizizzCompletion(
        {
            userId: 'u4',
            codeId: 'c5',
            isVip: true,
            isCompleted: false
        },
        {
            markCodeCompleted: async () => {
                calls.push('mark');
            },
            unmarkCodeCompleted: async () => {
                calls.push('unmark');
            }
        }
    );

    const unmarkResult = await toggleQuizizzCompletion(
        {
            userId: 'u4',
            codeId: 'c5',
            isVip: true,
            isCompleted: true
        },
        {
            markCodeCompleted: async () => {
                calls.push('mark');
            },
            unmarkCodeCompleted: async () => {
                calls.push('unmark');
            }
        }
    );

    assert.equal(markResult.changed, true);
    assert.equal(markResult.isCompleted, true);
    assert.equal(unmarkResult.changed, true);
    assert.equal(unmarkResult.isCompleted, false);
    assert.deepEqual(calls, ['mark', 'unmark']);
});
