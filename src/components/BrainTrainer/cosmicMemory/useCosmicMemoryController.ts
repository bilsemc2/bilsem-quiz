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
  buildCosmicMemoryFeedbackMessage,
  calculateCosmicMemoryScore,
  createRound,
  getDisplayTime,
  getExpectedCell,
  getPauseTime,
  isMaxLevel,
  isSequenceComplete,
} from "./logic";
import type { CosmicMemoryRound, LocalPhase } from "./types";

export const useCosmicMemoryController = () => {
  const actionTimeoutRef = useRef<number | null>(null);
  const displayTimeoutRef = useRef<number | null>(null);
  const pendingLevelRef = useRef<number | null>(null);
  const phaseStartedAtRef = useRef(0);
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
  const { phase, level, lives, addScore, loseLife, nextLevel, setGamePhase } =
    engine;
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [localPhase, setLocalPhase] = useState<LocalPhase>("waiting");
  const [round, setRound] = useState<CosmicMemoryRound | null>(null);
  const [displayedCell, setDisplayedCell] = useState<number | null>(null);
  const [userSequence, setUserSequence] = useState<number[]>([]);

  const clearActionTimeout = useCallback(() => {
    if (actionTimeoutRef.current !== null) {
      window.clearTimeout(actionTimeoutRef.current);
      actionTimeoutRef.current = null;
    }
  }, []);

  const clearDisplayTimeout = useCallback(() => {
    if (displayTimeoutRef.current !== null) {
      window.clearTimeout(displayTimeoutRef.current);
      displayTimeoutRef.current = null;
    }
  }, []);

  const clearAllTimeouts = useCallback(() => {
    clearActionTimeout();
    clearDisplayTimeout();
  }, [clearActionTimeout, clearDisplayTimeout]);

  const getResponseMs = useCallback(() => {
    return phaseStartedAtRef.current > 0
      ? Date.now() - phaseStartedAtRef.current
      : null;
  }, []);

  const resetRoundState = useCallback(() => {
    pendingLevelRef.current = null;
    phaseStartedAtRef.current = 0;
    setLocalPhase("waiting");
    setRound(null);
    setDisplayedCell(null);
    setUserSequence([]);
  }, []);

  const startRound = useCallback(
    (roundLevel: number) => {
      clearAllTimeouts();
      pendingLevelRef.current = roundLevel;
      phaseStartedAtRef.current = 0;
      setRound(createRound(roundLevel));
      setLocalPhase("displaying");
      setDisplayedCell(null);
      setUserSequence([]);
    },
    [clearAllTimeouts],
  );

  useEffect(() => clearAllTimeouts, [clearAllTimeouts]);

  useEffect(() => {
    if (phase === "playing") {
      if (pendingLevelRef.current !== level || !round) {
        startRound(level);
      }
      return;
    }

    clearAllTimeouts();
    dismissFeedback();

    if (phase === "welcome") {
      resetRoundState();
      resetPerformance();
      return;
    }

    resetRoundState();
  }, [
    clearAllTimeouts,
    dismissFeedback,
    level,
    phase,
    resetPerformance,
    resetRoundState,
    round,
    startRound,
  ]);

  useEffect(() => {
    clearDisplayTimeout();

    if (phase !== "playing" || localPhase !== "displaying" || !round) {
      return;
    }

    const displayTime = getDisplayTime(level);
    const pauseTime = getPauseTime(level);

    const runStep = (step: number, delay: number) => {
      displayTimeoutRef.current = window.setTimeout(() => {
        if (step >= round.sequence.length) {
          setDisplayedCell(null);
          setLocalPhase("input");
          phaseStartedAtRef.current = Date.now();
          return;
        }

        setDisplayedCell(round.sequence[step]);
        playSound("pop");

        displayTimeoutRef.current = window.setTimeout(() => {
          setDisplayedCell(null);
          runStep(step + 1, pauseTime);
        }, displayTime);
      }, delay);
    };

    runStep(0, displayTime + pauseTime);
    return clearDisplayTimeout;
  }, [clearDisplayTimeout, level, localPhase, phase, playSound, round]);

  const handleCellClick = useCallback(
    (index: number) => {
      if (
        !round ||
        localPhase !== "input" ||
        displayedCell !== null ||
        phase !== "playing" ||
        feedbackState
      ) {
        return;
      }

      const currentStep = userSequence.length;
      const expectedCell = getExpectedCell(round.sequence, currentStep, round.mode);
      const nextUserSequence = [...userSequence, index];

      if (expectedCell !== index) {
        const canRetry = lives > 1;
        recordAttempt({ isCorrect: false, responseMs: getResponseMs() });
        showFeedback(
          false,
          buildCosmicMemoryFeedbackMessage({
            correct: false,
            level,
            maxLevel: MAX_LEVEL,
            mode: round.mode,
          }),
        );
        clearActionTimeout();

        actionTimeoutRef.current = window.setTimeout(() => {
          dismissFeedback();
          loseLife();

          if (canRetry) {
            startRound(level);
          }
        }, FEEDBACK_DURATION_MS);
        return;
      }

      playSound("pop");
      setUserSequence(nextUserSequence);

      if (!isSequenceComplete(round.sequence, nextUserSequence.length)) {
        return;
      }

      recordAttempt({ isCorrect: true, responseMs: getResponseMs() });
      showFeedback(
        true,
        buildCosmicMemoryFeedbackMessage({
          correct: true,
          level,
          maxLevel: MAX_LEVEL,
          mode: round.mode,
        }),
      );
      clearActionTimeout();

      actionTimeoutRef.current = window.setTimeout(() => {
        dismissFeedback();
        addScore(calculateCosmicMemoryScore(level));

        if (isMaxLevel(level)) {
          setGamePhase("victory");
          playSound("success");
          return;
        }

        nextLevel();
      }, FEEDBACK_DURATION_MS);
    },
    [
      addScore,
      clearActionTimeout,
      dismissFeedback,
      displayedCell,
      feedbackState,
      getResponseMs,
      level,
      lives,
      localPhase,
      loseLife,
      nextLevel,
      phase,
      playSound,
      recordAttempt,
      round,
      setGamePhase,
      showFeedback,
      startRound,
      userSequence,
    ],
  );

  return {
    displayedCell,
    engine,
    feedback,
    handleCellClick,
    localPhase,
    round,
    userSequence,
  };
};
