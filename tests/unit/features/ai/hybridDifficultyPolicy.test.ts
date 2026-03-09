import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAdaptiveDifficultySettings } from '../../../../src/features/ai/adaptive-difficulty/model/adaptiveDifficultySettings.ts';
import { resolveHybridDifficulty } from '../../../../src/features/ai/adaptive-difficulty/model/hybridDifficultyPolicy.ts';

test('resolveHybridDifficulty applies safe in-band ai suggestion', () => {
    const result = resolveHybridDifficulty({
        ruleDifficultyLevel: 3,
        previousDifficultyLevel: 2,
        aiSuggestedDifficultyLevel: 3,
        accuracyAdjustment: 0,
        speedAdjustment: 0,
        trendAdjustment: 0,
        settings: resolveAdaptiveDifficultySettings({
            hybridAiEnabled: true,
            maxStepDelta: 1,
            maxHybridSuggestionDelta: 1
        })
    });

    assert.equal(result.difficultyLevel, 3);
    assert.equal(result.hybridMode, 'hybrid_ai');
    assert.equal(result.reasonCode, 'hybrid_ai_applied');
});

test('resolveHybridDifficulty falls back to rule when ai suggestion breaks anti-jitter boundary', () => {
    const result = resolveHybridDifficulty({
        ruleDifficultyLevel: 3,
        previousDifficultyLevel: 2,
        aiSuggestedDifficultyLevel: 4,
        accuracyAdjustment: 0,
        speedAdjustment: 0,
        trendAdjustment: 0,
        settings: resolveAdaptiveDifficultySettings({
            hybridAiEnabled: true,
            maxStepDelta: 1,
            maxHybridSuggestionDelta: 1
        })
    });

    assert.equal(result.difficultyLevel, 3);
    assert.equal(result.hybridMode, 'rule_fallback');
    assert.equal(result.reasonCode, 'hybrid_ai_rejected_anti_jitter');
});
