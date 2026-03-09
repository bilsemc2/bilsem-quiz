import { supabase } from '@/lib/supabase';

export interface AdminAIGenerationJobRecord {
    id: string;
    topic: string;
    locale: 'tr' | 'en' | string;
    job_type: 'story_questions' | 'adaptive_pool' | string;
    requested_question_count: number | null;
    generated_question_count: number | null;
    status: 'pending' | 'completed' | 'failed' | string;
    model_name: string | null;
    error_message: string | null;
    request_context: Record<string, unknown> | null;
    response_summary: Record<string, unknown> | null;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
}

export interface AdminAIQuestionRecord {
    id: string;
    topic: string;
    locale: 'tr' | 'en' | string;
    source: 'ai' | 'fallback' | 'bank' | string;
    model_name: string | null;
    prompt_version: string | null;
    review_status: 'candidate' | 'active' | 'rejected' | string;
    review_notes: Record<string, unknown> | null;
    difficulty_level: number | null;
    stem: string;
    options: unknown;
    explanation: string;
    created_at: string;
}

export interface AIOperationsRepository {
    listRecentGenerationJobs: (limit: number) => Promise<AdminAIGenerationJobRecord[]>;
    listRecentQuestions: (limit: number) => Promise<AdminAIQuestionRecord[]>;
}

const clampLimit = (limit: number, max: number): number => {
    return Math.max(1, Math.min(Math.round(limit), max));
};

const listRecentGenerationJobs = async (
    limit: number
): Promise<AdminAIGenerationJobRecord[]> => {
    const safeLimit = clampLimit(limit, 500);
    const { data, error } = await supabase
        .from('ai_generation_jobs')
        .select([
            'id',
            'topic',
            'locale',
            'job_type',
            'requested_question_count',
            'generated_question_count',
            'status',
            'model_name',
            'error_message',
            'request_context',
            'response_summary',
            'started_at',
            'completed_at',
            'created_at'
        ].join(', '))
        .order('created_at', { ascending: false })
        .limit(safeLimit);

    if (error || !data) {
        if (error) {
            console.error('ai generation jobs fetch failed:', error);
        }
        return [];
    }

    return data as unknown as AdminAIGenerationJobRecord[];
};

const listRecentQuestions = async (
    limit: number
): Promise<AdminAIQuestionRecord[]> => {
    const safeLimit = clampLimit(limit, 1000);
    const { data, error } = await supabase
        .from('ai_questions')
        .select([
            'id',
            'topic',
            'locale',
            'source',
            'model_name',
            'prompt_version',
            'review_status',
            'review_notes',
            'difficulty_level',
            'stem',
            'options',
            'explanation',
            'created_at'
        ].join(', '))
        .order('created_at', { ascending: false })
        .limit(safeLimit);

    if (error || !data) {
        if (error) {
            console.error('ai questions fetch failed:', error);
        }
        return [];
    }

    return data as unknown as AdminAIQuestionRecord[];
};

export const aiOperationsRepository: AIOperationsRepository = {
    listRecentGenerationJobs,
    listRecentQuestions
};
