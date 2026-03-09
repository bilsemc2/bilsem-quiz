import type { DifficultyLevel, AdaptiveDifficultyHybridMode } from '../../model/types.ts';
import type { AdaptiveDifficultySettings } from './adaptiveDifficultySettings.ts';

export interface ResolveHybridDifficultyInput {
    ruleDifficultyLevel: DifficultyLevel;
    previousDifficultyLevel?: DifficultyLevel | null;
    aiSuggestedDifficultyLevel?: DifficultyLevel | null;
    accuracyAdjustment: number;
    speedAdjustment: number;
    trendAdjustment: number;
    settings: AdaptiveDifficultySettings;
}

export interface HybridDifficultyResolution {
    difficultyLevel: DifficultyLevel;
    aiSuggestedDifficultyLevel: DifficultyLevel | null;
    hybridMode: AdaptiveDifficultyHybridMode;
    reasonCode: string;
}

const normalizeDifficulty = (value: number | null | undefined): DifficultyLevel | null => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null;
    }

    const rounded = Math.round(value);
    if (rounded < 1 || rounded > 5) {
        return null;
    }

    return rounded as DifficultyLevel;
};

export const resolveHybridDifficulty = (
    input: ResolveHybridDifficultyInput
): HybridDifficultyResolution => {
    const aiSuggestedDifficultyLevel = normalizeDifficulty(input.aiSuggestedDifficultyLevel);

    if (!input.settings.hybridAiEnabled) {
        return {
            difficultyLevel: input.ruleDifficultyLevel,
            aiSuggestedDifficultyLevel,
            hybridMode: 'rule_only',
            reasonCode: 'hybrid_ai_disabled'
        };
    }

    if (aiSuggestedDifficultyLevel === null) {
        return {
            difficultyLevel: input.ruleDifficultyLevel,
            aiSuggestedDifficultyLevel: null,
            hybridMode: 'rule_only',
            reasonCode: 'hybrid_ai_missing'
        };
    }

    if (
        Math.abs(aiSuggestedDifficultyLevel - input.ruleDifficultyLevel) >
        input.settings.maxHybridSuggestionDelta
    ) {
        return {
            difficultyLevel: input.ruleDifficultyLevel,
            aiSuggestedDifficultyLevel,
            hybridMode: 'rule_fallback',
            reasonCode: 'hybrid_ai_rejected_out_of_band'
        };
    }

    if (
        typeof input.previousDifficultyLevel === 'number' &&
        Math.abs(aiSuggestedDifficultyLevel - input.previousDifficultyLevel) > input.settings.maxStepDelta
    ) {
        return {
            difficultyLevel: input.ruleDifficultyLevel,
            aiSuggestedDifficultyLevel,
            hybridMode: 'rule_fallback',
            reasonCode: 'hybrid_ai_rejected_anti_jitter'
        };
    }

    const riskySession =
        input.accuracyAdjustment < 0 ||
        input.speedAdjustment < 0 ||
        input.trendAdjustment < 0;

    if (riskySession && aiSuggestedDifficultyLevel > input.ruleDifficultyLevel) {
        return {
            difficultyLevel: input.ruleDifficultyLevel,
            aiSuggestedDifficultyLevel,
            hybridMode: 'rule_fallback',
            reasonCode: 'hybrid_ai_rejected_risk_guard'
        };
    }

    return {
        difficultyLevel: aiSuggestedDifficultyLevel,
        aiSuggestedDifficultyLevel,
        hybridMode: 'hybrid_ai',
        reasonCode: 'hybrid_ai_applied'
    };
};
