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
  appendDigitToCell,
  calculateMathGridScore,
  deleteDigitFromCell,
  findFirstMissingCell,
  generatePuzzle,
  validatePuzzle,
} from "./logic";
import type { ActiveCell, GridMatrix } from "./types";

const EMPTY_TIMEOUTS: number[] = [];

export const useMathGridController = () => {
  const attemptStartedAtRef = useRef(0);
  const pendingLevelRef = useRef<number | null>(null);
  const timeoutIdsRef = useRef<number[]>(EMPTY_TIMEOUTS);
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
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { dismissFeedback, feedbackState, showFeedback } = feedback;
  const { addScore, level, loseLife, nextLevel, phase, setGamePhase } = engine;

  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [grid, setGrid] = useState<GridMatrix>([]);
  const [ruleDescription, setRuleDescription] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const clearScheduledActions = useCallback(() => {
    timeoutIdsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    timeoutIdsRef.current = [];
  }, []);

  const scheduleAction = useCallback(
    (callback: () => void, delayMs: number) => {
      const timeoutId = window.setTimeout(() => {
        timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
        callback();
      }, delayMs);

      timeoutIdsRef.current = [...timeoutIdsRef.current, timeoutId];
    },
    [],
  );

  const getResponseMs = useCallback(() => {
    return attemptStartedAtRef.current > 0 ? Date.now() - attemptStartedAtRef.current : null;
  }, []);

  const resetRoundState = useCallback(() => {
    pendingLevelRef.current = null;
    attemptStartedAtRef.current = 0;
    setActiveCell(null);
    setGrid([]);
    setRuleDescription("");
    setShowErrors(false);
  }, []);

  const startRound = useCallback(
    (roundLevel: number) => {
      clearScheduledActions();
      const puzzle = generatePuzzle(roundLevel);

      pendingLevelRef.current = roundLevel;
      attemptStartedAtRef.current = Date.now();
      setGrid(puzzle.grid);
      setRuleDescription(puzzle.ruleDescription);
      setShowErrors(false);
      setActiveCell(findFirstMissingCell(puzzle.grid));
    },
    [clearScheduledActions],
  );

  useEffect(() => clearScheduledActions, [clearScheduledActions]);

  useEffect(() => {
    if (phase === "playing") {
      if (pendingLevelRef.current !== level) {
        startRound(level);
      }
      return;
    }

    clearScheduledActions();
    dismissFeedback();

    if (phase === "welcome") {
      resetRoundState();
      resetPerformance();
      return;
    }

    resetRoundState();
  }, [
    clearScheduledActions,
    dismissFeedback,
    level,
    phase,
    resetPerformance,
    resetRoundState,
    startRound,
  ]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (phase !== "playing") {
        return;
      }

      const cell = grid[row]?.[col];
      if (!cell?.isMissing) {
        return;
      }

      setActiveCell({ c: col, r: row });
      setShowErrors(false);
      playSound("select");
    },
    [grid, phase, playSound],
  );

  const handleNumberInput = useCallback(
    (digit: string) => {
      if (!activeCell || phase !== "playing") {
        return;
      }

      setGrid((currentGrid) => appendDigitToCell(currentGrid, activeCell, digit));
      setShowErrors(false);
      playSound("pop");
    },
    [activeCell, phase, playSound],
  );

  const handleDelete = useCallback(() => {
    if (!activeCell || phase !== "playing") {
      return;
    }

    setGrid((currentGrid) => deleteDigitFromCell(currentGrid, activeCell));
    setShowErrors(false);
  }, [activeCell, phase]);

  const handleSubmit = useCallback(() => {
    if (phase !== "playing" || feedbackState) {
      return;
    }

    const validation = validatePuzzle(grid);
    if (!validation.anyFilled) {
      return;
    }

    recordAttempt({
      isCorrect: validation.allCorrect,
      responseMs: getResponseMs(),
    });

    if (validation.allCorrect) {
      playSound("correct");
      showFeedback(true);

      scheduleAction(() => {
        dismissFeedback();
        addScore(calculateMathGridScore(level));

        if (level >= MAX_LEVEL) {
          setGamePhase("victory");
          playSound("success");
          return;
        }

        nextLevel();
      }, FEEDBACK_DURATION_MS);
      return;
    }

    if (!validation.anyWrong) {
      return;
    }

    playSound("incorrect");
    showFeedback(false);
    setShowErrors(true);
    loseLife();

    scheduleAction(() => {
      dismissFeedback();
      attemptStartedAtRef.current = Date.now();
    }, FEEDBACK_DURATION_MS);
  }, [
    addScore,
    dismissFeedback,
    feedbackState,
    getResponseMs,
    grid,
    level,
    loseLife,
    nextLevel,
    phase,
    playSound,
    recordAttempt,
    scheduleAction,
    setGamePhase,
    showFeedback,
  ]);

  return {
    activeCell,
    engine,
    feedback,
    grid,
    handleCellClick,
    handleDelete,
    handleNumberInput,
    handleSubmit,
    ruleDescription,
    showErrors,
  };
};
