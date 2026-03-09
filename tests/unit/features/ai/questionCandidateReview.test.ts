import assert from 'node:assert/strict';
import test from 'node:test';
import { reviewAdaptiveQuestionCandidate } from '../../../../src/features/ai/quality-safety/model/questionCandidateReview.ts';

const createQuestion = () => ({
    id: 'ai-q-1',
    topic: 'mantik',
    stem: 'Diziyi tamamla: 2, 4, 6, ?',
    options: ['7', '8', '9', '10'],
    correctIndex: 1,
    explanation: 'Dizi ikişer artar.',
    difficultyLevel: 2 as const,
    source: 'ai' as const
});

test('reviewAdaptiveQuestionCandidate activates safe unique candidate', () => {
    const review = reviewAdaptiveQuestionCandidate({
        question: createQuestion(),
        previousQuestionFingerprints: [],
        expectedDifficultyLevel: 2
    });

    assert.equal(review.status, 'active');
    assert.equal(review.question?.id, 'ai-q-1');
    assert.deepEqual(review.reasons, []);
    assert.ok(review.fingerprint);
});

test('reviewAdaptiveQuestionCandidate rejects duplicate fingerprint', () => {
    const review = reviewAdaptiveQuestionCandidate({
        question: createQuestion(),
        previousQuestionFingerprints: ['diziyi tamamla 2 4 6::10|7|8|9'],
        expectedDifficultyLevel: 2
    });

    assert.equal(review.status, 'rejected');
    assert.deepEqual(review.reasons, ['duplicate_fingerprint']);
    assert.equal(review.question, null);
});

test('reviewAdaptiveQuestionCandidate rejects unexpected difficulty and unsafe options', () => {
    const review = reviewAdaptiveQuestionCandidate({
        question: {
            ...createQuestion(),
            options: ['8', '8', '9', '10'],
            difficultyLevel: 4
        },
        expectedDifficultyLevel: 2
    });

    assert.equal(review.status, 'rejected');
    assert.ok(review.reasons.includes('failed_safety_checks'));
    assert.ok(review.reasons.includes('unexpected_difficulty_level'));
});
