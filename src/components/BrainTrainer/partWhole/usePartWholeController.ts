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
  SKIP_PENALTY,
  TIME_LIMIT,
} from "./constants";
import { createRound, getRoundScore } from "./logic";
import type { GameOption, PatternLayer, TargetPosition } from "./types";

export const usePartWholeController = () => {
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
  const { addScore, level, lives, loseLife, nextLevel, phase } = engine;
  const { dismissFeedback, feedbackState, showFeedback } = feedback;

  const [gamePattern, setGamePattern] = useState<PatternLayer[]>([]);
  const [options, setOptions] = useState<GameOption[]>([]);
  const [targetPos, setTargetPos] = useState<TargetPosition>({ x: 0, y: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const getResponseMs = useCallback(() => {
    return roundStartedAtRef.current > 0
      ? Date.now() - roundStartedAtRef.current
      : null;
  }, []);

  const setupRound = useCallback((nextLevelNumber: number) => {
    const round = createRound(nextLevelNumber);
    setGamePattern(round.gamePattern);
    setOptions(round.options);
    setTargetPos(round.targetPos);
    setSelectedAnswer(null);
    roundStartedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (phase === "playing" && options.length === 0) {
      setupRound(level);
      playSound("slide");
      return;
    }

    if (phase === "welcome") {
      setGamePattern([]);
      setOptions([]);
      setSelectedAnswer(null);
      roundStartedAtRef.current = 0;
      resetPerformance();
      return;
    }

    if (phase !== "playing") {
      setSelectedAnswer(null);
    }
  }, [level, options.length, phase, playSound, resetPerformance, setupRound]);

  const handleAnswer = useCallback(
    (option: GameOption, index: number) => {
      if (
        phase !== "playing" ||
        options.length === 0 ||
        selectedAnswer !== null ||
        feedbackState
      ) {
        return;
      }

      const isCorrect = option.isCorrect;
      setSelectedAnswer(index);
      recordAttempt({ isCorrect, responseMs: getResponseMs() });
      showFeedback(isCorrect);
      playSound(isCorrect ? "correct" : "wrong");

      safeTimeout(() => {
        dismissFeedback();

        if (isCorrect) {
          addScore(getRoundScore(level));
          nextLevel();

          if (level < MAX_LEVEL) {
            setupRound(level + 1);
          }

          return;
        }

        const canRetry = lives > 1;
        loseLife();

        if (canRetry) {
          setupRound(level);
        }
      }, FEEDBACK_DURATION_MS);
    },
    [
      addScore,
      dismissFeedback,
      feedbackState,
      getResponseMs,
      level,
      lives,
      loseLife,
      nextLevel,
      options.length,
      phase,
      playSound,
      recordAttempt,
      safeTimeout,
      selectedAnswer,
      setupRound,
      showFeedback,
    ],
  );

  const skipQuestion = useCallback(() => {
    if (phase !== "playing" || selectedAnswer !== null || feedbackState) {
      return;
    }

    addScore(SKIP_PENALTY);
    playSound("click");
    setupRound(level);
  }, [addScore, feedbackState, level, phase, playSound, selectedAnswer, setupRound]);

  return {
    engine,
    feedback,
    gamePattern,
    options,
    targetPos,
    selectedAnswer,
    handleAnswer,
    skipQuestion,
  };
};
