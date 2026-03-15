import assert from 'node:assert/strict';
import test from 'node:test';
import {
    loadStories,
    saveStoryQuestionsToStory,
    shuffleStoryQuestionOptions
} from '../../../../src/features/content/model/storyUseCases.ts';
import type { Question } from '../../../../src/shared/story/types.ts';

const buildQuestion = (overrides: Partial<Question> = {}): Question => ({
    text: 'Soru',
    options: ['Kedi', 'Kopek', 'Kus'],
    correctAnswer: 1,
    feedback: {
        correct: 'Dogru',
        incorrect: 'Yanlis'
    },
    ...overrides
});

test('shuffleStoryQuestionOptions keeps the correct option aligned after shuffling', () => {
    const question = buildQuestion();

    const shuffled = shuffleStoryQuestionOptions(question);

    assert.equal(shuffled.options.length, 3);
    assert.equal(shuffled.options[shuffled.correctAnswer], 'Kopek');
    assert.deepEqual([...shuffled.options].sort(), [...question.options].sort());
});

test('loadStories maps repository story and question rows into shared story models', async () => {
    const stories = await loadStories({
        listStories: async () => [
            {
                id: 'story-1',
                title: 'Orman Macerasi',
                content: 'Bir varmis...',
                theme: 'animals',
                image_path: 'stories/forest.png',
                created_at: '2026-03-12T10:00:00.000Z'
            }
        ],
        listQuestionsByStoryId: async (storyId) => {
            assert.equal(storyId, 'story-1');
            return [
                {
                    id: 'question-1',
                    ai_generated_question_id: 'ai-question-1',
                    source: null,
                    question_text: 'Hangisi dogrudur?',
                    options: '["Kedi","Kopek","Kus"]',
                    correct_option: 'Kopek'
                }
            ];
        }
    });

    assert.equal(stories.length, 1);
    assert.equal(stories[0].image_url, '/stories/forest.png');
    assert.equal(stories[0].questions.length, 1);
    assert.equal(stories[0].questions[0].source, 'ai');
    assert.equal(
        stories[0].questions[0].options[stories[0].questions[0].correctAnswer],
        'Kopek'
    );
});

test('saveStoryQuestionsToStory sends mapped payload to the repository', async () => {
    let receivedStoryId = '';
    let receivedCorrectOption = '';
    let receivedSource: string | null = null;

    await saveStoryQuestionsToStory(
        'story-9',
        [
            buildQuestion({
                id: 'question-9',
                aiGeneratedQuestionId: 'ai-9',
                source: 'fallback'
            })
        ],
        {
            createStoryQuestions: async (questions) => {
                assert.equal(questions.length, 1);
                receivedStoryId = questions[0].storyId;
                receivedCorrectOption = questions[0].correctOption;
                receivedSource = questions[0].source;
            }
        }
    );

    assert.equal(receivedStoryId, 'story-9');
    assert.equal(receivedCorrectOption, 'Kopek');
    assert.equal(receivedSource, 'fallback');
});
