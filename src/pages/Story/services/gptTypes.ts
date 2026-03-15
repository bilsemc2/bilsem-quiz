// Story GPT Service — Common types and helpers

import { StoryTheme } from '../components/types.ts';
import type {
    AIQuestionGenerationMetadata,
    DifficultyLevel,
    AdaptiveQuestion,
} from '@/features/ai/model/types';
import {
    buildQuestionFingerprint,
} from '@/features/ai/question-generation/model/generationPersistenceModel';
import { resolveStoryQuestionAttemptSource } from '@/shared/story/model/questionSource';
import type { QuestionAttemptSource } from '@/shared/types/aiEventDtos';

export interface GeneratedQuestion {
    id?: string;
    aiGeneratedQuestionId?: string;
    source?: QuestionAttemptSource;
    text: string;
    options: string[];
    correctAnswer: number;
    feedback: {
        correct: string;
        incorrect: string;
    };
}

export interface Story {
    id: string;
    title: string;
    animalInfo?: string;
    content: string;
    summary: string;
    theme: StoryTheme;
    image_url: string;
    questions: Array<{
        id?: string;
        aiGeneratedQuestionId?: string;
        source?: QuestionAttemptSource;
        text: string;
        options: string[];
        correctAnswer: number;
        feedback: {
            correct: string;
            incorrect: string;
        }
    }>;
}

// Supabase Edge Function URL
export const getEdgeFunctionUrl = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/gemini-proxy`;
};

export const STORY_AI_GENERATION_METADATA: AIQuestionGenerationMetadata = {
    providerName: 'gemini',
    modelName: 'gemini-3-flash-preview',
    promptVersion: 'story.questions.v1.0.0',
    promptProfileId: 'story.bilsem.core'
};

export const STORY_FALLBACK_GENERATION_METADATA: AIQuestionGenerationMetadata = {
    providerName: 'fallback',
    modelName: null,
    promptVersion: 'story.fallback.v1.0.0',
    promptProfileId: 'story.fallback.local'
};

export const resolveStoryGenerationMetadata = (
    source: 'ai' | 'fallback'
): AIQuestionGenerationMetadata => {
    return source === 'ai'
        ? STORY_AI_GENERATION_METADATA
        : STORY_FALLBACK_GENERATION_METADATA;
};

export const resolveTopicFromTheme = (theme: StoryTheme): string => {
    switch (theme) {
        case 'animals':
            return 'hafıza ve sınıflama';
        case 'adventure':
            return 'problem çözme';
        case 'fantasy':
            return 'yaratıcı mantık';
        case 'science':
            return 'analitik düşünme';
        case 'friendship':
            return 'sözel anlama';
        case 'life-lessons':
            return 'çıkarım ve mantık';
        default:
            return 'mantık';
    }
};

export const normalizeDifficulty = (value: number): DifficultyLevel => {
    if (value <= 1) return 1;
    if (value >= 5) return 5;
    return value as DifficultyLevel;
};

export const toStoryQuestionFromAdaptive = (question: AdaptiveQuestion): GeneratedQuestion => ({
    aiGeneratedQuestionId: question.id,
    source: question.source,
    text: question.stem,
    options: question.options,
    correctAnswer: question.correctIndex,
    feedback: {
        correct: question.explanation || 'Doğru cevap!',
        incorrect: 'Henüz doğru değil, tekrar deneyebilirsin.'
    }
});

export const toAdaptiveQuestion = (
    question: GeneratedQuestion,
    topic: string,
    source: 'ai' | 'fallback'
): AdaptiveQuestion => ({
    id: question.aiGeneratedQuestionId || question.id || crypto.randomUUID(),
    topic,
    stem: question.text,
    options: question.options,
    correctIndex: question.correctAnswer,
    explanation: question.feedback.correct || 'Doğru cevap!',
    difficultyLevel: normalizeDifficulty(3),
    source: resolveStoryQuestionAttemptSource({
        source: question.source ?? source,
        aiGeneratedQuestionId: question.aiGeneratedQuestionId
    }) === 'fallback' ? 'fallback' : 'ai'
});

export const annotateQuestionSource = (
    questions: GeneratedQuestion[],
    source: QuestionAttemptSource
): GeneratedQuestion[] => {
    return questions.map((question) => ({
        ...question,
        source: question.source ?? source
    }));
};

export const mergeUniqueQuestions = (base: GeneratedQuestion[], incoming: GeneratedQuestion[]): GeneratedQuestion[] => {
    const seen = new Set<string>();
    const merged: GeneratedQuestion[] = [];

    const append = (question: GeneratedQuestion) => {
        const fingerprint = buildQuestionFingerprint({
            stem: question.text,
            options: question.options
        });
        if (fingerprint.length === 0 || seen.has(fingerprint)) {
            return;
        }
        seen.add(fingerprint);
        merged.push(question);
    };

    base.forEach(append);
    incoming.forEach(append);

    return merged;
};
