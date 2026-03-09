import type { AIProviderUsage } from '../../model/types.ts';

const toNumber = (value: unknown): number | null => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
};

export const normalizeProviderUsage = (value: unknown): AIProviderUsage | null => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }

    const candidate = value as Record<string, unknown>;
    const promptTokens = toNumber(candidate.promptTokens);
    const completionTokens = toNumber(candidate.completionTokens);
    const totalTokens = toNumber(candidate.totalTokens);
    const cachedTokens = toNumber(candidate.cachedTokens);

    if (
        promptTokens === null &&
        completionTokens === null &&
        totalTokens === null &&
        cachedTokens === null
    ) {
        return null;
    }

    return {
        promptTokens,
        completionTokens,
        totalTokens,
        cachedTokens
    };
};
