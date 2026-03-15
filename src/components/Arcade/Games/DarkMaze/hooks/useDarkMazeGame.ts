import { useCallback, useEffect, useRef, useState } from 'react';

import { ARCADE_FEEDBACK_TEXTS, ARCADE_SCORE_BASE, ARCADE_SCORE_FORMULA } from '../../../Shared/ArcadeConstants';
import { useArcadeGameSession } from '../../../Shared/useArcadeGameSession';
import {
    BATTERY_ENERGY_BONUS,
    ENERGY_EFFECT_DURATION_MS, GAME_ID, ILLUMINATION_DURATION_MS, INITIAL_ENERGY,
    INITIAL_GRID_SIZE, INITIAL_TIME_LEFT, LEVEL_CLEAR_DELAY_MS, LEVEL_ENERGY_BONUS,
    LEVEL_TIME_BONUS
} from '../constants';
import { clearCollectedItems, resolveMoveOutcome } from '../logic';
import type { Cell, EnergyEffect, GameState, GridPosition, MoveDirection } from '../types';
import { useDirectionalInput } from './useDirectionalInput';
import { useMazeGenerator } from './useMazeGenerator';
import { useResponsiveCanvasSize } from './useResponsiveCanvasSize';

type FeedbackState = { message: string; type: 'success' | 'error' } | null;

interface UseDarkMazeGameOptions {
    autoStart?: boolean;
    onGameStart?: () => void;
    onNextLevel?: () => void;
}

export const useDarkMazeGame = ({ autoStart, onGameStart, onNextLevel }: UseDarkMazeGameOptions = {}) => {
    const {
        sessionState,
        startSession,
        addScore,
        advanceLevel,
        finishGame,
        recordAttempt
    } = useArcadeGameSession({
        gameId: GAME_ID,
        initialLives: 1
    });
    const { generateMaze, getNextLevelSize } = useMazeGenerator();
    const [phase, setPhase] = useState<GameState>('idle');
    const [gridSize, setGridSize] = useState(INITIAL_GRID_SIZE);
    const [maze, setMaze] = useState<Cell[][]>([]);
    const [playerPos, setPlayerPos] = useState<GridPosition>({ r: 0, c: 0 });
    const [energy, setEnergy] = useState(INITIAL_ENERGY);
    const [timeLeft, setTimeLeft] = useState(INITIAL_TIME_LEFT);
    const [isIlluminated, setIsIlluminated] = useState(false);
    const [energyEffects, setEnergyEffects] = useState<EnergyEffect[]>([]);
    const [lastCollectionTime, setLastCollectionTime] = useState(0);
    const canvasSize = useResponsiveCanvasSize(gridSize);
    const [feedback, setFeedback] = useState<FeedbackState>(null);
    const [showLevelUp, setShowLevelUp] = useState(false);

    const isResolvingRef = useRef(false);
    const isEndingRef = useRef(false);
    const levelStartedAtRef = useRef(0);
    const timeoutIdsRef = useRef<number[]>([]);

    const clearScheduledTimeouts = useCallback(() => {
        timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
        timeoutIdsRef.current = [];
    }, []);

    const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
        const timeoutId = window.setTimeout(callback, delay);
        timeoutIdsRef.current.push(timeoutId);
        return timeoutId;
    }, []);

    const initializeLevel = useCallback((nextLevel: number, nextGridSize: number) => {
        setGridSize(nextGridSize);
        setMaze(generateMaze(nextGridSize, nextLevel));
        setPlayerPos({ r: 0, c: 0 });
        setShowLevelUp(false);
        setIsIlluminated(false);
        setPhase('playing');
        levelStartedAtRef.current = Date.now();
    }, [generateMaze]);

    const startGame = useCallback(() => {
        clearScheduledTimeouts();
        startSession();
        setEnergy(INITIAL_ENERGY);
        setTimeLeft(INITIAL_TIME_LEFT);
        setFeedback(null);
        setEnergyEffects([]);
        setLastCollectionTime(0);
        isResolvingRef.current = false;
        isEndingRef.current = false;
        initializeLevel(1, INITIAL_GRID_SIZE);
        onGameStart?.();
    }, [clearScheduledTimeouts, initializeLevel, onGameStart, startSession]);

    useEffect(() => {
        if (autoStart && sessionState.status === 'START' && phase === 'idle') {
            startGame();
        }
    }, [autoStart, phase, sessionState.status, startGame]);

    useEffect(() => clearScheduledTimeouts, [clearScheduledTimeouts]);

    const endGame = useCallback(() => {
        if (isEndingRef.current) {
            return;
        }

        isEndingRef.current = true;
        isResolvingRef.current = true;
        clearScheduledTimeouts();
        setShowLevelUp(false);
        setPhase('finished');
        recordAttempt({ isCorrect: false, responseMs: levelStartedAtRef.current > 0 ? Date.now() - levelStartedAtRef.current : null });
        void finishGame({
            status: 'GAME_OVER',
            livesRemaining: 0,
            metadata: {
                game_name: 'Karanlık Labirent',
                remaining_energy: Math.round(energy),
                remaining_time: timeLeft
            }
        });
    }, [clearScheduledTimeouts, energy, finishGame, recordAttempt, timeLeft]);

    useEffect(() => {
        if (phase !== 'playing') return undefined;
        const timerId = window.setInterval(() => {
            setTimeLeft((current) => Math.max(0, current - 1));
            setEnergy((current) => Math.max(0, current - 0.5));
        }, 1000);
        return () => window.clearInterval(timerId);
    }, [phase]);

    useEffect(() => {
        if (phase === 'playing' && timeLeft <= 0) {
            endGame();
        }
    }, [endGame, phase, timeLeft]);

    const move = useCallback((direction: MoveDirection) => {
        if (phase !== 'playing' || sessionState.status !== 'PLAYING' || isResolvingRef.current) return;
        const outcome = resolveMoveOutcome(maze, playerPos, direction, gridSize);
        if (!outcome.moved) return;
        setPlayerPos(outcome.position);
        if (outcome.collectedBattery || outcome.collectedLogo) {
            setMaze((current) => clearCollectedItems(current, outcome.position, outcome.collectedBattery, outcome.collectedLogo));
        }
        if (outcome.collectedBattery) {
            const effectId = Date.now() + Math.floor(Math.random() * 1000);
            setEnergy((current) => Math.min(INITIAL_ENERGY, current + BATTERY_ENERGY_BONUS));
            setEnergyEffects((current) => [...current, { id: effectId, ...outcome.position }]);
            setLastCollectionTime(Date.now());
            scheduleTimeout(() => setEnergyEffects((current) => current.filter((effect) => effect.id !== effectId)), ENERGY_EFFECT_DURATION_MS);
        }
        if (outcome.collectedLogo) {
            setIsIlluminated(true);
            scheduleTimeout(() => setIsIlluminated(false), ILLUMINATION_DURATION_MS);
        }
        if (!outcome.reachedExit) return;
        isResolvingRef.current = true;
        addScore(ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, sessionState.level));
        recordAttempt({ isCorrect: true, responseMs: levelStartedAtRef.current > 0 ? Date.now() - levelStartedAtRef.current : null });
        const messages = ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES;
        setFeedback({
            message: messages[Math.floor(Math.random() * messages.length)],
            type: 'success'
        });
        scheduleTimeout(() => {
            setFeedback(null);
            setShowLevelUp(true);
            setPhase('level_cleared');
            isResolvingRef.current = false;
        }, LEVEL_CLEAR_DELAY_MS);
    }, [
        addScore,
        gridSize,
        maze,
        phase,
        playerPos,
        recordAttempt,
        scheduleTimeout,
        sessionState.level,
        sessionState.status
    ]);

    const { handleTouchStart, handleTouchEnd } = useDirectionalInput(move);

    const nextLevel = useCallback(() => {
        clearScheduledTimeouts();
        const nextLevelNumber = sessionState.level + 1;
        const nextGridSize = getNextLevelSize(nextLevelNumber);
        advanceLevel();
        setEnergy((current) => Math.min(INITIAL_ENERGY, current + LEVEL_ENERGY_BONUS));
        setTimeLeft((current) => current + LEVEL_TIME_BONUS);
        setFeedback(null);
        setEnergyEffects([]);
        setLastCollectionTime(0);
        initializeLevel(nextLevelNumber, nextGridSize);
        onNextLevel?.();
    }, [
        advanceLevel,
        clearScheduledTimeouts,
        getNextLevelSize,
        initializeLevel,
        onNextLevel,
        sessionState.level
    ]);

    return {
        sessionState,
        phase,
        gridSize,
        maze,
        playerPos,
        energy,
        timeLeft,
        isIlluminated,
        energyEffects,
        lastCollectionTime,
        canvasSize,
        feedback,
        showLevelUp,
        levelScore: ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, sessionState.level),
        startGame,
        nextLevel,
        move,
        handleTouchStart,
        handleTouchEnd
    };
};
