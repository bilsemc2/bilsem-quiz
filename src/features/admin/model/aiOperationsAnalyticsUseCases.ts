import type {
    AdminAIGenerationJobRecord,
    AdminAIQuestionRecord
} from '@/server/repositories/aiOperationsRepository';
import {
    estimateCachedPromptSavings,
    estimateQuestionGenerationCost
} from '@/features/ai/question-generation/model/generationCostModel.ts';
import { estimateQuestionGenerationTelemetry } from '@/features/ai/question-generation/model/generationTelemetryModel';
import { normalizeProviderUsage } from '@/features/ai/question-generation/model/providerUsageModel.ts';
import { scoreQuestionQuality } from '@/features/ai/quality-safety/model/questionQualityRubric';

export interface AIOperationsAlert {
    severity: 'warning' | 'critical';
    code: string;
    message: string;
}

export interface AIOperationsProviderSummary {
    providerName: string;
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    averageLatencyMs: number;
    fallbackRate: number;
    cacheReuseRate: number;
    estimatedTotalTokens: number;
    estimatedCostUsd: number;
    cacheSavedTokens: number;
    estimatedCacheSavingsUsd: number;
}

export interface AIOperationsModelSummary {
    providerName: string;
    modelName: string;
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    averageLatencyMs: number;
    estimatedTotalTokens: number;
    estimatedCostUsd: number;
    cacheSavedTokens: number;
    estimatedCacheSavingsUsd: number;
}

export interface AIOperationsReviewBreakdown {
    candidate: number;
    active: number;
    rejected: number;
}

export interface AIOperationsSourceBreakdown {
    ai: number;
    fallback: number;
    bank: number;
}

export interface AIOperationsRecentJob {
    id: string;
    providerName: string;
    modelName: string | null;
    topic: string;
    status: string;
    latencyMs: number | null;
    requestedQuestionCount: number;
    generatedQuestionCount: number;
    fallbackQuestionCount: number;
    estimatedCostUsd: number;
    createdAt: string;
    errorMessage: string | null;
}

export interface AIOperationsAnalyticsData {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    pendingJobs: number;
    failureRate: number;
    fallbackRate: number;
    cacheReuseRate: number;
    averageLatencyMs: number;
    estimatedTotalTokens: number;
    estimatedCostUsd: number;
    last24hEstimatedCostUsd: number;
    previous24hEstimatedCostUsd: number;
    costTrendRate: number;
    cacheSavedTokens: number;
    estimatedCacheSavingsUsd: number;
    averageQualityScore: number;
    lowQualityQuestionCount: number;
    reviewedQuestionCount: number;
    approvalRate: number;
    approvedLast24h: number;
    averageReviewTurnaroundMinutes: number;
    reviewBreakdown: AIOperationsReviewBreakdown;
    sourceBreakdown: AIOperationsSourceBreakdown;
    providerSummaries: AIOperationsProviderSummary[];
    modelSummaries: AIOperationsModelSummary[];
    recentJobs: AIOperationsRecentJob[];
    alerts: AIOperationsAlert[];
}

interface BuildAIOperationsAnalyticsInput {
    jobs: AdminAIGenerationJobRecord[];
    questions: AdminAIQuestionRecord[];
    recentJobLimit?: number;
    nowISO?: string;
}

const LATENCY_WARNING_MS = 2500;
const LATENCY_CRITICAL_MS = 5000;
const FALLBACK_WARNING_RATE = 15;
const FALLBACK_CRITICAL_RATE = 25;
const FAILURE_WARNING_RATE = 10;
const FAILURE_CRITICAL_RATE = 20;
const REVIEW_REJECTION_WARNING_RATE = 15;
const REVIEW_REJECTION_CRITICAL_RATE = 30;
const CACHE_REUSE_WARNING_RATE = 20;
const CACHE_REUSE_CRITICAL_RATE = 10;
const QUALITY_WARNING_SCORE = 80;
const QUALITY_CRITICAL_SCORE = 65;

const toSafeObject = (value: unknown): Record<string, unknown> | null => {
    if (!value) {
        return null;
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value) as unknown;
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
                ? parsed as Record<string, unknown>
                : null;
        } catch {
            return null;
        }
    }

    return typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
};

const toNumber = (value: unknown): number | null => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
};

const toRoundedRate = (value: number, total: number): number => {
    if (total <= 0) {
        return 0;
    }

    return Number(((value / total) * 100).toFixed(1));
};

const getGenerationMetadata = (
    job: AdminAIGenerationJobRecord
): Record<string, unknown> | null => {
    const responseSummary = toSafeObject(job.response_summary);
    const responseMetadata = toSafeObject(responseSummary?.generationMetadata);
    if (responseMetadata) {
        return responseMetadata;
    }

    const requestContext = toSafeObject(job.request_context);
    return toSafeObject(requestContext?.generationMetadata);
};

const getProviderName = (job: AdminAIGenerationJobRecord): string => {
    const generationMetadata = getGenerationMetadata(job);
    const providerName = generationMetadata?.providerName;
    return typeof providerName === 'string' && providerName.trim().length > 0
        ? providerName
        : 'unknown';
};

const getModelName = (job: AdminAIGenerationJobRecord): string | null => {
    const generationMetadata = getGenerationMetadata(job);
    const metadataModelName = generationMetadata?.modelName;
    if (typeof metadataModelName === 'string' && metadataModelName.trim().length > 0) {
        return metadataModelName;
    }

    return typeof job.model_name === 'string' && job.model_name.trim().length > 0
        ? job.model_name
        : null;
};

const getLatencyMs = (job: AdminAIGenerationJobRecord): number | null => {
    if (!job.started_at || !job.completed_at) {
        return null;
    }

    const startedAt = Date.parse(job.started_at);
    const completedAt = Date.parse(job.completed_at);

    if (!Number.isFinite(startedAt) || !Number.isFinite(completedAt)) {
        return null;
    }

    return Math.max(0, completedAt - startedAt);
};

const getFallbackQuestionCount = (job: AdminAIGenerationJobRecord): number => {
    const responseSummary = toSafeObject(job.response_summary);
    const directFallbackCount = toNumber(responseSummary?.fallbackQuestionCount);
    if (directFallbackCount !== null) {
        return Math.max(0, Math.round(directFallbackCount));
    }

    const sources = toSafeObject(responseSummary?.sources);
    const sourceFallbackCount = toNumber(sources?.fallback);
    return sourceFallbackCount !== null
        ? Math.max(0, Math.round(sourceFallbackCount))
        : 0;
};

const getCachedQuestionCount = (job: AdminAIGenerationJobRecord): number => {
    const responseSummary = toSafeObject(job.response_summary);
    const directCachedCount = toNumber(responseSummary?.cachedQuestionCount);
    return directCachedCount !== null
        ? Math.max(0, Math.round(directCachedCount))
        : 0;
};

const getProviderUsage = (job: AdminAIGenerationJobRecord) => {
    const responseSummary = toSafeObject(job.response_summary);
    return normalizeProviderUsage(responseSummary?.providerUsage);
};

const getTelemetry = (job: AdminAIGenerationJobRecord) => {
    const estimatedTelemetry = estimateQuestionGenerationTelemetry({
        requestedQuestionCount: job.requested_question_count ?? 0,
        generatedQuestionCount: job.generated_question_count ?? 0,
        cachedQuestionCount: getCachedQuestionCount(job),
        requestContext: job.request_context
    });
    const responseSummary = toSafeObject(job.response_summary);
    const telemetry = toSafeObject(responseSummary?.telemetry);
    const providerUsage = getProviderUsage(job);

    if (providerUsage) {
        const promptTokens = providerUsage.promptTokens ?? estimatedTelemetry.estimatedPromptTokens;
        const completionTokens = providerUsage.completionTokens ?? estimatedTelemetry.estimatedCompletionTokens;
        const totalTokens = providerUsage.totalTokens
            ?? promptTokens + completionTokens;

        return {
            estimatedPromptTokens: promptTokens,
            estimatedCompletionTokens: completionTokens,
            estimatedTotalTokens: totalTokens,
            cacheReuseRate: estimatedTelemetry.cacheReuseRate
        };
    }

    if (telemetry) {
        return {
            estimatedPromptTokens: toNumber(telemetry.estimatedPromptTokens)
                ?? estimatedTelemetry.estimatedPromptTokens,
            estimatedCompletionTokens: toNumber(telemetry.estimatedCompletionTokens)
                ?? estimatedTelemetry.estimatedCompletionTokens,
            estimatedTotalTokens: toNumber(telemetry.estimatedTotalTokens)
                ?? estimatedTelemetry.estimatedTotalTokens,
            cacheReuseRate: toNumber(telemetry.cacheReuseRate)
                ?? estimatedTelemetry.cacheReuseRate
        };
    }

    return estimatedTelemetry;
};

const getReviewedAtMs = (question: AdminAIQuestionRecord): number | null => {
    const reviewNotes = toSafeObject(question.review_notes);
    const reviewedAtISO = reviewNotes?.reviewedAtISO;
    if (typeof reviewedAtISO !== 'string' || reviewedAtISO.trim().length === 0) {
        return null;
    }

    const reviewedAt = Date.parse(reviewedAtISO);
    return Number.isFinite(reviewedAt) ? reviewedAt : null;
};

const isReviewedQuestion = (question: AdminAIQuestionRecord): boolean => {
    return question.review_status === 'active'
        || question.review_status === 'rejected'
        || getReviewedAtMs(question) !== null;
};

const getReviewTurnaroundMinutes = (question: AdminAIQuestionRecord): number | null => {
    const reviewedAtMs = getReviewedAtMs(question);
    const createdAtMs = Date.parse(question.created_at);
    if (reviewedAtMs === null || !Number.isFinite(createdAtMs)) {
        return null;
    }

    const diffMs = reviewedAtMs - createdAtMs;
    if (diffMs < 0) {
        return null;
    }

    return Number((diffMs / 60000).toFixed(1));
};

const getEstimatedCost = (job: AdminAIGenerationJobRecord): number => {
    const telemetry = getTelemetry(job);
    return estimateQuestionGenerationCost({
        providerName: getProviderName(job),
        modelName: getModelName(job),
        estimatedPromptTokens: telemetry.estimatedPromptTokens,
        estimatedCompletionTokens: telemetry.estimatedCompletionTokens
    }).estimatedTotalCostUsd;
};

const getCachedTokenSavings = (job: AdminAIGenerationJobRecord) => {
    const cachedTokens = getProviderUsage(job)?.cachedTokens ?? 0;
    return estimateCachedPromptSavings({
        providerName: getProviderName(job),
        modelName: getModelName(job),
        cachedTokens
    });
};

const toTrendRate = (current: number, previous: number): number => {
    if (previous <= 0) {
        return current > 0 ? 100 : 0;
    }

    return Number((((current - previous) / previous) * 100).toFixed(1));
};

const getQuestionQualityScore = (question: AdminAIQuestionRecord): number => {
    const reviewNotes = toSafeObject(question.review_notes);
    const persistedScore = toNumber(reviewNotes?.qualityRubricScore);
    if (persistedScore !== null) {
        return Math.max(0, Math.min(100, Math.round(persistedScore)));
    }

    const reviewReasons = Array.isArray(reviewNotes?.reasons)
        ? reviewNotes.reasons.filter((reason): reason is string => typeof reason === 'string')
        : [];

    return scoreQuestionQuality({
        stem: question.stem,
        options: question.options as string[] | string,
        explanation: question.explanation,
        difficultyLevel: question.difficulty_level,
        reviewStatus: question.review_status,
        reviewReasons
    }).score;
};

const createAlert = (
    severity: 'warning' | 'critical',
    code: string,
    message: string
): AIOperationsAlert => ({
    severity,
    code,
    message
});

export const createEmptyAIOperationsAnalyticsData = (): AIOperationsAnalyticsData => ({
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

export const buildAIOperationsAnalyticsData = (
    input: BuildAIOperationsAnalyticsInput
): AIOperationsAnalyticsData => {
    if (input.jobs.length === 0 && input.questions.length === 0) {
        return createEmptyAIOperationsAnalyticsData();
    }

    const completedJobs = input.jobs.filter((job) => job.status === 'completed');
    const failedJobs = input.jobs.filter((job) => job.status === 'failed');
    const pendingJobs = input.jobs.filter((job) => job.status === 'pending');
    const latencyValues = completedJobs
        .map(getLatencyMs)
        .filter((value): value is number => value !== null);
    const latencyTotal = latencyValues.reduce((total, value) => total + value, 0);
    const telemetryValues = completedJobs.map(getTelemetry);
    const totalFallbackQuestions = completedJobs.reduce(
        (total, job) => total + getFallbackQuestionCount(job),
        0
    );
    const totalEstimatedTokens = telemetryValues.reduce(
        (total, telemetry) => total + telemetry.estimatedTotalTokens,
        0
    );
    const totalEstimatedCostUsd = completedJobs.reduce(
        (total, job) => total + getEstimatedCost(job),
        0
    );
    const totalCacheSavingsUsd = completedJobs.reduce(
        (total, job) => total + getCachedTokenSavings(job).estimatedCacheSavingsUsd,
        0
    );
    const totalCacheSavedTokens = completedJobs.reduce(
        (total, job) => total + getCachedTokenSavings(job).cachedTokens,
        0
    );
    const totalRequestedQuestions = completedJobs.reduce(
        (total, job) => total + Math.max(0, Math.round(job.requested_question_count ?? 0)),
        0
    );
    const totalCachedQuestions = completedJobs.reduce(
        (total, job) => total + getCachedQuestionCount(job),
        0
    );
    const qualityScores = input.questions.map(getQuestionQualityScore);
    const qualityScoreTotal = qualityScores.reduce((total, score) => total + score, 0);
    const lowQualityQuestionCount = qualityScores.filter((score) => score < QUALITY_WARNING_SCORE).length;
    const reviewedQuestions = input.questions.filter(isReviewedQuestion);
    const reviewTurnaroundValues = reviewedQuestions
        .map(getReviewTurnaroundMinutes)
        .filter((value): value is number => value !== null);

    const reviewBreakdown = input.questions.reduce<AIOperationsReviewBreakdown>(
        (totals, question) => {
            if (question.review_status === 'rejected') {
                totals.rejected += 1;
            } else if (question.review_status === 'active') {
                totals.active += 1;
            } else {
                totals.candidate += 1;
            }

            return totals;
        },
        { candidate: 0, active: 0, rejected: 0 }
    );

    const sourceBreakdown = input.questions.reduce<AIOperationsSourceBreakdown>(
        (totals, question) => {
            if (question.source === 'fallback') {
                totals.fallback += 1;
            } else if (question.source === 'bank') {
                totals.bank += 1;
            } else {
                totals.ai += 1;
            }

            return totals;
        },
        { ai: 0, fallback: 0, bank: 0 }
    );
    const nowMs = input.nowISO ? Date.parse(input.nowISO) : Date.now();

    const providerMap = new Map<string, {
        totalJobs: number;
        completedJobs: number;
        failedJobs: number;
        latencyTotal: number;
        latencyCount: number;
        fallbackQuestions: number;
        requestedQuestions: number;
        cachedQuestions: number;
        estimatedTotalTokens: number;
        estimatedCostUsd: number;
        cacheSavedTokens: number;
        estimatedCacheSavingsUsd: number;
    }>();
    const modelMap = new Map<string, {
        providerName: string;
        modelName: string;
        totalJobs: number;
        completedJobs: number;
        failedJobs: number;
        latencyTotal: number;
        latencyCount: number;
        estimatedTotalTokens: number;
        estimatedCostUsd: number;
        cacheSavedTokens: number;
        estimatedCacheSavingsUsd: number;
    }>();

    for (const job of input.jobs) {
        const providerName = getProviderName(job);
        const modelName = getModelName(job) ?? 'unknown';
        const current = providerMap.get(providerName) ?? {
            totalJobs: 0,
            completedJobs: 0,
            failedJobs: 0,
            latencyTotal: 0,
            latencyCount: 0,
            fallbackQuestions: 0,
            requestedQuestions: 0,
            cachedQuestions: 0,
            estimatedTotalTokens: 0,
            estimatedCostUsd: 0,
            cacheSavedTokens: 0,
            estimatedCacheSavingsUsd: 0
        };
        const modelKey = `${providerName}:${modelName}`;
        const currentModel = modelMap.get(modelKey) ?? {
            providerName,
            modelName,
            totalJobs: 0,
            completedJobs: 0,
            failedJobs: 0,
            latencyTotal: 0,
            latencyCount: 0,
            estimatedTotalTokens: 0,
            estimatedCostUsd: 0,
            cacheSavedTokens: 0,
            estimatedCacheSavingsUsd: 0
        };

        current.totalJobs += 1;
        currentModel.totalJobs += 1;

        if (job.status === 'completed') {
            const telemetry = getTelemetry(job);
            const estimatedCostUsd = getEstimatedCost(job);
            const cacheSavings = getCachedTokenSavings(job);
            current.completedJobs += 1;
            current.fallbackQuestions += getFallbackQuestionCount(job);
            current.requestedQuestions += Math.max(0, Math.round(job.requested_question_count ?? 0));
            current.cachedQuestions += getCachedQuestionCount(job);
            current.estimatedTotalTokens += telemetry.estimatedTotalTokens;
            current.estimatedCostUsd += estimatedCostUsd;
            current.cacheSavedTokens += cacheSavings.cachedTokens;
            current.estimatedCacheSavingsUsd += cacheSavings.estimatedCacheSavingsUsd;

            currentModel.completedJobs += 1;
            currentModel.estimatedTotalTokens += telemetry.estimatedTotalTokens;
            currentModel.estimatedCostUsd += estimatedCostUsd;
            currentModel.cacheSavedTokens += cacheSavings.cachedTokens;
            currentModel.estimatedCacheSavingsUsd += cacheSavings.estimatedCacheSavingsUsd;

            const latencyMs = getLatencyMs(job);
            if (latencyMs !== null) {
                current.latencyTotal += latencyMs;
                current.latencyCount += 1;
                currentModel.latencyTotal += latencyMs;
                currentModel.latencyCount += 1;
            }
        } else if (job.status === 'failed') {
            current.failedJobs += 1;
            currentModel.failedJobs += 1;
        }

        providerMap.set(providerName, current);
        modelMap.set(modelKey, currentModel);
    }

    const providerSummaries = Array.from(providerMap.entries())
        .map(([providerName, summary]) => ({
            providerName,
            totalJobs: summary.totalJobs,
            completedJobs: summary.completedJobs,
            failedJobs: summary.failedJobs,
            averageLatencyMs:
                summary.latencyCount > 0
                    ? Math.round(summary.latencyTotal / summary.latencyCount)
                    : 0,
            fallbackRate: toRoundedRate(summary.fallbackQuestions, summary.requestedQuestions),
            cacheReuseRate: toRoundedRate(
                summary.cachedQuestions,
                summary.requestedQuestions + summary.cachedQuestions
            ),
            estimatedTotalTokens: summary.estimatedTotalTokens,
            estimatedCostUsd: Number(summary.estimatedCostUsd.toFixed(6)),
            cacheSavedTokens: summary.cacheSavedTokens,
            estimatedCacheSavingsUsd: Number(summary.estimatedCacheSavingsUsd.toFixed(6))
        }))
        .sort((left, right) => right.totalJobs - left.totalJobs);
    const modelSummaries = Array.from(modelMap.values())
        .map((summary) => ({
            providerName: summary.providerName,
            modelName: summary.modelName,
            totalJobs: summary.totalJobs,
            completedJobs: summary.completedJobs,
            failedJobs: summary.failedJobs,
            averageLatencyMs:
                summary.latencyCount > 0
                    ? Math.round(summary.latencyTotal / summary.latencyCount)
                    : 0,
            estimatedTotalTokens: summary.estimatedTotalTokens,
            estimatedCostUsd: Number(summary.estimatedCostUsd.toFixed(6)),
            cacheSavedTokens: summary.cacheSavedTokens,
            estimatedCacheSavingsUsd: Number(summary.estimatedCacheSavingsUsd.toFixed(6))
        }))
        .sort((left, right) => right.estimatedCostUsd - left.estimatedCostUsd);

    const failureRate = toRoundedRate(failedJobs.length, input.jobs.length);
    const fallbackRate = toRoundedRate(totalFallbackQuestions, totalRequestedQuestions);
    const cacheReuseRate = toRoundedRate(
        totalCachedQuestions,
        totalRequestedQuestions + totalCachedQuestions
    );
    const averageLatencyMs =
        latencyValues.length > 0
            ? Math.round(latencyTotal / latencyValues.length)
            : 0;
    const averageQualityScore =
        qualityScores.length > 0
            ? Number((qualityScoreTotal / qualityScores.length).toFixed(1))
            : 0;
    const reviewedQuestionCount = reviewedQuestions.length;
    const approvalRate = toRoundedRate(
        reviewBreakdown.active,
        reviewBreakdown.active + reviewBreakdown.rejected
    );
    const approvedLast24h = Number.isFinite(nowMs)
        ? input.questions.filter((question) => {
            if (question.review_status !== 'active') {
                return false;
            }

            const reviewedAtMs = getReviewedAtMs(question);
            return reviewedAtMs !== null && reviewedAtMs >= nowMs - 24 * 60 * 60 * 1000;
        }).length
        : 0;
    const averageReviewTurnaroundMinutes =
        reviewTurnaroundValues.length > 0
            ? Number((
                reviewTurnaroundValues.reduce((total, value) => total + value, 0)
                / reviewTurnaroundValues.length
            ).toFixed(1))
            : 0;
    const last24hEstimatedCostUsd = Number.isFinite(nowMs)
        ? Number(completedJobs.reduce((total, job) => {
            const createdAtMs = Date.parse(job.created_at);
            return Number.isFinite(createdAtMs) && createdAtMs >= nowMs - 24 * 60 * 60 * 1000
                ? total + getEstimatedCost(job)
                : total;
        }, 0).toFixed(6))
        : 0;
    const previous24hEstimatedCostUsd = Number.isFinite(nowMs)
        ? Number(completedJobs.reduce((total, job) => {
            const createdAtMs = Date.parse(job.created_at);
            return Number.isFinite(createdAtMs)
                && createdAtMs >= nowMs - 48 * 60 * 60 * 1000
                && createdAtMs < nowMs - 24 * 60 * 60 * 1000
                ? total + getEstimatedCost(job)
                : total;
        }, 0).toFixed(6))
        : 0;
    const costTrendRate = toTrendRate(last24hEstimatedCostUsd, previous24hEstimatedCostUsd);

    const alerts: AIOperationsAlert[] = [];

    if (averageLatencyMs >= LATENCY_CRITICAL_MS) {
        alerts.push(createAlert('critical', 'latency_critical', `Ortalama AI yanıt süresi ${averageLatencyMs} ms oldu.`));
    } else if (averageLatencyMs >= LATENCY_WARNING_MS) {
        alerts.push(createAlert('warning', 'latency_warning', `Ortalama AI yanıt süresi ${averageLatencyMs} ms ile hedefi geçti.`));
    }

    if (fallbackRate >= FALLBACK_CRITICAL_RATE) {
        alerts.push(createAlert('critical', 'fallback_critical', `Fallback oranı %${fallbackRate} ile kritik eşiği geçti.`));
    } else if (fallbackRate >= FALLBACK_WARNING_RATE) {
        alerts.push(createAlert('warning', 'fallback_warning', `Fallback oranı %${fallbackRate} ile hedefin üstünde.`));
    }

    if (failureRate >= FAILURE_CRITICAL_RATE) {
        alerts.push(createAlert('critical', 'failure_critical', `AI job hata oranı %${failureRate} ile kritik seviyede.`));
    } else if (failureRate >= FAILURE_WARNING_RATE) {
        alerts.push(createAlert('warning', 'failure_warning', `AI job hata oranı %${failureRate} ile yükseldi.`));
    }

    if (cacheReuseRate <= CACHE_REUSE_CRITICAL_RATE && totalRequestedQuestions + totalCachedQuestions > 0) {
        alerts.push(createAlert('critical', 'cache_reuse_critical', `Cache reuse oranı %${cacheReuseRate} ile çok düşük.`));
    } else if (cacheReuseRate <= CACHE_REUSE_WARNING_RATE && totalRequestedQuestions + totalCachedQuestions > 0) {
        alerts.push(createAlert('warning', 'cache_reuse_warning', `Cache reuse oranı %${cacheReuseRate} ile hedefin altında.`));
    }

    const totalReviewedQuestions = reviewBreakdown.candidate + reviewBreakdown.active + reviewBreakdown.rejected;
    const rejectedRate = toRoundedRate(reviewBreakdown.rejected, totalReviewedQuestions);
    if (rejectedRate >= REVIEW_REJECTION_CRITICAL_RATE) {
        alerts.push(createAlert('critical', 'review_rejection_critical', `AI soru red oranı %${rejectedRate} ile kritik seviyede.`));
    } else if (rejectedRate >= REVIEW_REJECTION_WARNING_RATE) {
        alerts.push(createAlert('warning', 'review_rejection_warning', `AI soru red oranı %${rejectedRate} ile yükseldi.`));
    }

    if (averageQualityScore > 0 && averageQualityScore <= QUALITY_CRITICAL_SCORE) {
        alerts.push(createAlert('critical', 'quality_score_critical', `Ortalama kalite skoru ${averageQualityScore} seviyesine düştü.`));
    } else if (averageQualityScore > 0 && averageQualityScore <= QUALITY_WARNING_SCORE) {
        alerts.push(createAlert('warning', 'quality_score_warning', `Ortalama kalite skoru ${averageQualityScore} ile dikkat gerektiriyor.`));
    }

    const recentJobs = input.jobs
        .slice(0, input.recentJobLimit ?? 12)
        .map((job) => ({
            id: job.id,
            providerName: getProviderName(job),
            modelName: getModelName(job),
            topic: job.topic,
            status: job.status,
            latencyMs: getLatencyMs(job),
            requestedQuestionCount: Math.max(0, Math.round(job.requested_question_count ?? 0)),
            generatedQuestionCount: Math.max(0, Math.round(job.generated_question_count ?? 0)),
            fallbackQuestionCount: getFallbackQuestionCount(job),
            estimatedCostUsd: job.status === 'completed'
                ? getEstimatedCost(job)
                : 0,
            createdAt: job.created_at,
            errorMessage: job.error_message
        }));

    return {
        totalJobs: input.jobs.length,
        completedJobs: completedJobs.length,
        failedJobs: failedJobs.length,
        pendingJobs: pendingJobs.length,
        failureRate,
        fallbackRate,
        cacheReuseRate,
        averageLatencyMs,
        estimatedTotalTokens: totalEstimatedTokens,
        estimatedCostUsd: Number(totalEstimatedCostUsd.toFixed(6)),
        last24hEstimatedCostUsd,
        previous24hEstimatedCostUsd,
        costTrendRate,
        cacheSavedTokens: totalCacheSavedTokens,
        estimatedCacheSavingsUsd: Number(totalCacheSavingsUsd.toFixed(6)),
        averageQualityScore,
        lowQualityQuestionCount,
        reviewedQuestionCount,
        approvalRate,
        approvedLast24h,
        averageReviewTurnaroundMinutes,
        reviewBreakdown,
        sourceBreakdown,
        providerSummaries,
        modelSummaries,
        recentJobs,
        alerts
    };
};
