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
  LEVEL_BONUS_SECONDS,
  MAX_LEVEL,
  TIME_LIMIT,
} from "./constants";
import {
  createAttentionCodingRound,
  getAttentionCodingScore,
  getAvailableAnswerShapes,
  isCorrectAnswer,
} from "./logic";
import type { AttentionCodingRound, ShapeType } from "./types";

export const useAttentionCodingController = () => {
  const questionStartedAtRef = useRef(0);
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
  const { feedbackState, showFeedback } = feedback;
  const { addScore, addTime, level, lives, loseLife, nextLevel, phase } = engine;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [round, setRound] = useState<AttentionCodingRound | null>(null);

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
    return questionStartedAtRef.current > 0
      ? Date.now() - questionStartedAtRef.current
      : null;
  }, []);

  const resetRoundState = useCallback(() => {
    setCurrentIndex(0);
    setRound(null);
    pendingLevelRef.current = null;
    questionStartedAtRef.current = 0;
  }, []);

  const startRound = useCallback(
    (roundLevel: number) => {
      setRound(createAttentionCodingRound(roundLevel));
      setCurrentIndex(0);
      pendingLevelRef.current = roundLevel;
      questionStartedAtRef.current = Date.now();
      playSound("slide");
    },
    [playSound],
  );

  useEffect(() => clearPendingActions, [clearPendingActions]);

  useEffect(() => {
    if (phase === "playing") {
      if (pendingLevelRef.current !== level) {
        startRound(level);
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
    startRound,
  ]);

  const handleAnswer = useCallback(
    (shape: ShapeType) => {
      if (phase !== "playing" || feedbackState || !round) {
        return;
      }

      const currentItem = round.items[currentIndex];
      const correct = isCorrectAnswer(
        round.keyMappings,
        currentItem.targetNumber,
        shape,
      );
      const canRetry = lives > 1;

      clearPendingActions();
      recordAttempt({ isCorrect: correct, responseMs: getResponseMs() });

      if (correct) {
        playSound("pop");
        addScore(getAttentionCodingScore(level));

        if (currentIndex === round.items.length - 1) {
          playSound("correct");
          showFeedback(true);
          scheduleAction(() => {
            addTime(LEVEL_BONUS_SECONDS);
            nextLevel();
          }, FEEDBACK_DURATION_MS);
          return;
        }

        setCurrentIndex((previousIndex) => previousIndex + 1);
        questionStartedAtRef.current = Date.now();
        return;
      }

      playSound("incorrect");
      loseLife();
      showFeedback(false);

      if (!canRetry) {
        return;
      }

      scheduleAction(() => {
        questionStartedAtRef.current = Date.now();
      }, FEEDBACK_DURATION_MS);
    },
    [
      addScore,
      addTime,
      clearPendingActions,
      currentIndex,
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
      showFeedback,
    ],
  );

  return {
    availableShapes: getAvailableAnswerShapes(round?.keyMappings ?? []),
    currentIndex,
    engine,
    feedback,
    items: round?.items ?? [],
    keyMappings: round?.keyMappings ?? [],
    handleAnswer,
  };
};
