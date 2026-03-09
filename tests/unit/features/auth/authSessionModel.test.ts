import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeAuthProfile } from '../../../../src/features/auth/model/authSessionModel.ts';

test('normalizeAuthProfile returns null for missing profile data', () => {
    assert.equal(normalizeAuthProfile(null), null);
});

test('normalizeAuthProfile coerces experience into a safe number', () => {
    const profile = normalizeAuthProfile({
        id: 'user-1',
        name: 'Ada',
        email: 'ada@example.com',
        experience: Number.NaN,
        is_admin: true,
        role: 'teacher',
        avatar_url: 'https://example.com/avatar.png',
        yetenek_alani: ['Müzik']
    });

    assert.ok(profile);
    assert.equal(profile.experience, 0);
    assert.equal(profile.role, 'teacher');
    assert.deepEqual(profile.yetenek_alani, ['Müzik']);
});
