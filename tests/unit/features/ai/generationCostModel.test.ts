import assert from 'node:assert/strict';
import test from 'node:test';
import {
    estimateCachedPromptSavings,
    estimateQuestionGenerationCost
} from '../../../../src/features/ai/question-generation/model/generationCostModel.ts';

test('estimateQuestionGenerationCost uses model-specific rates when available', () => {
    const cost = estimateQuestionGenerationCost({
        providerName: 'openai',
        modelName: 'gpt-4o-mini',
        estimatedPromptTokens: 700,
        estimatedCompletionTokens: 1400
    });

    assert.deepEqual(cost, {
        estimatedPromptCostUsd: 0.000105,
        estimatedCompletionCostUsd: 0.00084,
        estimatedTotalCostUsd: 0.000945,
        rateSource: 'model'
    });
});

test('estimateQuestionGenerationCost falls back to provider defaults and keeps fallback free', () => {
    const providerFallbackCost = estimateQuestionGenerationCost({
        providerName: 'openai',
        modelName: 'unknown-model',
        estimatedPromptTokens: 1000,
        estimatedCompletionTokens: 1000
    });

    assert.deepEqual(providerFallbackCost, {
        estimatedPromptCostUsd: 0.0003,
        estimatedCompletionCostUsd: 0.0012,
        estimatedTotalCostUsd: 0.0015,
        rateSource: 'provider'
    });

    const fallbackCost = estimateQuestionGenerationCost({
        providerName: 'fallback',
        modelName: null,
        estimatedPromptTokens: 800,
        estimatedCompletionTokens: 1200
    });

    assert.deepEqual(fallbackCost, {
        estimatedPromptCostUsd: 0,
        estimatedCompletionCostUsd: 0,
        estimatedTotalCostUsd: 0,
        rateSource: 'free'
    });
});

test('estimateCachedPromptSavings uses prompt-side rate only', () => {
    const savings = estimateCachedPromptSavings({
        providerName: 'openai',
        modelName: 'gpt-4o-mini',
        cachedTokens: 120
    });

    assert.deepEqual(savings, {
        cachedTokens: 120,
        estimatedCacheSavingsUsd: 0.000018,
        rateSource: 'model'
    });
});
