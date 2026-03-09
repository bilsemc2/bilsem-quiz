import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker";
import { useSound } from "../../../hooks/useSound";
import { useGameEngine } from "../shared/useGameEngine";
import {
  FEEDBACK_DURATION_MS,
  GAME_ID,
  INITIAL_LIVES,
  MAX_LEVEL,
  TIME_LIMIT,
} from "./constants";
import {
  calculateSymbolSearchScore,
  createRound,
  isCorrectAnswer,
  isMaxLevel,
} from "./logic";
import type { RoundData } from "./types";

export const useSymbolSearchController = () => {
  const pendingLevelRef = useRef<number | null>(null);
  const roundStartedAtRef = useRef(0);
  const timeoutIdsRef = useRef<number[]>([]);
  const { performanceRef, recordAttempt, resetPerformance } =
    useGamePerformanceTracker();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
    getPerformanceSnapshot: () => performanceRef.current,
  });
  const { playSound } = useSound();
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { dismissFeedback, feedbackState, showFeedback } = feedback;
  const { addScore, level, lives, loseLife, nextLevel, phase, setGamePhase } = engine;

  const [round, setRound] = useState<RoundData | null>(null);
  const [userSelectedAnswer, setUserSelectedAnswer] = useState<boolean | null>(null);

  const clearScheduledActions = useCallback(() => {
    timeoutIdsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    timeoutIdsRef.current = [];
  }, []);

  const scheduleAction = useCallback((callback: () => void, delayMs: number) => {
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
      callback();
    }, delayMs);

    timeoutIdsRef.current = [...timeoutIdsRef.current, timeoutId];
  }, []);

  const getResponseMs = useCallback(() => {
    return roundStartedAtRef.current > 0 ? Date.now() - roundStartedAtRef.current : null;
  }, []);

  const startRound = useCallback((roundLevel: number) => {
    pendingLevelRef.current = roundLevel;
    roundStartedAtRef.current = Date.now();
    setRound(createRound(roundLevel));
    setUserSelectedAnswer(null);
  }, []);

  useEffect(() => clearScheduledActions, [clearScheduledActions]);

  useEffect(() => {
    if (phase === "playing") {
      if (pendingLevelRef.current !== level || !round) {
        startRound(level);
      }
      return;
    }

    clearScheduledActions();
    dismissFeedback();
    setUserSelectedAnswer(null);

    if (phase === "welcome") {
      pendingLevelRef.current = null;
      roundStartedAtRef.current = 0;
      setRound(null);
      resetPerformance();
      return;
    }

    pendingLevelRef.current = null;
    roundStartedAtRef.current = 0;
    setRound(null);
  }, [
    clearScheduledActions,
    dismissFeedback,
    level,
    phase,
    resetPerformance,
    round,
    startRound,
  ]);

  const handleAnswer = useCallback((userAnswer: boolean) => {
    if (!round || phase !== "playing" || feedbackState || userSelectedAnswer !== null) {
      return;
    }

    const correct = isCorrectAnswer(userAnswer, round);
    const canRetry = lives > 1;

    setUserSelectedAnswer(userAnswer);
    recordAttempt({ isCorrect: correct, responseMs: getResponseMs() });
    playSound(correct ? "correct" : "incorrect");
    showFeedback(correct);

    if (correct) {
      addScore(calculateSymbolSearchScore(level));
    } else {
      loseLife();
    }

    scheduleAction(() => {
      dismissFeedback();
      setUserSelectedAnswer(null);

      if (correct) {
        if (isMaxLevel(level)) {
          setGamePhase("victory");
          playSound("success");
          return;
        }

        setRound(null);
        nextLevel();
        return;
      }

      if (canRetry) {
        startRound(level);
      }
    }, FEEDBACK_DURATION_MS);
  }, [
    addScore,
    dismissFeedback,
    feedbackState,
    getResponseMs,
    level,
    lives,
    loseLife,
    nextLevel,
    phase,
    playSound,
    recordAttempt,
    round,
    scheduleAction,
    setGamePhase,
    showFeedback,
    startRound,
    userSelectedAnswer,
  ]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (phase !== "playing") {
        return;
      }

      if (event.key === "ArrowLeft") {
        handleAnswer(false);
      }
      if (event.key === "ArrowRight") {
        handleAnswer(true);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [handleAnswer, phase]);

  return {
    engine,
    feedback,
    feedbackCorrect: feedback.feedbackState?.correct ?? null,
    handleAnswer,
    round,
    userSelectedAnswer,
  };
};
