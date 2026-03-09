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
  PATTERN_COLORS,
  TIME_LIMIT,
} from "./constants";
import {
  createEmptyPainting,
  createLevel,
  getAvailableColors,
  getPatternPainterScore,
  isPaintingComplete,
  isPaintingCorrect,
  paintTile,
} from "./logic";
import type { PaintingGrid, PatternPainterLevel } from "./types";

export const usePatternPainterController = () => {
  const levelStartedAtRef = useRef(0);
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
  const { addScore, level, lives, loseLife, nextLevel, phase } = engine;
  const { dismissFeedback, feedbackState, showFeedback } = feedback;

  const [currentLevel, setCurrentLevel] = useState<PatternPainterLevel | null>(
    null,
  );
  const [userPainting, setUserPainting] = useState<PaintingGrid>(
    createEmptyPainting(),
  );
  const [activeColor, setActiveColor] = useState<string | null>(
    PATTERN_COLORS[0],
  );

  const availableColors = currentLevel
    ? getAvailableColors(currentLevel.grid)
    : PATTERN_COLORS.slice(0, 4);
  const canCheck = isPaintingComplete(userPainting);

  const getResponseMs = useCallback(() => {
    return levelStartedAtRef.current > 0
      ? Date.now() - levelStartedAtRef.current
      : null;
  }, []);

  const clearPainting = useCallback(() => {
    setUserPainting(createEmptyPainting());
  }, []);

  const setupLevel = useCallback((nextLevelNumber: number) => {
    const nextLevel = createLevel(nextLevelNumber);
    const nextColors = getAvailableColors(nextLevel.grid);
    setCurrentLevel(nextLevel);
    setUserPainting(createEmptyPainting());
    setActiveColor(nextColors[0] ?? PATTERN_COLORS[0]);
    levelStartedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (phase === "playing" && !currentLevel) {
      setupLevel(level);
      return;
    }

    if (phase === "welcome") {
      setCurrentLevel(null);
      setUserPainting(createEmptyPainting());
      setActiveColor(PATTERN_COLORS[0]);
      levelStartedAtRef.current = 0;
      resetPerformance();
      return;
    }

    if (phase !== "playing") {
      setCurrentLevel(null);
      setUserPainting(createEmptyPainting());
    }
  }, [currentLevel, level, phase, resetPerformance, setupLevel]);

  const handleSelectColor = useCallback(
    (color: string) => {
      if (phase !== "playing" || feedbackState) {
        return;
      }

      setActiveColor(color);
      playSound("click");
    },
    [feedbackState, phase, playSound],
  );

  const handlePaintTile = useCallback(
    (row: number, column: number) => {
      if (!activeColor || feedbackState || phase !== "playing") {
        return;
      }

      setUserPainting((currentPainting) =>
        paintTile(currentPainting, row, column, activeColor),
      );
      playSound("pop");
    },
    [activeColor, feedbackState, phase, playSound],
  );

  const handleClearPainting = useCallback(() => {
    if (feedbackState || phase !== "playing") {
      return;
    }

    clearPainting();
    playSound("slide");
  }, [clearPainting, feedbackState, phase, playSound]);

  const handleCheck = useCallback(() => {
    if (
      !currentLevel ||
      phase !== "playing" ||
      feedbackState ||
      !isPaintingComplete(userPainting)
    ) {
      return;
    }

    const isCorrect = isPaintingCorrect(userPainting, currentLevel.correctOption);
    recordAttempt({ isCorrect, responseMs: getResponseMs() });
    showFeedback(isCorrect);
    playSound(isCorrect ? "correct" : "wrong");

    safeTimeout(() => {
      dismissFeedback();

      if (isCorrect) {
        addScore(getPatternPainterScore(level));
        nextLevel();

        if (level < MAX_LEVEL) {
          setupLevel(level + 1);
        }

        return;
      }

      const willGameOver = lives <= 1;
      loseLife();

      if (!willGameOver) {
        clearPainting();
        levelStartedAtRef.current = Date.now();
      }
    }, FEEDBACK_DURATION_MS);
  }, [
    addScore,
    clearPainting,
    currentLevel,
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
    safeTimeout,
    setupLevel,
    showFeedback,
    userPainting,
  ]);

  return {
    engine,
    feedback,
    currentLevel,
    userPainting,
    activeColor,
    availableColors,
    canCheck,
    handleCheck,
    handleClearPainting,
    handlePaintTile,
    handleSelectColor,
  };
};
