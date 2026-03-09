import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker";
import { useSound } from "../../../hooks/useSound";
import { useGameEngine } from "../shared/useGameEngine";
import {
  FEEDBACK_DURATION_MS,
  GAME_ID,
  HIDDEN_PHASE_DELAY_MS,
  INITIAL_LIVES,
  MAX_LEVEL,
  TIME_LIMIT,
} from "./constants";
import {
  calculateMatrixEchoScore,
  createQuestion,
  generateCells,
  getMemorizeTime,
  isMaxLevel,
} from "./logic";
import type {
  MatrixEchoCell,
  MatrixEchoQuestion,
  MatrixEchoSubPhase,
} from "./types";

export const useMatrixEchoController = () => {
  const actionTimeoutRef = useRef<number | null>(null);
  const hiddenTimeoutRef = useRef<number | null>(null);
  const memorizeTimeoutRef = useRef<number | null>(null);
  const pendingLevelRef = useRef<number | null>(null);
  const questionStartedAtRef = useRef(0);
  const { performanceRef, recordAttempt, resetPerformance } =
    useGamePerformanceTracker();
  const { playSound } = useSound();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
    getPerformanceSnapshot: () => performanceRef.current,
  });
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { dismissFeedback, feedbackState, showFeedback } = feedback;
  const { addScore, level, lives, loseLife, nextLevel, phase, setGamePhase } =
    engine;

  const [cells, setCells] = useState<MatrixEchoCell[]>([]);
  const [question, setQuestion] = useState<MatrixEchoQuestion | null>(null);
  const [subPhase, setSubPhase] = useState<MatrixEchoSubPhase>("idle");

  const clearActionTimeout = useCallback(() => {
    if (actionTimeoutRef.current !== null) {
      window.clearTimeout(actionTimeoutRef.current);
      actionTimeoutRef.current = null;
    }
  }, []);

  const clearHiddenTimeout = useCallback(() => {
    if (hiddenTimeoutRef.current !== null) {
      window.clearTimeout(hiddenTimeoutRef.current);
      hiddenTimeoutRef.current = null;
    }
  }, []);

  const clearMemorizeTimeout = useCallback(() => {
    if (memorizeTimeoutRef.current !== null) {
      window.clearTimeout(memorizeTimeoutRef.current);
      memorizeTimeoutRef.current = null;
    }
  }, []);

  const clearScheduledActions = useCallback(() => {
    clearActionTimeout();
    clearHiddenTimeout();
    clearMemorizeTimeout();
  }, [clearActionTimeout, clearHiddenTimeout, clearMemorizeTimeout]);

  const getResponseMs = useCallback(() => {
    return questionStartedAtRef.current > 0
      ? Date.now() - questionStartedAtRef.current
      : null;
  }, []);

  const resetRoundState = useCallback(() => {
    pendingLevelRef.current = null;
    questionStartedAtRef.current = 0;
    setCells([]);
    setQuestion(null);
    setSubPhase("idle");
  }, []);

  const startRound = useCallback(
    (roundLevel: number) => {
      clearScheduledActions();

      const nextCells = generateCells(roundLevel);

      pendingLevelRef.current = roundLevel;
      questionStartedAtRef.current = 0;
      setCells(nextCells);
      setQuestion(null);
      setSubPhase("memorize");
      playSound("slide");

      memorizeTimeoutRef.current = window.setTimeout(() => {
        memorizeTimeoutRef.current = null;
        setSubPhase("hidden");

        hiddenTimeoutRef.current = window.setTimeout(() => {
          hiddenTimeoutRef.current = null;
          setQuestion(createQuestion(nextCells, roundLevel));
          setSubPhase("question");
          questionStartedAtRef.current = Date.now();
        }, HIDDEN_PHASE_DELAY_MS);
      }, getMemorizeTime(roundLevel));
    },
    [clearScheduledActions, playSound],
  );

  useEffect(() => clearScheduledActions, [clearScheduledActions]);

  useEffect(() => {
    if (phase === "playing") {
      if (pendingLevelRef.current !== level || subPhase === "idle") {
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
    subPhase,
  ]);

  const handleAnswer = useCallback(
    (selected: number) => {
      if (
        phase !== "playing" ||
        subPhase !== "question" ||
        feedbackState ||
        !question
      ) {
        return;
      }

      const isCorrect = selected === question.answer;
      const willGameOver = !isCorrect && lives <= 1;

      recordAttempt({ isCorrect, responseMs: getResponseMs() });
      showFeedback(isCorrect);
      playSound(isCorrect ? "correct" : "incorrect");
      clearActionTimeout();

      actionTimeoutRef.current = window.setTimeout(() => {
        actionTimeoutRef.current = null;
        dismissFeedback();

        if (isCorrect) {
          addScore(calculateMatrixEchoScore(level));

          if (isMaxLevel(level)) {
            setGamePhase("victory");
            playSound("success");
            return;
          }

          nextLevel();
          startRound(level + 1);
          return;
        }

        loseLife();

        if (willGameOver) {
          return;
        }

        startRound(level);
      }, FEEDBACK_DURATION_MS);
    },
    [
      addScore,
      clearActionTimeout,
      dismissFeedback,
      feedbackState,
      getResponseMs,
      level,
      lives,
      loseLife,
      nextLevel,
      phase,
      playSound,
      question,
      recordAttempt,
      setGamePhase,
      showFeedback,
      startRound,
      subPhase,
    ],
  );

  return {
    cells,
    engine,
    feedback,
    handleAnswer,
    isLocked: Boolean(feedbackState) || phase !== "playing",
    question,
    subPhase,
  };
};
