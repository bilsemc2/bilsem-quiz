import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuestionPublicationDecisions } from '@/features/ai/question-generation/model/questionPublicationModel';
import type { AdaptiveQuestion } from '@/features/ai/model/types';

const createQuestion = (overrides: Partial<AdaptiveQuestion> = {}): AdaptiveQuestion => ({
    id: overrides.id ?? 'q-1',
    topic: overrides.topic ?? 'mantik',
    stem: overrides.stem ?? 'Hangisi kurala uygundur?',
    options: overrides.options ?? ['A', 'B', 'C', 'D'],
    correctIndex: overrides.correctIndex ?? 0,
    explanation: overrides.explanation ?? 'Aciklama metni yeterli uzunlukta.',
    difficultyLevel: overrides.difficultyLevel ?? 3,
    source: overrides.source ?? 'ai'
});

test('createQuestionPublicationDecisions activates reviewed ai questions', () => {
    const decisions = createQuestionPublicationDecisions({
        reviewedAtISO: '2026-03-07T10:00:00.000Z',
        questions: [createQuestion()]
    });

    assert.equal(decisions.length, 1);
    assert.equal(decisions[0]?.reviewStatus, 'active');
    assert.equal(decisions[0]?.publishToPool, true);
    assert.equal(decisions[0]?.reviewNotes.qualityGate, 'runtime_review');
    assert.equal(typeof decisions[0]?.reviewNotes.qualityRubricScore, 'number');
    assert.equal(decisions[0]?.reviewNotes.qualityRubricBand, 'excellent');
});

test('createQuestionPublicationDecisions rejects duplicate ai fingerprints', () => {
    const first = createQuestion({
        id: 'q-1',
        stem: 'Ayni kural sorusu hangisi?',
        options: ['1', '2', '3', '4']
    });
    const second = createQuestion({
        id: 'q-2',
        stem: 'Ayni kural sorusu hangisi?',
        options: ['1', '2', '3', '4']
    });

    const decisions = createQuestionPublicationDecisions({
        questions: [first, second]
    });

    assert.equal(decisions[0]?.reviewStatus, 'active');
    assert.equal(decisions[1]?.reviewStatus, 'rejected');
    assert.deepEqual(decisions[1]?.reviewNotes.reasons, ['duplicate_fingerprint']);
    assert.equal(typeof decisions[1]?.reviewNotes.qualityRubricScore, 'number');
    assert.notEqual(decisions[1]?.reviewNotes.qualityRubricBand, 'excellent');
});

test('createQuestionPublicationDecisions keeps fallback questions active with bypass note', () => {
    const decisions = createQuestionPublicationDecisions({
        questions: [
            createQuestion({
                id: 'fallback-1',
                source: 'fallback'
            })
        ]
    });

    assert.equal(decisions[0]?.reviewStatus, 'active');
    assert.equal(decisions[0]?.publishToPool, true);
    assert.equal(decisions[0]?.reviewNotes.qualityGate, 'fallback_bypass');
    assert.equal(typeof decisions[0]?.reviewNotes.qualityRubricScore, 'number');
});
