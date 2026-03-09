import type { QuestionAttemptSource } from '../../types/aiEventDtos';

export interface StoryQuestionSourceLike {
    source?: QuestionAttemptSource | null;
    aiGeneratedQuestionId?: string | null;
}

const isQuestionAttemptSource = (value: unknown): value is QuestionAttemptSource => {
    return value === 'ai' || value === 'fallback' || value === 'bank';
};

export const normalizeStoryQuestionSource = (
    value: unknown
): QuestionAttemptSource | null => {
    return isQuestionAttemptSource(value) ? value : null;
};

export const resolveStoryQuestionAttemptSource = (
    question: StoryQuestionSourceLike
): QuestionAttemptSource => {
    return normalizeStoryQuestionSource(question.source) ?? (question.aiGeneratedQuestionId ? 'ai' : 'bank');
};
