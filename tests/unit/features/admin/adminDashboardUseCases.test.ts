import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildDashboardStatsResult,
    toRecentDashboardUsers
} from '../../../../src/features/admin/model/adminDashboardUseCases.ts';

test('toRecentDashboardUsers normalizes nullable fields', () => {
    const users = toRecentDashboardUsers([
        {
            id: 'u1',
            name: null,
            email: null,
            created_at: '2026-03-02T10:00:00.000Z',
            is_active: null
        }
    ]);

    assert.equal(users[0].email, '-');
    assert.equal(users[0].is_active, false);
});

test('buildDashboardStatsResult builds final response object', () => {
    const result = buildDashboardStatsResult(10, 7, [
        {
            id: 'u1',
            name: 'Ada',
            email: 'ada@example.com',
            created_at: '2026-03-02T10:00:00.000Z',
            is_active: true
        }
    ]);

    assert.equal(result.totalUsers, 10);
    assert.equal(result.activeUsers, 7);
    assert.equal(result.recentUsers.length, 1);
    assert.equal(result.recentUsers[0].email, 'ada@example.com');
});
