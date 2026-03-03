import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSound } from "../../../hooks/useSound";
import { useGamePersistence } from "../../../hooks/useGamePersistence";
import { useExam } from "../../../contexts/ExamContext";

export type GamePhase = "welcome" | "playing" | "feedback" | "game_over" | "victory";

export interface UseGameEngineConfig {
    gameId: string;
    maxLevel?: number;
    initialLives?: number;
    timeLimit?: number; // In seconds
    /** When true, prevents auto-start from location.state (useful for games with custom pre-game phases like reading) */
    disableAutoStart?: boolean;
}

export const useGameEngine = ({
    gameId,
    maxLevel = 20,
    initialLives = 5,
    timeLimit = 180,
    disableAutoStart = false,
}: UseGameEngineConfig) => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<GamePhase>("welcome");
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(initialLives);
    const [timeLeft, setTimeLeft] = useState(timeLimit);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || timeLimit;

    // Clear timer helper
    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        // First go to welcome to trigger cleanup in all game components
        setPhase("welcome");
        setScore(0);
        setLevel(1);
        setLives(initialLives);
        setTimeLeft(examMode ? examTimeLimit : timeLimit);
        hasSavedRef.current = false;
        startTimeRef.current = Date.now();
        clearTimer();
        // Then transition to playing on next tick so games see welcome→playing
        setTimeout(() => {
            setPhase("playing");
            playSound("pop");
        }, 0);
    }, [playSound, examMode, examTimeLimit, initialLives, timeLimit, clearTimer]);

    const addScore = useCallback((points: number) => {
        setScore((s) => s + points);
    }, []);

    const nextLevel = useCallback(() => {
        if (level >= maxLevel) {
            setPhase("victory");
        } else {
            setLevel((l) => l + 1);
        }
    }, [level, maxLevel]);

    const onCorrect = useCallback((bonusPoints?: number) => {
        addScore(bonusPoints ?? 100 + level * 20);
        nextLevel();
    }, [level, addScore, nextLevel]);

    const loseLife = useCallback(() => {
        setLives((l) => {
            const nl = Math.max(0, l - 1);
            if (nl === 0) {
                setPhase("game_over");
                clearTimer();
            }
            return nl;
        });
    }, [clearTimer]);

    const onIncorrect = useCallback(() => {
        loseLife();
    }, [loseLife]);

    const setGamePhase = useCallback((newPhase: GamePhase) => {
        setPhase(newPhase);
        if (newPhase === "game_over" || newPhase === "victory") {
            clearTimer();
        }
    }, [clearTimer]);

    // Auto-start for exam mode only
    useEffect(() => {
        if (disableAutoStart) return;
        if (examMode && phase === "welcome") {
            handleStart();
        }
    }, [phase, handleStart, examMode, disableAutoStart]);

    // Timer
    useEffect(() => {
        if (phase === "playing" && timeLeft > 0) {
            if (!timerRef.current) {
                timerRef.current = setInterval(() => {
                    setTimeLeft((p) => {
                        if (p <= 1) {
                            clearTimer();
                            setPhase("game_over");
                            return 0;
                        }
                        return p - 1;
                    });
                }, 1000);
            }
        } else if (phase !== "playing") {
            clearTimer();
        }
        return clearTimer;
    }, [phase, timeLeft, clearTimer]);

    // Save result on finish
    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            const passed = level >= 5 || phase === "victory";
            try {
                await submitResult(
                    passed,
                    score,
                    maxLevel * 100,
                    duration,
                );
            } catch (err) {
                console.error('[useGameEngine] submitResult hatası:', err);
            }
            setTimeout(() => navigate("/atolyeler/sinav-simulasyonu/devam"), 3000);
            return;
        }

        await saveGamePlay({
            game_id: gameId,
            score_achieved: score,
            duration_seconds: duration,
            metadata: { level_reached: level, victory: phase === "victory" },
        });
    }, [
        phase,
        score,
        level,
        saveGamePlay,
        examMode,
        submitResult,
        navigate,
        gameId,
        maxLevel,
    ]);

    useEffect(() => {
        if (phase === "game_over" || phase === "victory") {
            handleFinish();
        }
    }, [phase, handleFinish]);

    const addTime = useCallback(
        (seconds: number) => {
            setTimeLeft((prev) => Math.min(prev + seconds, timeLimit));
        },
        [timeLimit],
    );

    return {
        // State
        phase,
        level,
        score,
        lives,
        timeLeft,
        examMode,
        addTime,

        // Actions
        handleStart,
        addScore,
        loseLife,
        nextLevel,
        onCorrect,
        onIncorrect,
        setGamePhase,
    };
};
