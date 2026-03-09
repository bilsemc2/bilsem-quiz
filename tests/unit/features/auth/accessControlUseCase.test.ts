import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateAccess, normalizeTalents } from '../../../../src/features/auth/model/accessControlUseCase.ts';

test('normalizeTalents parses comma and semicolon separated strings', () => {
    const talents = normalizeTalents('Müzik, Resim; Matematik');

    assert.deepEqual(talents, ['Müzik', 'Resim', 'Matematik']);
});

test('evaluateAccess denies access when role is insufficient for admin routes', () => {
    const decision = evaluateAccess({
        requireAdmin: true,
        isAdmin: false,
        role: 'student',
        userXP: 50,
        requiredXP: 0
    });

    assert.equal(decision.hasAccess, false);
    assert.equal(decision.reason, 'role');
});

test('evaluateAccess enforces talent matching before XP check', () => {
    const decision = evaluateAccess({
        requiredTalent: 'müzik',
        userTalent: ['Resim'],
        userXP: 100,
        requiredXP: 10
    });

    assert.equal(decision.hasAccess, false);
    assert.equal(decision.reason, 'talent');
});

test('evaluateAccess matches talents accent-insensitively', () => {
    const decision = evaluateAccess({
        requiredTalent: 'Müzik',
        userTalent: ['Muzik'],
        userXP: 100,
        requiredXP: 0
    });

    assert.equal(decision.hasAccess, true);
    assert.equal(decision.reason, null);
});

test('evaluateAccess denies when XP is lower than required amount', () => {
    const decision = evaluateAccess({
        userXP: 4,
        requiredXP: 5
    });

    assert.equal(decision.hasAccess, false);
    assert.equal(decision.reason, 'xp');
});

test('evaluateAccess allows teacher role for privileged routes', () => {
    const decision = evaluateAccess({
        requireAdmin: true,
        role: 'teacher',
        userXP: 0,
        requiredXP: 999
    });

    assert.equal(decision.hasAccess, true);
    assert.equal(decision.reason, null);
});
