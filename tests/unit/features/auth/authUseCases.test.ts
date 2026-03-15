import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuthRepository } from '../../../../src/server/repositories/authRepository.ts';
import {
    loadSessionAccessToken,
    loadSessionUserId,
    registerUser,
    resetUserPassword,
    signInUser,
    signUpEmailPassword
} from '../../../../src/features/auth/model/authUseCases.ts';

test('signInUser maps invalid credential errors to a friendly message', async () => {
    await assert.rejects(
        () =>
            signInUser(
                { email: 'ada@example.com', password: 'wrong-password' },
                {
                    signInWithPassword: async () => {
                        throw new Error('Invalid login credentials');
                    }
                }
            ),
        /Email veya şifre hatalı/
    );
});

test('registerUser completes profile, signs in, and keeps signup successful when referral XP fails', async () => {
    const calls: {
        referrerCode?: string;
        profile?: Parameters<
            Pick<AuthRepository, 'completeRegistrationProfile'>['completeRegistrationProfile']
        >[0];
        signedIn?: boolean;
    } = {};
    const originalConsoleError = console.error;
    console.error = () => {};

    try {
        const result = await registerUser(
            {
                email: 'ada@example.com',
                name: 'Ada Lovelace',
                school: 'Bilsem',
                grade: '4',
                password: 'secret1',
                confirmPassword: 'secret1',
                referralCode: 'ARKADAS'
            },
            {
                getReferrerIdByCode: async (referralCode) => {
                    calls.referrerCode = referralCode;
                    return 'ref-user-1';
                },
                signUpWithPassword: async () => ({ id: 'user-1' } as never),
                completeRegistrationProfile: async (profile) => {
                    calls.profile = profile;
                },
                incrementXP: async () => {
                    throw new Error('rpc unavailable');
                },
                signInWithPassword: async () => {
                    calls.signedIn = true;
                    return { id: 'user-1' } as never;
                }
            }
        );

        assert.deepEqual(result, {
            startingXP: 50,
            referralBonusGranted: true
        });
        assert.equal(calls.referrerCode, 'ARKADAS');
        assert.equal(calls.profile?.userId, 'user-1');
        assert.equal(calls.profile?.grade, 4);
        assert.equal(calls.profile?.referredBy, 'ARKADAS');
        assert.equal(calls.profile?.experience, 50);
        assert.match(calls.profile?.avatarUrl ?? '', /seed=Ada%20Lovelace/);
        assert.equal(calls.signedIn, true);
    } finally {
        console.error = originalConsoleError;
    }
});

test('resetUserPassword ignores AuthSessionMissingError after updating the password', async () => {
    let updatePasswordArg: string | null = null;

    await resetUserPassword(
        {
            newPassword: 'new-password',
            confirmPassword: 'new-password'
        },
        {
            updatePassword: async (password) => {
                updatePasswordArg = password;
            },
            signOut: async () => {
                const error = new Error('session missing');
                error.name = 'AuthSessionMissingError';
                throw error;
            }
        }
    );

    assert.equal(updatePasswordArg, 'new-password');
});

test('signUpEmailPassword forwards metadata to the repository', async () => {
    let receivedMetadata: Record<string, unknown> | undefined;

    await signUpEmailPassword(
        {
            email: 'ada@example.com',
            password: 'secret1',
            metadata: {
                source: 'story'
            }
        },
        {
            signUpWithPassword: async (input) => {
                receivedMetadata = input.metadata;
                return null;
            }
        }
    );

    assert.deepEqual(receivedMetadata, {
        source: 'story'
    });
});

test('signUpEmailPassword maps already-registered errors to a friendly message', async () => {
    await assert.rejects(
        () =>
            signUpEmailPassword(
                {
                    email: 'ada@example.com',
                    password: 'secret1'
                },
                {
                    signUpWithPassword: async () => {
                        throw new Error('User already registered');
                    }
                }
            ),
        /Bu email ile zaten bir hesap var/
    );
});

test('loadSessionAccessToken returns the access token from the repository', async () => {
    const accessToken = await loadSessionAccessToken({
        getAccessToken: async () => 'token-123'
    });

    assert.equal(accessToken, 'token-123');
});

test('loadSessionUserId resolves the active session user id', async () => {
    const userId = await loadSessionUserId({
        getSessionUser: async () => ({ id: 'user-99' }) as never
    });

    assert.equal(userId, 'user-99');
});
