import assert from 'node:assert/strict';
import test from 'node:test';
import { loadMusicReportCardData } from '../../../../src/features/profile/model/musicReportUseCases.ts';

test('loadMusicReportCardData returns report and completed test count together', async () => {
    const result = await loadMusicReportCardData('user-1', {
        getLatestOverallReportByUserId: async (userId) => {
            assert.equal(userId, 'user-1');
            return {
                overall_score: 88,
                pitch_score: 50,
                rhythm_score: 20,
                melody_score: 11,
                expression_score: 7,
                level: 'Ileri',
                created_at: '2026-03-12T10:00:00.000Z'
            };
        },
        countCompletedTestsByUserId: async () => 6
    });

    assert.equal(result.completedCount, 6);
    assert.equal(result.report?.overall_score, 88);
    assert.equal(result.report?.level, 'Ileri');
});
