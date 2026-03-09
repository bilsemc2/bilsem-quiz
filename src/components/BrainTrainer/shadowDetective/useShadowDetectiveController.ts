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
  calculateShadowDetectiveScore,
  createRound,
} from "./logic";
import type { RoundStatus, ShadowDetectiveRound } from "./types";

export const useShadowDetectiveController = () => {
  const decidingStartedAtRef = useRef(0);
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

  const [round, setRound] = useState<ShadowDetectiveRound | null>(null);
  const [roundStatus, setRoundStatus] = useState<RoundStatus>("preview");
  const [previewTimer, setPreviewTimer] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const getResponseMs = useCallback(() => {
    return decidingStartedAtRef.current > 0
      ? Date.now() - decidingStartedAtRef.current
      : null;
  }, []);

  const setupRound = useCallback(
    (level: number) => {
      const nextRound = createRound(level);
      setRound(nextRound);
      setRoundStatus("preview");
      setPreviewTimer(nextRound.previewSeconds);
      setSelectedIndex(null);
      decidingStartedAtRef.current = 0;
      playSound("pop");
    },
    [playSound],
  );

  useEffect(() => {
    if (engine.phase === "playing" && !round) {
      setupRound(engine.level);
      return;
    }

    if (engine.phase === "welcome") {
      setRound(null);
      setRoundStatus("preview");
      setPreviewTimer(0);
      setSelectedIndex(null);
      decidingStartedAtRef.current = 0;
      resetPerformance();
      return;
    }

    if (engine.phase !== "playing") {
      setRound(null);
      setSelectedIndex(null);
      setRoundStatus("preview");
      setPreviewTimer(0);
      decidingStartedAtRef.current = 0;
    }
  }, [engine.level, engine.phase, resetPerformance, round, setupRound]);

  useEffect(() => {
    if (
      engine.phase !== "playing" ||
      !round ||
      roundStatus !== "preview" ||
      previewTimer <= 0
    ) {
      return;
    }

    const timeoutId = safeTimeout(() => {
      setPreviewTimer((current) => {
        const nextValue = Math.max(0, current - 1);

        if (nextValue === 0) {
          playSound("pop");
        }

        return nextValue;
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [engine.phase, playSound, previewTimer, round, roundStatus, safeTimeout]);

  useEffect(() => {
    if (
      engine.phase !== "playing" ||
      !round ||
      roundStatus !== "preview" ||
      previewTimer !== 0
    ) {
      return;
    }

    setRoundStatus("deciding");
    decidingStartedAtRef.current = Date.now();
    playSound("slide");
  }, [engine.phase, playSound, previewTimer, round, roundStatus]);

  const handleSelect = useCallback(
    (index: number) => {
      if (
        !round ||
        roundStatus !== "deciding" ||
        selectedIndex !== null ||
        feedbackState ||
        engine.phase !== "playing"
      ) {
        return;
      }

      const isCorrect = index === round.correctOptionIndex;
      setSelectedIndex(index);
      recordAttempt({ isCorrect, responseMs: getResponseMs() });
      showFeedback(isCorrect);
      playSound(isCorrect ? "correct" : "incorrect");

      safeTimeout(() => {
        dismissFeedback();

        if (isCorrect) {
          engine.addScore(calculateShadowDetectiveScore(engine.level));

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
    },
    [
      dismissFeedback,
      engine,
      feedbackState,
      getResponseMs,
      playSound,
      recordAttempt,
      round,
      roundStatus,
      safeTimeout,
      selectedIndex,
      setupRound,
      showFeedback,
    ],
  );

  return {
    engine,
    feedback,
    round,
    roundStatus,
    previewTimer,
    selectedIndex,
    handleSelect,
  };
};
