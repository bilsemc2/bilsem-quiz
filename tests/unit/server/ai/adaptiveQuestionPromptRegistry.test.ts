import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAdaptiveQuestionPromptProfile } from '../../../../src/server/ai/prompts/adaptiveQuestionPromptRegistry.ts';
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
    previousQuestionIds: [],
    previousQuestionFingerprints: [],
    ...overrides
});

test('resolveAdaptiveQuestionPromptProfile chooses verbal profile for verbal topics', () => {
    const profile = resolveAdaptiveQuestionPromptProfile(
        createInput({ topic: 'sözel anlama', difficultyLevel: 2 })
    );

    assert.equal(profile.id, 'verbal.core');
    assert.match(profile.version, /^aq\.verbal\.core\.v1\.0\.0$/);
});

test('resolveAdaptiveQuestionPromptProfile chooses advanced logic profile for harder reasoning topics', () => {
    const profile = resolveAdaptiveQuestionPromptProfile(
        createInput({ topic: 'örüntü ve mantık', difficultyLevel: 5 })
    );

    assert.equal(profile.id, 'logic.advanced');
    assert.match(profile.userInstruction, /two-step reasoning/i);
});
