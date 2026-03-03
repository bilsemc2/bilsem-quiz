import assert from 'node:assert/strict';
import test from 'node:test';
import {
    isAdminProfile,
    normalizeXPRequirements
} from '../../../../src/features/admin/model/xpRequirementsUseCases.ts';

test('isAdminProfile returns false for null and true for admin profile', () => {
    assert.equal(isAdminProfile(null), false);
    assert.equal(isAdminProfile({ is_admin: false }), false);
    assert.equal(isAdminProfile({ is_admin: true }), true);
});

test('normalizeXPRequirements removes invalid entries', () => {
    const normalized = normalizeXPRequirements([
        {
            id: 'r1',
            page_path: '/games/demo',
            required_xp: 5,
            description: null,
            created_at: '2026-03-02T10:00:00.000Z',
            updated_at: '2026-03-02T10:00:00.000Z'
        },
        {
            id: 'r2',
            page_path: '',
            required_xp: 10,
            description: null,
            created_at: '2026-03-02T10:00:00.000Z',
            updated_at: '2026-03-02T10:00:00.000Z'
        }
    ]);

    assert.equal(normalized.length, 1);
    assert.equal(normalized[0].id, 'r1');
});
