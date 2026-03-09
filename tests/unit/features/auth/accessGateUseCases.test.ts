import assert from 'node:assert/strict';
import test from 'node:test';
import { checkUserAccess, deductPageVisitXP } from '../../../../src/features/auth/model/accessGateService.ts';

test('checkUserAccessForPath denies access when profile is missing', async () => {
    const result = await checkUserAccess(
        {
            userId: 'user-1',
            pagePath: '/games/stroop'
        },
        {
            auth: {
                getAccessProfileByUserId: async () => null
            },
            xp: {
                getXPRequirementForPath: async () => 10
            }
        }
    );

    assert.equal(result.hasAccess, false);
    assert.equal(result.reason, 'role');
    assert.equal(result.requiredXP, 0);
});

test('checkUserAccessForPath skips XP lookup when skipXPCheck is enabled', async () => {
    let xpLookupCount = 0;

    const result = await checkUserAccess(
        {
            userId: 'user-1',
            pagePath: '/profile',
            skipXPCheck: true
        },
        {
            auth: {
                getAccessProfileByUserId: async () => ({
                    is_admin: false,
                    role: 'student',
                    yetenek_alani: null,
                    experience: 0
                })
            },
            xp: {
                getXPRequirementForPath: async () => {
                    xpLookupCount += 1;
                    return 99;
                }
            }
        }
    );

    assert.equal(result.hasAccess, true);
    assert.equal(result.reason, null);
    assert.equal(result.requiredXP, 0);
    assert.equal(xpLookupCount, 0);
});

test('checkUserAccessForPath returns talent denial details', async () => {
    const result = await checkUserAccess(
        {
            userId: 'user-1',
            pagePath: '/atolyeler/muzik-sinav',
            requiredTalent: 'Müzik'
        },
        {
            auth: {
                getAccessProfileByUserId: async () => ({
                    is_admin: false,
                    role: 'student',
                    yetenek_alani: ['Resim'],
                    experience: 120
                })
            },
            xp: {
                getXPRequirementForPath: async () => 20
            }
        }
    );

    assert.equal(result.hasAccess, false);
    assert.equal(result.reason, 'talent');
    assert.deepEqual(result.userTalent, ['Resim']);
    assert.equal(result.requiredXP, 20);
});

test('deductXPForPageVisit returns noop result when required XP is zero', async () => {
    const result = await deductPageVisitXP(
        {
            pagePath: '/profile',
            requiredXP: 0
        },
        {
            auth: {
                getAccessToken: async () => {
                    throw new Error('should not be called');
                }
            },
            xp: {
                executeXPTransaction: async () => {
                    throw new Error('should not be called');
                }
            }
        }
    );

    assert.deepEqual(result, {
        success: true,
        newXP: 0,
        change: 0
    });
});

test('deductXPForPageVisit returns unauthorized when access token is missing', async () => {
    const result = await deductPageVisitXP(
        {
            pagePath: '/games/stroop',
            requiredXP: 15
        },
        {
            auth: {
                getAccessToken: async () => null
            },
            xp: {
                executeXPTransaction: async () => {
                    throw new Error('should not be called');
                }
            }
        }
    );

    assert.deepEqual(result, {
        success: false,
        status: 401,
        error: 'Oturum bulunamadı'
    });
});

test('deductXPForPageVisit delegates transaction execution when token exists', async () => {
    const result = await deductPageVisitXP(
        {
            pagePath: '/games/stroop',
            requiredXP: 15
        },
        {
            auth: {
                getAccessToken: async () => 'token-123'
            },
            xp: {
                executeXPTransaction: async (payload, accessToken) => ({
                    success: true as const,
                    newXP: 85,
                    change: -payload.amount,
                    accessToken
                })
            }
        }
    );

    assert.deepEqual(result, {
        success: true,
        newXP: 85,
        change: -15,
        accessToken: 'token-123'
    });
});
