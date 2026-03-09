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
import { calculateLogicPuzzleScore, createPuzzle } from "./logic";
import type { PuzzleData } from "./types";

export const useLogicPuzzleController = () => {
  const puzzleStartedAtRef = useRef(0);
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

  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const getResponseMs = useCallback(() => {
    return puzzleStartedAtRef.current > 0
      ? Date.now() - puzzleStartedAtRef.current
      : null;
  }, []);

  const setupPuzzle = useCallback(() => {
    setPuzzle(createPuzzle());
    setSelectedIndex(null);
    puzzleStartedAtRef.current = Date.now();
    playSound("slide");
  }, [playSound]);

  useEffect(() => {
    if (engine.phase === "playing" && !puzzle) {
      setupPuzzle();
      return;
    }

    if (engine.phase === "welcome") {
      setPuzzle(null);
      setSelectedIndex(null);
      puzzleStartedAtRef.current = 0;
      resetPerformance();
      return;
    }

    if (engine.phase !== "playing") {
      setPuzzle(null);
      setSelectedIndex(null);
      puzzleStartedAtRef.current = 0;
    }
  }, [engine.phase, puzzle, resetPerformance, setupPuzzle]);

  const handleGuess = useCallback(
    (index: number) => {
      if (
        engine.phase !== "playing" ||
        selectedIndex !== null ||
        !puzzle ||
        feedbackState
      ) {
        return;
      }

      const isCorrect = puzzle.options[index].isCorrect;
      setSelectedIndex(index);
      recordAttempt({ isCorrect, responseMs: getResponseMs() });
      showFeedback(isCorrect);
      playSound(isCorrect ? "correct" : "incorrect");

      safeTimeout(() => {
        dismissFeedback();

        if (isCorrect) {
          engine.addScore(calculateLogicPuzzleScore(engine.level));

          if (engine.level >= MAX_LEVEL) {
            engine.setGamePhase("victory");
            return;
          }

          engine.nextLevel();
          setupPuzzle();
          return;
        }

        const willGameOver = engine.lives <= 1;
        engine.loseLife();

        if (!willGameOver) {
          setupPuzzle();
        }
      }, FEEDBACK_DURATION_MS);
    },
    [
      dismissFeedback,
      engine,
      feedbackState,
      getResponseMs,
      playSound,
      puzzle,
      recordAttempt,
      safeTimeout,
      selectedIndex,
      setupPuzzle,
      showFeedback,
    ],
  );

  return {
    engine,
    feedback,
    puzzle,
    selectedIndex,
    handleGuess,
  };
};
