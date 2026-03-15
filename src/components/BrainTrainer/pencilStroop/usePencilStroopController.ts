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
  buildPencilStroopFeedbackMessage,
  calculatePencilStroopScore,
  createRound,
  isAnswerCorrect,
} from "./logic";
import type { PencilStroopRound } from "./types";

export const usePencilStroopController = () => {
  const actionTimeoutRef = useRef<number | null>(null);
  const pendingLevelRef = useRef<number | null>(null);
  const previousLevelRef = useRef(1);
  const roundStartedAtRef = useRef(0);
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
  const { addScore, level, lives, loseLife, nextLevel, phase } = engine;
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { dismissFeedback, feedbackState, showFeedback } = feedback;

  const [currentRound, setCurrentRound] = useState<PencilStroopRound | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const clearActionTimeout = useCallback(() => {
    if (actionTimeoutRef.current !== null) {
      window.clearTimeout(actionTimeoutRef.current);
      actionTimeoutRef.current = null;
    }
  }, []);

  const getResponseMs = useCallback(() => {
    return roundStartedAtRef.current > 0
      ? Date.now() - roundStartedAtRef.current
      : null;
  }, []);

  const resetRoundState = useCallback(() => {
    pendingLevelRef.current = null;
    roundStartedAtRef.current = 0;
    setCurrentRound(null);
    setSelectedAnswer(null);
  }, []);

  const startRound = useCallback((roundLevel: number) => {
    pendingLevelRef.current = roundLevel;
    roundStartedAtRef.current = Date.now();
    setCurrentRound(createRound());
    setSelectedAnswer(null);
  }, []);

  useEffect(() => clearActionTimeout, [clearActionTimeout]);

  useEffect(() => {
    if (phase === "playing") {
      const needsRound = pendingLevelRef.current !== level || !currentRound;

      if (needsRound) {
        const shouldPlaySlide = !currentRound || level < previousLevelRef.current;
        startRound(level);

        if (shouldPlaySlide) {
          playSound("slide");
        }
      }
    } else {
      clearActionTimeout();
      dismissFeedback();

      if (phase === "welcome") {
        resetRoundState();
        resetPerformance();
      } else {
        resetRoundState();
      }
    }

    previousLevelRef.current = level;
  }, [
    clearActionTimeout,
    currentRound,
    dismissFeedback,
    level,
    phase,
    playSound,
    resetPerformance,
    resetRoundState,
    startRound,
  ]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (
        !currentRound ||
        phase !== "playing" ||
        feedbackState ||
        selectedAnswer !== null
      ) {
        return;
      }

      const correct = isAnswerCorrect(answer, currentRound);
      const canRetry = lives > 1;
      const feedbackMessage = buildPencilStroopFeedbackMessage(
        correct,
        currentRound.correctAnswer,
        level,
      );

      setSelectedAnswer(answer);
      recordAttempt({ isCorrect: correct, responseMs: getResponseMs() });
      showFeedback(correct, feedbackMessage);
      clearActionTimeout();

      actionTimeoutRef.current = window.setTimeout(() => {
        dismissFeedback();

        if (correct) {
          addScore(calculatePencilStroopScore(level));
          nextLevel();
          return;
        }

        loseLife();

        if (canRetry) {
          startRound(level);
        }
      }, FEEDBACK_DURATION_MS);
    },
    [
      addScore,
      clearActionTimeout,
      currentRound,
      dismissFeedback,
      feedbackState,
      getResponseMs,
      level,
      lives,
      loseLife,
      nextLevel,
      phase,
      recordAttempt,
      selectedAnswer,
      showFeedback,
      startRound,
    ],
  );

  return {
    engine,
    feedback,
    currentRound,
    selectedAnswer,
    handleAnswer,
    isLocked: selectedAnswer !== null || Boolean(feedbackState),
  };
};
