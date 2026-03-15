import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";
import { useSound } from "../../../hooks/useSound";
import { useGameEngine } from "../shared/useGameEngine";
import {
  BUILDING_PHASE_DELAY_MS,
  FEEDBACK_DURATION_MS,
  GAME_ID,
  INITIAL_LIVES,
  MAX_LEVEL,
  QUESTION_PHASE_DELAY_MS,
  TIME_LIMIT,
} from "./constants";
import {
  buildInvisibleTowerFeedbackMessage,
  calculateInvisibleTowerScore,
  createRound,
  getFlashDelay,
} from "./logic";
import type { InvisibleTowerRound, LocalPhase } from "./types";

export const useInvisibleTowerController = () => {
  const pendingLevelRef = useRef<number | null>(null);
  const questionShownAtRef = useRef(0);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
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
  const { dismissFeedback, feedbackState, showFeedback } = feedback;
  const { addScore, level, lives, loseLife, nextLevel, phase } = engine;

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [localPhase, setLocalPhase] = useState<LocalPhase>("building");
  const [round, setRound] = useState<InvisibleTowerRound | null>(null);
  const [streak, setStreak] = useState(0);

  const clearPendingActions = useCallback(() => {
    timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
  }, []);

  const scheduleAction = useCallback(
    (callback: () => void, delayMs: number) => {
      const timeoutId = safeTimeout(() => {
        timeoutIdsRef.current = timeoutIdsRef.current.filter(
          (trackedId) => trackedId !== timeoutId,
        );
        callback();
      }, delayMs);

      timeoutIdsRef.current.push(timeoutId);
      return timeoutId;
    },
    [safeTimeout],
  );

  const getResponseMs = useCallback(() => {
    return questionShownAtRef.current > 0
      ? Date.now() - questionShownAtRef.current
      : null;
  }, []);

  const resetRoundState = useCallback(() => {
    pendingLevelRef.current = null;
    questionShownAtRef.current = 0;
    setCurrentIndex(-1);
    setLocalPhase("building");
    setRound(null);
  }, []);

  const startRound = useCallback(
    (roundLevel: number) => {
      clearPendingActions();
      setRound(createRound(roundLevel));
      setCurrentIndex(-1);
      setLocalPhase("building");
      pendingLevelRef.current = roundLevel;
      questionShownAtRef.current = 0;
      playSound("detective_mystery");
    },
    [clearPendingActions, playSound],
  );

  useEffect(() => clearPendingActions, [clearPendingActions]);

  useEffect(() => {
    if (phase === "playing") {
      if (pendingLevelRef.current !== level) {
        startRound(level);
      }
      return;
    }

    clearPendingActions();
    dismissFeedback();

    if (phase === "welcome") {
      resetRoundState();
      setStreak(0);
      resetPerformance();
      return;
    }

    resetRoundState();
  }, [
    clearPendingActions,
    dismissFeedback,
    level,
    phase,
    resetPerformance,
    resetRoundState,
    startRound,
  ]);

  useEffect(() => {
    if (phase !== "playing" || !round) {
      return;
    }

    clearPendingActions();

    if (localPhase === "building") {
      scheduleAction(() => {
        setLocalPhase("flashing");
      }, BUILDING_PHASE_DELAY_MS);
      return;
    }

    if (localPhase === "flashing") {
      if (currentIndex < round.tower.length - 1) {
        scheduleAction(() => {
          setCurrentIndex((previousIndex) => previousIndex + 1);
        }, getFlashDelay(level));
        return;
      }

      scheduleAction(() => {
        setLocalPhase("question");
        questionShownAtRef.current = Date.now();
        playSound("complete");
      }, QUESTION_PHASE_DELAY_MS);
    }
  }, [
    clearPendingActions,
    currentIndex,
    level,
    localPhase,
    phase,
    playSound,
    round,
    scheduleAction,
  ]);

  const handleSelect = useCallback(
    (value: number) => {
      if (phase !== "playing" || localPhase !== "question" || feedbackState || !round) {
        return;
      }

      const isCorrect = value === round.correctAnswer;
      const canRetry = lives > 1;
      const nextStreak = isCorrect ? streak + 1 : 0;

      clearPendingActions();
      recordAttempt({ isCorrect, responseMs: getResponseMs() });
      showFeedback(
        isCorrect,
        buildInvisibleTowerFeedbackMessage({
          isCorrect,
          level,
          maxLevel: MAX_LEVEL,
          correctAnswer: round.correctAnswer,
        }),
      );
      playSound(isCorrect ? "correct" : "incorrect");

      if (isCorrect) {
        setStreak(nextStreak);
        addScore(calculateInvisibleTowerScore(level, nextStreak));

        scheduleAction(() => {
          dismissFeedback();
          nextLevel();
        }, QUESTION_PHASE_DELAY_MS);
        return;
      }

      setStreak(0);
      loseLife();

      scheduleAction(() => {
        dismissFeedback();

        if (canRetry) {
          startRound(level);
        }
      }, QUESTION_PHASE_DELAY_MS);
    },
    [
      addScore,
      clearPendingActions,
      dismissFeedback,
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
      scheduleAction,
      showFeedback,
      startRound,
      streak,
    ],
  );

  return {
    currentIndex,
    engine,
    feedback,
    handleSelect,
    isLocked: Boolean(feedbackState),
    localPhase,
    options: round?.options ?? [],
    tower: round?.tower ?? [],
  };
};
