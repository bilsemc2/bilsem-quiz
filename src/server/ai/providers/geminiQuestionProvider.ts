import type { AIQuestionProvider } from '@/features/ai/model/types';
import { invokeEdgeAdaptiveQuestionProvider } from './edgeQuestionProviderTransport.ts';

export const geminiQuestionProvider: AIQuestionProvider = {
    generateQuestion: async (input) => {
        return invokeEdgeAdaptiveQuestionProvider('gemini', input);
    }
};
