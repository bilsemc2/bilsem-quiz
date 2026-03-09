export interface QuestionGenerationCostEstimate {
    estimatedPromptCostUsd: number;
    estimatedCompletionCostUsd: number;
    estimatedTotalCostUsd: number;
    rateSource: 'model' | 'provider' | 'free';
}

export interface CacheSavingsEstimate {
    cachedTokens: number;
    estimatedCacheSavingsUsd: number;
    rateSource: QuestionGenerationCostEstimate['rateSource'];
}

interface EstimateQuestionGenerationCostInput {
    providerName?: string | null;
    modelName?: string | null;
    estimatedPromptTokens: number;
    estimatedCompletionTokens: number;
}

interface TokenCostRates {
    promptUsdPer1kTokens: number;
    completionUsdPer1kTokens: number;
    source: QuestionGenerationCostEstimate['rateSource'];
}

// Internal budgeting rates. These are intentionally explicit and easy to update
// without coupling dashboards to vendor billing APIs.
const MODEL_COST_RATES: Record<string, TokenCostRates> = {
    'openai:gpt-4o-mini': {
        promptUsdPer1kTokens: 0.00015,
        completionUsdPer1kTokens: 0.0006,
        source: 'model'
    },
    'openai:gpt-4.1-mini': {
        promptUsdPer1kTokens: 0.0004,
        completionUsdPer1kTokens: 0.0016,
        source: 'model'
    },
    'openai:gpt-4.1-nano': {
        promptUsdPer1kTokens: 0.0001,
        completionUsdPer1kTokens: 0.0004,
        source: 'model'
    },
    'gemini:gemini-3-flash-preview': {
        promptUsdPer1kTokens: 0.0001,
        completionUsdPer1kTokens: 0.0004,
        source: 'model'
    },
    'gemini:gemini-2.0-flash': {
        promptUsdPer1kTokens: 0.0001,
        completionUsdPer1kTokens: 0.0004,
        source: 'model'
    }
};

const PROVIDER_DEFAULT_COST_RATES: Record<string, TokenCostRates> = {
    openai: {
        promptUsdPer1kTokens: 0.0003,
        completionUsdPer1kTokens: 0.0012,
        source: 'provider'
    },
    gemini: {
        promptUsdPer1kTokens: 0.0001,
        completionUsdPer1kTokens: 0.0004,
        source: 'provider'
    },
    fallback: {
        promptUsdPer1kTokens: 0,
        completionUsdPer1kTokens: 0,
        source: 'free'
    },
    unknown: {
        promptUsdPer1kTokens: 0,
        completionUsdPer1kTokens: 0,
        source: 'free'
    }
};

const normalizeKeyPart = (value?: string | null): string => {
    return value?.trim().toLocaleLowerCase('en-US') || '';
};

const roundUsd = (value: number): number => {
    return Number(value.toFixed(6));
};

const resolveTokenCostRates = (
    input: EstimateQuestionGenerationCostInput
): TokenCostRates => {
    const providerName = normalizeKeyPart(input.providerName) || 'unknown';
    const modelName = normalizeKeyPart(input.modelName);

    if (providerName === 'fallback') {
        return PROVIDER_DEFAULT_COST_RATES.fallback;
    }

    if (modelName) {
        const modelRates = MODEL_COST_RATES[`${providerName}:${modelName}`];
        if (modelRates) {
            return modelRates;
        }
    }

    return PROVIDER_DEFAULT_COST_RATES[providerName] ?? PROVIDER_DEFAULT_COST_RATES.unknown;
};

export const estimateQuestionGenerationCost = (
    input: EstimateQuestionGenerationCostInput
): QuestionGenerationCostEstimate => {
    const rates = resolveTokenCostRates(input);
    const promptCost = Math.max(0, input.estimatedPromptTokens) / 1000 * rates.promptUsdPer1kTokens;
    const completionCost = Math.max(0, input.estimatedCompletionTokens) / 1000 * rates.completionUsdPer1kTokens;

    return {
        estimatedPromptCostUsd: roundUsd(promptCost),
        estimatedCompletionCostUsd: roundUsd(completionCost),
        estimatedTotalCostUsd: roundUsd(promptCost + completionCost),
        rateSource: rates.source
    };
};

export const estimateCachedPromptSavings = (
    input: {
        providerName?: string | null;
        modelName?: string | null;
        cachedTokens: number;
    }
): CacheSavingsEstimate => {
    const rates = resolveTokenCostRates({
        providerName: input.providerName,
        modelName: input.modelName,
        estimatedPromptTokens: 0,
        estimatedCompletionTokens: 0
    });
    const cachedTokens = Math.max(0, input.cachedTokens);
    const estimatedCacheSavingsUsd = cachedTokens / 1000 * rates.promptUsdPer1kTokens;

    return {
        cachedTokens,
        estimatedCacheSavingsUsd: roundUsd(estimatedCacheSavingsUsd),
        rateSource: rates.source
    };
};
