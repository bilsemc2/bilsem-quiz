import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker";
import { useSound } from "../../../hooks/useSound";
import { useGameEngine } from "../shared/useGameEngine";
import type { SoundItem } from "../noiseFilterData.ts";
import {
  FEEDBACK_DURATION_MS,
  GAME_ID,
  INITIAL_LIVES,
  MAX_LEVEL,
  TIME_LIMIT,
} from "./constants.ts";
import {
  calculateNoiseFilterScore,
  createRound,
  isAnswerCorrect,
} from "./logic.ts";
import type { NoiseFilterRound } from "./types.ts";
import { useNoiseFilterAudio } from "./useNoiseFilterAudio";

export const useNoiseFilterController = () => {
  const actionTimeoutRef = useRef<number | null>(null);
  const roundLevelRef = useRef<number | null>(null);
  const roundStartedAtRef = useRef(0);
  const { performanceRef, recordAttempt, resetPerformance } =
    useGamePerformanceTracker();
  const { playSound } = useSound();
  const {
    backgroundVolume,
    playTargetSound,
    resetBackgroundAudio,
    resumeBackgroundAudio,
    setBackgroundVolume,
    stopAllAudio,
    stopTargetAudio,
  } = useNoiseFilterAudio();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
    getPerformanceSnapshot: () => performanceRef.current,
  });
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { dismissFeedback, feedbackState, showFeedback } = feedback;
  const { addScore, level, lives, loseLife, nextLevel, phase } = engine;

  const [currentRound, setCurrentRound] = useState<NoiseFilterRound | null>(null);
  const [selectedOptionName, setSelectedOptionName] = useState<string | null>(
    null,
  );

  const clearActionTimeout = useCallback(() => {
    if (actionTimeoutRef.current !== null) {
      window.clearTimeout(actionTimeoutRef.current);
      actionTimeoutRef.current = null;
    }
  }, []);

  const getResponseMs = useCallback(() => {
    return roundStartedAtRef.current > 0
      ? Date.now() - roundStartedAtRef.current
      : null;
  }, []);

  const startRound = useCallback(
    (roundLevel: number, options?: { delayTarget?: boolean }) => {
      const round = createRound();

      if (!round) {
        return false;
      }

      roundLevelRef.current = roundLevel;
      roundStartedAtRef.current = Date.now();
      setCurrentRound(round);
      setSelectedOptionName(null);
      playTargetSound(round.targetSound, options?.delayTarget ?? true);
      return true;
    },
    [playTargetSound],
  );

  useEffect(() => {
    return () => {
      clearActionTimeout();
      dismissFeedback();
      stopAllAudio();
    };
  }, [clearActionTimeout, dismissFeedback, stopAllAudio]);

  useEffect(() => {
    if (phase === "playing") {
      resumeBackgroundAudio();

      const needsRound = roundLevelRef.current !== level || !currentRound;

      if (needsRound) {
        if (!currentRound) {
          resetBackgroundAudio();
          playSound("click");
        }

        startRound(level);
      }

      return;
    }

    clearActionTimeout();
    dismissFeedback();
    stopAllAudio();

    if (phase === "welcome") {
      roundLevelRef.current = null;
      roundStartedAtRef.current = 0;
      setCurrentRound(null);
      setSelectedOptionName(null);
      resetPerformance();
    }
  }, [
    clearActionTimeout,
    currentRound,
    dismissFeedback,
    level,
    phase,
    playSound,
    resetBackgroundAudio,
    resetPerformance,
    resumeBackgroundAudio,
    startRound,
    stopAllAudio,
  ]);

  useEffect(() => {
    if (phase !== "playing") {
      return;
    }

    window.addEventListener("pointerdown", resumeBackgroundAudio, {
      passive: true,
    });
    window.addEventListener("keydown", resumeBackgroundAudio);

    return () => {
      window.removeEventListener("pointerdown", resumeBackgroundAudio);
      window.removeEventListener("keydown", resumeBackgroundAudio);
    };
  }, [phase, resumeBackgroundAudio]);

  const handleReplayTarget = useCallback(() => {
    if (!currentRound || phase !== "playing") {
      return;
    }

    playTargetSound(currentRound.targetSound);
  }, [currentRound, phase, playTargetSound]);

  const handleOption = useCallback(
    (sound: SoundItem) => {
      if (
        !currentRound ||
        phase !== "playing" ||
        feedbackState ||
        selectedOptionName !== null
      ) {
        return;
      }

      const isCorrect = isAnswerCorrect(sound.name, currentRound);
      const canRetry = lives > 1;

      setSelectedOptionName(sound.name);
      recordAttempt({ isCorrect, responseMs: getResponseMs() });
      showFeedback(isCorrect);
      playSound(isCorrect ? "correct" : "wrong");
      clearActionTimeout();
      stopTargetAudio();

      actionTimeoutRef.current = window.setTimeout(() => {
        dismissFeedback();

        if (isCorrect) {
          addScore(calculateNoiseFilterScore(level));
          nextLevel();
          return;
        }

        loseLife();

        if (canRetry) {
          startRound(level);
        }
      }, FEEDBACK_DURATION_MS);
    },
    [
      addScore,
      clearActionTimeout,
      currentRound,
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
      selectedOptionName,
      showFeedback,
      startRound,
      stopTargetAudio,
    ],
  );

  return {
    engine,
    feedback,
    backgroundVolume,
    currentRound,
    selectedOptionName,
    handleOption,
    handleReplayTarget,
    isInteractionLocked:
      selectedOptionName !== null || Boolean(feedbackState),
    setBackgroundVolume,
  };
};
