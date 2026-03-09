import assert from 'node:assert/strict';
import test from 'node:test';
import { persistCompletedExamSession } from '../../../../src/features/exam/model/examSessionUseCases.ts';
import { ok } from '../../../../src/shared/types/result.ts';

test('persistCompletedExamSession delegates persistence payload to repository', async () => {
    let capturedUserId = '';
    let capturedScore = 0;

    const result = await persistCompletedExamSession(
        {
            id: 'session-1',
            userId: 'user-42',
            startedAt: new Date('2026-03-05T09:00:00.000Z'),
            completedAt: new Date('2026-03-05T09:10:00.000Z'),
            moduleCount: 10,
            results: [{ moduleId: 'm1', score: 8 }],
            finalScore: 80,
            bzpScore: 118,
            abilityEstimate: '1.25'
        },
        {
            async saveExamSession(input) {
                capturedUserId = input.userId;
                capturedScore = input.finalScore;
                return ok(undefined);
            }
        }
    );

    assert.equal(result.ok, true);
    assert.equal(capturedUserId, 'user-42');
    assert.equal(capturedScore, 80);
});
