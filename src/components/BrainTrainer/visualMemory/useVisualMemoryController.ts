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
  TRANSITION_DURATION_MS,
} from "./constants";
import {
  calculateVisualMemoryScore,
  createRound,
} from "./logic";
import type { InternalPhase, VisualMemoryRound } from "./types";

export const useVisualMemoryController = () => {
  const animationFrameRef = useRef<number | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const recallStartedAtRef = useRef(0);
  const { performanceRef, recordAttempt, resetPerformance } =
    useGamePerformanceTracker();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
    initialLives: INITIAL_LIVES,
    getPerformanceSnapshot: () => performanceRef.current,
  });
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [internalPhase, setInternalPhase] =
    useState<InternalPhase>("memorize");
  const [round, setRound] = useState<VisualMemoryRound | null>(null);
  const [userSelectedId, setUserSelectedId] = useState<string | null>(null);
  const [memTimeLeft, setMemTimeLeft] = useState(0);
  const [memTimeMax, setMemTimeMax] = useState(0);

  const clearMemorizeAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const clearTransitionTimeout = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

  const clearTimers = useCallback(() => {
    clearMemorizeAnimation();
    clearTransitionTimeout();
  }, [clearMemorizeAnimation, clearTransitionTimeout]);

  const getResponseMs = useCallback(() => {
    return recallStartedAtRef.current > 0
      ? Date.now() - recallStartedAtRef.current
      : null;
  }, []);

  const setupRound = useCallback(
    (level: number) => {
      clearTimers();
      const nextRound = createRound(level);
      setRound(nextRound);
      setInternalPhase("memorize");
      setUserSelectedId(null);
      setMemTimeLeft(nextRound.memorizeMs);
      setMemTimeMax(nextRound.memorizeMs);
      recallStartedAtRef.current = 0;
      playSound("pop");
    },
    [clearTimers, playSound],
  );

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (engine.phase === "playing" && !round) {
      setupRound(engine.level);
      return;
    }

    if (engine.phase === "welcome") {
      clearTimers();
      setRound(null);
      setInternalPhase("memorize");
      setUserSelectedId(null);
      setMemTimeLeft(0);
      setMemTimeMax(0);
      recallStartedAtRef.current = 0;
      resetPerformance();
      return;
    }

    if (engine.phase !== "playing") {
      clearTimers();
      setRound(null);
      setUserSelectedId(null);
      setMemTimeLeft(0);
      setMemTimeMax(0);
      recallStartedAtRef.current = 0;
    }
  }, [clearTimers, engine.level, engine.phase, resetPerformance, round, setupRound]);

  useEffect(() => {
    if (engine.phase !== "playing" || !round || internalPhase !== "memorize") {
      return;
    }

    const startedAt = performance.now();

    const tick = (now: number) => {
      const remainingMs = Math.max(0, round.memorizeMs - (now - startedAt));
      setMemTimeLeft(remainingMs);

      if (remainingMs <= 0) {
        clearMemorizeAnimation();
        setInternalPhase("transition");
        playSound("slide");
        transitionTimeoutRef.current = safeTimeout(() => {
          transitionTimeoutRef.current = null;
          setInternalPhase("recall");
          recallStartedAtRef.current = Date.now();
        }, TRANSITION_DURATION_MS);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return clearMemorizeAnimation;
  }, [
    clearMemorizeAnimation,
    engine.phase,
    internalPhase,
    playSound,
    round,
    safeTimeout,
  ]);

  const handleCellClick = useCallback(
    (id: string) => {
      if (
        !round ||
        internalPhase !== "recall" ||
        feedbackState ||
        engine.phase !== "playing"
      ) {
        return;
      }

      const isCorrect = id === round.targetCellId;
      setUserSelectedId(id);
      recordAttempt({ isCorrect, responseMs: getResponseMs() });
      playSound(isCorrect ? "correct" : "incorrect");
      showFeedback(isCorrect);

      const willGameOver = !isCorrect && engine.lives <= 1;

      if (isCorrect) {
        engine.addScore(calculateVisualMemoryScore(engine.level));
      } else {
        engine.loseLife();
      }

      safeTimeout(() => {
        dismissFeedback();

        if (isCorrect) {
          if (engine.level >= MAX_LEVEL) {
            engine.setGamePhase("victory");
            playSound("success");
            return;
          }

          engine.nextLevel();
          setupRound(engine.level + 1);
          playSound("slide");
          return;
        }

        if (!willGameOver) {
          setupRound(engine.level);
        }
      }, FEEDBACK_DURATION_MS);
    },
    [
      dismissFeedback,
      engine,
      feedbackState,
      getResponseMs,
      internalPhase,
      playSound,
      recordAttempt,
      round,
      safeTimeout,
      setupRound,
      showFeedback,
    ],
  );

  return {
    engine,
    feedback,
    internalPhase,
    round,
    userSelectedId,
    memTimeLeft,
    memTimeMax,
    handleCellClick,
  };
};
