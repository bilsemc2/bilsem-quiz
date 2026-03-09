import assert from 'node:assert/strict';
import test from 'node:test';
import {
    normalizeStoryQuestionSource,
    resolveStoryQuestionAttemptSource
} from '../../../../src/shared/story/model/questionSource.ts';

test('normalizeStoryQuestionSource accepts supported sources only', () => {
    assert.equal(normalizeStoryQuestionSource('fallback'), 'fallback');
    assert.equal(normalizeStoryQuestionSource('bank'), 'bank');
    assert.equal(normalizeStoryQuestionSource('unsupported'), null);
});

test('resolveStoryQuestionAttemptSource preserves explicit fallback source', () => {
    const source = resolveStoryQuestionAttemptSource({
        source: 'fallback',
        aiGeneratedQuestionId: 'ai-question-1'
    });

    assert.equal(source, 'fallback');
});

test('resolveStoryQuestionAttemptSource defaults to ai when aiGeneratedQuestionId exists', () => {
    const source = resolveStoryQuestionAttemptSource({
        aiGeneratedQuestionId: 'ai-question-2'
    });

    assert.equal(source, 'ai');
});

test('resolveStoryQuestionAttemptSource defaults to bank without source metadata', () => {
    const source = resolveStoryQuestionAttemptSource({});

    assert.equal(source, 'bank');
});
