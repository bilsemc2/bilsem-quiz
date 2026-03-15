import { supabase } from '@/lib/supabase';

export interface SystemStatsQuizProfileRow {
    full_name?: string | null;
    email?: string | null;
}

export interface SystemStatsQuizResultRow {
    score: number;
    questions_answered: number;
    correct_answers: number;
    completed_at: string;
    profiles?: SystemStatsQuizProfileRow | SystemStatsQuizProfileRow[] | null;
}

export interface SystemStatsUserProgressRow {
    points?: number | null;
    experience?: number | null;
}

export interface SystemStatsRepository {
    listQuizResults: () => Promise<SystemStatsQuizResultRow[]>;
    listUserProgress: () => Promise<SystemStatsUserProgressRow[]>;
}

const listQuizResults = async (): Promise<SystemStatsQuizResultRow[]> => {
    const { data, error } = await supabase
        .from('quiz_results')
        .select('score, questions_answered, correct_answers, completed_at, profiles(full_name, email)');

    if (error || !data) {
        if (error) {
            console.error('quiz results fetch failed:', error);
        }
        return [];
    }

    return data as SystemStatsQuizResultRow[];
};

const listUserProgress = async (): Promise<SystemStatsUserProgressRow[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('points, experience');

    if (error || !data) {
        if (error) {
            console.error('user progress fetch failed:', error);
        }
        return [];
    }

    return data as SystemStatsUserProgressRow[];
};

export const systemStatsRepository: SystemStatsRepository = {
    listQuizResults,
    listUserProgress
};
