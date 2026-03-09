import type { AIQuestionProvider } from '@/features/ai/model/types';
import type { NamedQuestionProvider } from './createChainedQuestionProvider.ts';
import { geminiQuestionProvider } from './geminiQuestionProvider.ts';
import { openaiQuestionProvider } from './openaiQuestionProvider.ts';

export const QUESTION_PROVIDER_NAMES = ['openai', 'gemini'] as const;

export type QuestionProviderName = (typeof QUESTION_PROVIDER_NAMES)[number];

const DEFAULT_PROVIDER_ORDER: QuestionProviderName[] = ['openai', 'gemini'];

const providerMap: Record<QuestionProviderName, AIQuestionProvider> = {
    openai: openaiQuestionProvider,
    gemini: geminiQuestionProvider
};

const isQuestionProviderName = (value: string): value is QuestionProviderName => {
    return QUESTION_PROVIDER_NAMES.includes(value as QuestionProviderName);
};

const getConfiguredProviderOrder = (): string | undefined => {
    const meta = import.meta as ImportMeta & {
        env?: Record<string, string | undefined>;
    };

    return meta.env?.VITE_AI_QUESTION_PROVIDER_ORDER;
};

export const resolveQuestionProviderOrder = (
    rawOrder: string | undefined
): QuestionProviderName[] => {
    if (!rawOrder) {
        return [...DEFAULT_PROVIDER_ORDER];
    }

    const parsed = rawOrder
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry): entry is QuestionProviderName => isQuestionProviderName(entry));

    if (parsed.length === 0) {
        return [...DEFAULT_PROVIDER_ORDER];
    }

    return Array.from(new Set(parsed));
};

export const getRegisteredQuestionProviders = (
    rawOrder: string | undefined = getConfiguredProviderOrder()
): NamedQuestionProvider[] => {
    return resolveQuestionProviderOrder(rawOrder).map((name) => ({
        name,
        provider: providerMap[name]
    }));
};
