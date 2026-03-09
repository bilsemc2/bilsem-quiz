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
  calculateWordHuntScore,
  createRound,
  evaluateRound,
  toggleSelectedItem,
} from "./logic";
import type { InternalPhase, WordHuntRound } from "./types";

export const useWordHuntController = () => {
  const animationFrameRef = useRef<number | null>(null);
  const exposureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playStartedAtRef = useRef(0);
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

  const [round, setRound] = useState<WordHuntRound | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [roundTimeLeft, setRoundTimeLeft] = useState(0);
  const [internalPhase, setInternalPhase] =
    useState<InternalPhase>("exposure");

  const clearRoundTimer = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const clearExposureTimer = useCallback(() => {
    if (exposureTimeoutRef.current) {
      clearTimeout(exposureTimeoutRef.current);
      exposureTimeoutRef.current = null;
    }
  }, []);

  const clearTimers = useCallback(() => {
    clearRoundTimer();
    clearExposureTimer();
  }, [clearExposureTimer, clearRoundTimer]);

  const getResponseMs = useCallback(() => {
    return playStartedAtRef.current > 0
      ? Date.now() - playStartedAtRef.current
      : null;
  }, []);

  const setupRound = useCallback(
    (level: number) => {
      clearTimers();
      const nextRound = createRound(level);
      setRound(nextRound);
      setSelectedIds(new Set());
      setRoundTimeLeft(nextRound.config.roundDur);
      setInternalPhase("exposure");
      playStartedAtRef.current = 0;
      playSound("slide");

      exposureTimeoutRef.current = safeTimeout(() => {
        exposureTimeoutRef.current = null;
        setInternalPhase("playing");
        playStartedAtRef.current = Date.now();
        playSound("pop");
      }, nextRound.config.flash * 1000);
    },
    [clearTimers, playSound, safeTimeout],
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
      setSelectedIds(new Set());
      setRoundTimeLeft(0);
      setInternalPhase("exposure");
      playStartedAtRef.current = 0;
      resetPerformance();
      return;
    }

    if (engine.phase !== "playing") {
      clearTimers();
      setRound(null);
      setSelectedIds(new Set());
      setRoundTimeLeft(0);
      setInternalPhase("exposure");
      playStartedAtRef.current = 0;
    }
  }, [clearTimers, engine.level, engine.phase, resetPerformance, round, setupRound]);

  const finishRound = useCallback(() => {
    if (!round || engine.phase !== "playing") {
      return;
    }

    clearRoundTimer();
    const result = evaluateRound(round.items, selectedIds);
    const willGameOver = !result.isSuccess && engine.lives <= 1;
    recordAttempt({ isCorrect: result.isSuccess, responseMs: getResponseMs() });
    feedback.showFeedback(result.isSuccess);
    playSound(result.isSuccess ? "correct" : "incorrect");

    if (result.isSuccess) {
      engine.addScore(
        calculateWordHuntScore(
          engine.level,
          result.correctSelections,
          result.incorrectSelections,
        ),
      );
    } else {
      engine.loseLife();
    }

    safeTimeout(() => {
      feedback.dismissFeedback();

      if (result.isSuccess) {
        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
          playSound("success");
          return;
        }

        engine.nextLevel();
        setupRound(engine.level + 1);
        return;
      }

      if (!willGameOver) {
        setupRound(engine.level);
      }
    }, FEEDBACK_DURATION_MS);
  }, [
    clearRoundTimer,
    engine,
    feedback,
    getResponseMs,
    playSound,
    recordAttempt,
    round,
    safeTimeout,
    selectedIds,
    setupRound,
  ]);

  useEffect(() => {
    if (
      engine.phase !== "playing" ||
      !round ||
      internalPhase !== "playing" ||
      feedback.feedbackState
    ) {
      return;
    }

    const tick = () => {
      const remainingTime = Math.max(
        0,
        round.config.roundDur - (Date.now() - playStartedAtRef.current) / 1000,
      );
      setRoundTimeLeft(remainingTime);

      if (remainingTime <= 0) {
        finishRound();
        return;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return clearRoundTimer;
  }, [
    clearRoundTimer,
    engine.phase,
    feedback.feedbackState,
    finishRound,
    internalPhase,
    round,
  ]);

  const handleToggle = useCallback(
    (id: string) => {
      if (
        engine.phase !== "playing" ||
        internalPhase !== "playing" ||
        feedback.feedbackState ||
        !round
      ) {
        return;
      }

      let didChange = false;
      setSelectedIds((current) => {
        const next = toggleSelectedItem(current, id, round.maxSelections);
        didChange = next !== current;
        return next;
      });

      if (didChange) {
        playSound("pop");
      }
    },
    [engine.phase, feedback.feedbackState, internalPhase, playSound, round],
  );

  return {
    engine,
    feedback,
    round,
    selectedIds,
    roundTimeLeft,
    internalPhase,
    handleToggle,
  };
};
