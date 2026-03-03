import type { AdminDashboardRecentUserRow } from '@/server/repositories/adminDashboardRepository';

export interface RecentDashboardUser {
    id: string;
    name: string | null;
    email: string;
    created_at: string;
    is_active: boolean;
}

export interface DashboardStatsResult {
    totalUsers: number;
    activeUsers: number;
    recentUsers: RecentDashboardUser[];
}

export const toRecentDashboardUsers = (
    recentUsers: AdminDashboardRecentUserRow[]
): RecentDashboardUser[] => {
    return recentUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email || '-',
        created_at: user.created_at,
        is_active: Boolean(user.is_active)
    }));
};

export const buildDashboardStatsResult = (
    totalUsers: number,
    activeUsers: number,
    recentUsers: AdminDashboardRecentUserRow[]
): DashboardStatsResult => {
    return {
        totalUsers,
        activeUsers,
        recentUsers: toRecentDashboardUsers(recentUsers)
    };
};
