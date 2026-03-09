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
  PREVIEW_END_DELAY_MS,
  PREVIEW_START_DELAY_MS,
  TIME_LIMIT,
} from "./constants";
import {
  calculateLazerHafizaScore,
  generateRandomPath,
  getLevelConfig,
  getPreviewSpeed,
} from "./logic";
import type { Coordinate, LevelConfig, LocalPhase } from "./types";

export const useLazerHafizaController = () => {
  const answerStartedAtRef = useRef(0);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isGameEndingRef = useRef(false);
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

  const [levelConfig, setLevelConfig] = useState<LevelConfig>(getLevelConfig(1));
  const [localPhase, setLocalPhase] = useState<LocalPhase>("preview");
  const [path, setPath] = useState<Coordinate[]>([]);
  const [userPath, setUserPath] = useState<Coordinate[]>([]);
  const [visiblePathIndex, setVisiblePathIndex] = useState(-1);

  const clearScheduledActions = useCallback(() => {
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
    return answerStartedAtRef.current > 0
      ? Date.now() - answerStartedAtRef.current
      : null;
  }, []);

  const resetRoundState = useCallback(() => {
    setLevelConfig(getLevelConfig(1));
    setLocalPhase("preview");
    setPath([]);
    setUserPath([]);
    setVisiblePathIndex(-1);
    answerStartedAtRef.current = 0;
  }, []);

  const startPreview = useCallback(
    (nextPath: Coordinate[], previewLevel: number) => {
      let step = 0;
      const previewSpeed = getPreviewSpeed(previewLevel);

      setVisiblePathIndex(-1);
      setLocalPhase("preview");
      answerStartedAtRef.current = 0;

      const runPreview = () => {
        if (isGameEndingRef.current) {
          return;
        }

        setVisiblePathIndex(step);
        step += 1;
        playSound("pop");

        if (step < nextPath.length) {
          scheduleAction(runPreview, previewSpeed);
          return;
        }

        scheduleAction(() => {
          if (isGameEndingRef.current) {
            return;
          }

          setVisiblePathIndex(-1);
          setLocalPhase("playing");
          answerStartedAtRef.current = Date.now();
        }, PREVIEW_END_DELAY_MS);
      };

      scheduleAction(runPreview, PREVIEW_START_DELAY_MS);
    },
    [playSound, scheduleAction],
  );

  const setupLevel = useCallback(
    (levelNumber: number) => {
      clearScheduledActions();
      const nextLevelConfig = getLevelConfig(levelNumber);
      const nextPath = generateRandomPath(
        nextLevelConfig.gridSize,
        nextLevelConfig.pathLength,
        nextLevelConfig.allowDiagonals,
      );

      setLevelConfig(nextLevelConfig);
      setPath(nextPath);
      setUserPath([]);
      setVisiblePathIndex(-1);
      startPreview(nextPath, levelNumber);
    },
    [clearScheduledActions, startPreview],
  );

  useEffect(() => clearScheduledActions, [clearScheduledActions]);

  useEffect(() => {
    if (phase === "playing" && path.length === 0) {
      isGameEndingRef.current = false;
      setupLevel(level);
      return;
    }

    if (phase === "welcome") {
      isGameEndingRef.current = false;
      clearScheduledActions();
      resetRoundState();
      resetPerformance();
      return;
    }

    if (phase !== "playing") {
      isGameEndingRef.current = true;
      clearScheduledActions();
      answerStartedAtRef.current = 0;
    }
  }, [
    clearScheduledActions,
    level,
    path.length,
    phase,
    resetPerformance,
    resetRoundState,
    setupLevel,
  ]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (phase !== "playing" || localPhase !== "playing" || feedbackState) {
        return;
      }

      const expectedCoordinate = path[userPath.length];
      if (!expectedCoordinate) {
        return;
      }

      const isCorrect =
        expectedCoordinate.row === row && expectedCoordinate.col === col;
      const nextUserPath = [...userPath, { row, col }];
      const canRetry = lives > 1;

      setUserPath(nextUserPath);
      playSound(isCorrect ? "pop" : "incorrect");

      if (isCorrect && nextUserPath.length === path.length) {
        recordAttempt({ isCorrect: true, responseMs: getResponseMs() });
        showFeedback(true);
        playSound("correct");

        scheduleAction(() => {
          dismissFeedback();
          addScore(calculateLazerHafizaScore(level, path.length));

          if (level >= MAX_LEVEL) {
            setGamePhase("victory");
            return;
          }

          nextLevel();
          setupLevel(level + 1);
        }, FEEDBACK_DURATION_MS);

        return;
      }

      if (isCorrect) {
        return;
      }

      recordAttempt({ isCorrect: false, responseMs: getResponseMs() });
      showFeedback(false);

      scheduleAction(() => {
        dismissFeedback();
        loseLife();

        if (canRetry) {
          setupLevel(level);
          return;
        }

        isGameEndingRef.current = true;
      }, FEEDBACK_DURATION_MS);
    },
    [
      addScore,
      dismissFeedback,
      feedbackState,
      getResponseMs,
      level,
      lives,
      localPhase,
      loseLife,
      nextLevel,
      path,
      phase,
      playSound,
      recordAttempt,
      scheduleAction,
      setGamePhase,
      setupLevel,
      showFeedback,
      userPath,
    ],
  );

  return {
    engine,
    feedback,
    levelConfig,
    localPhase,
    path,
    userPath,
    visiblePathIndex,
    handleCellClick,
  };
};
