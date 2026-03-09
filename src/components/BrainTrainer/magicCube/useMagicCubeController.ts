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
  ROUND_TRANSITION_MS,
  TIME_LIMIT,
} from "./constants";
import { createMagicCubeLevel, getMagicCubeScore } from "./logic";
import type { GameOption, MagicCubeLevelData } from "./types";

export const useMagicCubeController = () => {
  const answerStartedAtRef = useRef(0);
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
  const { addScore, level, lives, loseLife, nextLevel, phase } = engine;

  const [isFolding, setIsFolding] = useState(false);
  const [levelData, setLevelData] = useState<MagicCubeLevelData | null>(null);

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

  const resetRoundState = useCallback(() => {
    setIsFolding(false);
    setLevelData(null);
    answerStartedAtRef.current = 0;
  }, []);

  const startRound = useCallback(() => {
    setIsFolding(false);
    setLevelData(createMagicCubeLevel());
    answerStartedAtRef.current = Date.now();
    playSound("slide");
  }, [playSound]);

  const getResponseMs = useCallback(() => {
    return answerStartedAtRef.current > 0
      ? Date.now() - answerStartedAtRef.current
      : null;
  }, []);

  useEffect(() => clearPendingActions, [clearPendingActions]);

  useEffect(() => {
    if (phase === "playing") {
      startRound();
      return;
    }

    clearPendingActions();

    if (phase === "welcome") {
      resetRoundState();
      resetPerformance();
      return;
    }

    resetRoundState();
  }, [clearPendingActions, phase, resetPerformance, resetRoundState, startRound, level]);

  const handleSelect = useCallback(
    (option: GameOption) => {
      if (phase !== "playing" || feedbackState || !levelData) {
        return;
      }

      const correct = option.isCorrect;
      const canRetry = lives > 1;
      clearPendingActions();
      recordAttempt({ isCorrect: correct, responseMs: getResponseMs() });
      showFeedback(correct);
      playSound(correct ? "correct" : "incorrect");

      if (correct) {
        addScore(getMagicCubeScore(level));
        scheduleAction(() => {
          dismissFeedback();
          nextLevel();
        }, FEEDBACK_DURATION_MS);
        return;
      }

      loseLife();
      scheduleAction(() => {
        dismissFeedback();

        if (!canRetry) {
          return;
        }

        setIsFolding(true);
        scheduleAction(() => {
          startRound();
        }, ROUND_TRANSITION_MS);
      }, FEEDBACK_DURATION_MS);
    },
    [
      addScore,
      clearPendingActions,
      dismissFeedback,
      feedbackState,
      getResponseMs,
      level,
      levelData,
      lives,
      loseLife,
      nextLevel,
      phase,
      playSound,
      recordAttempt,
      scheduleAction,
      showFeedback,
      startRound,
    ],
  );

  const toggleFolding = useCallback(() => {
    setIsFolding((currentValue) => !currentValue);
  }, []);

  return {
    engine,
    feedback,
    facesData: levelData?.facesData ?? null,
    isFolding,
    net: levelData?.net ?? null,
    options: levelData?.options ?? [],
    handleSelect,
    toggleFolding,
  };
};
