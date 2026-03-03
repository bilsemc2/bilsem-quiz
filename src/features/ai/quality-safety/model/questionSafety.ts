import type { AdaptiveQuestion, DifficultyLevel } from '../../model/types';

const BANNED_PATTERNS = [/hakaret/i, /küfür/i, /violence/i];

const hasBannedContent = (value: string): boolean => {
    return BANNED_PATTERNS.some((pattern) => pattern.test(value));
};

const trimOptions = (options: string[]): string[] => options.map((option) => option.trim());

const hasDuplicateOptions = (options: string[]): boolean => {
    const normalized = options.map((item) => item.toLocaleLowerCase('tr-TR'));
    return new Set(normalized).size !== normalized.length;
};

export const isQuestionSafe = (question: AdaptiveQuestion): boolean => {
    if (!question.stem.trim() || question.stem.trim().length < 5) return false;
    if (question.options.length !== 4) return false;
    if (question.correctIndex < 0 || question.correctIndex > 3) return false;
    if (question.explanation.trim().length < 5) return false;
    if (hasBannedContent(question.stem) || hasBannedContent(question.explanation)) return false;
    if (trimOptions(question.options).some((option) => option.length === 0)) return false;
    if (hasDuplicateOptions(trimOptions(question.options))) return false;
    return true;
};

export const sanitizeQuestion = (question: Omit<AdaptiveQuestion, 'difficultyLevel'> & { difficultyLevel: number }): AdaptiveQuestion => {
    const difficulty = Math.min(5, Math.max(1, Math.round(question.difficultyLevel))) as DifficultyLevel;

    return {
        ...question,
        stem: question.stem.trim(),
        explanation: question.explanation.trim(),
        options: trimOptions(question.options),
        difficultyLevel: difficulty
    };
};
