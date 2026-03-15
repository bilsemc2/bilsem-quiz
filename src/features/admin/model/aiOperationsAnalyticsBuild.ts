// AI Operations Analytics — Main builder function

import type {
    AIOperationsAlert,
    AIOperationsAnalyticsData,
    AIOperationsReviewBreakdown,
    AIOperationsSourceBreakdown,
    BuildAIOperationsAnalyticsInput,
} from './aiOperationsAnalyticsTypes.ts';

import {
    toRoundedRate,
    toTrendRate,
    createAlert,
    getProviderName,
    getModelName,
    getLatencyMs,
    getFallbackQuestionCount,
    getCachedQuestionCount,
    getTelemetry,
    getEstimatedCost,
    getCachedTokenSavings,
    getReviewedAtMs,
    isReviewedQuestion,
    getReviewTurnaroundMinutes,
    getQuestionQualityScore,
    LATENCY_WARNING_MS,
    LATENCY_CRITICAL_MS,
    FALLBACK_WARNING_RATE,
    FALLBACK_CRITICAL_RATE,
    FAILURE_WARNING_RATE,
    FAILURE_CRITICAL_RATE,
    REVIEW_REJECTION_WARNING_RATE,
    REVIEW_REJECTION_CRITICAL_RATE,
    CACHE_REUSE_WARNING_RATE,
    CACHE_REUSE_CRITICAL_RATE,
    QUALITY_WARNING_SCORE,
    QUALITY_CRITICAL_SCORE,
} from './aiOperationsJobHelpers.ts';

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
