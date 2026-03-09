import { useCallback, useRef, useState } from 'react';
import { useGamePersistence } from '../../../hooks/useGamePersistence';
import { useGamePerformanceTracker } from '../../../hooks/useGamePerformanceTracker';
import { buildGamePerformanceMetadata } from '../../../shared/game/performance';

export type ArcadeSessionStatus = 'START' | 'PLAYING' | 'GAME_OVER' | 'SUCCESS';

export interface ArcadeSessionState {
    score: number;
    level: number;
    lives: number;
    status: ArcadeSessionStatus;
}

export interface ArcadeFinishOptions {
    status?: ArcadeSessionStatus;
    scoreAchieved?: number;
    levelReached?: number;
    livesRemaining?: number;
    durationSeconds?: number;
    metadata?: Record<string, unknown>;
}

interface UseArcadeGameSessionConfig {
    gameId: string;
    initialLives?: number;
    initialLevel?: number;
}

const createInitialSessionState = (
    level: number,
    lives: number,
    status: ArcadeSessionStatus = 'START'
): ArcadeSessionState => ({
    score: 0,
    level,
    lives,
    status
});

export const useArcadeGameSession = ({
    gameId,
    initialLives = 3,
    initialLevel = 1
}: UseArcadeGameSessionConfig) => {
    const { saveGamePlay } = useGamePersistence();
    const [sessionState, setSessionState] = useState<ArcadeSessionState>(
        createInitialSessionState(initialLevel, initialLives)
    );
    const sessionRef = useRef(sessionState);
    const hasSavedRef = useRef(false);
    const startTimeRef = useRef(0);
    const {
        performance,
        performanceRef,
        recordAttempt,
        resetPerformance
    } = useGamePerformanceTracker();

    const updateSession = useCallback((
        nextStateOrUpdater: ArcadeSessionState | ((current: ArcadeSessionState) => ArcadeSessionState)
    ) => {
        const nextState = typeof nextStateOrUpdater === 'function'
            ? nextStateOrUpdater(sessionRef.current)
            : nextStateOrUpdater;

        sessionRef.current = nextState;
        setSessionState(nextState);
        return nextState;
    }, []);

    const startSession = useCallback(() => {
        hasSavedRef.current = false;
        startTimeRef.current = Date.now();
        resetPerformance();

        return updateSession(createInitialSessionState(initialLevel, initialLives, 'PLAYING'));
    }, [initialLevel, initialLives, resetPerformance, updateSession]);

    const addScore = useCallback((points: number) => {
        return updateSession((current) => ({
            ...current,
            score: current.score + points
        }));
    }, [updateSession]);

    const advanceLevel = useCallback((step: number = 1) => {
        return updateSession((current) => ({
            ...current,
            level: current.level + step
        }));
    }, [updateSession]);

    const loseLife = useCallback((count: number = 1) => {
        return updateSession((current) => ({
            ...current,
            lives: Math.max(0, current.lives - count)
        }));
    }, [updateSession]);

    const setStatus = useCallback((status: ArcadeSessionStatus) => {
        return updateSession((current) => ({
            ...current,
            status
        }));
    }, [updateSession]);

    const saveResult = useCallback(async (options: ArcadeFinishOptions = {}) => {
        if (hasSavedRef.current) {
            return false;
        }

        hasSavedRef.current = true;

        const current = sessionRef.current;
        const success = await saveGamePlay({
            game_id: gameId,
            score_achieved: options.scoreAchieved ?? current.score,
            duration_seconds: options.durationSeconds ?? Math.floor((Date.now() - startTimeRef.current) / 1000),
            lives_remaining: options.livesRemaining ?? current.lives,
            metadata: {
                level_reached: options.levelReached ?? current.level,
                ...buildGamePerformanceMetadata(performanceRef.current),
                ...(options.metadata ?? {})
            }
        });

        if (!success) {
            hasSavedRef.current = false;
        }

        return success;
    }, [gameId, performanceRef, saveGamePlay]);

    const finishGame = useCallback(async (options: ArcadeFinishOptions = {}) => {
        if (options.status) {
            setStatus(options.status);
        }

        return saveResult(options);
    }, [saveResult, setStatus]);

    return {
        sessionState,
        sessionRef,
        performance,
        performanceRef,
        recordAttempt,
        resetPerformance,
        updateSession,
        startSession,
        addScore,
        advanceLevel,
        loseLife,
        setStatus,
        saveResult,
        finishGame
    };
};
