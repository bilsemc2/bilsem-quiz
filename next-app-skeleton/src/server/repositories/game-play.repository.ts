import type { QueryResultRow } from 'pg';

import { db } from '@/server/db/client';

export interface GamePlayMetricRow extends QueryResultRow {
  game_id: string;
  plays_count: number;
  avg_score: number;
  best_score: number;
  avg_duration_seconds: number;
}

export interface GamePlayOverviewRow extends QueryResultRow {
  active_games: number;
  todays_sessions: number;
}

export interface AdminGamePlayRow extends QueryResultRow {
  id: string;
  user_id: string | null;
  game_id: string;
  score_achieved: number;
  duration_seconds: number;
  lives_remaining: number | null;
  workshop_type: string | null;
  intelligence_type: string | null;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
}

export interface CreateGamePlayInput {
  userId?: string | null;
  gameId: string;
  scoreAchieved: number;
  durationSeconds: number;
  livesRemaining?: number | null;
  workshopType?: string | null;
  intelligenceType?: string | null;
  metadata?: Record<string, unknown>;
}

export async function listGamePlayMetrics(limit = 100): Promise<GamePlayMetricRow[]> {
  return db.query<GamePlayMetricRow>(
    `
      SELECT
        gp.game_id,
        COUNT(*)::int AS plays_count,
        COALESCE(ROUND(AVG(gp.score_achieved)), 0)::int AS avg_score,
        COALESCE(MAX(gp.score_achieved), 0)::int AS best_score,
        COALESCE(ROUND(AVG(gp.duration_seconds)), 0)::int AS avg_duration_seconds
      FROM public.game_plays gp
      GROUP BY gp.game_id
      ORDER BY plays_count DESC, game_id ASC
      LIMIT $1
    `,
    [limit],
  );
}

export async function getGamePlayMetric(gameId: string): Promise<GamePlayMetricRow | null> {
  const rows = await db.query<GamePlayMetricRow>(
    `
      SELECT
        gp.game_id,
        COUNT(*)::int AS plays_count,
        COALESCE(ROUND(AVG(gp.score_achieved)), 0)::int AS avg_score,
        COALESCE(MAX(gp.score_achieved), 0)::int AS best_score,
        COALESCE(ROUND(AVG(gp.duration_seconds)), 0)::int AS avg_duration_seconds
      FROM public.game_plays gp
      WHERE gp.game_id = $1
      GROUP BY gp.game_id
      LIMIT 1
    `,
    [gameId],
  );

  return rows[0] ?? null;
}

export async function listRecentGamePlays(limit = 50): Promise<AdminGamePlayRow[]> {
  return db.query<AdminGamePlayRow>(
    `
      SELECT
        gp.id,
        gp.user_id,
        gp.game_id,
        COALESCE(gp.score_achieved, 0)::int AS score_achieved,
        COALESCE(gp.duration_seconds, 0)::int AS duration_seconds,
        gp.lives_remaining,
        gp.workshop_type,
        gp.intelligence_type,
        gp.created_at::text,
        p.email AS user_email,
        COALESCE(p.full_name, p.name) AS user_name
      FROM public.game_plays gp
      LEFT JOIN public.profiles p ON p.id = gp.user_id
      ORDER BY gp.created_at DESC
      LIMIT $1
    `,
    [limit],
  );
}

export async function listGamePlaysByUser(userId: string, limit = 50): Promise<AdminGamePlayRow[]> {
  return db.query<AdminGamePlayRow>(
    `
      SELECT
        gp.id,
        gp.user_id,
        gp.game_id,
        COALESCE(gp.score_achieved, 0)::int AS score_achieved,
        COALESCE(gp.duration_seconds, 0)::int AS duration_seconds,
        gp.lives_remaining,
        gp.workshop_type,
        gp.intelligence_type,
        gp.created_at::text,
        p.email AS user_email,
        COALESCE(p.full_name, p.name) AS user_name
      FROM public.game_plays gp
      LEFT JOIN public.profiles p ON p.id = gp.user_id
      WHERE gp.user_id = $1
      ORDER BY gp.created_at DESC
      LIMIT $2
    `,
    [userId, limit],
  );
}

export async function getGamePlayOverview(): Promise<GamePlayOverviewRow> {
  const rows = await db.query<GamePlayOverviewRow>(
    `
      SELECT
        COUNT(DISTINCT gp.game_id)::int AS active_games,
        COUNT(*) FILTER (WHERE gp.created_at::date = CURRENT_DATE)::int AS todays_sessions
      FROM public.game_plays gp
    `,
  );

  return rows[0] ?? { active_games: 0, todays_sessions: 0 };
}

export async function createGamePlay(input: CreateGamePlayInput): Promise<string> {
  const rows = await db.query<{ id: string }>(
    `
      INSERT INTO public.game_plays (
        user_id,
        game_id,
        score_achieved,
        duration_seconds,
        lives_remaining,
        metadata,
        workshop_type,
        intelligence_type
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
      RETURNING id
    `,
    [
      input.userId ?? null,
      input.gameId,
      input.scoreAchieved,
      input.durationSeconds,
      input.livesRemaining ?? null,
      JSON.stringify(input.metadata ?? {}),
      input.workshopType ?? null,
      input.intelligenceType ?? null,
    ],
  );

  return rows[0].id;
}
