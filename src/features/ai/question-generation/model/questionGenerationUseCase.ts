import type {
    AdaptiveDifficultyDecision,
    AdaptiveQuestion,
    AdaptiveQuestionRequest,
    AIProviderUsage,
    AIQuestionGenerationMetadata,
    AIQuestionProvider
} from '../../model/types.ts';
import { calculateTargetDifficultyDecision } from '../../adaptive-difficulty/model/difficultyEngine.ts';
import type { AdaptiveDifficultySettings } from '../../adaptive-difficulty/model/adaptiveDifficultySettings.ts';
import { getAdaptiveDifficultySettings } from '../../adaptive-difficulty/model/adaptiveDifficultySettings.ts';
import { createFallbackQuestion } from './fallbackQuestionFactory.ts';
import { reviewAdaptiveQuestionCandidate } from '../../quality-safety/model/questionCandidateReview.ts';
import { defaultQuestionProvider } from '../../../../server/ai/providers/defaultQuestionProvider.ts';

export interface GenerateAdaptiveQuestionResult {
    question: AdaptiveQuestion;
    usedFallback: boolean;
    difficultyDecision: AdaptiveDifficultyDecision;
    generationMetadata: AIQuestionGenerationMetadata;
    providerUsage: AIProviderUsage | null;
}

export interface GenerateAdaptiveQuestionOptions {
    settings?: AdaptiveDifficultySettings;
}

const createProviderInput = (
    request: AdaptiveQuestionRequest,
    difficultyDecision: AdaptiveDifficultyDecision
) => ({
    topic: request.topic,
    locale: request.locale,
    difficultyLevel: difficultyDecision.difficultyLevel,
    abilitySnapshot: request.abilitySnapshot,
    sessionPerformance: request.sessionPerformance,
    previousQuestionIds: request.previousQuestionIds ?? [],
    previousQuestionFingerprints: request.previousQuestionFingerprints ?? []
});

export const generateAdaptiveQuestion = async (
    request: AdaptiveQuestionRequest,
    provider: AIQuestionProvider = defaultQuestionProvider,
    options: GenerateAdaptiveQuestionOptions = {}
): Promise<GenerateAdaptiveQuestionResult> => {
    const settings = options.settings ?? getAdaptiveDifficultySettings();
    const providerDifficultyDecision = calculateTargetDifficultyDecision(request, {
        settings
    });
    const providerInput = createProviderInput(request, providerDifficultyDecision);
    const providerResult = await provider.generateQuestion(providerInput);
    const difficultyDecision = calculateTargetDifficultyDecision(request, {
        aiSuggestedDifficultyLevel: providerResult.suggestedDifficultyLevel ?? null,
        settings
    });
    const candidateReview = reviewAdaptiveQuestionCandidate({
        question: providerResult.question,
        previousQuestionFingerprints: request.previousQuestionFingerprints,
        expectedDifficultyLevel: providerInput.difficultyLevel
    });

    if (candidateReview.status === 'active' && candidateReview.question) {
        return {
            question: candidateReview.question,
            usedFallback: false,
            difficultyDecision,
            generationMetadata: providerResult.metadata,
            providerUsage: providerResult.usage ?? null
        };
    }

    const fallbackQuestion = createFallbackQuestion({
        topic: request.topic,
        difficultyLevel: providerInput.difficultyLevel,
        locale: request.locale
    });

        return {
            question: fallbackQuestion,
            usedFallback: true,
            difficultyDecision,
            generationMetadata: {
                providerName: 'fallback',
                modelName: null,
                promptVersion: null,
                promptProfileId: null
            },
            providerUsage: providerResult.usage ?? null
        };
};
