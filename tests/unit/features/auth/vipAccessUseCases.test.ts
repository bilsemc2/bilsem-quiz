import assert from 'node:assert/strict';
import test from 'node:test';
import { checkVipAccessForPath, deductVipXPForPageVisit } from '../../../../src/features/auth/model/vipAccessUseCases.ts';

test('checkVipAccessForPath denies when profile is missing', async () => {
    const result = await checkVipAccessForPath(
        {
            userId: 'u1',
            pagePath: '/atolyeler/muzik'
        },
        {
            auth: { getProfileByUserId: async () => null },
            xp: { getXPRequirementForPath: async () => 50 }
        }
    );

    assert.equal(result.hasVipAccess, false);
    assert.equal(result.shouldDeductXP, false);
    assert.equal(result.requiredXP, 0);
});

test('checkVipAccessForPath grants admin access without XP deduction', async () => {
    const result = await checkVipAccessForPath(
        {
            userId: 'u1',
            pagePath: '/atolyeler/muzik'
        },
        {
            auth: {
                getProfileByUserId: async () => ({
                    id: 'u1',
                    email: 'admin@test.com',
                    name: 'Admin',
                    experience: 0,
                    is_admin: true,
                    role: 'admin',
                    is_vip: false
                })
            },
            xp: { getXPRequirementForPath: async () => 50 }
        }
    );

    assert.equal(result.hasVipAccess, true);
    assert.equal(result.isPrivileged, true);
    assert.equal(result.shouldDeductXP, false);
});

test('checkVipAccessForPath requires XP deduction for standard VIP users', async () => {
    const result = await checkVipAccessForPath(
        {
            userId: 'u2',
            pagePath: '/atolyeler/muzik'
        },
        {
            auth: {
                getProfileByUserId: async () => ({
                    id: 'u2',
                    email: 'vip@test.com',
                    name: 'Vip',
                    experience: 120,
                    is_admin: false,
                    role: 'student',
                    is_vip: true
                })
            },
            xp: { getXPRequirementForPath: async () => 50 }
        }
    );

    assert.equal(result.hasVipAccess, true);
    assert.equal(result.isPrivileged, false);
    assert.equal(result.shouldDeductXP, true);
    assert.equal(result.requiredXP, 50);
});

test('checkVipAccessForPath skips deduction if VIP user has insufficient XP', async () => {
    const result = await checkVipAccessForPath(
        {
            userId: 'u3',
            pagePath: '/atolyeler/muzik'
        },
        {
            auth: {
                getProfileByUserId: async () => ({
                    id: 'u3',
                    email: 'vip-low@test.com',
                    name: 'VipLow',
                    experience: 10,
                    is_admin: false,
                    role: 'student',
                    is_vip: true
                })
            },
            xp: { getXPRequirementForPath: async () => 50 }
        }
    );

    assert.equal(result.hasVipAccess, true);
    assert.equal(result.shouldDeductXP, false);
    assert.equal(result.requiredXP, 50);
});

test('deductVipXPForPageVisit returns unauthorized when access token is missing', async () => {
    const result = await deductVipXPForPageVisit(
        {
            pagePath: '/atolyeler/muzik',
            requiredXP: 50
        },
        {
            auth: { getAccessToken: async () => null },
            xp: {
                executeXPTransaction: async () => ({ success: true as const, newXP: 0, change: 0 })
            }
        }
    );

    assert.equal(result.success, false);
    if (result.success) {
        return;
    }
    assert.equal(result.status, 401);
});
