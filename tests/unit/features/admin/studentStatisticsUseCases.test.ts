import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildStudentStatsSummary,
    filterStudentsForStatistics,
    toStudentListItems
} from '../../../../src/features/admin/model/studentStatisticsUseCases.ts';

test('toStudentListItems normalizes numeric and nullable fields', () => {
    const students = toStudentListItems([
        {
            id: 'u1',
            name: null,
            email: null,
            grade: 3,
            experience: null,
            points: 12,
            is_vip: null,
            created_at: '2026-03-02T10:00:00.000Z'
        }
    ]);

    assert.equal(students[0].name, 'İsimsiz Kullanıcı');
    assert.equal(students[0].email, '-');
    assert.equal(students[0].experience, 0);
    assert.equal(students[0].points, 12);
});

test('filterStudentsForStatistics applies search and grade rules', () => {
    const filtered = filterStudentsForStatistics(
        [
            {
                id: 'u1',
                name: 'Ada',
                email: 'ada@example.com',
                grade: 3,
                experience: 20,
                points: 10,
                is_vip: false,
                created_at: '2026-03-02T10:00:00.000Z'
            },
            {
                id: 'u2',
                name: 'Bora',
                email: 'bora@example.com',
                grade: 3,
                experience: 0,
                points: 5,
                is_vip: true,
                created_at: '2026-03-02T10:00:00.000Z'
            }
        ],
        'ada',
        '3'
    );

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, 'u1');
});

test('buildStudentStatsSummary computes counts and recent games', () => {
    const summary = buildStudentStatsSummary([
        {
            id: 'g1',
            game_id: 'game-1',
            score_achieved: 80,
            duration_seconds: 30,
            intelligence_type: 'Gorsel',
            workshop_type: 'genel_yetenek',
            created_at: '2026-03-02T10:00:00.000Z'
        },
        {
            id: 'g2',
            game_id: 'game-2',
            score_achieved: 100,
            duration_seconds: 45,
            intelligence_type: 'Gorsel',
            workshop_type: 'resim',
            created_at: '2026-03-02T10:01:00.000Z'
        }
    ]);

    assert.equal(summary.totalGames, 2);
    assert.equal(summary.avgScore, 90);
    assert.equal(summary.totalDuration, 75);
    assert.equal(summary.intelligenceBreakdown.Gorsel, 2);
    assert.equal(summary.workshopBreakdown.resim, 1);
    assert.equal(summary.recentGames.length, 2);
});
