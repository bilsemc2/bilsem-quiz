import type { QueryResultRow } from 'pg';

import { db } from '@/server/db/client';

export interface ProfileRow extends QueryResultRow {
  id: string;
  email: string;
  full_name: string | null;
  name: string;
  role: string;
  experience: number;
  is_active: boolean;
  created_at: string;
}

export interface AdminProfileRow extends ProfileRow {
  game_play_count: number;
  best_score: number;
  last_play_at: string | null;
}

export interface ProfileStatsRow extends QueryResultRow {
  user_count: number;
  active_user_count: number;
}

export async function listProfiles(limit = 25): Promise<ProfileRow[]> {
  return db.query<ProfileRow>(
    `
      SELECT
        p.id,
        p.email,
        p.full_name,
        p.name,
        p.role::text,
        COALESCE(p.experience, 0)::int AS experience,
        COALESCE(p.is_active, true) AS is_active,
        p.created_at::text
      FROM public.profiles p
      ORDER BY p.created_at DESC
      LIMIT $1
    `,
    [limit],
  );
}

export async function getProfileById(userId: string): Promise<ProfileRow | null> {
  const rows = await db.query<ProfileRow>(
    `
      SELECT
        p.id,
        p.email,
        p.full_name,
        p.name,
        p.role::text,
        COALESCE(p.experience, 0)::int AS experience,
        COALESCE(p.is_active, true) AS is_active,
        p.created_at::text
      FROM public.profiles p
      WHERE p.id = $1
      LIMIT 1
    `,
    [userId],
  );

  return rows[0] ?? null;
}

export async function listAdminProfiles(limit = 50): Promise<AdminProfileRow[]> {
  return db.query<AdminProfileRow>(
    `
      SELECT
        p.id,
        p.email,
        p.full_name,
        p.name,
        p.role::text,
        COALESCE(p.experience, 0)::int AS experience,
        COALESCE(p.is_active, true) AS is_active,
        p.created_at::text,
        COUNT(gp.id)::int AS game_play_count,
        COALESCE(MAX(gp.score_achieved), 0)::int AS best_score,
        MAX(gp.created_at)::text AS last_play_at
      FROM public.profiles p
      LEFT JOIN public.game_plays gp ON gp.user_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $1
    `,
    [limit],
  );
}

export async function getAdminProfileById(userId: string): Promise<AdminProfileRow | null> {
  const rows = await db.query<AdminProfileRow>(
    `
      SELECT
        p.id,
        p.email,
        p.full_name,
        p.name,
        p.role::text,
        COALESCE(p.experience, 0)::int AS experience,
        COALESCE(p.is_active, true) AS is_active,
        p.created_at::text,
        COUNT(gp.id)::int AS game_play_count,
        COALESCE(MAX(gp.score_achieved), 0)::int AS best_score,
        MAX(gp.created_at)::text AS last_play_at
      FROM public.profiles p
      LEFT JOIN public.game_plays gp ON gp.user_id = p.id
      WHERE p.id = $1
      GROUP BY p.id
      LIMIT 1
    `,
    [userId],
  );

  return rows[0] ?? null;
}

export async function getProfileStats(): Promise<ProfileStatsRow> {
  const rows = await db.query<ProfileStatsRow>(
    `
      SELECT
        COUNT(*)::int AS user_count,
        COUNT(*) FILTER (WHERE COALESCE(is_active, true))::int AS active_user_count
      FROM public.profiles
    `,
  );

  return rows[0] ?? { user_count: 0, active_user_count: 0 };
}
