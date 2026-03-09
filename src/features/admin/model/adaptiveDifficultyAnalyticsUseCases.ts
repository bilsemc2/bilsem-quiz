import type { AdaptiveDifficultyDecisionDTO } from '@/shared/types/aiEventDtos';
import type {
    AdminAdaptiveQuestionAttemptRecord,
    AdminStatisticsProfileNameRecord
} from '@/server/repositories/adminStatisticsRepository';

export interface AdaptiveDifficultyDistributionItem {
    difficultyLevel: number;
    attempts: number;
    accuracyRate: number;
}

export interface AdaptiveDifficultyReasonItem {
    reasonCode: string;
    count: number;
}

export interface AdaptiveDifficultyRecentDecision {
    userName: string;
    topic: string;
    difficultyLevel: number;
    baseDifficulty: number;
    wasCorrect: boolean;
    responseMs: number;
    explanation: string;
    createdAt: string;
}

export interface AdaptiveDifficultyAnalyticsData {
    totalAttempts: number;
    uniqueLearners: number;
    overallAccuracyRate: number;
    averageResponseMs: number;
    averageDifficultyLevel: number;
    increasedCount: number;
    decreasedCount: number;
    steadyCount: number;
    hybridAppliedCount: number;
    hybridFallbackCount: number;
    ruleOnlyCount: number;
    difficultyDistribution: AdaptiveDifficultyDistributionItem[];
    topReasons: AdaptiveDifficultyReasonItem[];
    recentDecisions: AdaptiveDifficultyRecentDecision[];
}

interface BuildAdaptiveDifficultyAnalyticsInput {
    attempts: AdminAdaptiveQuestionAttemptRecord[];
    profiles: AdminStatisticsProfileNameRecord[];
    recentLimit?: number;
    topReasonLimit?: number;
}

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

const toReasonCodes = (value: unknown): string[] => {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
        : [];
};

export const extractDifficultyDecisionFromPayload = (
    payload: unknown
): AdaptiveDifficultyDecisionDTO | null => {
    const root = toSafeObject(payload);
    const decision = toSafeObject(root?.difficultyDecision);

    if (!decision) {
        return null;
    }

    const difficultyLevel = Number(decision.difficultyLevel);
    const baseDifficulty = Number(decision.baseDifficulty);
    const rawDifficultyLevel = Number(decision.rawDifficultyLevel ?? difficultyLevel);
    const accuracyAdjustment = Number(decision.accuracyAdjustment);
    const speedAdjustment = Number(decision.speedAdjustment);
    const trendAdjustment = Number(decision.trendAdjustment ?? 0);
    const previousDifficultyLevelValue = decision.previousDifficultyLevel;
    const aiSuggestedDifficultyLevelValue = decision.aiSuggestedDifficultyLevel;
    const hybridMode =
        decision.hybridMode === 'hybrid_ai' || decision.hybridMode === 'rule_fallback'
            ? decision.hybridMode
            : 'rule_only';
    const overallScore = Number(decision.overallScore);
    const recentAccuracy = Number(decision.recentAccuracy);
    const averageResponseMs = Number(decision.averageResponseMs);
    const targetResponseMs = Number(decision.targetResponseMs);
    const streakCorrect = Number(decision.streakCorrect);
    const consecutiveWrong = Number(decision.consecutiveWrong);
    const adaptiveEnabled =
        typeof decision.adaptiveEnabled === 'boolean' ? decision.adaptiveEnabled : true;
    const maxStepDelta = Number(decision.maxStepDelta ?? 1);
    const explanation = typeof decision.explanation === 'string' ? decision.explanation : '';
    const reasonCodes = toReasonCodes(decision.reasonCodes);
    const previousDifficultyLevel =
        previousDifficultyLevelValue === null || typeof previousDifficultyLevelValue === 'undefined'
            ? null
            : Number(previousDifficultyLevelValue);
    const aiSuggestedDifficultyLevel =
        aiSuggestedDifficultyLevelValue === null || typeof aiSuggestedDifficultyLevelValue === 'undefined'
            ? null
            : Number(aiSuggestedDifficultyLevelValue);

    if (
        !Number.isFinite(difficultyLevel) ||
        !Number.isFinite(baseDifficulty) ||
        !Number.isFinite(rawDifficultyLevel) ||
        !Number.isFinite(accuracyAdjustment) ||
        !Number.isFinite(speedAdjustment) ||
        !Number.isFinite(trendAdjustment) ||
        !Number.isFinite(overallScore) ||
        !Number.isFinite(recentAccuracy) ||
        !Number.isFinite(averageResponseMs) ||
        !Number.isFinite(targetResponseMs) ||
        !Number.isFinite(streakCorrect) ||
        !Number.isFinite(consecutiveWrong) ||
        !Number.isFinite(maxStepDelta) ||
        (previousDifficultyLevel !== null && !Number.isFinite(previousDifficultyLevel)) ||
        (aiSuggestedDifficultyLevel !== null && !Number.isFinite(aiSuggestedDifficultyLevel)) ||
        reasonCodes.length === 0 ||
        explanation.length === 0
    ) {
        return null;
    }

    return {
        difficultyLevel: difficultyLevel as AdaptiveDifficultyDecisionDTO['difficultyLevel'],
        rawDifficultyLevel: rawDifficultyLevel as AdaptiveDifficultyDecisionDTO['rawDifficultyLevel'],
        baseDifficulty: baseDifficulty as AdaptiveDifficultyDecisionDTO['baseDifficulty'],
        accuracyAdjustment,
        speedAdjustment,
        trendAdjustment,
        previousDifficultyLevel:
            previousDifficultyLevel as AdaptiveDifficultyDecisionDTO['previousDifficultyLevel'],
        aiSuggestedDifficultyLevel:
            aiSuggestedDifficultyLevel as AdaptiveDifficultyDecisionDTO['aiSuggestedDifficultyLevel'],
        hybridMode,
        overallScore,
        recentAccuracy,
        averageResponseMs,
        targetResponseMs,
        streakCorrect,
        consecutiveWrong,
        adaptiveEnabled,
        maxStepDelta,
        reasonCodes,
        explanation
    };
};

const toProfileNameMap = (
    profiles: AdminStatisticsProfileNameRecord[]
): Record<string, string> => {
    return Object.fromEntries(
        profiles.map((profile) => [profile.id, profile.name?.trim() || 'Bilinmiyor'])
    );
};

export const createEmptyAdaptiveDifficultyAnalyticsData = (): AdaptiveDifficultyAnalyticsData => ({
    totalAttempts: 0,
    uniqueLearners: 0,
    overallAccuracyRate: 0,
    averageResponseMs: 0,
    averageDifficultyLevel: 0,
    increasedCount: 0,
    decreasedCount: 0,
    steadyCount: 0,
    hybridAppliedCount: 0,
    hybridFallbackCount: 0,
    ruleOnlyCount: 0,
    difficultyDistribution: [],
    topReasons: [],
    recentDecisions: []
});

export const buildAdaptiveDifficultyAnalyticsData = (
    input: BuildAdaptiveDifficultyAnalyticsInput
): AdaptiveDifficultyAnalyticsData => {
    const parsedAttempts = input.attempts
        .map((attempt) => ({
            attempt,
            decision: extractDifficultyDecisionFromPayload(attempt.question_payload)
        }))
        .filter(
            (entry): entry is {
                attempt: AdminAdaptiveQuestionAttemptRecord;
                decision: AdaptiveDifficultyDecisionDTO;
            } => entry.decision !== null
        );

    if (parsedAttempts.length === 0) {
        return createEmptyAdaptiveDifficultyAnalyticsData();
    }

    const profileNameMap = toProfileNameMap(input.profiles);
    const totalAttempts = parsedAttempts.length;
    const uniqueLearners = new Set(parsedAttempts.map(({ attempt }) => attempt.user_id).filter(Boolean)).size;
    const correctAttempts = parsedAttempts.filter(({ attempt }) => attempt.was_correct).length;
    const responseMsTotal = parsedAttempts.reduce(
        (total, { attempt }) => total + (Number(attempt.response_ms) || 0),
        0
    );
    const difficultyLevelTotal = parsedAttempts.reduce(
        (total, { decision }) => total + Number(decision.difficultyLevel),
        0
    );

    const difficultyDistribution = [1, 2, 3, 4, 5]
        .map((difficultyLevel) => {
            const attempts = parsedAttempts.filter(
                ({ decision }) => Number(decision.difficultyLevel) === difficultyLevel
            );

            if (attempts.length === 0) {
                return null;
            }

            const correctCount = attempts.filter(({ attempt }) => attempt.was_correct).length;

            return {
                difficultyLevel,
                attempts: attempts.length,
                accuracyRate: Math.round((correctCount / attempts.length) * 100)
            };
        })
        .filter((item): item is AdaptiveDifficultyDistributionItem => item !== null);

    const reasonCountMap: Record<string, number> = {};
    let increasedCount = 0;
    let decreasedCount = 0;
    let steadyCount = 0;
    let hybridAppliedCount = 0;
    let hybridFallbackCount = 0;
    let ruleOnlyCount = 0;

    for (const { decision } of parsedAttempts) {
        for (const reasonCode of decision.reasonCodes) {
            reasonCountMap[reasonCode] = (reasonCountMap[reasonCode] || 0) + 1;
        }

        if (decision.hybridMode === 'hybrid_ai') {
            hybridAppliedCount += 1;
        } else if (decision.hybridMode === 'rule_fallback') {
            hybridFallbackCount += 1;
        } else {
            ruleOnlyCount += 1;
        }

        if (decision.difficultyLevel > decision.baseDifficulty) {
            increasedCount += 1;
        } else if (decision.difficultyLevel < decision.baseDifficulty) {
            decreasedCount += 1;
        } else {
            steadyCount += 1;
        }
    }

    const topReasons = Object.entries(reasonCountMap)
        .map(([reasonCode, count]) => ({ reasonCode, count }))
        .sort((left, right) => right.count - left.count)
        .slice(0, input.topReasonLimit ?? 8);

    const recentDecisions = parsedAttempts
        .slice(0, input.recentLimit ?? 12)
        .map(({ attempt, decision }) => ({
            userName: profileNameMap[attempt.user_id] || 'Bilinmiyor',
            topic: attempt.topic,
            difficultyLevel: Number(decision.difficultyLevel),
            baseDifficulty: Number(decision.baseDifficulty),
            wasCorrect: Boolean(attempt.was_correct),
            responseMs: Number(attempt.response_ms) || 0,
            explanation: decision.explanation,
            createdAt: attempt.created_at
        }));

    return {
        totalAttempts,
        uniqueLearners,
        overallAccuracyRate: Math.round((correctAttempts / totalAttempts) * 100),
        averageResponseMs: Math.round(responseMsTotal / totalAttempts),
        averageDifficultyLevel: Number((difficultyLevelTotal / totalAttempts).toFixed(2)),
        increasedCount,
        decreasedCount,
        steadyCount,
        hybridAppliedCount,
        hybridFallbackCount,
        ruleOnlyCount,
        difficultyDistribution,
        topReasons,
        recentDecisions
    };
};
