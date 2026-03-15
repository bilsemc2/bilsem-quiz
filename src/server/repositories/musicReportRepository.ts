import { supabase } from '@/lib/supabase';

export interface MusicOverallReportRecord {
    overall_score: number;
    pitch_score: number;
    rhythm_score: number;
    melody_score: number;
    expression_score: number;
    level: string;
    created_at: string;
}

export interface MusicReportRepository {
    getLatestOverallReportByUserId: (userId: string) => Promise<MusicOverallReportRecord | null>;
    countCompletedTestsByUserId: (userId: string) => Promise<number>;
}

const getLatestOverallReportByUserId = async (
    userId: string
): Promise<MusicOverallReportRecord | null> => {
    const { data, error } = await supabase
        .from('music_overall_reports')
        .select(
            'overall_score, pitch_score, rhythm_score, melody_score, expression_score, level, created_at'
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !data) {
        if (error) {
            console.error('latest music report fetch failed:', error);
        }
        return null;
    }

    return data as MusicOverallReportRecord;
};

const countCompletedTestsByUserId = async (userId: string): Promise<number> => {
    const { count, error } = await supabase
        .from('music_test_results')
        .select('test_type', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) {
        console.error('completed music tests count failed:', error);
        return 0;
    }

    return count ?? 0;
};

export const musicReportRepository: MusicReportRepository = {
    getLatestOverallReportByUserId,
    countCompletedTestsByUserId
};
