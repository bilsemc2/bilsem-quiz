import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildAdaptiveDifficultyAnalyticsData,
    createEmptyAdaptiveDifficultyAnalyticsData,
    extractDifficultyDecisionFromPayload
} from '../../../../src/features/admin/model/adaptiveDifficultyAnalyticsUseCases.ts';

test('extractDifficultyDecisionFromPayload returns null for missing decision payload', () => {
    assert.equal(extractDifficultyDecisionFromPayload({ storyId: 's1' }), null);
    assert.equal(extractDifficultyDecisionFromPayload(null), null);
});

test('extractDifficultyDecisionFromPayload backfills new adaptive fields for legacy payloads', () => {
    const decision = extractDifficultyDecisionFromPayload({
        difficultyDecision: {
            difficultyLevel: 4,
            baseDifficulty: 3,
            accuracyAdjustment: 1,
            speedAdjustment: 0,
            overallScore: 62,
            recentAccuracy: 0.8,
            averageResponseMs: 3200,
            targetResponseMs: 4500,
            streakCorrect: 3,
            consecutiveWrong: 0,
            reasonCodes: ['ability_band_core', 'accuracy_strong_with_streak', 'speed_on_target_band'],
            explanation: 'ability_band_core | accuracy_strong_with_streak | speed_on_target_band'
        }
    });

    assert.ok(decision);
    assert.equal(decision.rawDifficultyLevel, 4);
    assert.equal(decision.trendAdjustment, 0);
    assert.equal(decision.previousDifficultyLevel, null);
    assert.equal(decision.aiSuggestedDifficultyLevel, null);
    assert.equal(decision.hybridMode, 'rule_only');
    assert.equal(decision.adaptiveEnabled, true);
    assert.equal(decision.maxStepDelta, 1);
});

test('buildAdaptiveDifficultyAnalyticsData aggregates parsed decision logs', () => {
    const data = buildAdaptiveDifficultyAnalyticsData({
        attempts: [
            {
                id: 'a1',
                user_id: 'u1',
                topic: 'analitik düşünme',
                difficulty_level: 4,
                was_correct: true,
                response_ms: 3200,
                source: 'ai',
                created_at: '2026-03-07T10:00:00.000Z',
                question_payload: {
                    difficultyDecision: {
                        difficultyLevel: 4,
                        baseDifficulty: 3,
                        accuracyAdjustment: 1,
                        speedAdjustment: 0,
                        overallScore: 62,
                        recentAccuracy: 0.8,
                        averageResponseMs: 3200,
                        targetResponseMs: 4500,
                        streakCorrect: 3,
                        consecutiveWrong: 0,
                        reasonCodes: ['ability_band_core', 'accuracy_strong_with_streak', 'speed_on_target_band'],
                        explanation: 'ability_band_core | accuracy_strong_with_streak | speed_on_target_band'
                    }
                }
            },
            {
                id: 'a2',
                user_id: 'u2',
                topic: 'sözel anlama',
                difficulty_level: 2,
                was_correct: false,
                response_ms: 6100,
                source: 'ai',
                created_at: '2026-03-07T09:55:00.000Z',
                question_payload: {
                    difficultyDecision: {
                        difficultyLevel: 2,
                        baseDifficulty: 3,
                        accuracyAdjustment: -1,
                        speedAdjustment: 0,
                        overallScore: 58,
                        recentAccuracy: 0.42,
                        averageResponseMs: 6100,
                        targetResponseMs: 4500,
                        streakCorrect: 0,
                        consecutiveWrong: 2,
                        reasonCodes: ['ability_band_core', 'accuracy_low_or_error_streak', 'speed_on_target_band'],
                        explanation: 'ability_band_core | accuracy_low_or_error_streak | speed_on_target_band'
                    }
                }
            }
        ],
        profiles: [
            { id: 'u1', name: 'Ada' },
            { id: 'u2', name: 'Can' }
        ],
        recentLimit: 5,
        topReasonLimit: 5
    });

    assert.equal(data.totalAttempts, 2);
    assert.equal(data.uniqueLearners, 2);
    assert.equal(data.overallAccuracyRate, 50);
    assert.equal(data.averageResponseMs, 4650);
    assert.equal(data.averageDifficultyLevel, 3);
    assert.equal(data.increasedCount, 1);
    assert.equal(data.decreasedCount, 1);
    assert.equal(data.steadyCount, 0);
    assert.equal(data.ruleOnlyCount, 2);
    assert.equal(data.hybridAppliedCount, 0);
    assert.equal(data.hybridFallbackCount, 0);
    assert.deepEqual(data.difficultyDistribution, [
        { difficultyLevel: 2, attempts: 1, accuracyRate: 0 },
        { difficultyLevel: 4, attempts: 1, accuracyRate: 100 }
    ]);
    assert.equal(data.topReasons[0]?.reasonCode, 'ability_band_core');
    assert.equal(data.topReasons[0]?.count, 2);
    assert.equal(data.recentDecisions[0]?.userName, 'Ada');
    assert.equal(data.recentDecisions[1]?.userName, 'Can');
});

test('createEmptyAdaptiveDifficultyAnalyticsData returns safe defaults', () => {
    assert.deepEqual(createEmptyAdaptiveDifficultyAnalyticsData(), {
        totalAttempts: 0,
        uniqueLearners: 0,
        overallAccuracyRate: 0,
        averageResponseMs: 0,
        averageDifficultyLevel: 0,
        increasedCount: 0,
        decreasedCount: 0,
        steadyCount: 0,
        hybridAppliedCount: 0,
        hybridFallbackCount: 0,
        ruleOnlyCount: 0,
        difficultyDistribution: [],
        topReasons: [],
        recentDecisions: []
    });
});
