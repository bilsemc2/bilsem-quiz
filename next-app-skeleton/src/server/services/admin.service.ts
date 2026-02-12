import type { AdminGamePlaySummary, AdminUserDetail, AdminUserSummary } from '@/shared/types/domain';

import {
  listGamePlaysByUser,
  listRecentGamePlays,
  type AdminGamePlayRow,
} from '@/server/repositories/game-play.repository';
import {
  getAdminProfileById,
  listAdminProfiles,
  type AdminProfileRow,
} from '@/server/repositories/profile.repository';

function mapAdminProfile(row: AdminProfileRow): AdminUserSummary {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name ?? row.name,
    role: row.role,
    experience: row.experience,
    isActive: row.is_active,
    createdAt: row.created_at,
    gamePlayCount: row.game_play_count,
    bestScore: row.best_score,
    lastPlayAt: row.last_play_at,
  };
}

function mapAdminGamePlay(row: AdminGamePlayRow): AdminGamePlaySummary {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    gameId: row.game_id,
    scoreAchieved: row.score_achieved,
    durationSeconds: row.duration_seconds,
    livesRemaining: row.lives_remaining,
    workshopType: row.workshop_type,
    intelligenceType: row.intelligence_type,
    createdAt: row.created_at,
  };
}

export async function listAdminUsers(limit = 50): Promise<AdminUserSummary[]> {
  try {
    const rows = await listAdminProfiles(limit);
    return rows.map(mapAdminProfile);
  } catch {
    return [];
  }
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  try {
    const profile = await getAdminProfileById(userId);

    if (!profile) {
      return null;
    }

    const recentPlays = await listGamePlaysByUser(userId, 20);

    return {
      ...mapAdminProfile(profile),
      recentGameIds: [...new Set(recentPlays.map((play) => play.game_id))],
    };
  } catch {
    return null;
  }
}

export async function listAdminGamePlays(limit = 50): Promise<AdminGamePlaySummary[]> {
  try {
    const rows = await listRecentGamePlays(limit);
    return rows.map(mapAdminGamePlay);
  } catch {
    return [];
  }
}

export async function listAdminGamePlaysByUser(
  userId: string,
  limit = 50,
): Promise<AdminGamePlaySummary[]> {
  try {
    const rows = await listGamePlaysByUser(userId, limit);
    return rows.map(mapAdminGamePlay);
  } catch {
    return [];
  }
}
