export interface AdaptiveDifficultySettings {
    enabled: boolean;
    maxStepDelta: number;
    upwardTrendAccuracyThreshold: number;
    downwardTrendAccuracyThreshold: number;
    responseTrendThreshold: number;
    hybridAiEnabled: boolean;
    maxHybridSuggestionDelta: number;
}

const DEFAULT_SETTINGS: AdaptiveDifficultySettings = {
    enabled: true,
    maxStepDelta: 1,
    upwardTrendAccuracyThreshold: 0.12,
    downwardTrendAccuracyThreshold: 0.12,
    responseTrendThreshold: 0.08,
    hybridAiEnabled: false,
    maxHybridSuggestionDelta: 1
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
    if (typeof value !== 'string') {
        return fallback;
    }

    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
        return true;
    }

    if (['0', 'false', 'no', 'off'].includes(normalized)) {
        return false;
    }

    return fallback;
};

const parseNumber = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const resolveAdaptiveDifficultySettings = (
    overrides: Partial<AdaptiveDifficultySettings> = {}
): AdaptiveDifficultySettings => {
    return {
        enabled: overrides.enabled ?? DEFAULT_SETTINGS.enabled,
        maxStepDelta: Math.max(0, Math.min(2, Math.round(overrides.maxStepDelta ?? DEFAULT_SETTINGS.maxStepDelta))),
        upwardTrendAccuracyThreshold: Math.max(
            0,
            overrides.upwardTrendAccuracyThreshold ?? DEFAULT_SETTINGS.upwardTrendAccuracyThreshold
        ),
        downwardTrendAccuracyThreshold: Math.max(
            0,
            overrides.downwardTrendAccuracyThreshold ?? DEFAULT_SETTINGS.downwardTrendAccuracyThreshold
        ),
        responseTrendThreshold: Math.max(
            0,
            overrides.responseTrendThreshold ?? DEFAULT_SETTINGS.responseTrendThreshold
        ),
        hybridAiEnabled: overrides.hybridAiEnabled ?? DEFAULT_SETTINGS.hybridAiEnabled,
        maxHybridSuggestionDelta: Math.max(
            0,
            Math.min(2, Math.round(overrides.maxHybridSuggestionDelta ?? DEFAULT_SETTINGS.maxHybridSuggestionDelta))
        )
    };
};

export const getAdaptiveDifficultySettings = (): AdaptiveDifficultySettings => {
    const meta = import.meta as ImportMeta & {
        env?: Record<string, string | undefined>;
    };
    const env = meta.env ?? {};

    return resolveAdaptiveDifficultySettings({
        enabled: parseBoolean(env.VITE_ENABLE_ADAPTIVE_DIFFICULTY_V2, DEFAULT_SETTINGS.enabled),
        maxStepDelta: parseNumber(env.VITE_ADAPTIVE_DIFFICULTY_MAX_STEP, DEFAULT_SETTINGS.maxStepDelta),
        upwardTrendAccuracyThreshold: parseNumber(
            env.VITE_ADAPTIVE_DIFFICULTY_UP_TREND_ACCURACY_THRESHOLD,
            DEFAULT_SETTINGS.upwardTrendAccuracyThreshold
        ),
        downwardTrendAccuracyThreshold: parseNumber(
            env.VITE_ADAPTIVE_DIFFICULTY_DOWN_TREND_ACCURACY_THRESHOLD,
            DEFAULT_SETTINGS.downwardTrendAccuracyThreshold
        ),
        responseTrendThreshold: parseNumber(
            env.VITE_ADAPTIVE_DIFFICULTY_RESPONSE_TREND_THRESHOLD,
            DEFAULT_SETTINGS.responseTrendThreshold
        ),
        hybridAiEnabled: parseBoolean(
            env.VITE_ENABLE_HYBRID_DIFFICULTY_AI,
            DEFAULT_SETTINGS.hybridAiEnabled
        ),
        maxHybridSuggestionDelta: parseNumber(
            env.VITE_ADAPTIVE_DIFFICULTY_MAX_AI_DELTA,
            DEFAULT_SETTINGS.maxHybridSuggestionDelta
        )
    });
};
