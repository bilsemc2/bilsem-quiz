import type { AdaptiveQuestion, DifficultyLevel } from '../../model/types';

export interface QuestionSchemaValidationSuccess {
    success: true;
    value: AdaptiveQuestion;
}

export interface QuestionSchemaValidationFailure {
    success: false;
    errors: string[];
}

export type QuestionSchemaValidationResult =
    | QuestionSchemaValidationSuccess
    | QuestionSchemaValidationFailure;

const clampDifficulty = (value: number): DifficultyLevel => {
    if (value <= 1) return 1;
    if (value >= 5) return 5;
    return value as DifficultyLevel;
};

const isStringArray = (value: unknown): value is string[] => {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
};

export const validateAdaptiveQuestionSchema = (value: unknown): QuestionSchemaValidationResult => {
    const errors: string[] = [];

    if (!value || typeof value !== 'object') {
        return { success: false, errors: ['Result must be an object'] };
    }

    const candidate = value as Partial<AdaptiveQuestion> & { difficultyLevel?: unknown };

    if (typeof candidate.id !== 'string' || candidate.id.trim().length === 0) {
        errors.push('id must be a non-empty string');
    }
    if (typeof candidate.topic !== 'string' || candidate.topic.trim().length === 0) {
        errors.push('topic must be a non-empty string');
    }
    if (typeof candidate.stem !== 'string' || candidate.stem.trim().length < 5) {
        errors.push('stem must be a string with at least 5 characters');
    }
    if (!isStringArray(candidate.options) || candidate.options.length !== 4) {
        errors.push('options must be a string array with exactly 4 items');
    }
    if (typeof candidate.correctIndex !== 'number' || !Number.isInteger(candidate.correctIndex) || candidate.correctIndex < 0 || candidate.correctIndex > 3) {
        errors.push('correctIndex must be an integer between 0 and 3');
    }
    if (typeof candidate.explanation !== 'string' || candidate.explanation.trim().length < 5) {
        errors.push('explanation must be a string with at least 5 characters');
    }
    if (typeof candidate.difficultyLevel !== 'number') {
        errors.push('difficultyLevel must be a number');
    }
    if (candidate.source !== 'ai' && candidate.source !== 'fallback') {
        errors.push('source must be "ai" or "fallback"');
    }

    if (errors.length > 0) {
        return { success: false, errors };
    }

    const normalized: AdaptiveQuestion = {
        id: candidate.id!.trim(),
        topic: candidate.topic!.trim(),
        stem: candidate.stem!.trim(),
        options: candidate.options!.map((option) => option.trim()),
        correctIndex: candidate.correctIndex!,
        explanation: candidate.explanation!.trim(),
        difficultyLevel: clampDifficulty(Number(candidate.difficultyLevel)),
        source: candidate.source as 'ai' | 'fallback'
    };

    return { success: true, value: normalized };
};
