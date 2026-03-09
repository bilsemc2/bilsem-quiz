import assert from 'node:assert/strict';
import test from 'node:test';
import {
    checkXPBalance,
    loadXPRequirementsMap,
    performXPTransaction
} from '../../../../src/features/xp/model/xpUseCases.ts';

test('loadXPRequirementsMap normalizes repository rows into a page map', async () => {
    const result = await loadXPRequirementsMap(
        ['/games/stroop', '/atolyeler/muzik-sinav'],
        {
            getXPRequirementsForPaths: async () => [
                { pagePath: '/games/stroop', requiredXP: 15 },
                { pagePath: '/atolyeler/muzik-sinav', requiredXP: 50 }
            ]
        }
    );

    assert.deepEqual(result, {
        '/games/stroop': 15,
        '/atolyeler/muzik-sinav': 50
    });
});

test('checkXPBalance returns false when user XP is unavailable and true when balance is sufficient', async () => {
    const missingBalance = await checkXPBalance(
        {
            userId: 'user-1',
            requiredAmount: 20
        },
        {
            getExperienceByUserId: async () => null
        }
    );

    const sufficientBalance = await checkXPBalance(
        {
            userId: 'user-1',
            requiredAmount: 20
        },
        {
            getExperienceByUserId: async () => 35
        }
    );

    assert.equal(missingBalance, false);
    assert.equal(sufficientBalance, true);
});

test('performXPTransaction returns unauthorized when session token is missing', async () => {
    const result = await performXPTransaction(
        {
            action: 'deduct',
            amount: 12,
            reason: 'Atolye girisi'
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

test('performXPTransaction delegates gain and deduct requests with the active token', async () => {
    const capturedPayloads: Array<{ action: 'gain' | 'deduct'; amount: number; reason?: string }> = [];

    const gainResult = await performXPTransaction(
        {
            action: 'gain',
            amount: 25,
            reason: 'Basari odulu'
        },
        {
            auth: {
                getAccessToken: async () => 'token-123'
            },
            xp: {
                executeXPTransaction: async (payload, accessToken) => {
                    capturedPayloads.push(payload);
                    assert.equal(accessToken, 'token-123');

                    return {
                        success: true as const,
                        newXP: 125,
                        change: 25
                    };
                }
            }
        }
    );

    const deductResult = await performXPTransaction(
        {
            action: 'deduct',
            amount: 10,
            reason: 'Sayfa girisi'
        },
        {
            auth: {
                getAccessToken: async () => 'token-123'
            },
            xp: {
                executeXPTransaction: async (payload, accessToken) => {
                    capturedPayloads.push(payload);
                    assert.equal(accessToken, 'token-123');

                    return {
                        success: true as const,
                        newXP: 115,
                        change: -10
                    };
                }
            }
        }
    );

    assert.deepEqual(capturedPayloads, [
        {
            action: 'gain',
            amount: 25,
            reason: 'Basari odulu'
        },
        {
            action: 'deduct',
            amount: 10,
            reason: 'Sayfa girisi'
        }
    ]);
    assert.deepEqual(gainResult, {
        success: true,
        newXP: 125,
        change: 25
    });
    assert.deepEqual(deductResult, {
        success: true,
        newXP: 115,
        change: -10
    });
});
