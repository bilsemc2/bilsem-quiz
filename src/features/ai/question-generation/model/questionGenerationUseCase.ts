import type { AdaptiveQuestion, AdaptiveQuestionRequest, AIQuestionProvider } from '../../model/types';
import { calculateTargetDifficulty } from '../../adaptive-difficulty/model/difficultyEngine';
import { createFallbackQuestion } from './fallbackQuestionFactory';
import { isQuestionSafe } from '../../quality-safety/model/questionSafety';
import { geminiQuestionProvider } from '../../../../server/ai/providers/geminiQuestionProvider';

export interface GenerateAdaptiveQuestionResult {
    question: AdaptiveQuestion;
    usedFallback: boolean;
}

const createProviderInput = (request: AdaptiveQuestionRequest) => ({
    topic: request.topic,
    locale: request.locale,
    difficultyLevel: calculateTargetDifficulty(request),
    abilitySnapshot: request.abilitySnapshot,
    sessionPerformance: request.sessionPerformance,
    previousQuestionIds: request.previousQuestionIds ?? []
});

export const generateAdaptiveQuestion = async (
    request: AdaptiveQuestionRequest,
    provider: AIQuestionProvider = geminiQuestionProvider
): Promise<GenerateAdaptiveQuestionResult> => {
    const providerInput = createProviderInput(request);
    const aiQuestion = await provider.generateQuestion(providerInput);

    if (aiQuestion && isQuestionSafe(aiQuestion)) {
        return { question: aiQuestion, usedFallback: false };
    }

    const fallbackQuestion = createFallbackQuestion({
        topic: request.topic,
        difficultyLevel: providerInput.difficultyLevel,
        locale: request.locale
    });

    return {
        question: fallbackQuestion,
        usedFallback: true
    };
};
