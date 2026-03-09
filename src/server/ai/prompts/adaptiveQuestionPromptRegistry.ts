import type { AIQuestionProviderInput } from '@/features/ai/model/types';

export interface AdaptiveQuestionPromptProfile {
    id: string;
    version: string;
    systemInstruction: string;
    userInstruction: string;
}

const VERSION_SUFFIX = 'v1.0.0';

const normalizeTopic = (value: string): string => {
    return value
        .toLocaleLowerCase('tr-TR')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ı/g, 'i');
};

const containsAny = (topic: string, keywords: string[]): boolean => {
    return keywords.some((keyword) => topic.includes(keyword));
};

const resolvePromptFamily = (topic: string): 'verbal' | 'logic' | 'attention' => {
    const normalizedTopic = normalizeTopic(topic);

    if (containsAny(normalizedTopic, ['sozel', 'anlama', 'analoji', 'deyim', 'cikarim'])) {
        return 'verbal';
    }

    if (containsAny(normalizedTopic, ['dikkat', 'hiz', 'islem', 'tarama'])) {
        return 'attention';
    }

    return 'logic';
};

const resolveDifficultyBand = (difficultyLevel: number): 'core' | 'advanced' => {
    return difficultyLevel >= 4 ? 'advanced' : 'core';
};

export const resolveAdaptiveQuestionPromptProfile = (
    input: AIQuestionProviderInput
): AdaptiveQuestionPromptProfile => {
    const family = resolvePromptFamily(input.topic);
    const difficultyBand = resolveDifficultyBand(input.difficultyLevel);
    const profileId = `${family}.${difficultyBand}`;
    const version = `aq.${profileId}.${VERSION_SUFFIX}`;

    if (family === 'verbal') {
        return {
            id: profileId,
            version,
            systemInstruction: 'Prefer age-appropriate word relations, meaning clues, and inference over raw memorization.',
            userInstruction: difficultyBand === 'advanced'
                ? 'Require a two-step verbal inference but keep the wording short and child-friendly.'
                : 'Use one clear verbal relation or inference clue.'
        };
    }

    if (family === 'attention') {
        return {
            id: profileId,
            version,
            systemInstruction: 'Prefer selective attention, scanning, and distractor control tasks with concrete answer options.',
            userInstruction: difficultyBand === 'advanced'
                ? 'Include one strong distractor and require careful comparison before answering.'
                : 'Keep the attention task fast to parse and easy to verify.'
        };
    }

    return {
        id: profileId,
        version,
        systemInstruction: 'Prefer rule discovery, pattern recognition, and structured reasoning.',
        userInstruction: difficultyBand === 'advanced'
            ? 'Require two-step reasoning or pattern transfer, but keep it answerable within 45 seconds.'
            : 'Use one clear rule or pattern with a single best answer.'
    };
};
