import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildGameStatsSummary,
    persistGamePlay
} from '../../../../src/features/games/model/gamePlayUseCases.ts';
import { err, ok } from '../../../../src/shared/types/result.ts';

test('buildGameStatsSummary aggregates recent, weekly and progress data', () => {
    const summary = buildGameStatsSummary(
        [
            {
                id: 'g1',
                game_id: 'memory-rush',
                score_achieved: 40,
                duration_seconds: 30,
                intelligence_type: 'Görsel Hafıza',
                workshop_type: 'genel_yetenek',
                created_at: '2026-03-04T12:00:00.000Z',
                metadata: { game_name: 'Memory Rush' }
            },
            {
                id: 'g2',
                game_id: 'memory-rush',
                score_achieved: 80,
                duration_seconds: 45,
                intelligence_type: 'Görsel Hafıza',
                workshop_type: 'genel_yetenek',
                created_at: '2026-03-05T12:00:00.000Z',
                metadata: { game_name: 'Memory Rush' }
            },
            {
                id: 'g3',
                game_id: 'logic-lane',
                score_achieved: 60,
                duration_seconds: 50,
                intelligence_type: 'Mantıksal Zeka',
                workshop_type: 'genel_yetenek',
                created_at: '2026-02-25T12:00:00.000Z',
                metadata: null
            }
        ],
        new Date('2026-03-05T15:00:00.000Z')
    );

    assert.equal(summary.totalPlays, 3);
    assert.equal(summary.totalScore, 180);
    assert.equal(summary.averageScore, 60);
    assert.equal(summary.totalDuration, 125);
    assert.equal(summary.recentGames[0].game_name, 'Memory Rush');
    assert.equal(summary.recentGames[1].game_name, 'Memory Rush');
    assert.equal(summary.thisWeek.plays, 2);
    assert.equal(summary.lastWeek.plays, 1);
    assert.equal(summary.gameProgress.length, 1);
    assert.equal(summary.gameProgress[0].game_id, 'memory-rush');
    assert.equal(summary.gameProgress[0].improvement, 100);
    assert.equal(summary.intelligenceBreakdown['Görsel Hafıza'], 2);
});

test('persistGamePlay forwards repository result', async () => {
    let capturedGameId = '';

    const success = await persistGamePlay(
        {
            userId: 'user-1',
            gameId: 'stroop',
            scoreAchieved: 90,
            durationSeconds: 33
        },
        {
            async createGamePlay(input) {
                capturedGameId = input.gameId;
                return ok(undefined);
            }
        }
    );

    assert.equal(capturedGameId, 'stroop');
    assert.equal(success.ok, true);

    const failure = await persistGamePlay(
        {
            userId: 'user-1',
            gameId: 'stroop',
            scoreAchieved: 90,
            durationSeconds: 33
        },
        {
            async createGamePlay() {
                return err({ message: 'failed' });
            }
        }
    );

    assert.equal(failure.ok, false);
    if (!failure.ok) {
        assert.equal(failure.error.message, 'failed');
    }
});
