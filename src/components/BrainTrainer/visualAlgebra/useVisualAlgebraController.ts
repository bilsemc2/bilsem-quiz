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
  calculatePanWeight,
  calculateVisualAlgebraScore,
  generateLevel,
  getShapesForLevel,
} from "./logic";
import { ShapeType } from "./types";
import type { LevelData, PanContent } from "./types";

export const useVisualAlgebraController = () => {
  const actionTimeoutRef = useRef<number | null>(null);
  const roundLevelRef = useRef<number | null>(null);
  const attemptStartedAtRef = useRef(0);
  const { performanceRef, recordAttempt, resetPerformance } =
    useGamePerformanceTracker();
  const { playSound } = useSound();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
    initialLives: INITIAL_LIVES,
    getPerformanceSnapshot: () => performanceRef.current,
  });
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { dismissFeedback, feedbackState, showFeedback } = feedback;
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [userRightPan, setUserRightPan] = useState<PanContent>({});
  const [showWeights, setShowWeights] = useState(false);

  const clearActionTimeout = useCallback(() => {
    if (actionTimeoutRef.current !== null) {
      window.clearTimeout(actionTimeoutRef.current);
      actionTimeoutRef.current = null;
    }
  }, []);

  const getResponseMs = useCallback(
    () => (attemptStartedAtRef.current > 0 ? Math.round(performance.now() - attemptStartedAtRef.current) : null),
    [],
  );

  const setupLevel = useCallback(
    (level: number) => {
      clearActionTimeout();
      roundLevelRef.current = level;
      attemptStartedAtRef.current = performance.now();
      setLevelData(generateLevel(level));
      setUserRightPan({});
      setShowWeights(false);
    },
    [clearActionTimeout],
  );

  useEffect(() => clearActionTimeout, [clearActionTimeout]);

  useEffect(() => {
    if (engine.phase === "playing") {
      if (!levelData || roundLevelRef.current !== engine.level) {
        setupLevel(engine.level);
      }
      return;
    }

    clearActionTimeout();
    roundLevelRef.current = null;
    attemptStartedAtRef.current = 0;

    if (engine.phase === "welcome") {
      setLevelData(null);
      setUserRightPan({});
      setShowWeights(false);
      resetPerformance();
    }
  }, [clearActionTimeout, engine.level, engine.phase, levelData, resetPerformance, setupLevel]);

  const handleCheckAnswer = useCallback(() => {
    if (!levelData || feedbackState || engine.phase !== "playing") {
      return;
    }

    const isCorrect =
      calculatePanWeight(levelData.question.left, levelData.weights) ===
      calculatePanWeight(userRightPan, levelData.weights);
    const willGameOver = !isCorrect && engine.lives <= 1;
    recordAttempt({ isCorrect, responseMs: getResponseMs() });
    playSound(isCorrect ? "correct" : "incorrect");
    showFeedback(isCorrect);

    if (isCorrect) {
      engine.addScore(calculateVisualAlgebraScore(engine.level));
    } else {
      engine.loseLife();
    }

    clearActionTimeout();
    actionTimeoutRef.current = window.setTimeout(() => {
      dismissFeedback();

      if (isCorrect) {
        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
          playSound("success");
        } else {
          engine.nextLevel();
          playSound("slide");
        }
        return;
      }

      if (!willGameOver) {
        setUserRightPan({});
        attemptStartedAtRef.current = performance.now();
        playSound("pop");
      }
    }, FEEDBACK_DURATION_MS);
  }, [
    clearActionTimeout,
    dismissFeedback,
    engine,
    feedbackState,
    getResponseMs,
    levelData,
    playSound,
    recordAttempt,
    showFeedback,
    userRightPan,
  ]);

  const handleAddShape = useCallback(
    (shape: ShapeType) => {
      if (engine.phase === "playing" && !feedbackState) {
        setUserRightPan((current) => ({
          ...current,
          [shape]: (current[shape] ?? 0) + 1,
        }));
        playSound("pop");
      }
    },
    [engine.phase, feedbackState, playSound],
  );

  const handleRemoveShape = useCallback(
    (shape: ShapeType) => {
      if (engine.phase !== "playing" || feedbackState || !userRightPan[shape]) {
        return;
      }

      setUserRightPan((current) => {
        const nextCount = (current[shape] ?? 0) - 1;

        if (nextCount <= 0) {
          const next = { ...current };
          delete next[shape];
          return next;
        }

        return { ...current, [shape]: nextCount };
      });
      playSound("pop");
    },
    [engine.phase, feedbackState, playSound, userRightPan],
  );

  const handleResetPan = useCallback(() => {
    if (!feedbackState) {
      setUserRightPan({});
      playSound("slide");
    }
  }, [feedbackState, playSound]);

  const toggleWeights = useCallback(() => {
    setShowWeights((current) => !current);
  }, []);

  return {
    availableShapes: getShapesForLevel(engine.level),
    engine,
    feedback,
    handleAddShape,
    handleCheckAnswer,
    handleRemoveShape,
    handleResetPan,
    levelData,
    showWeights,
    toggleWeights,
    userRightPan,
  };
};
