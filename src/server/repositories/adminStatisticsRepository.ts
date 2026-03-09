import { supabase } from '@/lib/supabase';
import {
    gamePlayRepository,
    type GamePlayRecord,
    type GamePlayRecentWorkshopRecord,
    type GamePlayWorkshopRecord
} from '@/server/repositories/gamePlayRepository';

export interface AdminStatisticsStudentRecord {
    id: string;
    name: string | null;
    email: string | null;
    grade: number | null;
    experience: number | null;
    points: number | null;
    is_vip: boolean | null;
    created_at: string;
}

export type AdminStatisticsGamePlayRecord = GamePlayRecord;

export type AdminStatisticsWorkshopPlayRecord = GamePlayWorkshopRecord;

export type AdminStatisticsRecentWorkshopPlayRecord = GamePlayRecentWorkshopRecord;

export interface AdminStatisticsProfileNameRecord {
    id: string;
    name: string | null;
}

export interface AdminAdaptiveQuestionAttemptRecord {
    id: string;
    user_id: string;
    topic: string;
    difficulty_level: number | null;
    was_correct: boolean;
    response_ms: number | null;
    source: 'ai' | 'fallback' | 'bank' | null;
    question_payload: Record<string, unknown> | null;
    created_at: string;
}

export interface AdminStatisticsRepository {
    listStudents: () => Promise<AdminStatisticsStudentRecord[]>;
    listGamePlaysByUserId: (userId: string) => Promise<AdminStatisticsGamePlayRecord[]>;
    listWorkshopGamePlays: () => Promise<AdminStatisticsWorkshopPlayRecord[]>;
    listRecentWorkshopGamePlays: (limit: number) => Promise<AdminStatisticsRecentWorkshopPlayRecord[]>;
    listProfilesByIds: (profileIds: string[]) => Promise<AdminStatisticsProfileNameRecord[]>;
    listRecentAdaptiveQuestionAttempts: (limit: number) => Promise<AdminAdaptiveQuestionAttemptRecord[]>;
}

const listStudents = async (): Promise<AdminStatisticsStudentRecord[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, grade, experience, points, is_vip, created_at')
        .order('name', { ascending: true });

    if (error || !data) {
        if (error) {
            console.error('student list fetch failed:', error);
        }
        return [];
    }

    return data as AdminStatisticsStudentRecord[];
};

const listGamePlaysByUserId = async (userId: string): Promise<AdminStatisticsGamePlayRecord[]> => {
    return gamePlayRepository.listGamePlaysByUserId(userId);
};

const listWorkshopGamePlays = async (): Promise<AdminStatisticsWorkshopPlayRecord[]> => {
    return gamePlayRepository.listWorkshopGamePlays();
};

const listRecentWorkshopGamePlays = async (
    limit: number
): Promise<AdminStatisticsRecentWorkshopPlayRecord[]> => {
    return gamePlayRepository.listRecentWorkshopGamePlays(limit);
};

const listProfilesByIds = async (
    profileIds: string[]
): Promise<AdminStatisticsProfileNameRecord[]> => {
    if (profileIds.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', profileIds);

    if (error || !data) {
        if (error) {
            console.error('profile names fetch failed:', error);
        }
        return [];
    }

    return data as AdminStatisticsProfileNameRecord[];
};

const listRecentAdaptiveQuestionAttempts = async (
    limit: number
): Promise<AdminAdaptiveQuestionAttemptRecord[]> => {
    const safeLimit = Math.max(1, Math.min(Math.round(limit), 500));
    const { data, error } = await supabase
        .from('question_attempt')
        .select('id, user_id, topic, difficulty_level, was_correct, response_ms, source, question_payload, created_at')
        .order('created_at', { ascending: false })
        .limit(safeLimit);

    if (error || !data) {
        if (error) {
            console.error('adaptive question attempts fetch failed:', error);
        }
        return [];
    }

    return data as AdminAdaptiveQuestionAttemptRecord[];
};

export const adminStatisticsRepository: AdminStatisticsRepository = {
    listStudents,
    listGamePlaysByUserId,
    listWorkshopGamePlays,
    listRecentWorkshopGamePlays,
    listProfilesByIds,
    listRecentAdaptiveQuestionAttempts
};
