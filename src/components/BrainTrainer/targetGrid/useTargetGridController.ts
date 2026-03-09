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
  calculateTargetGridScore,
  createRound,
  hideAllCards,
  hideCardsAtIndices,
  revealCard,
} from "./logic";
import type { Card } from "./types";

export const useTargetGridController = () => {
  const pendingLevelRef = useRef<number | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);
  const roundStartedAtRef = useRef(0);
  const timeoutIdsRef = useRef<number[]>([]);
  const { performanceRef, recordAttempt, resetPerformance } =
    useGamePerformanceTracker();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
    getPerformanceSnapshot: () => performanceRef.current,
  });
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { dismissFeedback, feedbackState, showFeedback } = feedback;
  const { playSound } = useSound();
  const { addScore, level, lives, loseLife, nextLevel, phase, setGamePhase } = engine;

  const [cards, setCards] = useState<Card[]>([]);
  const [currentSum, setCurrentSum] = useState(0);
  const [isPreview, setIsPreview] = useState(false);
  const [previewTimer, setPreviewTimer] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [targetSum, setTargetSum] = useState(0);

  const clearPreviewTimeout = useCallback(() => {
    if (previewTimeoutRef.current !== null) {
      window.clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
  }, []);

  const clearScheduledActions = useCallback(() => {
    timeoutIdsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    timeoutIdsRef.current = [];
  }, []);

  const scheduleAction = useCallback((callback: () => void, delayMs: number) => {
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
      callback();
    }, delayMs);

    timeoutIdsRef.current = [...timeoutIdsRef.current, timeoutId];
  }, []);

  const getResponseMs = useCallback(() => {
    return roundStartedAtRef.current > 0 ? Date.now() - roundStartedAtRef.current : null;
  }, []);

  const resetRoundState = useCallback(() => {
    pendingLevelRef.current = null;
    roundStartedAtRef.current = 0;
    setCards([]);
    setCurrentSum(0);
    setIsPreview(false);
    setPreviewTimer(0);
    setSelectedIndices([]);
    setTargetSum(0);
  }, []);

  const startRound = useCallback((roundLevel: number) => {
    clearPreviewTimeout();
    clearScheduledActions();

    const round = createRound(roundLevel);
    pendingLevelRef.current = roundLevel;
    roundStartedAtRef.current = 0;
    setCards(round.cards);
    setCurrentSum(0);
    setIsPreview(true);
    setPreviewTimer(round.previewSeconds);
    setSelectedIndices([]);
    setTargetSum(round.targetSum);
  }, [clearPreviewTimeout, clearScheduledActions]);

  useEffect(() => {
    return () => {
      clearPreviewTimeout();
      clearScheduledActions();
    };
  }, [clearPreviewTimeout, clearScheduledActions]);

  useEffect(() => {
    if (phase === "playing") {
      if (pendingLevelRef.current !== level) {
        startRound(level);
      }
      return;
    }

    clearPreviewTimeout();
    clearScheduledActions();
    dismissFeedback();

    if (phase === "welcome") {
      resetRoundState();
      resetPerformance();
      return;
    }

    resetRoundState();
  }, [
    clearPreviewTimeout,
    clearScheduledActions,
    dismissFeedback,
    level,
    phase,
    resetPerformance,
    resetRoundState,
    startRound,
  ]);

  useEffect(() => {
    clearPreviewTimeout();

    if (phase !== "playing" || !isPreview) {
      return;
    }

    if (previewTimer > 0) {
      previewTimeoutRef.current = window.setTimeout(() => {
        setPreviewTimer((currentTimer) => currentTimer - 1);
        playSound("pop");
      }, 1000);

      return clearPreviewTimeout;
    }

    setIsPreview(false);
    setCards((currentCards) => hideAllCards(currentCards));
    playSound("pop");
    roundStartedAtRef.current = Date.now();

    return clearPreviewTimeout;
  }, [clearPreviewTimeout, isPreview, phase, playSound, previewTimer]);

  const handleCard = useCallback((index: number) => {
    if (
      phase !== "playing" ||
      isPreview ||
      feedbackState ||
      cards[index]?.isRevealed ||
      cards[index]?.isSolved
    ) {
      return;
    }

    const card = cards[index];
    if (!card) {
      return;
    }

    const nextSelectedIndices = [...selectedIndices, index];
    const nextSum = currentSum + card.value;
    const canRetry = lives > 1;

    setCurrentSum(nextSum);
    setSelectedIndices(nextSelectedIndices);
    setCards((currentCards) => revealCard(currentCards, index));
    playSound("pop");

    if (nextSum === targetSum) {
      recordAttempt({ isCorrect: true, responseMs: getResponseMs() });
      showFeedback(true);
      playSound("correct");
      addScore(calculateTargetGridScore(level));

      scheduleAction(() => {
        dismissFeedback();

        if (level >= MAX_LEVEL) {
          setGamePhase("victory");
          return;
        }

        nextLevel();
      }, FEEDBACK_DURATION_MS);
      return;
    }

    if (nextSum < targetSum) {
      return;
    }

    recordAttempt({ isCorrect: false, responseMs: getResponseMs() });
    showFeedback(false);
    playSound("incorrect");
    loseLife();

    scheduleAction(() => {
      dismissFeedback();

      if (!canRetry) {
        return;
      }

      setCards((currentCards) => hideCardsAtIndices(currentCards, nextSelectedIndices));
      setCurrentSum(0);
      setSelectedIndices([]);
      roundStartedAtRef.current = Date.now();
    }, FEEDBACK_DURATION_MS);
  }, [
    addScore,
    cards,
    currentSum,
    dismissFeedback,
    feedbackState,
    getResponseMs,
    isPreview,
    level,
    lives,
    loseLife,
    nextLevel,
    phase,
    playSound,
    recordAttempt,
    scheduleAction,
    selectedIndices,
    setGamePhase,
    showFeedback,
    targetSum,
  ]);

  return {
    cards,
    currentSum,
    engine,
    feedback,
    handleCard,
    isPreview,
    previewTimer,
    selectedIndices,
    targetSum,
  };
};
