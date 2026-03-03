import assert from 'node:assert/strict';
import test from 'node:test';
import { generateStoryQuestionSet } from '../../../../src/features/ai/question-generation/model/storyQuestionSetUseCase.ts';
import type { AdaptiveQuestionRequest } from '../../../../src/features/ai/model/types.ts';

test('generateStoryQuestionSet creates requested number of story questions', async () => {
    const mockedGenerate = async (request: AdaptiveQuestionRequest) => ({
        usedFallback: false,
        question: {
            id: `q-${request.previousQuestionIds?.length ?? 0}`,
            topic: request.topic,
            stem: '2, 4, 6, ?',
            options: ['7', '8', '9', '10'],
            correctIndex: 1,
            explanation: 'İkişer artar.',
            difficultyLevel: 2 as const,
            source: 'ai' as const
        }
    });

    const questions = await generateStoryQuestionSet(
        {
            userId: 'u1',
            theme: 'science',
            locale: 'tr',
            questionCount: 3
        },
        mockedGenerate
    );

    assert.equal(questions.length, 3);
    assert.equal(questions[0].options.length, 4);
    assert.equal(questions[0].correctAnswer, 1);
    assert.match(questions[0].text, /Soru 1/);
});
