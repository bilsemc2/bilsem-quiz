import type { DashboardStats } from '@/shared/types/domain';

import { getGamePlayOverview } from '@/server/repositories/game-play.repository';
import { getProfileStats } from '@/server/repositories/profile.repository';

const fallbackStats: DashboardStats = {
  userCount: 0,
  activeUserCount: 0,
  activeGames: 0,
  todaysSessions: 0,
};

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [profileStats, gameOverview] = await Promise.all([getProfileStats(), getGamePlayOverview()]);

    return {
      userCount: profileStats.user_count,
      activeUserCount: profileStats.active_user_count,
      activeGames: gameOverview.active_games,
      todaysSessions: gameOverview.todays_sessions,
    };
  } catch {
    return fallbackStats;
  }
}
