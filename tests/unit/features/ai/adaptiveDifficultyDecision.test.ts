import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateTargetDifficultyDecision } from '../../../../src/features/ai/adaptive-difficulty/model/difficultyEngine.ts';
import { resolveAdaptiveDifficultySettings } from '../../../../src/features/ai/adaptive-difficulty/model/adaptiveDifficultySettings.ts';

const createRequest = (overrides: Partial<Parameters<typeof calculateTargetDifficultyDecision>[0]> = {}) => ({
    userId: 'u-1',
    topic: 'analitik düşünme',
    locale: 'tr' as const,
    abilitySnapshot: {
        userId: 'u-1',
        overallScore: 72,
        dimensions: {
            memory: 68,
            logic: 74,
            attention: 70,
            verbal: 63,
            spatial: 71,
            processing_speed: 69
        },
        updatedAtISO: '2026-03-07T12:00:00.000Z'
    },
    sessionPerformance: {
        recentAccuracy: 0.9,
        averageResponseMs: 3000,
        targetResponseMs: 4500,
        streakCorrect: 4,
        consecutiveWrong: 0
    },
    ...overrides
});

test('calculateTargetDifficultyDecision explains upward adjustment signals', () => {
    const decision = calculateTargetDifficultyDecision(createRequest());

    assert.equal(decision.baseDifficulty, 4);
    assert.equal(decision.accuracyAdjustment, 1);
    assert.equal(decision.speedAdjustment, 1);
    assert.equal(decision.trendAdjustment, 0);
    assert.equal(decision.rawDifficultyLevel, 5);
    assert.equal(decision.difficultyLevel, 5);
    assert.equal(decision.adaptiveEnabled, true);
    assert.equal(decision.aiSuggestedDifficultyLevel, null);
    assert.equal(decision.hybridMode, 'rule_only');
    assert.ok(decision.reasonCodes.includes('ability_band_high'));
    assert.ok(decision.reasonCodes.includes('accuracy_strong_with_streak'));
    assert.ok(decision.reasonCodes.includes('speed_faster_than_target'));
    assert.ok(decision.reasonCodes.includes('trend_no_history'));
    assert.ok(decision.reasonCodes.includes('hybrid_ai_disabled'));
});

test('calculateTargetDifficultyDecision explains downward adjustment signals', () => {
    const decision = calculateTargetDifficultyDecision(
        createRequest({
            abilitySnapshot: {
                userId: 'u-1',
                overallScore: 38,
                dimensions: {
                    memory: 38,
                    logic: 40,
                    attention: 35,
                    verbal: 36,
                    spatial: 37,
                    processing_speed: 34
                },
                updatedAtISO: '2026-03-07T12:00:00.000Z'
            },
            sessionPerformance: {
                recentAccuracy: 0.4,
                averageResponseMs: 7200,
                targetResponseMs: 4500,
                streakCorrect: 0,
                consecutiveWrong: 3
            }
        })
    );

    assert.equal(decision.baseDifficulty, 2);
    assert.equal(decision.accuracyAdjustment, -1);
    assert.equal(decision.speedAdjustment, -1);
    assert.equal(decision.trendAdjustment, 0);
    assert.equal(decision.rawDifficultyLevel, 1);
    assert.equal(decision.difficultyLevel, 1);
    assert.equal(decision.hybridMode, 'rule_only');
    assert.ok(decision.reasonCodes.includes('ability_band_foundation'));
    assert.ok(decision.reasonCodes.includes('accuracy_low_or_error_streak'));
    assert.ok(decision.reasonCodes.includes('speed_slower_than_target'));
    assert.ok(decision.reasonCodes.includes('trend_no_history'));
});

test('calculateTargetDifficultyDecision applies positive trend but caps jump with anti jitter', () => {
    const decision = calculateTargetDifficultyDecision(
        createRequest({
            abilitySnapshot: {
                userId: 'u-1',
                overallScore: 55,
                dimensions: {
                    memory: 55,
                    logic: 55,
                    attention: 55,
                    verbal: 55,
                    spatial: 55,
                    processing_speed: 55
                },
                updatedAtISO: '2026-03-07T12:00:00.000Z'
            },
            sessionPerformance: {
                recentAccuracy: 0.75,
                averageResponseMs: 4100,
                targetResponseMs: 4500,
                streakCorrect: 1,
                consecutiveWrong: 0
            }
        }),
        {
            previousSessionPerformance: {
                recentAccuracy: 0.55,
                averageResponseMs: 5000,
                targetResponseMs: 4500,
                streakCorrect: 0,
                consecutiveWrong: 1
            },
            previousDifficultyLevel: 2,
            settings: resolveAdaptiveDifficultySettings({ maxStepDelta: 1 })
        }
    );

    assert.equal(decision.baseDifficulty, 3);
    assert.equal(decision.accuracyAdjustment, 0);
    assert.equal(decision.speedAdjustment, 0);
    assert.equal(decision.trendAdjustment, 1);
    assert.equal(decision.rawDifficultyLevel, 4);
    assert.equal(decision.difficultyLevel, 3);
    assert.equal(decision.previousDifficultyLevel, 2);
    assert.equal(decision.hybridMode, 'rule_only');
    assert.ok(decision.reasonCodes.includes('trend_improving'));
    assert.ok(decision.reasonCodes.includes('anti_jitter_up_cap'));
});

test('calculateTargetDifficultyDecision supports disabled adaptive engine for A/B control', () => {
    const decision = calculateTargetDifficultyDecision(createRequest(), {
        settings: resolveAdaptiveDifficultySettings({ enabled: false })
    });

    assert.equal(decision.adaptiveEnabled, false);
    assert.equal(decision.baseDifficulty, 4);
    assert.equal(decision.rawDifficultyLevel, 4);
    assert.equal(decision.difficultyLevel, 4);
    assert.equal(decision.accuracyAdjustment, 0);
    assert.equal(decision.speedAdjustment, 0);
    assert.equal(decision.trendAdjustment, 0);
    assert.equal(decision.hybridMode, 'rule_only');
    assert.ok(decision.reasonCodes.includes('adaptive_engine_disabled'));
});

test('calculateTargetDifficultyDecision applies hybrid ai suggestion when it is safe and in band', () => {
    const decision = calculateTargetDifficultyDecision(createRequest(), {
        aiSuggestedDifficultyLevel: 4,
        settings: resolveAdaptiveDifficultySettings({
            hybridAiEnabled: true,
            maxHybridSuggestionDelta: 1
        })
    });

    assert.equal(decision.rawDifficultyLevel, 5);
    assert.equal(decision.difficultyLevel, 4);
    assert.equal(decision.aiSuggestedDifficultyLevel, 4);
    assert.equal(decision.hybridMode, 'hybrid_ai');
    assert.ok(decision.reasonCodes.includes('hybrid_ai_applied'));
});

test('calculateTargetDifficultyDecision rejects risky upward hybrid ai suggestion', () => {
    const decision = calculateTargetDifficultyDecision(
        createRequest({
            sessionPerformance: {
                recentAccuracy: 0.35,
                averageResponseMs: 6800,
                targetResponseMs: 4500,
                streakCorrect: 0,
                consecutiveWrong: 2
            }
        }),
        {
            aiSuggestedDifficultyLevel: 3,
            settings: resolveAdaptiveDifficultySettings({
                hybridAiEnabled: true,
                maxHybridSuggestionDelta: 1
            })
        }
    );

    assert.equal(decision.difficultyLevel, 2);
    assert.equal(decision.aiSuggestedDifficultyLevel, 3);
    assert.equal(decision.hybridMode, 'rule_fallback');
    assert.ok(decision.reasonCodes.includes('hybrid_ai_rejected_risk_guard'));
});
