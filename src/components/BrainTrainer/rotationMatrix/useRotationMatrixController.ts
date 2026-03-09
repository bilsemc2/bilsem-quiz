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
  calculateRotationMatrixScore,
  createRound,
  isMaxLevel,
} from "./logic";
import type { RotationMatrixOption, RotationMatrixRound } from "./types";

export const useRotationMatrixController = () => {
  const actionTimeoutRef = useRef<number | null>(null);
  const pendingLevelRef = useRef<number | null>(null);
  const answerStartedAtRef = useRef(0);
  const { performanceRef, recordAttempt, resetPerformance } =
    useGamePerformanceTracker();
  const { playSound } = useSound();
  const engine = useGameEngine({
    gameId: GAME_ID,
    timeLimit: TIME_LIMIT,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    getPerformanceSnapshot: () => performanceRef.current,
  });
  const { level, lives, phase, setGamePhase, addScore, loseLife, nextLevel } = engine;
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { dismissFeedback, feedbackState, showFeedback } = feedback;

  const [round, setRound] = useState<RotationMatrixRound | null>(null);

  const clearActionTimeout = useCallback(() => {
    if (actionTimeoutRef.current !== null) {
      window.clearTimeout(actionTimeoutRef.current);
      actionTimeoutRef.current = null;
    }
  }, []);

  const getResponseMs = useCallback(() => {
    return answerStartedAtRef.current > 0 ? Date.now() - answerStartedAtRef.current : null;
  }, []);

  const resetRoundState = useCallback(() => {
    pendingLevelRef.current = null;
    answerStartedAtRef.current = 0;
    setRound(null);
  }, []);

  const startRound = useCallback((roundLevel: number, shouldPlaySlide = false) => {
    pendingLevelRef.current = roundLevel;
    answerStartedAtRef.current = Date.now();
    setRound(createRound());

    if (shouldPlaySlide) {
      playSound("slide");
    }
  }, [playSound]);

  useEffect(() => clearActionTimeout, [clearActionTimeout]);

  useEffect(() => {
    if (phase === "playing") {
      if (pendingLevelRef.current !== level || !round) {
        startRound(level, !round);
      }

      return;
    }

    clearActionTimeout();
    dismissFeedback();

    if (phase === "welcome") {
      resetRoundState();
      resetPerformance();
      return;
    }

    resetRoundState();
  }, [
    clearActionTimeout,
    dismissFeedback,
    level,
    phase,
    resetPerformance,
    resetRoundState,
    round,
    startRound,
  ]);

  const handleSelect = useCallback((option: RotationMatrixOption) => {
    if (phase !== "playing" || feedbackState || !round) {
      return;
    }

    const isCorrect = option.isCorrect;
    const willGameOver = !isCorrect && lives <= 1;

    recordAttempt({ isCorrect, responseMs: getResponseMs() });
    showFeedback(isCorrect);
    playSound(isCorrect ? "correct" : "wrong");
    clearActionTimeout();

    actionTimeoutRef.current = window.setTimeout(() => {
      dismissFeedback();

      if (isCorrect) {
        addScore(calculateRotationMatrixScore(level));

        if (isMaxLevel(level)) {
          setGamePhase("victory");
          playSound("success");
          return;
        }

        nextLevel();
        startRound(level + 1);
        return;
      }

      loseLife();

      if (willGameOver) {
        playSound("wrong");
        return;
      }

      startRound(level);
    }, FEEDBACK_DURATION_MS);
  }, [
    addScore,
    clearActionTimeout,
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
    setGamePhase,
    showFeedback,
    startRound,
  ]);

  return {
    engine,
    feedback,
    handleSelect,
    isLocked: Boolean(feedbackState),
    round,
  };
};
