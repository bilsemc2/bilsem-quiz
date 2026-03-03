import { supabase } from '@/lib/supabase';
import type { AdaptiveQuestion, DifficultyLevel } from '@/features/ai/model/types';

type QuestionLocale = 'tr' | 'en';

interface AIGeneratedQuestionDbRow {
    id: string;
    topic: string;
    locale: QuestionLocale;
    stem: string;
    options: string[] | string;
    correct_index: number;
    explanation: string;
    difficulty_level: number;
    source: 'ai' | 'fallback';
    served_count: number;
}

interface SaveGeneratedQuestionDbRow {
    id: string;
    topic: string;
    stem: string;
    options: string[] | string;
    correct_index: number;
    explanation: string;
    difficulty_level: number;
    source: 'ai' | 'fallback';
}

interface ExistingQuestionFingerprintRow {
    stem: string;
    options: string[] | string;
}

export interface ListPendingQuestionsInput {
    userId: string;
    topic: string;
    locale: QuestionLocale;
    limit: number;
    maxServedCountBeforeRetire?: number;
}

export interface SaveGeneratedQuestionsInput {
    userId: string;
    topic: string;
    locale: QuestionLocale;
    questions: AdaptiveQuestion[];
}

export interface AIQuestionPoolRepository {
    getPendingQuestionCount: (input: {
        userId: string;
        topic: string;
        locale: QuestionLocale;
        maxServedCountBeforeRetire?: number;
    }) => Promise<number>;
    listPendingQuestions: (input: ListPendingQuestionsInput) => Promise<AdaptiveQuestion[]>;
    saveGeneratedQuestions: (input: SaveGeneratedQuestionsInput) => Promise<AdaptiveQuestion[]>;
    markQuestionSolved: (userId: string, questionId: string) => Promise<void>;
}

const clampDifficulty = (value: number): DifficultyLevel => {
    if (value <= 1) return 1;
    if (value >= 5) return 5;
    return value as DifficultyLevel;
};

const normalizeQuestionText = (value: string): string => {
    return value
        .toLocaleLowerCase('tr-TR')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const toOptions = (value: string[] | string): string[] => {
    if (Array.isArray(value)) {
        return value.filter((item) => typeof item === 'string');
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value) as unknown;
            return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
        } catch {
            return [];
        }
    }

    return [];
};

const buildQuestionFingerprint = (input: { stem: string; options: string[] | string }): string => {
    const stem = normalizeQuestionText(input.stem);
    const options = toOptions(input.options)
        .map((option) => normalizeQuestionText(option))
        .filter((option) => option.length > 0)
        .sort();

    return `${stem}::${options.join('|')}`;
};

const loadExistingFingerprints = async (input: {
    userId: string;
    topic: string;
    locale: QuestionLocale;
}): Promise<Set<string>> => {
    const { data, error } = await supabase
        .from('ai_generated_questions')
        .select('stem, options')
        .eq('user_id', input.userId)
        .eq('topic', input.topic)
        .eq('locale', input.locale)
        .in('status', ['pending', 'solved'])
        .order('created_at', { ascending: false })
        .limit(250);

    if (error || !data) {
        if (error) {
            console.error('existing ai question fingerprints fetch failed:', error);
        }
        return new Set<string>();
    }

    return new Set(
        (data as unknown as ExistingQuestionFingerprintRow[])
            .map((row) => buildQuestionFingerprint(row))
            .filter((fingerprint) => fingerprint.length > 0)
    );
};

const mapDbRowToAdaptiveQuestion = (
    row: AIGeneratedQuestionDbRow | SaveGeneratedQuestionDbRow
): AdaptiveQuestion => ({
    id: row.id,
    topic: row.topic,
    stem: row.stem,
    options: toOptions(row.options),
    correctIndex: Number(row.correct_index) || 0,
    explanation: row.explanation,
    difficultyLevel: clampDifficulty(Number(row.difficulty_level) || 3),
    source: row.source
});

const getPendingQuestionCount = async (input: {
    userId: string;
    topic: string;
    locale: QuestionLocale;
    maxServedCountBeforeRetire?: number;
}): Promise<number> => {
    const maxServedCount = input.maxServedCountBeforeRetire ?? 2;

    const { count, error } = await supabase
        .from('ai_generated_questions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', input.userId)
        .eq('topic', input.topic)
        .eq('locale', input.locale)
        .eq('status', 'pending')
        .lt('served_count', maxServedCount);

    if (error) {
        console.error('pending ai question count failed:', error);
        return 0;
    }

    return Number(count) || 0;
};

const listPendingQuestions = async (input: ListPendingQuestionsInput): Promise<AdaptiveQuestion[]> => {
    const maxServedCount = input.maxServedCountBeforeRetire ?? 2;
    const limit = Math.max(1, Math.round(input.limit));

    const { data, error } = await supabase
        .from('ai_generated_questions')
        .select('id, topic, locale, stem, options, correct_index, explanation, difficulty_level, source, served_count')
        .eq('user_id', input.userId)
        .eq('topic', input.topic)
        .eq('locale', input.locale)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(Math.max(limit * 3, 12));

    if (error || !data) {
        if (error) {
            console.error('pending ai question fetch failed:', error);
        }
        return [];
    }

    const rows = data as unknown as AIGeneratedQuestionDbRow[];
    const staleIds = rows
        .filter((row) => Number(row.served_count) >= maxServedCount)
        .map((row) => row.id);

    if (staleIds.length > 0) {
        const { error: retireError } = await supabase
            .from('ai_generated_questions')
            .update({ status: 'retired' })
            .eq('user_id', input.userId)
            .in('id', staleIds);

        if (retireError) {
            console.error('stale ai question retire failed:', retireError);
        }
    }

    const eligibleRows = rows.filter((row) => Number(row.served_count) < maxServedCount);
    const selectedRows = eligibleRows.slice(0, limit);
    const nowISO = new Date().toISOString();

    await Promise.all(
        selectedRows.map(async (row) => {
            const { error: touchError } = await supabase
                .from('ai_generated_questions')
                .update({
                    served_count: Number(row.served_count) + 1,
                    last_served_at: nowISO
                })
                .eq('id', row.id)
                .eq('user_id', input.userId);

            if (touchError) {
                console.error('ai question served_count update failed:', touchError);
            }
        })
    );

    return selectedRows.map(mapDbRowToAdaptiveQuestion);
};

const saveGeneratedQuestions = async (input: SaveGeneratedQuestionsInput): Promise<AdaptiveQuestion[]> => {
    if (input.questions.length === 0) {
        return [];
    }

    const existingFingerprints = await loadExistingFingerprints({
        userId: input.userId,
        topic: input.topic,
        locale: input.locale
    });

    const uniqueQuestions = input.questions.filter((question) => {
        const fingerprint = buildQuestionFingerprint({
            stem: question.stem,
            options: question.options
        });

        if (!fingerprint || existingFingerprints.has(fingerprint)) {
            return false;
        }

        existingFingerprints.add(fingerprint);
        return true;
    });

    if (uniqueQuestions.length === 0) {
        return [];
    }

    const insertRows = uniqueQuestions.map((question) => ({
        user_id: input.userId,
        topic: input.topic,
        locale: input.locale,
        external_id: question.id,
        stem: question.stem,
        options: question.options,
        correct_index: question.correctIndex,
        explanation: question.explanation,
        difficulty_level: question.difficultyLevel,
        source: question.source,
        generation_context: {
            originalTopic: question.topic
        }
    }));

    const { data, error } = await supabase
        .from('ai_generated_questions')
        .insert(insertRows)
        .select('id, topic, stem, options, correct_index, explanation, difficulty_level, source');

    if (error || !data) {
        throw error ?? new Error('ai generated question insert failed');
    }

    return (data as unknown as SaveGeneratedQuestionDbRow[]).map(mapDbRowToAdaptiveQuestion);
};

const markQuestionSolved = async (userId: string, questionId: string): Promise<void> => {
    const { error } = await supabase
        .from('ai_generated_questions')
        .update({
            status: 'solved',
            solved_at: new Date().toISOString()
        })
        .eq('id', questionId)
        .eq('user_id', userId)
        .eq('status', 'pending');

    if (error) {
        throw error;
    }
};

export const aiQuestionPoolRepository: AIQuestionPoolRepository = {
    getPendingQuestionCount,
    listPendingQuestions,
    saveGeneratedQuestions,
    markQuestionSolved
};
