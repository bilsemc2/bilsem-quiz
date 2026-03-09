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
import {
  createQuestionForLevel,
  getNumberSequenceScore,
  isMaxLevel,
} from "./logic";
import type { NumberSequenceQuestion } from "./types";

export const useNumberSequenceController = () => {
  const pendingLevelRef = useRef<number | null>(null);
  const playSlideOnNextRoundRef = useRef(false);
  const questionShownAtRef = useRef(0);
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
  const { addScore, level, lives, loseLife, nextLevel, phase, setGamePhase } =
    engine;

  const [currentQuestion, setCurrentQuestion] =
    useState<NumberSequenceQuestion | null>(null);
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
    pendingLevelRef.current = null;
    playSlideOnNextRoundRef.current = false;
    questionShownAtRef.current = 0;
    setCurrentQuestion(null);
    setSelectedAnswer(null);
  }, []);

  const startLevel = useCallback(
    (roundLevel: number, shouldPlaySlide: boolean) => {
      setCurrentQuestion(createQuestionForLevel(roundLevel));
      setSelectedAnswer(null);
      pendingLevelRef.current = roundLevel;
      questionShownAtRef.current = Date.now();

      if (shouldPlaySlide) {
        playSound("slide");
      }
    },
    [playSound],
  );

  useEffect(() => clearPendingActions, [clearPendingActions]);

  useEffect(() => {
    if (phase === "playing") {
      if (pendingLevelRef.current !== level) {
        const shouldPlaySlide =
          pendingLevelRef.current === null || playSlideOnNextRoundRef.current;

        playSlideOnNextRoundRef.current = false;
        startLevel(level, shouldPlaySlide);
      }

      return;
    }

    clearPendingActions();
    dismissFeedback();

    if (phase === "welcome") {
      resetRoundState();
      resetPerformance();
      return;
    }

    resetRoundState();
  }, [
    clearPendingActions,
    dismissFeedback,
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
        feedbackState ||
        selectedAnswer !== null ||
        !currentQuestion
      ) {
        return;
      }

      const isCorrect = value === currentQuestion.answer;
      const canRetry = lives > 1;

      setSelectedAnswer(value);
      clearPendingActions();
      recordAttempt({ isCorrect, responseMs: getResponseMs() });
      showFeedback(isCorrect);
      playSound(isCorrect ? "correct" : "incorrect");

      scheduleAction(() => {
        dismissFeedback();

        if (isCorrect) {
          addScore(getNumberSequenceScore(level));

          if (isMaxLevel(level)) {
            setGamePhase("victory");
            playSound("success");
            return;
          }

          playSlideOnNextRoundRef.current = true;
          nextLevel();
          return;
        }

        loseLife();

        if (canRetry) {
          startLevel(level, false);
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
    isLocked: Boolean(feedbackState),
    selectedAnswer,
  };
};
