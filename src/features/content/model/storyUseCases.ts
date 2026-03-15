import {
    authRepository,
    type AuthRepository
} from '@/server/repositories/authRepository';
import {
    storyRepository,
    type CreateStoryQuestionInput,
    type StoryQuestionRecord,
    type StoryRepository
} from '@/server/repositories/storyRepository';
import type { Question, Story, StoryTheme } from '@/shared/story/types';
import { resolveStoryQuestionAttemptSource } from '@/shared/story/model/questionSource';

const STORIES_KEY = 'local_stories';

export interface StoryDraft {
    title: string;
    content: string;
    animalInfo?: string;
    summary: string;
    theme: StoryTheme;
    image_url: string;
    questions: Question[];
}

const parseStoredStories = (storiesJson: string | null): Story[] => {
    if (!storiesJson) {
        return [];
    }

    const parsed = JSON.parse(storiesJson);
    return Array.isArray(parsed) ? (parsed as Story[]) : [];
};

const getStoriesFromLocalStorage = (): Story[] => {
    try {
        return parseStoredStories(localStorage.getItem(STORIES_KEY));
    } catch (error) {
        console.error('Hikayeler yerel depolamadan okunamadi:', error);
        return [];
    }
};

const saveStoriesToLocalStorage = (stories: Story[]) => {
    localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
};

const normalizeOptions = (options: string[] | string): string[] => {
    if (Array.isArray(options)) {
        return options;
    }

    try {
        const parsed = JSON.parse(options);
        return Array.isArray(parsed) ? parsed.filter((option): option is string => typeof option === 'string') : [];
    } catch {
        return [];
    }
};

export const shuffleStoryQuestionOptions = <T extends { options: string[]; correctAnswer: number }>(
    question: T
): T => {
    const options = [...question.options];
    const correctOption = options[question.correctAnswer];

    for (let i = options.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }

    return {
        ...question,
        options,
        correctAnswer: options.indexOf(correctOption)
    };
};

const mapQuestionRecord = (question: StoryQuestionRecord): Question => {
    const options = normalizeOptions(question.options);
    const correctAnswer = options.findIndex((option) => option === question.correct_option);

    return shuffleStoryQuestionOptions({
        id: question.id,
        aiGeneratedQuestionId: question.ai_generated_question_id || undefined,
        source: resolveStoryQuestionAttemptSource({
            source: question.source ?? undefined,
            aiGeneratedQuestionId: question.ai_generated_question_id || undefined
        }),
        text: question.question_text,
        options,
        correctAnswer: correctAnswer >= 0 ? correctAnswer : 0,
        feedback: {
            correct: 'Doğru cevap!',
            incorrect: 'Tekrar deneyin.'
        }
    });
};

const mapQuestionsToInsert = (storyId: string, questions: Question[]): CreateStoryQuestionInput[] => {
    return questions.map((question) => ({
        storyId,
        aiGeneratedQuestionId: question.aiGeneratedQuestionId || null,
        source: resolveStoryQuestionAttemptSource(question),
        questionText: question.text,
        options: question.options,
        correctOption: question.options[question.correctAnswer],
        difficultyLevel: 'normal'
    }));
};

export const saveStoryContent = async (
    story: StoryDraft,
    deps: {
        auth: Pick<AuthRepository, 'getSessionUser'>;
        stories: Pick<StoryRepository, 'createStory' | 'createStoryQuestions'>;
    } = { auth: authRepository, stories: storyRepository }
): Promise<Story> => {
    try {
        const user = await deps.auth.getSessionUser();
        const insertedStory = await deps.stories.createStory({
            title: story.title,
            content: story.content,
            theme: story.theme,
            imagePath: story.image_url,
            createdBy: user?.id ?? null
        });

        if (story.questions.length > 0) {
            await deps.stories.createStoryQuestions(
                mapQuestionsToInsert(insertedStory.id, story.questions)
            );
        }

        const newStory: Story = {
            id: insertedStory.id,
            title: story.title,
            content: story.content,
            summary: story.summary,
            theme: story.theme,
            image_url: story.image_url,
            animalInfo: story.animalInfo,
            questions: story.questions,
            created_at: insertedStory.created_at || new Date().toISOString()
        };

        const stories = getStoriesFromLocalStorage();
        stories.push(newStory);
        saveStoriesToLocalStorage(stories);

        return newStory;
    } catch (error) {
        console.error('Hikaye kaydedilirken bir hata oluştu:', error);

        const stories = getStoriesFromLocalStorage();
        const fallbackStory: Story = {
            id: crypto.randomUUID(),
            ...story,
            created_at: new Date().toISOString()
        };
        stories.push(fallbackStory);
        saveStoriesToLocalStorage(stories);
        return fallbackStory;
    }
};

export const loadStories = async (
    deps: Pick<StoryRepository, 'listStories' | 'listQuestionsByStoryId'> = storyRepository
): Promise<Story[]> => {
    try {
        const storyData = await deps.listStories();
        if (storyData.length === 0) {
            return getStoriesFromLocalStorage();
        }

        const stories = await Promise.all(
            storyData.map(async (storyItem) => {
                const questionData = await deps.listQuestionsByStoryId(storyItem.id);
                return {
                    id: storyItem.id,
                    title: storyItem.title,
                    content: storyItem.content,
                    theme: storyItem.theme,
                    image_url: storyItem.image_path
                        ? (storyItem.image_path.startsWith('/') ? storyItem.image_path : `/${storyItem.image_path}`)
                        : '',
                    summary: '',
                    questions: questionData.map(mapQuestionRecord),
                    created_at: storyItem.created_at
                } satisfies Story;
            })
        );

        return stories;
    } catch (error) {
        console.error('Hikayeler yüklenirken hata oluştu:', error);
        return getStoriesFromLocalStorage();
    }
};

export const saveStoryQuestionsToStory = async (
    storyId: string,
    questions: Question[],
    deps: Pick<StoryRepository, 'createStoryQuestions'> = storyRepository
): Promise<void> => {
    if (questions.length === 0) {
        return;
    }

    try {
        await deps.createStoryQuestions(mapQuestionsToInsert(storyId, questions));
    } catch (error) {
        console.error('Sorular kaydedilirken hata:', error);
    }
};
