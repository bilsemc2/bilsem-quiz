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
  buildNoiseFilterFeedbackMessage,
  calculateNoiseFilterScore,
  createRound,
  isNoiseFilterInteractionLocked,
  resolveNoiseFilterSelection,
} from "./logic.ts";
import type { NoiseFilterRound } from "./types.ts";
import { useNoiseFilterAudio } from "./useNoiseFilterAudio";

export const useNoiseFilterController = () => {
  const roundLevelRef = useRef<number | null>(null);
  const roundStartedAtRef = useRef(0);
  const pendingResolutionRef = useRef<{
    resolution: ReturnType<typeof resolveNoiseFilterSelection>;
    roundLevel: number;
  } | null>(null);
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
  const feedback = useGameFeedback({
    duration: FEEDBACK_DURATION_MS,
    onFeedbackEnd: () => {
      const pendingResolution = pendingResolutionRef.current;
      if (!pendingResolution) {
        return;
      }

      pendingResolutionRef.current = null;

      if (pendingResolution.resolution.shouldAdvanceLevel) {
        addScore(
          pendingResolution.resolution.scoreDelta ||
            calculateNoiseFilterScore(pendingResolution.roundLevel),
        );
        nextLevel();
        return;
      }

      if (pendingResolution.resolution.shouldLoseLife) {
        loseLife();
      }

      if (pendingResolution.resolution.shouldRetryLevel) {
        startRound(pendingResolution.roundLevel);
      }
    },
  });
  const { dismissFeedback, feedbackState, showFeedback } = feedback;
  const { addScore, level, lives, loseLife, nextLevel, phase } = engine;

  const [currentRound, setCurrentRound] = useState<NoiseFilterRound | null>(null);
  const [selectedOptionName, setSelectedOptionName] = useState<string | null>(
    null,
  );

  const getResponseMs = useCallback(() => {
    return roundStartedAtRef.current > 0
      ? Date.now() - roundStartedAtRef.current
      : null;
  }, []);

  const startRound = useCallback(
    (roundLevel: number, options?: { delayTarget?: boolean }) => {
      const round = createRound(roundLevel);

      if (!round) {
        console.warn(
          `[NoiseFilter] createRound(${roundLevel}) returned null — no sounds available`,
        );
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

  const dismissFeedbackRef = useRef(dismissFeedback);
  const stopAllAudioRef = useRef(stopAllAudio);

  useEffect(() => {
    dismissFeedbackRef.current = dismissFeedback;
  }, [dismissFeedback]);

  useEffect(() => {
    stopAllAudioRef.current = stopAllAudio;
  }, [stopAllAudio]);

  useEffect(() => {
    return () => {
      pendingResolutionRef.current = null;
      dismissFeedbackRef.current();
      stopAllAudioRef.current();
    };
  }, []);

  const currentRoundRef = useRef<NoiseFilterRound | null>(null);

  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);

  useEffect(() => {
    if (phase === "playing") {
      resumeBackgroundAudio();

      const needsRound =
        roundLevelRef.current !== level || !currentRoundRef.current;

      if (needsRound) {
        if (!currentRoundRef.current) {
          resetBackgroundAudio();
          playSound("click");
        }

        startRound(level);
      }

      return;
    }

    pendingResolutionRef.current = null;
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

      const resolution = resolveNoiseFilterSelection({
        selectedName: sound.name,
        round: currentRound,
        level,
        lives,
      });
      const isCorrect = resolution.isCorrect;
      const feedbackMessage = buildNoiseFilterFeedbackMessage(
        resolution,
        level,
        MAX_LEVEL,
        lives,
      );
      
      setSelectedOptionName(sound.name);
      recordAttempt({ isCorrect, responseMs: getResponseMs() });
      pendingResolutionRef.current = {
        resolution,
        roundLevel: level,
      };
      showFeedback(isCorrect, feedbackMessage);
      stopTargetAudio();
    },
    [
      currentRound,
      feedbackState,
      getResponseMs,
      level,
      lives,
      phase,
      recordAttempt,
      selectedOptionName,
      showFeedback,
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
    isInteractionLocked: isNoiseFilterInteractionLocked(
      selectedOptionName,
      Boolean(feedbackState),
    ),
    setBackgroundVolume,
  };
};
