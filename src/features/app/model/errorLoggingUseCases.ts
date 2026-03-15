import {
    errorLogRepository,
    type CreateErrorLogInput,
    type ErrorLogRepository
} from '@/server/repositories/errorLogRepository';

const STACK_LIMIT = 2000;

export interface RuntimeErrorLogInput {
    error: Error;
    componentStack?: string | null;
    url: string;
    userAgent: string;
    createdAtISO?: string;
}

const truncateText = (value: string | null | undefined): string | null => {
    if (!value) {
        return null;
    }

    return value.substring(0, STACK_LIMIT);
};

export const toRuntimeErrorLogInput = (
    input: RuntimeErrorLogInput
): CreateErrorLogInput => {
    return {
        errorMessage: input.error.message,
        errorStack: truncateText(input.error.stack),
        componentStack: truncateText(input.componentStack),
        url: input.url,
        userAgent: input.userAgent,
        createdAt: input.createdAtISO ?? new Date().toISOString()
    };
};

export const logRuntimeError = async (
    input: RuntimeErrorLogInput,
    deps: Pick<ErrorLogRepository, 'createErrorLog'> = errorLogRepository
): Promise<boolean> => {
    try {
        await deps.createErrorLog(toRuntimeErrorLogInput(input));
        return true;
    } catch {
        return false;
    }
};
