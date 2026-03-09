import assert from 'node:assert/strict';
import test from 'node:test';
import { createChainedQuestionProvider } from '../../../../src/server/ai/providers/createChainedQuestionProvider.ts';
import type { AIQuestionProviderInput } from '../../../../src/features/ai/model/types.ts';

const sampleInput: AIQuestionProviderInput = {
    topic: 'mantik',
    locale: 'tr',
    difficultyLevel: 2,
    abilitySnapshot: {
        userId: 'user-1',
        overallScore: 55,
        dimensions: {
            memory: 55,
            logic: 55,
            attention: 55,
            verbal: 55,
            spatial: 55,
            processing_speed: 55
        },
        updatedAtISO: '2026-03-07T12:00:00.000Z'
    },
    sessionPerformance: {
        recentAccuracy: 0.7,
        averageResponseMs: 3500,
        targetResponseMs: 4000,
        streakCorrect: 1,
        consecutiveWrong: 0
    },
    previousQuestionIds: [],
    previousQuestionFingerprints: []
};

test('createChainedQuestionProvider returns the first successful provider result', async () => {
    const provider = createChainedQuestionProvider([
        {
            name: 'primary',
            provider: {
                generateQuestion: async () => ({
                    question: null,
                    metadata: {
                        providerName: 'primary',
                        modelName: 'm1',
                        promptVersion: 'p1',
                        promptProfileId: 'logic.core'
                    }
                })
            }
        },
        {
            name: 'secondary',
            provider: {
                generateQuestion: async () => ({
                    question: {
                        id: 'q-1',
                        topic: 'mantik',
                        stem: '1, 2, 3, ?',
                        options: ['4', '5', '6', '7'],
                        correctIndex: 0,
                        explanation: 'Birer artar.',
                        difficultyLevel: 2,
                        source: 'ai'
                    },
                    metadata: {
                        providerName: 'secondary',
                        modelName: 'm2',
                        promptVersion: 'p2',
                        promptProfileId: 'logic.core'
                    }
                })
            }
        }
    ]);

    const result = await provider.generateQuestion(sampleInput);

    assert.equal(result.question?.id, 'q-1');
    assert.equal(result.metadata.providerName, 'secondary');
});

test('createChainedQuestionProvider returns null if all providers fail', async () => {
    const provider = createChainedQuestionProvider([
        {
            name: 'primary',
            provider: {
                generateQuestion: async () => ({
                    question: null,
                    metadata: {
                        providerName: 'primary',
                        modelName: 'm1',
                        promptVersion: 'p1',
                        promptProfileId: 'logic.core'
                    }
                })
            }
        },
        {
            name: 'secondary',
            provider: {
                generateQuestion: async () => ({
                    question: null,
                    metadata: {
                        providerName: 'secondary',
                        modelName: 'm2',
                        promptVersion: 'p2',
                        promptProfileId: 'logic.advanced'
                    }
                })
            }
        }
    ]);

    const result = await provider.generateQuestion(sampleInput);

    assert.equal(result.question, null);
    assert.equal(result.metadata.providerName, 'secondary');
});
