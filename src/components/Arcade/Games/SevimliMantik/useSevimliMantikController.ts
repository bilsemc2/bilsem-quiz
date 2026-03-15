// SevimliMantik — State management hook

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence.ts';
import { useGameViewportFocus } from '../../../../hooks/useGameViewportFocus.ts';
import { ARCADE_SCORE_FORMULA, ARCADE_SCORE_BASE } from '../../Shared/ArcadeConstants.ts';
import { useArcadeSoundEffects } from '../../Shared/useArcadeSoundEffects.ts';
import {
    INITIAL_LIVES,
    TIME_LIMIT,
    MAX_LEVEL,
    generateRound,
    getDifficulty,
} from './logic.ts';
import type { RoundData } from './logic.ts';

export type Phase = 'welcome' | 'animating' | 'playing' | 'game_over' | 'victory';

export function useSevimliMantikController() {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { playAreaRef, focusPlayArea } = useGameViewportFocus();
    const { playArcadeSound } = useArcadeSoundEffects();

    const hasSavedRef = useRef(false);
    const isResolvingRef = useRef(false);
    const countdownTimeoutRef = useRef<number | null>(null);
    const resolveTimeoutRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const animationDoneRef = useRef<Set<string>>(new Set());

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [round, setRound] = useState<RoundData | null>(null);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

    const clearTrackedTimeout = useCallback((timeoutRef: React.MutableRefObject<number | null>) => {
        if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const scheduleTrackedTimeout = useCallback((
        timeoutRef: React.MutableRefObject<number | null>,
        callback: () => void,
        delay: number,
    ) => {
        clearTrackedTimeout(timeoutRef);
        timeoutRef.current = window.setTimeout(() => {
            timeoutRef.current = null;
            callback();
        }, delay);
    }, [clearTrackedTimeout]);

    const clearScheduledTimeouts = useCallback(() => {
        clearTrackedTimeout(countdownTimeoutRef);
        clearTrackedTimeout(resolveTimeoutRef);
    }, [clearTrackedTimeout]);

    const startRound = useCallback((targetLevel: number) => {
        setRound(generateRound(targetLevel));
        setPhase('animating');
    }, []);

    const handleStart = useCallback(() => {
        clearScheduledTimeouts();
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(TIME_LIMIT);
        setFeedback(null);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        isResolvingRef.current = false;
        startRound(1);
        playArcadeSound('start');
        focusPlayArea();
    }, [clearScheduledTimeouts, focusPlayArea, playArcadeSound, startRound]);

    useEffect(() => {
        if (location.state?.autoStart && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, phase, handleStart]);

    const handleAnimationEnd = useCallback((creatureId: string) => {
        if (phase !== 'animating' || !round) {
            return;
        }
        animationDoneRef.current.add(creatureId);
        if (animationDoneRef.current.size >= round.creatures.length) {
            setPhase('playing');
        }
    }, [phase, round]);

    useEffect(() => {
        if (phase === 'animating') {
            animationDoneRef.current.clear();
        }
    }, [phase, round]);

    const handleReplay = useCallback(() => {
        if (phase === 'playing' && !isResolvingRef.current) {
            setPhase('animating');
        }
    }, [phase]);

    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) {
            return;
        }
        hasSavedRef.current = true;
        isResolvingRef.current = true;
        clearScheduledTimeouts();
        setPhase('game_over');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        await saveGamePlay({
            game_id: 'arcade-sevimli-mantik',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives },
        });
    }, [clearScheduledTimeouts, lives, level, saveGamePlay, score]);

    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) {
            return;
        }
        hasSavedRef.current = true;
        isResolvingRef.current = true;
        clearScheduledTimeouts();
        setPhase('victory');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        await saveGamePlay({
            game_id: 'arcade-sevimli-mantik',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true },
        });
    }, [clearScheduledTimeouts, saveGamePlay, score]);

    useEffect(() => clearScheduledTimeouts, [clearScheduledTimeouts]);

    useEffect(() => {
        if ((phase === 'playing' || phase === 'animating') && timeLeft > 0) {
            scheduleTrackedTimeout(countdownTimeoutRef, () => setTimeLeft((prev) => prev - 1), 1000);
        } else if (timeLeft === 0 && (phase === 'playing' || phase === 'animating')) {
            void handleGameOver();
        }

        return () => {
            clearTrackedTimeout(countdownTimeoutRef);
        };
    }, [clearTrackedTimeout, handleGameOver, phase, scheduleTrackedTimeout, timeLeft]);

    const handleOptionSelect = useCallback((optionId: string) => {
        if (!round || phase !== 'playing' || isResolvingRef.current) {
            return;
        }
        isResolvingRef.current = true;

        const isCorrect = optionId === round.correctOptionId;
        const nextLives = isCorrect ? lives : lives - 1;

        if (isCorrect) {
            setScore((prev) => prev + ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, level));
            playArcadeSound('success');
            setFeedback({ message: 'Harikasın! 🎉', type: 'success' });
        } else {
            setLives(nextLives);
            playArcadeSound('fail');
            setFeedback({ message: 'Tekrar dene! 💪', type: 'error' });
        }

        scheduleTrackedTimeout(resolveTimeoutRef, () => {
            setFeedback(null);

            if (!isCorrect && nextLives <= 0) {
                void handleGameOver();
                return;
            }

            if (isCorrect && level >= MAX_LEVEL) {
                void handleVictory();
                return;
            }

            if (isCorrect) {
                const nextLevel = level + 1;
                setLevel(nextLevel);
                playArcadeSound('levelUp');
                startRound(nextLevel);
            } else {
                startRound(level);
            }

            focusPlayArea();
            isResolvingRef.current = false;
        }, 1500);
    }, [focusPlayArea, handleGameOver, handleVictory, level, lives, phase, playArcadeSound, round, scheduleTrackedTimeout, startRound]);

    return {
        phase,
        score,
        lives,
        level,
        timeLeft,
        round,
        feedback,
        playAreaRef,
        isResolvingRef,
        formatTime,
        getDifficulty,
        handleStart,
        handleAnimationEnd,
        handleReplay,
        handleOptionSelect,
        navigate,
    };
}
