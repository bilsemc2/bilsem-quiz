import { getRegistryItem } from '@/features/games/game-registry';
import type { GameSummary } from '@/shared/types/domain';

import { GAME_SEED, getCatalogItem, toGameTitle } from '@/server/queries/games';
import {
  createGamePlay,
  type CreateGamePlayInput,
  getGamePlayMetric,
  listGamePlayMetrics,
} from '@/server/repositories/game-play.repository';

function mapMetricToSummary(metric: {
  game_id: string;
  plays_count: number;
  avg_score: number;
  best_score: number;
  avg_duration_seconds: number;
}): GameSummary {
  const catalog = getCatalogItem(metric.game_id);
  const registry = getRegistryItem(metric.game_id);

  return {
    id: metric.game_id,
    title: registry?.title ?? catalog?.title ?? toGameTitle(metric.game_id),
    category: registry?.category ?? catalog?.category ?? 'logic',
    durationSeconds: registry?.durationSeconds ?? catalog?.durationSeconds ?? metric.avg_duration_seconds,
    description: registry?.description,
    migrated: registry?.migrated,
    playsCount: metric.plays_count,
    bestScore: metric.best_score,
    avgScore: metric.avg_score,
    avgDurationSeconds: metric.avg_duration_seconds,
  };
}

export async function listGames(): Promise<GameSummary[]> {
  try {
    const metrics = await listGamePlayMetrics(100);

    if (metrics.length === 0) {
      return GAME_SEED.map((seed) => {
        const registry = getRegistryItem(seed.id);

        return {
          ...seed,
          title: registry?.title ?? seed.title,
          description: registry?.description,
          migrated: registry?.migrated,
        };
      });
    }

    return metrics.map(mapMetricToSummary);
  } catch {
    return GAME_SEED.map((seed) => {
      const registry = getRegistryItem(seed.id);

      return {
        ...seed,
        title: registry?.title ?? seed.title,
        description: registry?.description,
        migrated: registry?.migrated,
      };
    });
  }
}

export async function getGameById(gameId: string): Promise<GameSummary | null> {
  try {
    const metric = await getGamePlayMetric(gameId);

    if (metric) {
      return mapMetricToSummary(metric);
    }
  } catch {
    // DB unavailable olabilir; seed fallback kullan.
  }

  const registry = getRegistryItem(gameId);
  const fromSeed = GAME_SEED.find((game) => game.id === gameId);

  if (fromSeed) {
    return {
      ...fromSeed,
      title: registry?.title ?? fromSeed.title,
      description: registry?.description,
      migrated: registry?.migrated,
    };
  }

  if (registry) {
    return {
      id: registry.id,
      title: registry.title,
      category: registry.category,
      durationSeconds: registry.durationSeconds,
      description: registry.description,
      migrated: registry.migrated,
    };
  }

  return null;
}

export async function recordGamePlay(input: CreateGamePlayInput): Promise<string> {
  return createGamePlay(input);
}
