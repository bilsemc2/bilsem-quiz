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
  appendAnswerDigit,
  createLevelData,
  deleteAnswerDigit,
  getLevelScore,
  isCorrectAnswer,
} from "./logic";
import type { LevelData } from "./types";

export const useShapeAlgebraController = () => {
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
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [userAnswer, setUserAnswer] = useState("");

  const getResponseMs = useCallback(() => {
    return levelStartedAtRef.current > 0
      ? Date.now() - levelStartedAtRef.current
      : null;
  }, []);

  const setupLevel = useCallback((level: number) => {
    setLevelData(createLevelData(level));
    setUserAnswer("");
    levelStartedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (engine.phase === "playing" && !levelData) {
      setupLevel(engine.level);
      return;
    }

    if (engine.phase === "welcome") {
      setLevelData(null);
      setUserAnswer("");
      levelStartedAtRef.current = 0;
      resetPerformance();
      return;
    }

    if (engine.phase !== "playing") {
      setLevelData(null);
    }
  }, [engine.level, engine.phase, levelData, resetPerformance, setupLevel]);

  const handleDigit = useCallback((digit: string) => {
    if (feedbackState) {
      return;
    }

    setUserAnswer((current) => appendAnswerDigit(current, digit));
  }, [feedbackState]);

  const handleDelete = useCallback(() => {
    if (feedbackState) {
      return;
    }

    setUserAnswer((current) => deleteAnswerDigit(current));
  }, [feedbackState]);

  const handleSubmit = useCallback(() => {
    if (
      !levelData ||
      !userAnswer ||
      feedbackState ||
      engine.phase !== "playing"
    ) {
      return;
    }

    const isCorrect = isCorrectAnswer(levelData.question.answer, userAnswer);
    recordAttempt({ isCorrect, responseMs: getResponseMs() });
    playSound(isCorrect ? "correct" : "incorrect");
    showFeedback(isCorrect);

    safeTimeout(() => {
      dismissFeedback();

      if (isCorrect) {
        engine.addScore(getLevelScore(engine.level));

        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
          return;
        }

        engine.nextLevel();
        setupLevel(engine.level + 1);
        return;
      }

      const willGameOver = engine.lives <= 1;
      engine.loseLife();
      setUserAnswer("");

      if (!willGameOver) {
        levelStartedAtRef.current = Date.now();
      }
    }, FEEDBACK_DURATION_MS);
  }, [
    dismissFeedback,
    engine,
    feedbackState,
    getResponseMs,
    levelData,
    playSound,
    recordAttempt,
    safeTimeout,
    setupLevel,
    showFeedback,
    userAnswer,
  ]);

  return {
    engine,
    feedback,
    levelData,
    userAnswer,
    handleDigit,
    handleDelete,
    handleSubmit,
  };
};
