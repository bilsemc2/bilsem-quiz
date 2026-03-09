import type {
    AdaptiveDifficultyDecision,
    AdaptiveQuestionRequest,
    DifficultyLevel,
    SessionPerformance
} from '../../model/types.ts';
import type { AdaptiveDifficultySettings } from './adaptiveDifficultySettings.ts';
import { resolveAdaptiveDifficultySettings } from './adaptiveDifficultySettings.ts';
import { resolveHybridDifficulty } from './hybridDifficultyPolicy.ts';

const hasNoPerformanceSignal = (performance: SessionPerformance): boolean => {
    return (
        performance.recentAccuracy === 0 &&
        performance.averageResponseMs <= 0 &&
        performance.streakCorrect === 0 &&
        performance.consecutiveWrong === 0
    );
};

const clampDifficulty = (value: number): DifficultyLevel => {
    if (value <= 1) return 1;
    if (value >= 5) return 5;
    return value as DifficultyLevel;
};

const baseDifficultyFromAbility = (overallScore: number): DifficultyLevel => {
    if (overallScore >= 85) return 5;
    if (overallScore >= 70) return 4;
    if (overallScore >= 55) return 3;
    if (overallScore >= 35) return 2;
    return 1;
};

const getBaseDifficultyReasonCode = (overallScore: number): string => {
    if (overallScore >= 85) return 'ability_band_elite';
    if (overallScore >= 70) return 'ability_band_high';
    if (overallScore >= 55) return 'ability_band_core';
    if (overallScore >= 35) return 'ability_band_foundation';
    return 'ability_band_emerging';
};

const speedAdjustment = (performance: SessionPerformance): number => {
    if (hasNoPerformanceSignal(performance)) {
        return 0;
    }

    if (performance.targetResponseMs <= 0) {
        return 0;
    }

    const ratio = performance.averageResponseMs / performance.targetResponseMs;
    if (ratio < 0.8) return 1;
    if (ratio > 1.4) return -1;
    return 0;
};

const getSpeedReasonCode = (performance: SessionPerformance): string => {
    if (hasNoPerformanceSignal(performance)) {
        return 'speed_no_signal';
    }

    if (performance.targetResponseMs <= 0) {
        return 'speed_target_missing';
    }

    const ratio = performance.averageResponseMs / performance.targetResponseMs;
    if (ratio < 0.8) return 'speed_faster_than_target';
    if (ratio > 1.4) return 'speed_slower_than_target';
    return 'speed_on_target_band';
};

const accuracyAdjustment = (performance: SessionPerformance): number => {
    if (hasNoPerformanceSignal(performance)) return 0;
    if (performance.recentAccuracy >= 0.85 && performance.streakCorrect >= 3) return 1;
    if (performance.recentAccuracy <= 0.45 || performance.consecutiveWrong >= 2) return -1;
    return 0;
};

const getAccuracyReasonCode = (performance: SessionPerformance): string => {
    if (hasNoPerformanceSignal(performance)) {
        return 'accuracy_no_signal';
    }

    if (performance.recentAccuracy >= 0.85 && performance.streakCorrect >= 3) {
        return 'accuracy_strong_with_streak';
    }

    if (performance.recentAccuracy <= 0.45 || performance.consecutiveWrong >= 2) {
        return 'accuracy_low_or_error_streak';
    }

    return 'accuracy_stable_band';
};

const buildDifficultyExplanation = (reasonCodes: string[]): string => {
    return reasonCodes.join(' | ');
};

const clampStepDelta = (
    rawDifficultyLevel: DifficultyLevel,
    previousDifficultyLevel: DifficultyLevel | null | undefined,
    maxStepDelta: number
): { difficultyLevel: DifficultyLevel; reasonCode: string } => {
    if (typeof previousDifficultyLevel !== 'number' || maxStepDelta <= 0) {
        return {
            difficultyLevel: rawDifficultyLevel,
            reasonCode: 'anti_jitter_not_needed'
        };
    }

    const maxAllowed = Math.min(5, previousDifficultyLevel + maxStepDelta);
    const minAllowed = Math.max(1, previousDifficultyLevel - maxStepDelta);

    if (rawDifficultyLevel > maxAllowed) {
        return {
            difficultyLevel: maxAllowed as DifficultyLevel,
            reasonCode: 'anti_jitter_up_cap'
        };
    }

    if (rawDifficultyLevel < minAllowed) {
        return {
            difficultyLevel: minAllowed as DifficultyLevel,
            reasonCode: 'anti_jitter_down_cap'
        };
    }

    return {
        difficultyLevel: rawDifficultyLevel,
        reasonCode: 'anti_jitter_not_needed'
    };
};

const calculateTrendAdjustment = (
    current: SessionPerformance,
    previous: SessionPerformance | null | undefined,
    settings: AdaptiveDifficultySettings
): { adjustment: number; reasonCode: string } => {
    if (!previous) {
        return {
            adjustment: 0,
            reasonCode: 'trend_no_history'
        };
    }

    const accuracyDelta = current.recentAccuracy - previous.recentAccuracy;
    const responseDeltaRatio =
        previous.averageResponseMs > 0
            ? (current.averageResponseMs - previous.averageResponseMs) / previous.averageResponseMs
            : 0;

    const trendUp =
        accuracyDelta >= settings.upwardTrendAccuracyThreshold &&
        responseDeltaRatio <= -settings.responseTrendThreshold;

    if (trendUp) {
        return {
            adjustment: 1,
            reasonCode: 'trend_improving'
        };
    }

    const trendDown =
        accuracyDelta <= -settings.downwardTrendAccuracyThreshold ||
        responseDeltaRatio >= settings.responseTrendThreshold;

    if (trendDown) {
        return {
            adjustment: -1,
            reasonCode: 'trend_declining'
        };
    }

    return {
        adjustment: 0,
        reasonCode: 'trend_stable'
    };
};

export interface AdaptiveDifficultyDecisionOptions {
    previousSessionPerformance?: SessionPerformance | null;
    previousDifficultyLevel?: DifficultyLevel | null;
    aiSuggestedDifficultyLevel?: DifficultyLevel | null;
    settings?: AdaptiveDifficultySettings;
}

export const calculateTargetDifficultyDecision = (
    request: AdaptiveQuestionRequest,
    options: AdaptiveDifficultyDecisionOptions = {}
): AdaptiveDifficultyDecision => {
    const settings = resolveAdaptiveDifficultySettings(options.settings);
    const baseDifficulty = baseDifficultyFromAbility(request.abilitySnapshot.overallScore);
    if (!settings.enabled) {
        const reasonCodes = [
            getBaseDifficultyReasonCode(request.abilitySnapshot.overallScore),
            'adaptive_engine_disabled',
            'hybrid_ai_disabled'
        ];

        return {
            difficultyLevel: baseDifficulty,
            rawDifficultyLevel: baseDifficulty,
            baseDifficulty,
            accuracyAdjustment: 0,
            speedAdjustment: 0,
            trendAdjustment: 0,
            previousDifficultyLevel: options.previousDifficultyLevel ?? null,
            aiSuggestedDifficultyLevel: options.aiSuggestedDifficultyLevel ?? null,
            hybridMode: 'rule_only',
            overallScore: request.abilitySnapshot.overallScore,
            recentAccuracy: request.sessionPerformance.recentAccuracy,
            averageResponseMs: request.sessionPerformance.averageResponseMs,
            targetResponseMs: request.sessionPerformance.targetResponseMs,
            streakCorrect: request.sessionPerformance.streakCorrect,
            consecutiveWrong: request.sessionPerformance.consecutiveWrong,
            adaptiveEnabled: false,
            maxStepDelta: settings.maxStepDelta,
            reasonCodes,
            explanation: buildDifficultyExplanation(reasonCodes)
        };
    }

    const accuracyDelta = accuracyAdjustment(request.sessionPerformance);
    const speedDelta = speedAdjustment(request.sessionPerformance);
    const trend = calculateTrendAdjustment(
        request.sessionPerformance,
        options.previousSessionPerformance,
        settings
    );
    const adjusted = baseDifficulty + accuracyDelta + speedDelta + trend.adjustment;
    const rawDifficultyLevel = clampDifficulty(adjusted);
    const jitterResolution = clampStepDelta(
        rawDifficultyLevel,
        options.previousDifficultyLevel,
        settings.maxStepDelta
    );
    const hybridResolution = resolveHybridDifficulty({
        ruleDifficultyLevel: jitterResolution.difficultyLevel,
        previousDifficultyLevel: options.previousDifficultyLevel,
        aiSuggestedDifficultyLevel: options.aiSuggestedDifficultyLevel,
        accuracyAdjustment: accuracyDelta,
        speedAdjustment: speedDelta,
        trendAdjustment: trend.adjustment,
        settings
    });
    const difficultyLevel = hybridResolution.difficultyLevel;
    const reasonCodes = [
        getBaseDifficultyReasonCode(request.abilitySnapshot.overallScore),
        getAccuracyReasonCode(request.sessionPerformance),
        getSpeedReasonCode(request.sessionPerformance),
        trend.reasonCode,
        jitterResolution.reasonCode,
        hybridResolution.reasonCode
    ];

    return {
        difficultyLevel,
        rawDifficultyLevel,
        baseDifficulty,
        accuracyAdjustment: accuracyDelta,
        speedAdjustment: speedDelta,
        trendAdjustment: trend.adjustment,
        previousDifficultyLevel: options.previousDifficultyLevel ?? null,
        aiSuggestedDifficultyLevel: hybridResolution.aiSuggestedDifficultyLevel,
        hybridMode: hybridResolution.hybridMode,
        overallScore: request.abilitySnapshot.overallScore,
        recentAccuracy: request.sessionPerformance.recentAccuracy,
        averageResponseMs: request.sessionPerformance.averageResponseMs,
        targetResponseMs: request.sessionPerformance.targetResponseMs,
        streakCorrect: request.sessionPerformance.streakCorrect,
        consecutiveWrong: request.sessionPerformance.consecutiveWrong,
        adaptiveEnabled: true,
        maxStepDelta: settings.maxStepDelta,
        reasonCodes,
        explanation: buildDifficultyExplanation(reasonCodes)
    };
};

export const calculateTargetDifficulty = (
    request: AdaptiveQuestionRequest,
    options: AdaptiveDifficultyDecisionOptions = {}
): DifficultyLevel => {
    return calculateTargetDifficultyDecision(request, options).difficultyLevel;
};

export const updateAbilityScore = (input: {
    currentScore: number;
    wasCorrect: boolean;
    responseMs: number;
    targetResponseMs: number;
}): number => {
    const correctnessDelta = input.wasCorrect ? 2.5 : -3;
    const speedRatio = input.targetResponseMs > 0 ? input.responseMs / input.targetResponseMs : 1;
    const speedDelta = speedRatio < 0.85 ? 1 : speedRatio > 1.3 ? -1 : 0;
    const nextScore = input.currentScore + correctnessDelta + speedDelta;
    return Math.max(0, Math.min(100, Number(nextScore.toFixed(2))));
};
