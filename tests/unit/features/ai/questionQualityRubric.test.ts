import assert from 'node:assert/strict';
import test from 'node:test';
import { scoreQuestionQuality } from '../../../../src/features/ai/quality-safety/model/questionQualityRubric.ts';

test('scoreQuestionQuality gives high score to a well-formed active question', () => {
    const result = scoreQuestionQuality({
        stem: 'Sıradaki örüntüde hangi sayı gelmelidir?',
        options: ['8', '9', '10', '11'],
        explanation: 'Dizi her adımda ikişer artıyor, bu yüzden doğru cevap 10 olur.',
        difficultyLevel: 3,
        reviewStatus: 'active',
        reviewReasons: []
    });

    assert.equal(result.score, 100);
    assert.equal(result.band, 'excellent');
    assert.deepEqual(result.penalties, []);
});

test('scoreQuestionQuality penalizes rejected weak questions', () => {
    const result = scoreQuestionQuality({
        stem: 'Kısa?',
        options: ['A', 'A', '', 'D'],
        explanation: 'Kısa',
        difficultyLevel: 8,
        reviewStatus: 'rejected',
        reviewReasons: ['duplicate_options', 'failed_safety_checks']
    });

    assert.equal(result.band, 'poor');
    assert.ok(result.score < 50);
    assert.ok(result.penalties.includes('stem_too_short'));
    assert.ok(result.penalties.includes('duplicate_options'));
    assert.ok(result.penalties.includes('review_rejected'));
});
