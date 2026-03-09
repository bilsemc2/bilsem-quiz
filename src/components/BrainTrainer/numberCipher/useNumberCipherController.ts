import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";
import { useSound } from "../../../hooks/useSound";
import { useGameEngine } from "../shared/useGameEngine";
import {
  FEEDBACK_DURATION_MS,
  GAME_ID,
  INITIAL_LIVES,
  MAX_LEVEL,
  TIME_LIMIT,
} from "./constants";
import { createQuestionForLevel, getNumberCipherScore } from "./logic";
import type { Question } from "./types";

export const useNumberCipherController = () => {
  const questionShownAtRef = useRef(0);
  const pendingLevelRef = useRef<number | null>(null);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
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
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { dismissFeedback, feedbackState, showFeedback } = feedback;
  const {
    addScore,
    level,
    lives,
    loseLife,
    nextLevel,
    phase,
    setGamePhase,
  } = engine;

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const clearPendingActions = useCallback(() => {
    timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
  }, []);

  const scheduleAction = useCallback(
    (callback: () => void, delayMs: number) => {
      const timeoutId = safeTimeout(() => {
        timeoutIdsRef.current = timeoutIdsRef.current.filter(
          (trackedId) => trackedId !== timeoutId,
        );
        callback();
      }, delayMs);

      timeoutIdsRef.current.push(timeoutId);
      return timeoutId;
    },
    [safeTimeout],
  );

  const getResponseMs = useCallback(() => {
    return questionShownAtRef.current > 0
      ? Date.now() - questionShownAtRef.current
      : null;
  }, []);

  const resetRoundState = useCallback(() => {
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    pendingLevelRef.current = null;
    questionShownAtRef.current = 0;
  }, []);

  const startLevel = useCallback((roundLevel: number) => {
    setCurrentQuestion(createQuestionForLevel(roundLevel));
    setSelectedAnswer(null);
    pendingLevelRef.current = roundLevel;
    questionShownAtRef.current = Date.now();
  }, []);

  useEffect(() => clearPendingActions, [clearPendingActions]);

  useEffect(() => {
    if (phase === "playing") {
      if (pendingLevelRef.current !== level) {
        startLevel(level);
      }
      return;
    }

    clearPendingActions();

    if (phase === "welcome") {
      resetRoundState();
      resetPerformance();
      return;
    }

    resetRoundState();
  }, [
    clearPendingActions,
    level,
    phase,
    resetPerformance,
    resetRoundState,
    startLevel,
  ]);

  const handleAnswer = useCallback(
    (value: number) => {
      if (
        phase !== "playing" ||
        selectedAnswer !== null ||
        !currentQuestion ||
        feedbackState
      ) {
        return;
      }

      const correct = value === currentQuestion.answer;
      const canRetry = lives > 1;

      setSelectedAnswer(value);
      clearPendingActions();
      recordAttempt({ isCorrect: correct, responseMs: getResponseMs() });
      showFeedback(correct);
      playSound(correct ? "correct" : "wrong");

      scheduleAction(() => {
        dismissFeedback();

        if (correct) {
          addScore(getNumberCipherScore(level));

          if (level >= MAX_LEVEL) {
            setGamePhase("victory");
            playSound("success");
            return;
          }

          nextLevel();
          return;
        }

        loseLife();

        if (canRetry) {
          startLevel(level);
        }
      }, FEEDBACK_DURATION_MS);
    },
    [
      addScore,
      clearPendingActions,
      currentQuestion,
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
      scheduleAction,
      selectedAnswer,
      setGamePhase,
      showFeedback,
      startLevel,
    ],
  );

  return {
    currentQuestion,
    engine,
    feedback,
    handleAnswer,
    selectedAnswer,
  };
};
