import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildAIOperationsAnalyticsData,
    createEmptyAIOperationsAnalyticsData
} from '../../../../src/features/admin/model/aiOperationsAnalyticsUseCases.ts';

test('buildAIOperationsAnalyticsData aggregates provider metrics, quality state and alerts', () => {
    const data = buildAIOperationsAnalyticsData({
        nowISO: '2026-03-08T12:00:00.000Z',
        jobs: [
            {
                id: 'job-1',
                topic: 'analitik düşünme',
                locale: 'tr',
                job_type: 'story_questions',
                requested_question_count: 10,
                generated_question_count: 10,
                status: 'completed',
                model_name: 'gpt-4o-mini',
                error_message: null,
                request_context: {
                    generationMetadata: {
                        providerName: 'openai'
                    }
                },
                response_summary: {
                    fallbackQuestionCount: 2,
                    cachedQuestionCount: 3,
                    requestedQuestionCount: 10,
                    receivedQuestionCount: 10,
                    telemetry: {
                        estimatedPromptTokens: 650,
                        estimatedCompletionTokens: 1350,
                        estimatedTotalTokens: 2000,
                        cacheReuseRate: 23.1
                    },
                    providerUsage: {
                        promptTokens: 720,
                        completionTokens: 1380,
                        totalTokens: 2100,
                        cachedTokens: 120
                    },
                    generationMetadata: {
                        providerName: 'openai'
                    }
                },
                started_at: '2026-03-07T10:00:00.000Z',
                completed_at: '2026-03-07T10:00:03.000Z',
                created_at: '2026-03-07T10:00:00.000Z'
            },
            {
                id: 'job-2',
                topic: 'sözel anlama',
                locale: 'tr',
                job_type: 'story_questions',
                requested_question_count: 8,
                generated_question_count: 0,
                status: 'failed',
                model_name: 'gemini-3-flash-preview',
                error_message: 'provider timeout',
                request_context: {
                    generationMetadata: {
                        providerName: 'gemini'
                    }
                },
                response_summary: {
                    telemetry: {
                        estimatedPromptTokens: 650,
                        estimatedCompletionTokens: 0,
                        estimatedTotalTokens: 650,
                        cacheReuseRate: 0
                    },
                    generationMetadata: {
                        providerName: 'gemini'
                    }
                },
                started_at: '2026-03-07T11:00:00.000Z',
                completed_at: '2026-03-07T11:00:06.000Z',
                created_at: '2026-03-07T11:00:00.000Z'
            },
            {
                id: 'job-3',
                topic: 'hafıza',
                locale: 'tr',
                job_type: 'story_questions',
                requested_question_count: 5,
                generated_question_count: 5,
                status: 'completed',
                model_name: 'gemini-3-flash-preview',
                error_message: null,
                request_context: {
                    generationMetadata: {
                        providerName: 'gemini'
                    }
                },
                response_summary: {
                    fallbackQuestionCount: 1,
                    cachedQuestionCount: 1,
                    requestedQuestionCount: 5,
                    receivedQuestionCount: 5,
                    providerUsage: {
                        promptTokens: 500,
                        completionTokens: 900,
                        totalTokens: 1400,
                        cachedTokens: 50
                    },
                    generationMetadata: {
                        providerName: 'gemini'
                    }
                },
                started_at: '2026-03-08T09:00:00.000Z',
                completed_at: '2026-03-08T09:00:02.000Z',
                created_at: '2026-03-08T09:00:00.000Z'
            }
        ],
        questions: [
            {
                id: 'q-1',
                topic: 'analitik düşünme',
                locale: 'tr',
                source: 'ai',
                model_name: 'gpt-4o-mini',
                prompt_version: 'aq.logic.core.v1.0.0',
                review_status: 'active',
                review_notes: {
                    qualityRubricScore: 96,
                    qualityRubricBand: 'excellent',
                    reviewedAtISO: '2026-03-08T10:00:00.000Z'
                },
                difficulty_level: 3,
                stem: 'Sıradaki sayı örüntüsünde hangi sayı gelmelidir?',
                options: ['8', '9', '10', '11'],
                explanation: 'Dizi ikişer arttığı için doğru cevap 10 olur.',
                created_at: '2026-03-08T09:30:00.000Z'
            },
            {
                id: 'q-2',
                topic: 'analitik düşünme',
                locale: 'tr',
                source: 'fallback',
                model_name: null,
                prompt_version: 'aq.logic.core.v1.0.0',
                review_status: 'rejected',
                review_notes: {
                    qualityRubricScore: 58,
                    qualityRubricBand: 'poor',
                    reasons: ['failed_safety_checks'],
                    reviewedAtISO: '2026-03-08T11:30:00.000Z'
                },
                difficulty_level: 3,
                stem: 'Kısa?',
                options: ['A', 'B', 'C', 'D'],
                explanation: 'Kısa.',
                created_at: '2026-03-08T10:30:00.000Z'
            }
        ]
    });

    assert.equal(data.totalJobs, 3);
    assert.equal(data.completedJobs, 2);
    assert.equal(data.failedJobs, 1);
    assert.equal(data.pendingJobs, 0);
    assert.equal(data.averageLatencyMs, 2500);
    assert.equal(data.failureRate, 33.3);
    assert.equal(data.fallbackRate, 20);
    assert.equal(data.cacheReuseRate, 21.1);
    assert.equal(data.estimatedTotalTokens, 3500);
    assert.equal(data.estimatedCostUsd, 0.001346);
    assert.equal(data.last24hEstimatedCostUsd, 0.00041);
    assert.equal(data.previous24hEstimatedCostUsd, 0.000936);
    assert.equal(data.costTrendRate, -56.2);
    assert.equal(data.cacheSavedTokens, 170);
    assert.equal(data.estimatedCacheSavingsUsd, 0.000023);
    assert.equal(data.averageQualityScore, 77);
    assert.equal(data.lowQualityQuestionCount, 1);
    assert.equal(data.reviewedQuestionCount, 2);
    assert.equal(data.approvalRate, 50);
    assert.equal(data.approvedLast24h, 1);
    assert.equal(data.averageReviewTurnaroundMinutes, 45);
    assert.equal(data.reviewBreakdown.active, 1);
    assert.equal(data.reviewBreakdown.rejected, 1);
    assert.equal(data.sourceBreakdown.ai, 1);
    assert.equal(data.sourceBreakdown.fallback, 1);
    const openaiSummary = data.providerSummaries.find((summary) => summary.providerName === 'openai');
    const geminiSummary = data.providerSummaries.find((summary) => summary.providerName === 'gemini');
    assert.equal(openaiSummary?.fallbackRate, 20);
    assert.equal(openaiSummary?.cacheReuseRate, 23.1);
    assert.equal(openaiSummary?.estimatedTotalTokens, 2100);
    assert.equal(openaiSummary?.estimatedCostUsd, 0.000936);
    assert.equal(openaiSummary?.cacheSavedTokens, 120);
    assert.equal(openaiSummary?.estimatedCacheSavingsUsd, 0.000018);
    assert.equal(geminiSummary?.totalJobs, 2);
    assert.equal(geminiSummary?.estimatedCostUsd, 0.00041);
    assert.equal(data.recentJobs[0]?.modelName, 'gpt-4o-mini');
    assert.equal(data.recentJobs[0]?.estimatedCostUsd, 0.000936);
    assert.equal(data.modelSummaries[0]?.modelName, 'gpt-4o-mini');
    assert.equal(data.modelSummaries[0]?.estimatedCacheSavingsUsd, 0.000018);
    assert.equal(data.modelSummaries[1]?.modelName, 'gemini-3-flash-preview');
    assert.equal(data.modelSummaries[1]?.cacheSavedTokens, 50);
    assert.ok(data.alerts.some((alert) => alert.code === 'fallback_warning'));
    assert.ok(data.alerts.some((alert) => alert.code === 'failure_critical'));
    assert.ok(data.alerts.some((alert) => alert.code === 'quality_score_warning'));
});

test('createEmptyAIOperationsAnalyticsData returns safe defaults', () => {
    assert.deepEqual(createEmptyAIOperationsAnalyticsData(), {
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        pendingJobs: 0,
        failureRate: 0,
        fallbackRate: 0,
        cacheReuseRate: 0,
        averageLatencyMs: 0,
        estimatedTotalTokens: 0,
        estimatedCostUsd: 0,
        last24hEstimatedCostUsd: 0,
        previous24hEstimatedCostUsd: 0,
        costTrendRate: 0,
        cacheSavedTokens: 0,
        estimatedCacheSavingsUsd: 0,
        averageQualityScore: 0,
        lowQualityQuestionCount: 0,
        reviewedQuestionCount: 0,
        approvalRate: 0,
        approvedLast24h: 0,
        averageReviewTurnaroundMinutes: 0,
        reviewBreakdown: {
            candidate: 0,
            active: 0,
            rejected: 0
        },
        sourceBreakdown: {
            ai: 0,
            fallback: 0,
            bank: 0
        },
        providerSummaries: [],
        modelSummaries: [],
        recentJobs: [],
        alerts: []
    });
});
