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
import { getResponsiveCanvasSize } from "./layout";
import { createPuzzleForLevel } from "./logic";
import type { PuzzleState } from "./types";

export const usePositionPuzzleController = () => {
  const levelStartedAtRef = useRef(0);
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

  const [canvasSize, setCanvasSize] = useState(300);
  const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const getResponseMs = useCallback(() => {
    return levelStartedAtRef.current > 0 ? Date.now() - levelStartedAtRef.current : null;
  }, []);

  const setupLevel = useCallback((level: number) => {
    const nextPuzzle = createPuzzleForLevel(level);
    setPuzzle(nextPuzzle);
    setSelectedId(null);
    levelStartedAtRef.current = nextPuzzle ? Date.now() : 0;
  }, []);

  useEffect(() => {
    if (engine.phase === "playing" && !puzzle) {
      setupLevel(engine.level);
      return;
    }

    if (engine.phase === "welcome") {
      setPuzzle(null);
      setSelectedId(null);
      resetPerformance();
      levelStartedAtRef.current = 0;
      return;
    }

    if (engine.phase !== "playing") {
      setPuzzle(null);
    }
  }, [engine.level, engine.phase, puzzle, resetPerformance, setupLevel]);

  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize(getResponsiveCanvasSize(window.innerWidth));
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const handleAnswer = useCallback(
    (optionId: number) => {
      if (!puzzle || engine.phase !== "playing" || feedback.feedbackState) {
        return;
      }

      const isCorrect = optionId === puzzle.correctOptionId;
      setSelectedId(optionId);
      recordAttempt({ isCorrect, responseMs: getResponseMs() });
      feedback.showFeedback(isCorrect);
      playSound(isCorrect ? "correct" : "wrong");

      safeTimeout(() => {
        feedback.dismissFeedback();

        if (isCorrect) {
          engine.addScore(20 * engine.level);

          if (engine.level >= MAX_LEVEL) {
            engine.setGamePhase("victory");
            playSound("success");
            return;
          }

          engine.nextLevel();
          setupLevel(engine.level + 1);
          return;
        }

        const willGameOver = engine.lives <= 1;
        engine.loseLife();

        if (willGameOver) {
          playSound("wrong");
          return;
        }

        setupLevel(engine.level);
      }, FEEDBACK_DURATION_MS);
    },
    [
      engine,
      feedback,
      getResponseMs,
      playSound,
      puzzle,
      recordAttempt,
      safeTimeout,
      setupLevel,
    ],
  );

  return {
    engine,
    feedback,
    canvasSize,
    puzzle,
    selectedId,
    handleAnswer,
  };
};
