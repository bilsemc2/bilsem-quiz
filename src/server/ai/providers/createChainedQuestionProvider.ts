import type {
    AIQuestionGenerationMetadata,
    AIQuestionProvider
} from '@/features/ai/model/types';

export interface NamedQuestionProvider {
    name: string;
    provider: AIQuestionProvider;
}

export const createChainedQuestionProvider = (
    providers: readonly NamedQuestionProvider[]
): AIQuestionProvider => ({
    generateQuestion: async (input) => {
        let lastMetadata: AIQuestionGenerationMetadata = {
            providerName: null,
            modelName: null,
            promptVersion: null,
            promptProfileId: null
        };

        for (const providerEntry of providers) {
            const result = await providerEntry.provider.generateQuestion(input);
            lastMetadata = result.metadata;

            if (result.question) {
                return result;
            }
        }

        return {
            question: null,
            metadata: lastMetadata,
            suggestedDifficultyLevel: null
        };
    }
});
