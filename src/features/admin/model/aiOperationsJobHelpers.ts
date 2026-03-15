// AI Operations Analytics — Job data extraction helpers

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

import type { AIOperationsAlert } from './aiOperationsAnalyticsTypes.ts';

// ── Primitive helpers ──────────────────────────────────────

export const toSafeObject = (value: unknown): Record<string, unknown> | null => {
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

export const toNumber = (value: unknown): number | null => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
};

export const toRoundedRate = (value: number, total: number): number => {
    if (total <= 0) {
        return 0;
    }

    return Number(((value / total) * 100).toFixed(1));
};

export const toTrendRate = (current: number, previous: number): number => {
    if (previous <= 0) {
        return current > 0 ? 100 : 0;
    }

    return Number((((current - previous) / previous) * 100).toFixed(1));
};

export const createAlert = (
    severity: 'warning' | 'critical',
    code: string,
    message: string
): AIOperationsAlert => ({
    severity,
    code,
    message
});

// ── Job metadata extraction ────────────────────────────────

export const getGenerationMetadata = (
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

export const getProviderName = (job: AdminAIGenerationJobRecord): string => {
    const generationMetadata = getGenerationMetadata(job);
    const providerName = generationMetadata?.providerName;
    return typeof providerName === 'string' && providerName.trim().length > 0
        ? providerName
        : 'unknown';
};

export const getModelName = (job: AdminAIGenerationJobRecord): string | null => {
    const generationMetadata = getGenerationMetadata(job);
    const metadataModelName = generationMetadata?.modelName;
    if (typeof metadataModelName === 'string' && metadataModelName.trim().length > 0) {
        return metadataModelName;
    }

    return typeof job.model_name === 'string' && job.model_name.trim().length > 0
        ? job.model_name
        : null;
};

export const getLatencyMs = (job: AdminAIGenerationJobRecord): number | null => {
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

export const getFallbackQuestionCount = (job: AdminAIGenerationJobRecord): number => {
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

export const getCachedQuestionCount = (job: AdminAIGenerationJobRecord): number => {
    const responseSummary = toSafeObject(job.response_summary);
    const directCachedCount = toNumber(responseSummary?.cachedQuestionCount);
    return directCachedCount !== null
        ? Math.max(0, Math.round(directCachedCount))
        : 0;
};

export const getProviderUsage = (job: AdminAIGenerationJobRecord) => {
    const responseSummary = toSafeObject(job.response_summary);
    return normalizeProviderUsage(responseSummary?.providerUsage);
};

export const getTelemetry = (job: AdminAIGenerationJobRecord) => {
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

export const getEstimatedCost = (job: AdminAIGenerationJobRecord): number => {
    const telemetry = getTelemetry(job);
    return estimateQuestionGenerationCost({
        providerName: getProviderName(job),
        modelName: getModelName(job),
        estimatedPromptTokens: telemetry.estimatedPromptTokens,
        estimatedCompletionTokens: telemetry.estimatedCompletionTokens
    }).estimatedTotalCostUsd;
};

export const getCachedTokenSavings = (job: AdminAIGenerationJobRecord) => {
    const cachedTokens = getProviderUsage(job)?.cachedTokens ?? 0;
    return estimateCachedPromptSavings({
        providerName: getProviderName(job),
        modelName: getModelName(job),
        cachedTokens
    });
};

// ── Question helpers ───────────────────────────────────────

export const getReviewedAtMs = (question: AdminAIQuestionRecord): number | null => {
    const reviewNotes = toSafeObject(question.review_notes);
    const reviewedAtISO = reviewNotes?.reviewedAtISO;
    if (typeof reviewedAtISO !== 'string' || reviewedAtISO.trim().length === 0) {
        return null;
    }

    const reviewedAt = Date.parse(reviewedAtISO);
    return Number.isFinite(reviewedAt) ? reviewedAt : null;
};

export const isReviewedQuestion = (question: AdminAIQuestionRecord): boolean => {
    return question.review_status === 'active'
        || question.review_status === 'rejected'
        || getReviewedAtMs(question) !== null;
};

export const getReviewTurnaroundMinutes = (question: AdminAIQuestionRecord): number | null => {
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

export const getQuestionQualityScore = (question: AdminAIQuestionRecord): number => {
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

// ── Alert threshold constants ──────────────────────────────

export const LATENCY_WARNING_MS = 2500;
export const LATENCY_CRITICAL_MS = 5000;
export const FALLBACK_WARNING_RATE = 15;
export const FALLBACK_CRITICAL_RATE = 25;
export const FAILURE_WARNING_RATE = 10;
export const FAILURE_CRITICAL_RATE = 20;
export const REVIEW_REJECTION_WARNING_RATE = 15;
export const REVIEW_REJECTION_CRITICAL_RATE = 30;
export const CACHE_REUSE_WARNING_RATE = 20;
export const CACHE_REUSE_CRITICAL_RATE = 10;
export const QUALITY_WARNING_SCORE = 80;
export const QUALITY_CRITICAL_SCORE = 65;
