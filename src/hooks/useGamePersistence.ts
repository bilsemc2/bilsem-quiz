import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getZekaTuru, getWorkshopType } from '../constants/intelligenceTypes';

export interface GamePlayData {
    game_id: string;
    score_achieved: number;
    difficulty_played?: string;
    duration_seconds: number;
    lives_remaining?: number;
    metadata?: Record<string, any>;
}

export const useGamePersistence = () => {
    const { user } = useAuth();

    const saveGamePlay = useCallback(async (data: GamePlayData): Promise<boolean> => {
        if (!user) {
            console.log('Game data not saved: No user logged in');
            return false;
        }

        try {
            const workshopType = getWorkshopType(data.game_id);
            const intelligenceType = getZekaTuru(data.game_id);

            const { error } = await supabase.from('game_plays').insert({
                user_id: user.id,
                game_id: data.game_id,
                score_achieved: data.score_achieved,
                difficulty_played: data.difficulty_played || 'orta',
                duration_seconds: Math.floor(data.duration_seconds),
                lives_remaining: data.lives_remaining,
                metadata: data.metadata || {},
                workshop_type: workshopType,
                intelligence_type: intelligenceType,
            });

            if (error) {
                console.error('Error saving game play:', error);
                return false;
            }

            console.log(`Game play saved: ${data.game_id} (${workshopType}, ${intelligenceType})`);
            return true;
        } catch (err) {
            console.error('Error saving game play:', err);
            return false;
        }
    }, [user]);

    return { saveGamePlay };
};

export default useGamePersistence;
