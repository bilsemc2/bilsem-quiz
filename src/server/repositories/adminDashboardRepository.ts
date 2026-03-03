import { supabase } from '@/lib/supabase';

export interface AdminDashboardRecentUserRow {
    id: string;
    name: string | null;
    email: string | null;
    created_at: string;
    is_active: boolean | null;
}

export interface AdminDashboardRepository {
    getTotalUsersCount: () => Promise<number>;
    getActiveUsersCount: () => Promise<number>;
    listRecentUsers: (limit?: number) => Promise<AdminDashboardRecentUserRow[]>;
}

const getTotalUsersCount = async (): Promise<number> => {
    const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

    if (error) {
        console.error('dashboard total users count failed:', error);
        return 0;
    }

    return count ?? 0;
};

const getActiveUsersCount = async (): Promise<number> => {
    const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

    if (error) {
        console.error('dashboard active users count failed:', error);
        return 0;
    }

    return count ?? 0;
};

const listRecentUsers = async (limit = 5): Promise<AdminDashboardRecentUserRow[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, created_at, is_active')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error || !data) {
        if (error) {
            console.error('dashboard recent users fetch failed:', error);
        }
        return [];
    }

    return data as AdminDashboardRecentUserRow[];
};

export const adminDashboardRepository: AdminDashboardRepository = {
    getTotalUsersCount,
    getActiveUsersCount,
    listRecentUsers
};
