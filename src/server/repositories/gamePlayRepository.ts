import { supabase } from '@/lib/supabase';
import { err, ok, type AppError, type Result } from '@/shared/types/result';

export interface GamePlayCreateInput {
    userId: string;
    gameId: string;
    scoreAchieved: number;
    difficultyPlayed?: string;
    durationSeconds: number;
    livesRemaining?: number;
    metadata?: Record<string, unknown>;
    workshopType?: string | null;
    intelligenceType?: string | null;
}

export interface GamePlayRecord {
    id: string;
    game_id: string;
    score_achieved: number | null;
    duration_seconds: number | null;
    intelligence_type: string | null;
    workshop_type: string | null;
    created_at: string;
    metadata: Record<string, unknown> | null;
}

export interface GamePlayWorkshopRecord {
    user_id: string;
    workshop_type: string | null;
    intelligence_type: string | null;
}

export interface GamePlayRecentWorkshopRecord {
    user_id: string;
    score_achieved: number | null;
    game_id: string | null;
    created_at: string;
}

export interface GamePlayRepository {
    createGamePlay: (input: GamePlayCreateInput) => Promise<Result<void, AppError>>;
    listGamePlaysByUserId: (userId: string) => Promise<GamePlayRecord[]>;
    listWorkshopGamePlays: () => Promise<GamePlayWorkshopRecord[]>;
    listRecentWorkshopGamePlays: (limit: number) => Promise<GamePlayRecentWorkshopRecord[]>;
}

const createGamePlay = async (
    input: GamePlayCreateInput
): Promise<Result<void, AppError>> => {
    try {
        const { error } = await supabase.from('game_plays').insert({
            user_id: input.userId,
            game_id: input.gameId,
            score_achieved: input.scoreAchieved,
            difficulty_played: input.difficultyPlayed ?? 'orta',
            duration_seconds: Math.floor(input.durationSeconds),
            lives_remaining: input.livesRemaining,
            metadata: input.metadata ?? {},
            workshop_type: input.workshopType ?? null,
            intelligence_type: input.intelligenceType ?? null,
        });

        if (error) {
            return err({
                message: 'Oyun sonucu kaydedilemedi',
                cause: error
            });
        }

        return ok(undefined);
    } catch (cause) {
        return err({
            message: 'Oyun sonucu kaydedilemedi',
            cause
        });
    }
};

const listGamePlaysByUserId = async (userId: string): Promise<GamePlayRecord[]> => {
    const { data, error } = await supabase
        .from('game_plays')
        .select('id, game_id, score_achieved, duration_seconds, intelligence_type, workshop_type, created_at, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error || !data) {
        if (error) {
            console.error('game plays fetch failed:', error);
        }
        return [];
    }

    return data as GamePlayRecord[];
};

const listWorkshopGamePlays = async (): Promise<GamePlayWorkshopRecord[]> => {
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

    return data as GamePlayWorkshopRecord[];
};

const listRecentWorkshopGamePlays = async (
    limit: number
): Promise<GamePlayRecentWorkshopRecord[]> => {
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

    return data as GamePlayRecentWorkshopRecord[];
};

export const gamePlayRepository: GamePlayRepository = {
    createGamePlay,
    listGamePlaysByUserId,
    listWorkshopGamePlays,
    listRecentWorkshopGamePlays
};
