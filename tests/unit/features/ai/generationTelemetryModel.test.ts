import assert from 'node:assert/strict';
import test from 'node:test';
import { estimateQuestionGenerationTelemetry } from '../../../../src/features/ai/question-generation/model/generationTelemetryModel.ts';

test('estimateQuestionGenerationTelemetry calculates tokens and cache reuse from request context', () => {
    const telemetry = estimateQuestionGenerationTelemetry({
        requestedQuestionCount: 6,
        generatedQuestionCount: 4,
        cachedQuestionCount: 2,
        requestContext: {
            storyTitle: 'Uzay Macerasi',
            storyContentLength: 400,
            summaryLength: 80
        }
    });

    assert.deepEqual(telemetry, {
        estimatedPromptTokens: 543,
        estimatedCompletionTokens: 560,
        estimatedTotalTokens: 1103,
        cacheReuseRate: 25
    });
});
