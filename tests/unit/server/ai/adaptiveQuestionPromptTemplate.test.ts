import assert from 'node:assert/strict';
import test from 'node:test';
import {
    ADAPTIVE_QUESTION_PROMPT_TEMPLATE_VERSION,
    buildAdaptiveQuestionPromptTemplate
} from '../../../../src/server/ai/prompts/adaptiveQuestionPromptTemplate.ts';
import type { AIQuestionProviderInput } from '../../../../src/features/ai/model/types.ts';

const createInput = (overrides: Partial<AIQuestionProviderInput> = {}): AIQuestionProviderInput => ({
    topic: 'analitik düşünme',
    locale: 'tr',
    difficultyLevel: 3,
    abilitySnapshot: {
        userId: 'u1',
        overallScore: 62,
        dimensions: {
            memory: 58,
            logic: 65,
            attention: 60,
            verbal: 59,
            spatial: 66,
            processing_speed: 61
        },
        updatedAtISO: new Date().toISOString()
    },
    sessionPerformance: {
        recentAccuracy: 0.72,
        averageResponseMs: 4100,
        targetResponseMs: 4300,
        streakCorrect: 2,
        consecutiveWrong: 0
    },
    previousQuestionIds: ['q-1', 'q-2'],
    ...overrides
});

test('buildAdaptiveQuestionPromptTemplate returns versioned Turkish prompt', () => {
    const result = buildAdaptiveQuestionPromptTemplate(createInput());

    assert.match(result.version, /^aq\.logic\.core\.v1\.0\.0$/);
    assert.equal(ADAPTIVE_QUESTION_PROMPT_TEMPLATE_VERSION, 'v1.0.0');
    assert.equal(result.profileId, 'logic.core');
    assert.match(result.systemPrompt, /Cevabı Türkçe ver/);
    assert.match(result.userPrompt, /Topic: analitik düşünme/);
    assert.match(result.userPrompt, /Target difficulty level: 3/);
    assert.match(result.userPrompt, /Prompt profile: logic\.core/);
    assert.match(result.userPrompt, /Do not repeat these question ids: q-1, q-2/);
    assert.match(result.userPrompt, /"source": "ai"/);
    assert.match(result.userPrompt, /"suggestedDifficultyLevel": 3/);
});

test('buildAdaptiveQuestionPromptTemplate returns English locale instruction', () => {
    const result = buildAdaptiveQuestionPromptTemplate(
        createInput({ locale: 'en', previousQuestionIds: [] })
    );

    assert.match(result.systemPrompt, /Respond in English/);
    assert.equal(result.profileId, 'logic.core');
    assert.match(result.userPrompt, /Do not repeat these question ids: \(none\)/);
});
