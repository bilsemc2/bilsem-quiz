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
import { generatePuzzleLevel } from "./imageGenerator";
import {
  calculatePuzzleMasterScore,
  createDefaultSelection,
  isSelectionCorrect,
} from "./logic";
import type { PuzzleLevelData, SelectionPosition } from "./types";

export const usePuzzleMasterController = () => {
  const answerStartedAtRef = useRef(0);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const loadRequestIdRef = useRef(0);
  const { performanceRef, recordAttempt, resetPerformance } =
    useGamePerformanceTracker();
  const engine = useGameEngine({
    gameId: GAME_ID,
    timeLimit: TIME_LIMIT,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    getPerformanceSnapshot: () => performanceRef.current,
  });
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { dismissFeedback, feedbackState, showFeedback } = feedback;
  const { addScore, level, lives, loseLife, nextLevel, phase, setGamePhase } =
    engine;

  const [selection, setSelection] = useState<SelectionPosition>(
    createDefaultSelection(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [levelData, setLevelData] = useState<PuzzleLevelData | null>(null);

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

  const invalidatePendingLoad = useCallback(() => {
    loadRequestIdRef.current += 1;
    return loadRequestIdRef.current;
  }, []);

  const getResponseMs = useCallback(() => {
    return answerStartedAtRef.current > 0
      ? Date.now() - answerStartedAtRef.current
      : null;
  }, []);

  const resetRoundState = useCallback(() => {
    setSelection(createDefaultSelection());
    setIsLoading(false);
    setLevelData(null);
    answerStartedAtRef.current = 0;
  }, []);

  const loadLevel = useCallback(
    async (levelNumber: number) => {
      const requestId = invalidatePendingLoad();
      setIsLoading(true);

      try {
        const nextLevelData = await generatePuzzleLevel(levelNumber);

        if (loadRequestIdRef.current !== requestId) {
          return;
        }

        setLevelData(nextLevelData);
        setSelection(createDefaultSelection());
        setIsLoading(false);
        answerStartedAtRef.current = Date.now();
      } catch (error) {
        if (loadRequestIdRef.current === requestId) {
          console.error("[PuzzleMaster] level generation failed", error);
          setIsLoading(false);
        }
      }
    },
    [invalidatePendingLoad],
  );

  useEffect(() => clearPendingActions, [clearPendingActions]);

  useEffect(() => {
    if (phase === "playing" && !levelData && !isLoading) {
      void loadLevel(level);
      return;
    }

    if (phase === "welcome") {
      clearPendingActions();
      invalidatePendingLoad();
      resetRoundState();
      resetPerformance();
      return;
    }

    if (phase !== "playing") {
      clearPendingActions();
      invalidatePendingLoad();
      resetRoundState();
    }
  }, [
    clearPendingActions,
    invalidatePendingLoad,
    isLoading,
    level,
    levelData,
    loadLevel,
    phase,
    resetPerformance,
    resetRoundState,
  ]);

  const handleCheck = useCallback(() => {
    if (!levelData || phase !== "playing" || feedbackState || isLoading) {
      return;
    }

    const correct = isSelectionCorrect(selection, levelData.targetBox);
    const canRetry = lives > 1;
    recordAttempt({ isCorrect: correct, responseMs: getResponseMs() });
    showFeedback(correct);
    playSound(correct ? "correct" : "wrong");

    scheduleAction(() => {
      dismissFeedback();

      if (correct) {
        addScore(calculatePuzzleMasterScore(level));

        if (level >= MAX_LEVEL) {
          setGamePhase("victory");
          playSound("success");
          return;
        }

        nextLevel();
        void loadLevel(level + 1);
        return;
      }

      loseLife();

      if (canRetry) {
        answerStartedAtRef.current = Date.now();
      }
    }, FEEDBACK_DURATION_MS);
  }, [
    addScore,
    dismissFeedback,
    feedbackState,
    getResponseMs,
    isLoading,
    level,
    levelData,
    lives,
    loadLevel,
    loseLife,
    nextLevel,
    phase,
    playSound,
    recordAttempt,
    scheduleAction,
    selection,
    setGamePhase,
    showFeedback,
  ]);

  return {
    engine,
    feedback,
    selection,
    isLoading,
    levelData,
    setSelection,
    handleCheck,
  };
};
