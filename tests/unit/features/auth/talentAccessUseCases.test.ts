import assert from 'node:assert/strict';
import test from 'node:test';
import { checkTalentAccess } from '../../../../src/features/auth/model/talentAccessUseCases.ts';

test('checkTalentAccess grants access for accent-insensitive talent matches', () => {
    const result = checkTalentAccess({
        role: 'student',
        is_admin: false,
        yetenek_alani: ['Muzik']
    }, 'Müzik');

    assert.equal(result.hasAccess, true);
    assert.deepEqual(result.userTalents, ['Muzik']);
});

test('checkTalentAccess grants privileged users regardless of talent list', () => {
    const result = checkTalentAccess({
        role: 'teacher',
        is_admin: false,
        yetenek_alani: ['Resim']
    }, 'Müzik');

    assert.equal(result.hasAccess, true);
});
