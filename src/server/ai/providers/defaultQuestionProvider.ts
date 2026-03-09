import type { AIQuestionProvider } from '@/features/ai/model/types';
import { createChainedQuestionProvider } from './createChainedQuestionProvider.ts';
import { getRegisteredQuestionProviders } from './providerRegistry.ts';

export const defaultQuestionProvider: AIQuestionProvider = createChainedQuestionProvider(
    getRegisteredQuestionProviders()
);
