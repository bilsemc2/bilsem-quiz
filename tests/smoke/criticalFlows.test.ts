import assert from 'node:assert/strict';
import test from 'node:test';
import type { User } from '@supabase/supabase-js';
import { loadSessionUser, loadUserProfile } from '../../src/features/auth/model/authUseCases.ts';
import { persistCompletedExamSession } from '../../src/features/exam/model/examSessionUseCases.ts';
import { persistGamePlay } from '../../src/features/games/model/gamePlayUseCases.ts';
import { performXPTransaction } from '../../src/features/xp/model/xpUseCases.ts';
import { ok } from '../../src/shared/types/result.ts';

const createUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-03-07T10:00:00.000Z',
    email: 'user@example.com',
    ...overrides
});

test('critical flow smoke covers login, XP spend, game save and exam completion', async () => {
    const timeline: string[] = [];

    const sessionUser = await loadSessionUser({
        getSessionUser: async () => {
            timeline.push('session');
            return createUser();
        }
    });

    const profile = await loadUserProfile('user-1', {
        getProfileByUserId: async (userId) => {
            timeline.push('profile');
            return {
                id: userId,
                email: 'user@example.com',
                name: 'Ada',
                experience: 120
            };
        }
    });

    const xpResult = await performXPTransaction(
        {
            action: 'deduct',
            amount: 15,
            reason: 'Oyun girisi'
        },
        {
            auth: {
                getAccessToken: async () => {
                    timeline.push('token');
                    return 'token-123';
                }
            },
            xp: {
                executeXPTransaction: async (payload, accessToken) => {
                    timeline.push(`xp:${payload.action}`);
                    assert.equal(accessToken, 'token-123');

                    return {
                        success: true as const,
                        newXP: 105,
                        change: -payload.amount
                    };
                }
            }
        }
    );

    const gameSaveResult = await persistGamePlay(
        {
            userId: 'user-1',
            gameId: 'stroop',
            scoreAchieved: 88,
            durationSeconds: 42,
            metadata: {
                game_name: 'Stroop'
            }
        },
        {
            createGamePlay: async (input) => {
                timeline.push(`game:${input.gameId}`);
                assert.equal(input.userId, 'user-1');
                return ok(undefined);
            }
        }
    );

    const examSaveResult = await persistCompletedExamSession(
        {
            id: 'exam-1',
            userId: 'user-1',
            startedAt: new Date('2026-03-07T10:00:00.000Z'),
            completedAt: new Date('2026-03-07T10:20:00.000Z'),
            moduleCount: 8,
            results: [{ moduleId: 'm1', score: 8, passed: true }],
            finalScore: 80,
            bzpScore: 118,
            abilityEstimate: '1.20'
        },
        {
            saveExamSession: async (input) => {
                timeline.push(`exam:${input.id}`);
                assert.equal(input.userId, 'user-1');
                return ok(undefined);
            }
        }
    );

    assert.equal(sessionUser?.id, 'user-1');
    assert.equal(profile?.experience, 120);
    assert.deepEqual(xpResult, {
        success: true,
        newXP: 105,
        change: -15
    });
    assert.equal(gameSaveResult.ok, true);
    assert.equal(examSaveResult.ok, true);
    assert.deepEqual(timeline, [
        'session',
        'profile',
        'token',
        'xp:deduct',
        'game:stroop',
        'exam:exam-1'
    ]);
});

test('critical flow smoke blocks XP spend when the active session is missing', async () => {
    const result = await performXPTransaction(
        {
            action: 'deduct',
            amount: 15,
            reason: 'Oyun girisi'
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
