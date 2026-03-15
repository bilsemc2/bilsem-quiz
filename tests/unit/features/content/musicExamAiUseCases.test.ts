import assert from 'node:assert/strict';
import test from 'node:test';
import {
    requestMusicExamAnalysis,
    requestMusicExamContent,
    requestMusicExamReport
} from '../../../../src/features/content/model/musicExamAiUseCases.ts';

test('requestMusicExamContent sends the expected payload with previous notes fallback', async () => {
    let receivedAccessToken: string | null | undefined;
    let receivedPayload: Record<string, unknown> | null = null;

    const response = await requestMusicExamContent<{ notes: string[] }>(
        {
            module: 'tek-ses',
            questionIndex: 2,
            totalQuestions: 6,
            difficulty: 3
        },
        {
            auth: {
                getAccessToken: async () => 'token-1'
            },
            proxy: {
                invokeGeminiProxy: async (payload, accessToken) => {
                    receivedPayload = payload;
                    receivedAccessToken = accessToken;
                    return { result: { notes: ['C4'] } };
                }
            }
        }
    );

    assert.equal(receivedAccessToken, 'token-1');
    assert.deepEqual(receivedPayload, {
        action: 'generateMusicExamContent',
        module: 'tek-ses',
        questionIndex: 2,
        totalQuestions: 6,
        difficulty: 3,
        previousNotes: []
    });
    assert.deepEqual(response, {
        result: { notes: ['C4'] },
        error: null,
        retryAfterSec: null
    });
});

test('requestMusicExamAnalysis includes audio metadata when provided', async () => {
    let receivedPayload: Record<string, unknown> | null = null;

    const response = await requestMusicExamAnalysis<{ score: number }>(
        {
            module: 'ritim',
            target: { beats: [1, 2] },
            detected: { beats: [1, 2] },
            questionIndex: 1,
            difficulty: 4,
            audioBase64: 'abc123',
            audioMimeType: 'audio/mp3'
        },
        {
            auth: {
                getAccessToken: async () => null
            },
            proxy: {
                invokeGeminiProxy: async (payload) => {
                    receivedPayload = payload;
                    return { result: { score: 90 }, retryAfterSec: 5 };
                }
            }
        }
    );

    assert.deepEqual(receivedPayload, {
        action: 'analyzeMusicExamPerformance',
        module: 'ritim',
        target: { beats: [1, 2] },
        detected: { beats: [1, 2] },
        questionIndex: 1,
        difficulty: 4,
        audioBase64: 'abc123',
        audioMimeType: 'audio/mp3'
    });
    assert.equal(response.result?.score, 90);
    assert.equal(response.retryAfterSec, 5);
});

test('requestMusicExamReport maps proxy errors without throwing', async () => {
    const response = await requestMusicExamReport<{ overallScore: number }>(
        {
            moduleScores: [
                {
                    module: 'ezgi',
                    earnedPoints: 12,
                    maxPoints: 20,
                    details: 'iyi'
                }
            ]
        },
        {
            auth: {
                getAccessToken: async () => 'token-2'
            },
            proxy: {
                invokeGeminiProxy: async () => ({ error: 'limit' })
            }
        }
    );

    assert.equal(response.result, null);
    assert.equal(response.error, 'limit');
    assert.equal(response.retryAfterSec, null);
});
