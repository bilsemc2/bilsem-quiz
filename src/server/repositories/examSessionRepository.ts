import { supabase } from '@/lib/supabase';
import { err, ok, type AppError, type Result } from '@/shared/types/result';

export interface ExamSessionSummary {
    bzp_score: number | null;
    final_score: number;
    results: Array<{
        passed: boolean;
        score: number;
        maxScore: number;
        level: number;
        moduleTitle?: string;
        moduleId?: string;
    }>;
    completed_at: string;
}

export interface SaveExamSessionInput {
    id: string;
    userId: string;
    startedAt: Date;
    completedAt: Date | null;
    moduleCount: number;
    results: unknown[];
    finalScore: number;
    bzpScore: number;
    abilityEstimate: string;
}

export interface ExamSessionRepository {
    saveExamSession: (input: SaveExamSessionInput) => Promise<Result<void, AppError>>;
    getLatestCompletedExamSession: (userId: string) => Promise<ExamSessionSummary | null>;
}

const saveExamSession = async (
    input: SaveExamSessionInput
): Promise<Result<void, AppError>> => {
    try {
        const { error } = await supabase.from('exam_sessions').upsert({
            id: input.id,
            user_id: input.userId,
            started_at: input.startedAt,
            completed_at: input.completedAt,
            module_count: input.moduleCount,
            results: input.results,
            final_score: input.finalScore,
            bzp_score: input.bzpScore,
            ability_estimate: input.abilityEstimate
        }, { onConflict: 'id' });

        if (error) {
            return err({
                message: 'Sınav oturumu kaydedilemedi',
                cause: error
            });
        }

        return ok(undefined);
    } catch (cause) {
        return err({
            message: 'Sınav oturumu kaydedilemedi',
            cause
        });
    }
};

const getLatestCompletedExamSession = async (
    userId: string
): Promise<ExamSessionSummary | null> => {
    const { data, error } = await supabase
        .from('exam_sessions')
        .select('bzp_score, final_score, results, completed_at')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !data) {
        if (error) {
            console.error('latest exam session fetch failed:', error);
        }
        return null;
    }

    return data as ExamSessionSummary;
};

export const examSessionRepository: ExamSessionRepository = {
    saveExamSession,
    getLatestCompletedExamSession
};
