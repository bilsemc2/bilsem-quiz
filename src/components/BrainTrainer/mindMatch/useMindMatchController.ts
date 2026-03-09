import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";
import { useSound } from "../../../hooks/useSound";
import { useGameEngine } from "../shared/useGameEngine";
import {
  CORRECT_DELAY_MS,
  FEEDBACK_DURATION_MS,
  GAME_ID,
  INCORRECT_DELAY_MS,
  INITIAL_LIVES,
  MAX_LEVEL,
  TIME_LIMIT,
} from "./constants";
import {
  calculateMindMatchScore,
  evaluatePuzzleSelection,
  generatePuzzle,
  toggleSelectedId,
} from "./logic";
import type { PuzzleData } from "./types";

export const useMindMatchController = () => {
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isChecking, setIsChecking] = useState(false);

  const getResponseMs = useCallback(() => {
    return puzzleStartedAtRef.current > 0
      ? Date.now() - puzzleStartedAtRef.current
      : null;
  }, []);

  const setupPuzzle = useCallback((level: number) => {
    setPuzzle(generatePuzzle(level));
    setSelectedIds(new Set());
    setIsChecking(false);
    puzzleStartedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (engine.phase === "playing" && !puzzle) {
      setupPuzzle(engine.level);
      return;
    }

    if (engine.phase === "welcome") {
      setPuzzle(null);
      setSelectedIds(new Set());
      setIsChecking(false);
      puzzleStartedAtRef.current = 0;
      resetPerformance();
      return;
    }

    if (engine.phase !== "playing") {
      setPuzzle(null);
      setSelectedIds(new Set());
      setIsChecking(false);
      puzzleStartedAtRef.current = 0;
    }
  }, [engine.level, engine.phase, puzzle, resetPerformance, setupPuzzle]);

  const toggleCard = useCallback(
    (id: string) => {
      if (engine.phase !== "playing" || isChecking || feedbackState) {
        return;
      }

      setSelectedIds((current) => toggleSelectedId(current, id));
    },
    [engine.phase, feedbackState, isChecking],
  );

  const checkAnswer = useCallback(() => {
    if (!puzzle || engine.phase !== "playing" || isChecking) {
      return;
    }

    const result = evaluatePuzzleSelection(puzzle, selectedIds);
    setIsChecking(true);
    recordAttempt({ isCorrect: result.isCorrect, responseMs: getResponseMs() });
    showFeedback(result.isCorrect);
    playSound(result.isCorrect ? "correct" : "incorrect");

    if (result.isCorrect) {
      engine.addScore(calculateMindMatchScore(engine.level));

      safeTimeout(() => {
        dismissFeedback();
        setIsChecking(false);

        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
          return;
        }

        engine.nextLevel();
        setupPuzzle(engine.level + 1);
      }, CORRECT_DELAY_MS);

      return;
    }

    const willGameOver = engine.lives <= 1;
    engine.loseLife();

    safeTimeout(() => {
      dismissFeedback();
      setIsChecking(false);
      setSelectedIds(new Set());

      if (!willGameOver) {
        puzzleStartedAtRef.current = Date.now();
      }
    }, INCORRECT_DELAY_MS);
  }, [
    dismissFeedback,
    engine,
    getResponseMs,
    isChecking,
    playSound,
    puzzle,
    recordAttempt,
    safeTimeout,
    selectedIds,
    setupPuzzle,
    showFeedback,
  ]);

  return {
    engine,
    feedback,
    puzzle,
    selectedIds,
    isChecking,
    toggleCard,
    checkAnswer,
  };
};
