import assert from 'node:assert/strict';
import test from 'node:test';
import {
    generateAdaptiveQuestion
} from '../../../../src/features/ai/question-generation/model/questionGenerationUseCase.ts';
import { resolveAdaptiveDifficultySettings } from '../../../../src/features/ai/adaptive-difficulty/model/adaptiveDifficultySettings.ts';
import type {
    AdaptiveQuestionRequest,
    AIQuestionProvider
} from '../../../../src/features/ai/model/types.ts';

const createRequest = (): AdaptiveQuestionRequest => ({
    userId: 'u1',
    topic: 'analitik düşünme',
    locale: 'tr',
    abilitySnapshot: {
        userId: 'u1',
        overallScore: 60,
        dimensions: {
            memory: 60,
            logic: 62,
            attention: 58,
            verbal: 57,
            spatial: 61,
            processing_speed: 59
        },
        updatedAtISO: '2026-03-07T10:00:00.000Z'
    },
    sessionPerformance: {
        recentAccuracy: 0.72,
        averageResponseMs: 4200,
        targetResponseMs: 4300,
        streakCorrect: 2,
        consecutiveWrong: 0
    },
    previousQuestionIds: [],
    previousQuestionFingerprints: []
});

test('generateAdaptiveQuestion returns provider metadata for reviewed ai question', async () => {
    const provider: AIQuestionProvider = {
        generateQuestion: async () => ({
            question: {
                id: 'q-1',
                topic: 'analitik düşünme',
                stem: '2, 4, 6, ?',
                options: ['7', '8', '9', '10'],
                correctIndex: 1,
                explanation: 'İkişer artar.',
                difficultyLevel: 3,
                source: 'ai'
            },
            metadata: {
                providerName: 'openai',
                modelName: 'gpt-4o-mini',
                promptVersion: 'aq.logic.core.v1.0.0',
                promptProfileId: 'logic.core'
            },
            suggestedDifficultyLevel: 3
        })
    };

    const result = await generateAdaptiveQuestion(createRequest(), provider);

    assert.equal(result.usedFallback, false);
    assert.equal(result.difficultyDecision.difficultyLevel, 3);
    assert.ok(result.difficultyDecision.reasonCodes.includes('ability_band_core'));
    assert.equal(result.generationMetadata.providerName, 'openai');
    assert.equal(result.generationMetadata.promptProfileId, 'logic.core');
});

test('generateAdaptiveQuestion returns fallback metadata when provider result is rejected', async () => {
    const provider: AIQuestionProvider = {
        generateQuestion: async () => ({
            question: null,
            metadata: {
                providerName: 'gemini',
                modelName: 'gemini-3-flash-preview',
                promptVersion: 'aq.logic.core.v1.0.0',
                promptProfileId: 'logic.core'
            },
            suggestedDifficultyLevel: 2
        })
    };

    const result = await generateAdaptiveQuestion(createRequest(), provider);

    assert.equal(result.usedFallback, true);
    assert.equal(result.difficultyDecision.difficultyLevel, 3);
    assert.equal(result.generationMetadata.providerName, 'fallback');
    assert.equal(result.generationMetadata.modelName, null);
});

test('generateAdaptiveQuestion keeps rule-target review but returns hybrid difficulty decision when ai suggestion is enabled', async () => {
    const provider: AIQuestionProvider = {
        generateQuestion: async (input) => ({
            question: {
                id: 'q-2',
                topic: input.topic,
                stem: '6, 8, 10, ?',
                options: ['11', '12', '13', '14'],
                correctIndex: 1,
                explanation: 'İkişer artar.',
                difficultyLevel: input.difficultyLevel,
                source: 'ai'
            },
            metadata: {
                providerName: 'openai',
                modelName: 'gpt-4o-mini',
                promptVersion: 'aq.logic.core.v1.0.0',
                promptProfileId: 'logic.core'
            },
            suggestedDifficultyLevel: 4
        })
    };

    const result = await generateAdaptiveQuestion(createRequest(), provider, {
        settings: resolveAdaptiveDifficultySettings({
            hybridAiEnabled: true,
            maxHybridSuggestionDelta: 1
        })
    });

    assert.equal(result.usedFallback, false);
    assert.equal(result.question.difficultyLevel, 3);
    assert.equal(result.difficultyDecision.hybridMode, 'hybrid_ai');
    assert.equal(result.difficultyDecision.aiSuggestedDifficultyLevel, 4);
    assert.equal(result.difficultyDecision.difficultyLevel, 4);
});
