import { supabase } from '@/lib/supabase';
import type { StoryTheme } from '@/shared/story/types';
import type { QuestionAttemptSource } from '@/shared/types/aiEventDtos';

export interface StoryRecord {
    id: string;
    title: string;
    content: string;
    theme: StoryTheme;
    image_path: string | null;
    created_at: string;
}

export interface StoryQuestionRecord {
    id: string;
    ai_generated_question_id: string | null;
    source: QuestionAttemptSource | null;
    question_text: string;
    options: string[] | string;
    correct_option: string;
}

export interface CreateStoryInput {
    title: string;
    content: string;
    theme: StoryTheme;
    imagePath: string;
    createdBy: string | null;
}

export interface CreateStoryQuestionInput {
    storyId: string;
    aiGeneratedQuestionId: string | null;
    source: QuestionAttemptSource;
    questionText: string;
    options: string[];
    correctOption: string;
    difficultyLevel: string;
}

export interface StoryRepository {
    createStory: (input: CreateStoryInput) => Promise<StoryRecord>;
    createStoryQuestions: (questions: CreateStoryQuestionInput[]) => Promise<void>;
    listStories: () => Promise<StoryRecord[]>;
    listQuestionsByStoryId: (storyId: string) => Promise<StoryQuestionRecord[]>;
}

const createStory = async (input: CreateStoryInput): Promise<StoryRecord> => {
    const { data, error } = await supabase
        .from('story')
        .insert({
            title: input.title,
            content: input.content,
            theme: input.theme,
            age_range: '7-12',
            is_active: true,
            image_path: input.imagePath,
            created_by: input.createdBy
        })
        .select('id, title, content, theme, image_path, created_at')
        .single();

    if (error || !data) {
        throw error || new Error('Hikaye kaydedilemedi');
    }

    return data as StoryRecord;
};

const createStoryQuestions = async (questions: CreateStoryQuestionInput[]): Promise<void> => {
    if (questions.length === 0) {
        return;
    }

    const payload = questions.map((question) => ({
        story_id: question.storyId,
        ai_generated_question_id: question.aiGeneratedQuestionId,
        source: question.source,
        question_text: question.questionText,
        options: question.options,
        correct_option: question.correctOption,
        difficulty_level: question.difficultyLevel
    }));

    const { error } = await supabase
        .from('story_questions')
        .insert(payload);

    if (error) {
        throw error;
    }
};

const listStories = async (): Promise<StoryRecord[]> => {
    const { data, error } = await supabase
        .from('story')
        .select('id, title, content, theme, image_path, created_at')
        .order('created_at', { ascending: false });

    if (error || !data) {
        if (error) {
            console.error('stories list failed:', error);
        }
        return [];
    }

    return data as StoryRecord[];
};

const listQuestionsByStoryId = async (storyId: string): Promise<StoryQuestionRecord[]> => {
    const { data, error } = await supabase
        .from('story_questions')
        .select('id, ai_generated_question_id, source, question_text, options, correct_option')
        .eq('story_id', storyId);

    if (error || !data) {
        if (error) {
            console.error('story questions fetch failed:', error);
        }
        return [];
    }

    return data as StoryQuestionRecord[];
};

export const storyRepository: StoryRepository = {
    createStory,
    createStoryQuestions,
    listStories,
    listQuestionsByStoryId
};
