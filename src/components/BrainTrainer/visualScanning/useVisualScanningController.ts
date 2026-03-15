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
} from "./constants.ts";
import {
  applyCellSelection,
  buildVisualScanningFeedbackMessage,
  calculateVisualScanningScore,
  createRound,
  getRemainingTargetCount,
} from "./logic.ts";
import type { VisualScanningRound } from "./types.ts";

export const useVisualScanningController = () => {
  const actionTimeoutRef = useRef<number | null>(null);
  const roundLevelRef = useRef<number | null>(null);
  const roundActionStartedAtRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const { performanceRef, recordAttempt, resetPerformance } =
    useGamePerformanceTracker();
  const { playSound } = useSound();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
    getPerformanceSnapshot: () => performanceRef.current,
  });
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { dismissFeedback, feedbackState, showFeedback } = feedback;
  const { addScore, level, lives, loseLife, nextLevel, phase } = engine;

  const [round, setRound] = useState<VisualScanningRound | null>(null);
  const [streak, setStreak] = useState(0);

  const clearActionTimeout = useCallback(() => {
    if (actionTimeoutRef.current !== null) {
      window.clearTimeout(actionTimeoutRef.current);
      actionTimeoutRef.current = null;
    }
  }, []);

  const getResponseMs = useCallback(() => {
    return roundActionStartedAtRef.current > 0
      ? Math.round(performance.now() - roundActionStartedAtRef.current)
      : null;
  }, []);

  const startRound = useCallback((roundLevel: number) => {
    roundLevelRef.current = roundLevel;
    roundActionStartedAtRef.current = performance.now();
    isTransitioningRef.current = false;
    setRound(createRound(roundLevel));
  }, []);

  useEffect(() => clearActionTimeout, [clearActionTimeout]);

  useEffect(() => {
    if (phase === "playing") {
      if (!round || roundLevelRef.current !== level) {
        startRound(level);
      }
      return;
    }

    clearActionTimeout();
    dismissFeedback();
    isTransitioningRef.current = false;
    roundLevelRef.current = null;
    roundActionStartedAtRef.current = 0;
    setRound(null);
    setStreak(0);

    if (phase === "welcome") {
      resetPerformance();
    }
  }, [
    clearActionTimeout,
    dismissFeedback,
    level,
    phase,
    resetPerformance,
    round,
    startRound,
  ]);

  const handleCellClick = useCallback(
    (index: number) => {
      if (
        !round ||
        phase !== "playing" ||
        feedbackState ||
        isTransitioningRef.current
      ) {
        return;
      }

      const result = applyCellSelection(round.cells, index);

      if (result.isIgnored) {
        return;
      }

      const canRetry = lives > 1;
      setRound({ ...round, cells: result.nextCells });
      recordAttempt({ isCorrect: result.isCorrect, responseMs: getResponseMs() });

      if (result.isCorrect) {
        const nextStreak = streak + 1;
        const remaining = getRemainingTargetCount(result.nextCells);

        setStreak(nextStreak);
        addScore(calculateVisualScanningScore(streak));
        playSound("pop");

        if (remaining === 0) {
          isTransitioningRef.current = true;
          showFeedback(
            true,
            buildVisualScanningFeedbackMessage({
              correct: true,
              remainingTargets: remaining,
              level,
              maxLevel: MAX_LEVEL,
            }),
          );
          clearActionTimeout();

          actionTimeoutRef.current = window.setTimeout(() => {
            dismissFeedback();
            nextLevel();
          }, FEEDBACK_DURATION_MS);

          return;
        }

        roundActionStartedAtRef.current = performance.now();
        return;
      }

      setStreak(0);
      addScore(-10);
      loseLife();
      showFeedback(
        false,
        buildVisualScanningFeedbackMessage({
          correct: false,
          remainingTargets: getRemainingTargetCount(result.nextCells),
          level,
          maxLevel: MAX_LEVEL,
        }),
      );
      clearActionTimeout();

      actionTimeoutRef.current = window.setTimeout(() => {
        dismissFeedback();

        if (canRetry) {
          roundActionStartedAtRef.current = performance.now();
        }
      }, FEEDBACK_DURATION_MS);
    },
    [
      addScore,
      clearActionTimeout,
      dismissFeedback,
      feedbackState,
      getResponseMs,
      lives,
      loseLife,
      nextLevel,
      phase,
      playSound,
      recordAttempt,
      round,
      showFeedback,
      level,
      streak,
    ],
  );

  return {
    engine,
    feedback,
    round,
    streak,
    handleCellClick,
  };
};
