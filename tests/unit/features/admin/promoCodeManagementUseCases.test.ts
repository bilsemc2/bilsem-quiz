import assert from 'node:assert/strict';
import test from 'node:test';
import {
    createDefaultPromoCodeFormData,
    isPromoCodeExpired,
    isPromoCodeUsageFull,
    normalizePromoCodeText,
    toPromoCodeEditFormData,
    toPromoCodeMutationInput,
    toPromoCodeUsageAvatarUrl
} from '../../../../src/features/admin/model/promoCodeManagementUseCases.ts';

test('createDefaultPromoCodeFormData returns expected defaults', () => {
    assert.deepEqual(createDefaultPromoCodeFormData(), {
        code: '',
        xp_reward: 50,
        max_uses: 100,
        expires_at: ''
    });
});

test('normalizePromoCodeText trims and uppercases', () => {
    assert.equal(normalizePromoCodeText(' bilsem-2026 '), 'BILSEM-2026');
});

test('toPromoCodeMutationInput normalizes code and nullable expiry', () => {
    const payload = toPromoCodeMutationInput({
        code: ' abc ',
        xp_reward: 45,
        max_uses: 200,
        expires_at: ''
    });

    assert.equal(payload.code, 'ABC');
    assert.equal(payload.expires_at, null);
    assert.equal(payload.xp_reward, 45);
    assert.equal(payload.max_uses, 200);
});

test('toPromoCodeEditFormData converts ISO date into YYYY-MM-DD', () => {
    const formData = toPromoCodeEditFormData({
        id: 'p1',
        code: 'WELCOME',
        xp_reward: 50,
        max_uses: 10,
        current_uses: 1,
        expires_at: '2026-03-20T10:00:00.000Z',
        created_at: '2026-03-01T10:00:00.000Z'
    });

    assert.equal(formData.expires_at, '2026-03-20');
});

test('isPromoCodeExpired and isPromoCodeUsageFull evaluate status correctly', () => {
    const expired = isPromoCodeExpired(
        { expires_at: '2026-03-01T00:00:00.000Z' },
        new Date('2026-03-03T00:00:00.000Z')
    );
    const full = isPromoCodeUsageFull({ current_uses: 10, max_uses: 10 });

    assert.equal(expired, true);
    assert.equal(full, true);
});

test('toPromoCodeUsageAvatarUrl returns explicit avatar or fallback url', () => {
    const explicit = toPromoCodeUsageAvatarUrl({
        id: 'u1',
        used_at: '2026-03-03T10:00:00.000Z',
        profile_name: 'Ada',
        profile_email: 'ada@example.com',
        profile_avatar_url: 'https://example.com/avatar.png'
    });

    const fallback = toPromoCodeUsageAvatarUrl({
        id: 'u2',
        used_at: '2026-03-03T10:00:00.000Z',
        profile_name: 'Bora',
        profile_email: 'bora@example.com',
        profile_avatar_url: null
    });

    assert.equal(explicit, 'https://example.com/avatar.png');
    assert.match(fallback, /dicebear/);
});
