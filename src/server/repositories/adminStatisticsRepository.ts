import { supabase } from '@/lib/supabase';

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

export interface AdminStatisticsGamePlayRecord {
    id: string;
    game_id: string;
    score_achieved: number | null;
    duration_seconds: number | null;
    intelligence_type: string | null;
    workshop_type: string | null;
    created_at: string;
}

export interface AdminStatisticsWorkshopPlayRecord {
    user_id: string;
    workshop_type: string | null;
    intelligence_type: string | null;
}

export interface AdminStatisticsRecentWorkshopPlayRecord {
    user_id: string;
    score_achieved: number | null;
    game_id: string | null;
    created_at: string;
}

export interface AdminStatisticsProfileNameRecord {
    id: string;
    name: string | null;
}

export interface AdminStatisticsRepository {
    listStudents: () => Promise<AdminStatisticsStudentRecord[]>;
    listGamePlaysByUserId: (userId: string) => Promise<AdminStatisticsGamePlayRecord[]>;
    listWorkshopGamePlays: () => Promise<AdminStatisticsWorkshopPlayRecord[]>;
    listRecentWorkshopGamePlays: (limit: number) => Promise<AdminStatisticsRecentWorkshopPlayRecord[]>;
    listProfilesByIds: (profileIds: string[]) => Promise<AdminStatisticsProfileNameRecord[]>;
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
    const { data, error } = await supabase
        .from('game_plays')
        .select('id, game_id, score_achieved, duration_seconds, intelligence_type, workshop_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error || !data) {
        if (error) {
            console.error('student gameplay fetch failed:', error);
        }
        return [];
    }

    return data as AdminStatisticsGamePlayRecord[];
};

const listWorkshopGamePlays = async (): Promise<AdminStatisticsWorkshopPlayRecord[]> => {
    const { data, error } = await supabase
        .from('game_plays')
        .select('user_id, workshop_type, intelligence_type')
        .not('workshop_type', 'is', null);

    if (error || !data) {
        if (error) {
            console.error('workshop gameplay list fetch failed:', error);
        }
        return [];
    }

    return data as AdminStatisticsWorkshopPlayRecord[];
};

const listRecentWorkshopGamePlays = async (
    limit: number
): Promise<AdminStatisticsRecentWorkshopPlayRecord[]> => {
    if (!Number.isFinite(limit) || limit <= 0) {
        return [];
    }

    const { data, error } = await supabase
        .from('game_plays')
        .select('user_id, score_achieved, game_id, created_at')
        .not('workshop_type', 'is', null)
        .order('created_at', { ascending: false })
        .limit(Math.floor(limit));

    if (error || !data) {
        if (error) {
            console.error('recent workshop gameplay fetch failed:', error);
        }
        return [];
    }

    return data as AdminStatisticsRecentWorkshopPlayRecord[];
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

export const adminStatisticsRepository: AdminStatisticsRepository = {
    listStudents,
    listGamePlaysByUserId,
    listWorkshopGamePlays,
    listRecentWorkshopGamePlays,
    listProfilesByIds
};
