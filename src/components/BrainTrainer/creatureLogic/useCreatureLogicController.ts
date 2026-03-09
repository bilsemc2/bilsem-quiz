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
  calculateCreatureLogicScore,
  evaluateSelection,
  generateRound,
  toggleCreatureSelection,
} from "./logic";
import type { RoundData } from "./types";

export const useCreatureLogicController = () => {
  const roundStartedAtRef = useRef(0);
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

  const [round, setRound] = useState<RoundData | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const getResponseMs = useCallback(() => {
    return roundStartedAtRef.current > 0
      ? Date.now() - roundStartedAtRef.current
      : null;
  }, []);

  const setupRound = useCallback((level: number) => {
    setRound(generateRound(level));
    setSelectedIds([]);
    roundStartedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (engine.phase === "playing" && !round) {
      setupRound(engine.level);
      return;
    }

    if (engine.phase === "welcome") {
      setRound(null);
      setSelectedIds([]);
      roundStartedAtRef.current = 0;
      resetPerformance();
      return;
    }

    if (engine.phase !== "playing") {
      setRound(null);
      setSelectedIds([]);
      roundStartedAtRef.current = 0;
    }
  }, [engine.level, engine.phase, resetPerformance, round, setupRound]);

  const handleCreatureClick = useCallback(
    (id: number) => {
      if (engine.phase !== "playing" || feedbackState) {
        return;
      }

      playSound("pop");
      setSelectedIds((current) => toggleCreatureSelection(current, id));
    },
    [engine.phase, feedbackState, playSound],
  );

  const handleSubmit = useCallback(() => {
    if (
      !round ||
      engine.phase !== "playing" ||
      selectedIds.length === 0 ||
      feedbackState
    ) {
      return;
    }

    const isCorrect = evaluateSelection(selectedIds, round.targetIds);
    recordAttempt({ isCorrect, responseMs: getResponseMs() });
    showFeedback(isCorrect);
    playSound(isCorrect ? "correct" : "incorrect");

    safeTimeout(() => {
      dismissFeedback();

      if (isCorrect) {
        engine.addScore(calculateCreatureLogicScore(engine.level));

        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
          return;
        }

        engine.nextLevel();
        setupRound(engine.level + 1);
        return;
      }

      const willGameOver = engine.lives <= 1;
      engine.loseLife();

      if (!willGameOver) {
        setupRound(engine.level);
      }
    }, FEEDBACK_DURATION_MS);
  }, [
    dismissFeedback,
    engine,
    feedbackState,
    getResponseMs,
    playSound,
    recordAttempt,
    round,
    safeTimeout,
    selectedIds,
    setupRound,
    showFeedback,
  ]);

  return {
    engine,
    feedback,
    round,
    selectedIds,
    handleCreatureClick,
    handleSubmit,
  };
};
