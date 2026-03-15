import {
    authRepository,
    type AuthRepository
} from '@/server/repositories/authRepository';
import {
    edgeAiProxyRepository,
    type EdgeAiProxyRepository
} from '@/server/repositories/edgeAiProxyRepository';

export type MusicExamModule =
    | 'tek-ses'
    | 'cift-ses'
    | 'ezgi'
    | 'ritim'
    | 'sarki'
    | 'uretkenlik';

export interface MusicExamContentRequest {
    module: MusicExamModule;
    questionIndex: number;
    totalQuestions: number;
    difficulty: number;
    previousNotes?: string[];
}

export interface MusicExamAnalysisRequest {
    module: MusicExamModule;
    target: unknown;
    detected: unknown;
    questionIndex: number;
    difficulty: number;
    audioBase64?: string;
    audioMimeType?: string;
}

export interface MusicExamReportRequest {
    moduleScores: Array<{
        module: MusicExamModule;
        earnedPoints: number;
        maxPoints: number;
        details: string;
    }>;
}

export interface MusicExamProxyResult<T> {
    result: T | null;
    error: string | null;
    retryAfterSec: number | null;
}

const mapProxyResult = <T>(
    payload: { result?: unknown; error?: unknown; retryAfterSec?: unknown }
): MusicExamProxyResult<T> => {
    return {
        result: (payload.result as T | null | undefined) ?? null,
        error:
            typeof payload.error === 'string' && payload.error.trim().length > 0
                ? payload.error
                : null,
        retryAfterSec:
            typeof payload.retryAfterSec === 'number' && Number.isFinite(payload.retryAfterSec)
                ? payload.retryAfterSec
                : null
    };
};

export const requestMusicExamContent = async <T>(
    input: MusicExamContentRequest,
    deps: {
        auth: Pick<AuthRepository, 'getAccessToken'>;
        proxy: Pick<EdgeAiProxyRepository, 'invokeGeminiProxy'>;
    } = { auth: authRepository, proxy: edgeAiProxyRepository }
): Promise<MusicExamProxyResult<T>> => {
    const accessToken = await deps.auth.getAccessToken();
    const payload = await deps.proxy.invokeGeminiProxy(
        {
            action: 'generateMusicExamContent',
            module: input.module,
            questionIndex: input.questionIndex,
            totalQuestions: input.totalQuestions,
            difficulty: input.difficulty,
            previousNotes: input.previousNotes ?? []
        },
        accessToken
    );

    return mapProxyResult<T>(payload);
};

export const requestMusicExamAnalysis = async <T>(
    input: MusicExamAnalysisRequest,
    deps: {
        auth: Pick<AuthRepository, 'getAccessToken'>;
        proxy: Pick<EdgeAiProxyRepository, 'invokeGeminiProxy'>;
    } = { auth: authRepository, proxy: edgeAiProxyRepository }
): Promise<MusicExamProxyResult<T>> => {
    const accessToken = await deps.auth.getAccessToken();
    const payload = await deps.proxy.invokeGeminiProxy(
        {
            action: 'analyzeMusicExamPerformance',
            module: input.module,
            target: input.target,
            detected: input.detected,
            questionIndex: input.questionIndex,
            difficulty: input.difficulty,
            ...(input.audioBase64
                ? {
                    audioBase64: input.audioBase64,
                    audioMimeType: input.audioMimeType || 'audio/webm'
                }
                : {})
        },
        accessToken
    );

    return mapProxyResult<T>(payload);
};

export const requestMusicExamReport = async <T>(
    input: MusicExamReportRequest,
    deps: {
        auth: Pick<AuthRepository, 'getAccessToken'>;
        proxy: Pick<EdgeAiProxyRepository, 'invokeGeminiProxy'>;
    } = { auth: authRepository, proxy: edgeAiProxyRepository }
): Promise<MusicExamProxyResult<T>> => {
    const accessToken = await deps.auth.getAccessToken();
    const payload = await deps.proxy.invokeGeminiProxy(
        {
            action: 'generateMusicExamReport',
            moduleScores: input.moduleScores
        },
        accessToken
    );

    return mapProxyResult<T>(payload);
};
