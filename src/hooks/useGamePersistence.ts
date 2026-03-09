import { useCallback } from 'react';
import { persistGamePlay } from '@/features/games/model/gamePlayUseCases';
import { useAuth } from '@/contexts/auth/useAuth';
import { getZekaTuru, getWorkshopType } from '../constants/intelligenceTypes';

export interface GamePlayData {
    game_id: string;
    score_achieved: number;
    difficulty_played?: string;
    duration_seconds: number;
    lives_remaining?: number;
    metadata?: Record<string, unknown>;
}

export const useGamePersistence = () => {
    const { user } = useAuth();

    const saveGamePlay = useCallback(async (data: GamePlayData): Promise<boolean> => {
        if (!user) {

            return false;
        }

        try {
            const workshopType = getWorkshopType(data.game_id);
            const intelligenceType = getZekaTuru(data.game_id);

            const result = await persistGamePlay({
                userId: user.id,
                gameId: data.game_id,
                scoreAchieved: data.score_achieved,
                difficultyPlayed: data.difficulty_played,
                durationSeconds: data.duration_seconds,
                livesRemaining: data.lives_remaining,
                metadata: data.metadata,
                workshopType,
                intelligenceType,
            });

            if (!result.ok) {
                console.error('Error saving game play:', result.error.cause ?? result.error.message);
                return false;
            }

            return true;
        } catch (err) {
            console.error('Error saving game play:', err);
            return false;
        }
    }, [user]);

    return { saveGamePlay };
};

export default useGamePersistence;
