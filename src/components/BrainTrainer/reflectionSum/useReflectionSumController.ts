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
  SUM_TRANSITION_DELAY_MS,
  TIME_LIMIT,
} from "./constants";
import {
  buildReflectionSumFeedbackMessage,
  calculateReflectionSumScore,
  createRound,
  getDigitsSum,
  getDisplaySpeed,
  isMaxLevel,
  isNextSequenceDigitCorrect,
  isSequenceComplete,
} from "./logic";
import type { ReflectionStatus } from "./types";

export const useReflectionSumController = () => {
  const actionTimeoutRef = useRef<number | null>(null);
  const displayTimeoutRef = useRef<number | null>(null);
  const pendingLevelRef = useRef<number | null>(null);
  const phaseStartedAtRef = useRef(0);
  const { performanceRef, recordAttempt, resetPerformance } =
    useGamePerformanceTracker();
  const { playSound } = useSound();
  const engine = useGameEngine({
    gameId: GAME_ID,
    timeLimit: TIME_LIMIT,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    getPerformanceSnapshot: () => performanceRef.current,
  });
  const { phase, level, lives, timeLeft, addScore, loseLife, nextLevel, setGamePhase } =
    engine;
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [status, setStatus] = useState<ReflectionStatus>("display");
  const [digits, setDigits] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [userSum, setUserSum] = useState("");
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isMirrored, setIsMirrored] = useState(false);

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
    return phaseStartedAtRef.current > 0 ? Date.now() - phaseStartedAtRef.current : null;
  }, []);

  const resetRoundState = useCallback(() => {
    pendingLevelRef.current = null;
    phaseStartedAtRef.current = 0;
    setCurrentIndex(-1);
    setDigits([]);
    setIsMirrored(false);
    setStatus("display");
    setUserSequence([]);
    setUserSum("");
  }, []);

  const startRound = useCallback((roundLevel: number) => {
    const round = createRound(roundLevel);

    pendingLevelRef.current = roundLevel;
    phaseStartedAtRef.current = 0;
    setCurrentIndex(-1);
    setDigits(round.digits);
    setIsMirrored(round.isMirrored);
    setStatus("display");
    setUserSequence([]);
    setUserSum("");
  }, []);

  useEffect(() => clearAllTimeouts, [clearAllTimeouts]);

  useEffect(() => {
    if (phase === "playing") {
      if (pendingLevelRef.current !== level || digits.length === 0) {
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
    digits.length,
    dismissFeedback,
    level,
    phase,
    resetPerformance,
    resetRoundState,
    startRound,
  ]);

  useEffect(() => {
    clearDisplayTimeout();

    if (phase !== "playing" || status !== "display" || digits.length === 0) {
      return;
    }

    if (currentIndex < digits.length - 1) {
      displayTimeoutRef.current = window.setTimeout(() => {
        setCurrentIndex((value) => value + 1);
        playSound("pop");
      }, getDisplaySpeed(level));

      return clearDisplayTimeout;
    }

    displayTimeoutRef.current = window.setTimeout(() => {
      setCurrentIndex(-1);
      setStatus("input_sequence");
      phaseStartedAtRef.current = Date.now();
    }, 1000);

    return clearDisplayTimeout;
  }, [
    clearDisplayTimeout,
    currentIndex,
    digits,
    level,
    phase,
    playSound,
    status,
  ]);

  const handleDigitClick = useCallback((digit: number) => {
    if (status !== "input_sequence" || feedbackState || phase !== "playing") {
      return;
    }

    const nextSequence = [...userSequence, digit];
    setUserSequence(nextSequence);

    if (!isNextSequenceDigitCorrect(digits, userSequence, digit)) {
      const canRetry = lives > 1;
      recordAttempt({ isCorrect: false, responseMs: getResponseMs() });
      playSound("wrong");
      showFeedback(
        false,
        buildReflectionSumFeedbackMessage({
          isCorrect: false,
          level,
          maxLevel: MAX_LEVEL,
          correctSum: null,
          phase: "sequence",
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

    playSound("click");

    if (isSequenceComplete(digits, nextSequence.length)) {
      playSound("success");
      clearActionTimeout();
      actionTimeoutRef.current = window.setTimeout(() => {
        setStatus("input_sum");
        phaseStartedAtRef.current = Date.now();
      }, SUM_TRANSITION_DELAY_MS);
    }
  }, [
    clearActionTimeout,
    digits,
    dismissFeedback,
    feedbackState,
    getResponseMs,
    level,
    lives,
    loseLife,
    phase,
    playSound,
    recordAttempt,
    showFeedback,
    startRound,
    status,
    userSequence,
  ]);

  const handleSumSubmit = useCallback(() => {
    if (status !== "input_sum" || feedbackState || !userSum || phase !== "playing") {
      return;
    }

    const correct = Number.parseInt(userSum, 10) === getDigitsSum(digits);
    const canRetry = lives > 1;

    recordAttempt({ isCorrect: correct, responseMs: getResponseMs() });
    showFeedback(
      correct,
      buildReflectionSumFeedbackMessage({
        isCorrect: correct,
        level,
        maxLevel: MAX_LEVEL,
        correctSum: getDigitsSum(digits),
        phase: "sum",
      }),
    );
    playSound(correct ? "correct" : "wrong");
    clearActionTimeout();

    actionTimeoutRef.current = window.setTimeout(() => {
      dismissFeedback();

      if (correct) {
        addScore(calculateReflectionSumScore(level, timeLeft));

        if (isMaxLevel(level)) {
          setGamePhase("victory");
          playSound("success");
          return;
        }

        nextLevel();
        return;
      }

      loseLife();
      if (canRetry) {
        startRound(level);
      }
    }, FEEDBACK_DURATION_MS);
  }, [
    addScore,
    clearActionTimeout,
    digits,
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
    setGamePhase,
    showFeedback,
    startRound,
    status,
    timeLeft,
    userSum,
  ]);

  return {
    currentIndex,
    digits,
    engine,
    feedback,
    handleDigitClick,
    handleSumSubmit,
    isMirrored,
    setUserSum,
    status,
    userSequence,
    userSum,
  };
};
