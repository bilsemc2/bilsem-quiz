import type { AIQuestionProvider } from '@/features/ai/model/types';
import { invokeEdgeAdaptiveQuestionProvider } from './edgeQuestionProviderTransport.ts';

export const openaiQuestionProvider: AIQuestionProvider = {
    generateQuestion: async (input) => {
        return invokeEdgeAdaptiveQuestionProvider('openai', input);
    }
};
