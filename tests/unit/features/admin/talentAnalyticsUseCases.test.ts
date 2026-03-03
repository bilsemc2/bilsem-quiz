import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildIntelligenceBreakdown,
    buildTalentAnalyticsData,
    buildTopPlayers,
    collectProfileIdsFromRecentPlays
} from '../../../../src/features/admin/model/talentAnalyticsUseCases.ts';

test('buildIntelligenceBreakdown counts only defined intelligence types', () => {
    const breakdown = buildIntelligenceBreakdown([
        { user_id: 'u1', workshop_type: 'tablet', intelligence_type: 'Mantıksal' },
        { user_id: 'u2', workshop_type: 'tablet', intelligence_type: 'Mantıksal' },
        { user_id: 'u3', workshop_type: 'bireysel', intelligence_type: null }
    ]);

    assert.equal(breakdown['Mantıksal'], 2);
    assert.equal(Object.keys(breakdown).length, 1);
});

test('collectProfileIdsFromRecentPlays deduplicates repeated users', () => {
    const ids = collectProfileIdsFromRecentPlays([
        { user_id: 'u1', score_achieved: 10, game_id: 'g1', created_at: '2026-03-02T10:00:00.000Z' },
        { user_id: 'u2', score_achieved: 20, game_id: 'g2', created_at: '2026-03-02T11:00:00.000Z' },
        { user_id: 'u1', score_achieved: 30, game_id: 'g3', created_at: '2026-03-02T12:00:00.000Z' }
    ]);

    assert.deepEqual(ids.sort(), ['u1', 'u2']);
});

test('buildTopPlayers computes play count and average score', () => {
    const topPlayers = buildTopPlayers(
        [
            { user_id: 'u1', score_achieved: 50, game_id: 'g1', created_at: '2026-03-02T10:00:00.000Z' },
            { user_id: 'u1', score_achieved: 70, game_id: 'g2', created_at: '2026-03-02T10:10:00.000Z' },
            { user_id: 'u2', score_achieved: 100, game_id: 'g3', created_at: '2026-03-02T10:20:00.000Z' }
        ],
        {
            u1: 'Ada',
            u2: 'Bora'
        }
    );

    assert.equal(topPlayers[0].name, 'Ada');
    assert.equal(topPlayers[0].plays, 2);
    assert.equal(topPlayers[0].avgScore, 60);
});

test('buildTalentAnalyticsData returns aggregated dashboard payload', () => {
    const result = buildTalentAnalyticsData({
        workshopPlays: [
            { user_id: 'u1', workshop_type: 'tablet', intelligence_type: 'Görsel' },
            { user_id: 'u2', workshop_type: 'bireysel', intelligence_type: 'Görsel' },
            { user_id: 'u3', workshop_type: 'tablet', intelligence_type: 'Sözel' }
        ],
        recentPlays: [
            { user_id: 'u1', score_achieved: 10, game_id: 'maze', created_at: '2026-03-02T10:00:00.000Z' },
            { user_id: 'u2', score_achieved: 20, game_id: 'stroop', created_at: '2026-03-02T11:00:00.000Z' }
        ],
        profiles: [
            { id: 'u1', name: 'Ada' },
            { id: 'u2', name: 'Bora' }
        ],
        topPlayersLimit: 5,
        recentActivityLimit: 10
    });

    assert.equal(result.totalPlays, 3);
    assert.equal(result.tabletPlays, 2);
    assert.equal(result.bireyselPlays, 1);
    assert.equal(result.intelligenceBreakdown['Görsel'], 2);
    assert.equal(result.topPlayers.length, 2);
    assert.equal(result.recentActivity[0].user_name, 'Ada');
});
