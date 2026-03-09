import type { AIQuestionProviderInput } from '@/features/ai/model/types';
import { resolveAdaptiveQuestionPromptProfile } from './adaptiveQuestionPromptRegistry.ts';

export const ADAPTIVE_QUESTION_PROMPT_TEMPLATE_VERSION = 'v1.0.0';

export interface AdaptiveQuestionPromptTemplate {
    version: string;
    profileId: string;
    systemPrompt: string;
    userPrompt: string;
}

const buildLocaleInstruction = (locale: 'tr' | 'en'): string => {
    return locale === 'tr'
        ? 'Cevabı Türkçe ver. Türkçe karakterleri doğru kullan.'
        : 'Respond in English with clear, child-friendly language.';
};

export const buildAdaptiveQuestionPromptTemplate = (
    input: AIQuestionProviderInput
): AdaptiveQuestionPromptTemplate => {
    const localeInstruction = buildLocaleInstruction(input.locale);
    const promptProfile = resolveAdaptiveQuestionPromptProfile(input);
    const ability = input.abilitySnapshot;
    const performance = input.sessionPerformance;
    const excludedIds = input.previousQuestionIds.join(', ') || '(none)';
    const excludedFingerprints = input.previousQuestionFingerprints?.join(', ') || '(none)';

    const systemPrompt = [
        'You are an educational assessment assistant for children (ages 7-12).',
        'Generate exactly one multiple-choice question.',
        'Return only JSON object, no markdown.',
        'The question must be safe, age-appropriate, and non-violent.',
        'Options must be distinct and exactly 4 items.',
        promptProfile.systemInstruction,
        localeInstruction
    ].join(' ');

    const userPrompt = `
Create one adaptive question using the profile below:
- Topic: ${input.topic}
- Target difficulty level: ${input.difficultyLevel} (1 easiest - 5 hardest)
- Ability overall score: ${ability.overallScore}
- Ability dimensions:
  - memory: ${ability.dimensions.memory}
  - logic: ${ability.dimensions.logic}
  - attention: ${ability.dimensions.attention}
  - verbal: ${ability.dimensions.verbal}
  - spatial: ${ability.dimensions.spatial}
  - processing_speed: ${ability.dimensions.processing_speed}
- Session performance:
  - recentAccuracy: ${performance.recentAccuracy}
  - averageResponseMs: ${performance.averageResponseMs}
  - targetResponseMs: ${performance.targetResponseMs}
  - streakCorrect: ${performance.streakCorrect}
  - consecutiveWrong: ${performance.consecutiveWrong}
- Prompt profile: ${promptProfile.id}
- Prompt rule: ${promptProfile.userInstruction}
- Do not repeat these question ids: ${excludedIds}
- Do not create questions that match these normalized fingerprints: ${excludedFingerprints}

Required output JSON shape:
{
  "question": {
    "id": "string",
    "topic": "string",
    "stem": "string",
    "options": ["string", "string", "string", "string"],
    "correctIndex": 0,
    "explanation": "string",
    "difficultyLevel": ${input.difficultyLevel},
    "source": "ai"
  },
  "suggestedDifficultyLevel": ${input.difficultyLevel}
}
`.trim();

    return {
        version: promptProfile.version,
        profileId: promptProfile.id,
        systemPrompt,
        userPrompt
    };
};
