import { supabase } from '@/lib/supabase';

export interface CreateErrorLogInput {
    errorMessage: string;
    errorStack: string | null;
    componentStack: string | null;
    url: string;
    userAgent: string;
    createdAt: string;
}

export interface ErrorLogRepository {
    createErrorLog: (input: CreateErrorLogInput) => Promise<void>;
}

const createErrorLog = async (input: CreateErrorLogInput): Promise<void> => {
    const { error } = await supabase.from('error_logs').insert({
        error_message: input.errorMessage,
        error_stack: input.errorStack,
        component_stack: input.componentStack,
        url: input.url,
        user_agent: input.userAgent,
        created_at: input.createdAt
    });

    if (error) {
        throw error;
    }
};

export const errorLogRepository: ErrorLogRepository = {
    createErrorLog
};
