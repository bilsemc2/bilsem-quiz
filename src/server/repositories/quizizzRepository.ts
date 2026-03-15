import { supabase } from '@/lib/supabase';

export interface QuizizzCodeRecord {
    id: string;
    code: string;
    subject: string;
    grade: string;
    scheduled_time: string;
    is_active: boolean;
}

export interface QuizizzRepository {
    listActiveCodesByGrade: (grade: string) => Promise<QuizizzCodeRecord[]>;
    listCompletedCodeIds: (userId: string) => Promise<string[]>;
    markCodeCompleted: (userId: string, codeId: string) => Promise<void>;
    unmarkCodeCompleted: (userId: string, codeId: string) => Promise<void>;
}

const COMPLETION_SCHEMA_CANDIDATES = [
    { table: 'user_quizizz_completions', codeColumn: 'quizizz_code_id' },
    { table: 'user_quizizz_codes', codeColumn: 'code_id' }
] as const;

const isMissingSchemaError = (error: unknown): boolean => {
    const candidate = error as { code?: unknown; message?: unknown };
    const code = typeof candidate?.code === 'string' ? candidate.code : '';
    const message = typeof candidate?.message === 'string' ? candidate.message.toLowerCase() : '';

    return (
        code === '42P01' ||
        code === '42703' ||
        code === 'PGRST204' ||
        message.includes('relation') ||
        message.includes('column')
    );
};

const listActiveCodesByGrade = async (grade: string): Promise<QuizizzCodeRecord[]> => {
    if (!grade.trim()) {
        return [];
    }

    const { data, error } = await supabase
        .from('quizizz_codes')
        .select('id, code, subject, grade, scheduled_time, is_active')
        .eq('grade', grade)
        .eq('is_active', true)
        .order('subject', { ascending: true });

    if (error || !data) {
        if (error) {
            console.error('quizizz codes fetch failed:', error);
        }
        return [];
    }

    return data as QuizizzCodeRecord[];
};

const listCompletedCodeIds = async (userId: string): Promise<string[]> => {
    for (const candidate of COMPLETION_SCHEMA_CANDIDATES) {
        const { data, error } = await supabase
            .from(candidate.table)
            .select(candidate.codeColumn)
            .eq('user_id', userId);

        if (!error && data) {
            return data
                .map((row) => {
                    const value = (row as Record<string, unknown>)[candidate.codeColumn];
                    return typeof value === 'string' ? value : null;
                })
                .filter((value): value is string => Boolean(value));
        }

        if (error && !isMissingSchemaError(error)) {
            console.error('quizizz completed codes fetch failed:', error);
        }
    }

    return [];
};

const markCodeCompleted = async (userId: string, codeId: string): Promise<void> => {
    for (const candidate of COMPLETION_SCHEMA_CANDIDATES) {
        const payload: Record<string, string> = {
            user_id: userId,
            [candidate.codeColumn]: codeId
        };

        const { error } = await supabase
            .from(candidate.table)
            .insert(payload);

        if (!error) {
            return;
        }

        if (!isMissingSchemaError(error)) {
            throw error;
        }
    }

    throw new Error('Quizizz completion table is not available');
};

const unmarkCodeCompleted = async (userId: string, codeId: string): Promise<void> => {
    for (const candidate of COMPLETION_SCHEMA_CANDIDATES) {
        const { error } = await supabase
            .from(candidate.table)
            .delete()
            .eq('user_id', userId)
            .eq(candidate.codeColumn, codeId);

        if (!error) {
            return;
        }

        if (!isMissingSchemaError(error)) {
            throw error;
        }
    }

    throw new Error('Quizizz completion table is not available');
};

export const quizizzRepository: QuizizzRepository = {
    listActiveCodesByGrade,
    listCompletedCodeIds,
    markCodeCompleted,
    unmarkCodeCompleted
};
