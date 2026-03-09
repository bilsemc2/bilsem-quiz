import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import {
    gainXPForCurrentSession,
    loadSessionUser,
    loadUserProfile,
    signOutUser,
    subscribeAuthState,
    touchUserLastSeen
} from '../../../../src/features/auth/model/authUseCases.ts';

const createUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-03-07T10:00:00.000Z',
    email: 'user@example.com',
    ...overrides
});

test('loadSessionUser and loadUserProfile delegate to auth repository', async () => {
    const sessionUser = await loadSessionUser({
        getSessionUser: async () => createUser()
    });

    const profile = await loadUserProfile('user-1', {
        getProfileByUserId: async (userId) => ({
            id: userId,
            email: 'user@example.com',
            name: 'Ada',
            experience: 120
        })
    });

    assert.equal(sessionUser?.id, 'user-1');
    assert.deepEqual(profile, {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Ada',
        experience: 120
    });
});

test('subscribeAuthState forwards callback values and exposes unsubscribe', () => {
    const receivedEvents: Array<{ userId: string | null; event: AuthChangeEvent; hasSession: boolean }> = [];
    let unsubscribed = false;

    const session = {
        access_token: 'token-1',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: 1_700_000_000,
        refresh_token: 'refresh-1',
        user: createUser()
    } as Session;

    const subscription = subscribeAuthState(
        (user, event, activeSession) => {
            receivedEvents.push({
                userId: user?.id ?? null,
                event,
                hasSession: Boolean(activeSession)
            });
        },
        {
            onAuthStateChange: (callback) => {
                callback(session.user, 'SIGNED_IN', session);
                return {
                    unsubscribe: () => {
                        unsubscribed = true;
                    }
                };
            }
        }
    );

    subscription.unsubscribe();

    assert.deepEqual(receivedEvents, [
        {
            userId: 'user-1',
            event: 'SIGNED_IN',
            hasSession: true
        }
    ]);
    assert.equal(unsubscribed, true);
});

test('touchUserLastSeen persists an ISO timestamp for the active user', async () => {
    let capturedUserId = '';
    let capturedTimestamp = '';

    await touchUserLastSeen('user-42', {
        updateLastSeen: async (userId, lastSeenISO) => {
            capturedUserId = userId;
            capturedTimestamp = lastSeenISO;
        }
    });

    assert.equal(capturedUserId, 'user-42');
    assert.notEqual(Number.isNaN(Date.parse(capturedTimestamp)), true);
});

test('signOutUser delegates sign-out to auth repository', async () => {
    let called = false;

    await signOutUser({
        signOut: async () => {
            called = true;
        }
    });

    assert.equal(called, true);
});

test('gainXPForCurrentSession returns unauthorized when access token is missing', async () => {
    const result = await gainXPForCurrentSession(
        15,
        'Zaman bazlı XP',
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
        error: 'Oturum bulunamadı',
        status: 401
    });
});

test('gainXPForCurrentSession executes a gain transaction with the active access token', async () => {
    const result = await gainXPForCurrentSession(
        20,
        'Ders tamamlama',
        {
            auth: {
                getAccessToken: async () => 'token-123'
            },
            xp: {
                executeXPTransaction: async (payload, accessToken) => {
                    assert.deepEqual(payload, {
                        action: 'gain',
                        amount: 20,
                        reason: 'Ders tamamlama'
                    });
                    assert.equal(accessToken, 'token-123');

                    return {
                        success: true as const,
                        newXP: 140,
                        change: 20
                    };
                }
            }
        }
    );

    assert.deepEqual(result, {
        success: true,
        newXP: 140,
        change: 20
    });
});
