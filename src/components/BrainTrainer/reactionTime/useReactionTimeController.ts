import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";
import { useGameEngine } from "../shared/useGameEngine";
import {
  GAME_ID,
  INITIAL_LIVES,
  MAX_LEVEL,
  TARGET_COLOR,
  TIME_LIMIT,
} from "./constants";
import {
  addReactionTime,
  buildReactionFeedbackMessage,
  calculateReactionScore,
  createEmptyReactionMetrics,
  getBackNavigation,
  getRoundColor,
  getSelectiveWaitTime,
  shouldWaitForTarget,
} from "./logic";
import type { GameMode, ReactionMetrics, RoundState } from "./types";

export const useReactionTimeController = () => {
  const safeTimeout = useSafeTimeout();
  const location = useLocation();
  const {
    performance: gamePerformance,
    performanceRef,
    recordAttempt,
    resetPerformance,
  } = useGamePerformanceTracker();
  const engine = useGameEngine({
    gameId: GAME_ID,
    timeLimit: TIME_LIMIT,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    disableAutoStart: true,
    getPerformanceSnapshot: () => performanceRef.current,
  });
  const {
    phase,
    level,
    lives,
    addScore,
    loseLife,
    nextLevel,
    setGamePhase,
    handleStart,
    examMode,
  } = engine;
  const feedback = useGameFeedback({ duration: 1000 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [gameMode, setGameMode] = useState<GameMode>("simple");
  const [roundState, setRoundState] = useState<RoundState>("waiting");
  const [currentColor, setCurrentColor] = useState<string>(TARGET_COLOR);
  const [currentReactionTime, setCurrentReactionTime] = useState<number | null>(
    null,
  );
  const [reactionMetrics, setReactionMetrics] = useState<ReactionMetrics>(
    createEmptyReactionMetrics(),
  );

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTimeRef = useRef(0);
  const phaseRef = useRef(phase);

  const clearRoundTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const clearTransitionTimeout = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

  const clearAllTimeouts = useCallback(() => {
    clearRoundTimeout();
    clearTransitionTimeout();
  }, [clearRoundTimeout, clearTransitionTimeout]);

  const resetSessionState = useCallback(
    (nextMode: GameMode = "simple") => {
      setGameMode(nextMode);
      setRoundState("waiting");
      setCurrentColor(TARGET_COLOR);
      setCurrentReactionTime(null);
      setReactionMetrics(createEmptyReactionMetrics());
      resetPerformance();
      clearAllTimeouts();
    },
    [clearAllTimeouts, resetPerformance],
  );

  const scheduleTransition = useCallback(
    (onContinue: () => void) => {
      clearTransitionTimeout();
      transitionTimeoutRef.current = safeTimeout(() => {
        dismissFeedback();
        onContinue();
      }, 1200);
    },
    [clearTransitionTimeout, dismissFeedback, safeTimeout],
  );

  const startRound = useCallback(() => {
    setRoundState("waiting");
    setCurrentReactionTime(null);
    clearRoundTimeout();

    timeoutRef.current = safeTimeout(() => {
      if (phaseRef.current !== "playing") {
        return;
      }

      setRoundState("ready");
      setCurrentColor(getRoundColor(gameMode));
      timeoutRef.current = safeTimeout(() => {
        if (phaseRef.current !== "playing") {
          return;
        }

        setRoundState("go");
        roundStartTimeRef.current = performance.now();
      }, 300 + Math.random() * 500);
    }, 1500 + Math.random() * 2500);
  }, [clearRoundTimeout, gameMode, safeTimeout]);

  const startCustomGame = useCallback(
    (mode: GameMode) => {
      resetSessionState(mode);
      handleStart();
    },
    [handleStart, resetSessionState],
  );

  const resetToWelcome = useCallback(() => {
    resetSessionState();
    setGamePhase("welcome");
  }, [resetSessionState, setGamePhase]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (
      phase === "playing" &&
      roundState === "waiting" &&
      gamePerformance.attempts === 0 &&
      !timeoutRef.current
    ) {
      startRound();
    }
  }, [gamePerformance.attempts, phase, roundState, startRound]);

  useEffect(() => clearAllTimeouts, [clearAllTimeouts]);

  useEffect(() => {
    if (phase === "game_over" || phase === "victory") {
      dismissFeedback();
      clearAllTimeouts();
    }
  }, [clearAllTimeouts, dismissFeedback, phase]);

  const handleClick = useCallback(() => {
    if (phase !== "playing" || feedbackState) {
      return;
    }

    if (roundState === "waiting" || roundState === "ready") {
      setRoundState("early");
      showFeedback(
        false,
        buildReactionFeedbackMessage({
          gameMode,
          isCorrect: false,
          roundState,
          reactionTime: null,
          currentColor,
        }),
      );
      recordAttempt({ isCorrect: false, responseMs: null });
      loseLife();
      clearAllTimeouts();
      scheduleTransition(() => {
        if (lives > 1) {
          startRound();
        }
      });
      return;
    }

    if (roundState !== "go") {
      return;
    }

    const reactionTime = Math.round(performance.now() - roundStartTimeRef.current);
    setCurrentReactionTime(reactionTime);

    if (shouldWaitForTarget(gameMode, currentColor, TARGET_COLOR)) {
      setRoundState("result");
      showFeedback(
        false,
        buildReactionFeedbackMessage({
          gameMode,
          isCorrect: false,
          roundState: "go",
          reactionTime,
          currentColor,
        }),
      );
      recordAttempt({ isCorrect: false, responseMs: reactionTime });
      loseLife();
      scheduleTransition(() => {
        if (lives > 1) {
          startRound();
        }
      });
      return;
    }

    setRoundState("result");
    showFeedback(
      true,
      buildReactionFeedbackMessage({
        gameMode,
        isCorrect: true,
        roundState: "result",
        reactionTime,
        currentColor,
      }),
    );
    const nextPerformance = recordAttempt({
      isCorrect: true,
      responseMs: reactionTime,
    });
    setReactionMetrics((currentMetrics) =>
      addReactionTime(currentMetrics, reactionTime),
    );
    addScore(calculateReactionScore(reactionTime, nextPerformance.streakCorrect));
    scheduleTransition(() => {
      if (level >= MAX_LEVEL) {
        setGamePhase("victory");
      } else {
        nextLevel();
        startRound();
      }
    });
  }, [
    addScore,
    clearAllTimeouts,
    currentColor,
    feedbackState,
    gameMode,
    level,
    lives,
    loseLife,
    nextLevel,
    phase,
    recordAttempt,
    roundState,
    scheduleTransition,
    setGamePhase,
    showFeedback,
    startRound,
  ]);

  const handleWait = useCallback(() => {
    if (
      phase !== "playing" ||
      gameMode !== "selective" ||
      roundState !== "go" ||
      feedbackState ||
      !shouldWaitForTarget(gameMode, currentColor, TARGET_COLOR)
    ) {
      return;
    }

    setRoundState("result");
    setCurrentReactionTime(null);
    showFeedback(
      true,
      buildReactionFeedbackMessage({
        gameMode,
        isCorrect: true,
        roundState: "result",
        reactionTime: null,
        currentColor,
      }),
    );
    const nextPerformance = recordAttempt({ isCorrect: true, responseMs: null });
    addScore(75 + nextPerformance.streakCorrect * 5);
    scheduleTransition(() => {
      if (level >= MAX_LEVEL) {
        setGamePhase("victory");
      } else {
        nextLevel();
        startRound();
      }
    });
  }, [
    addScore,
    currentColor,
    feedbackState,
    gameMode,
    level,
    nextLevel,
    phase,
    recordAttempt,
    roundState,
    scheduleTransition,
    setGamePhase,
    showFeedback,
    startRound,
  ]);

  useEffect(() => {
    if (gameMode !== "selective" || roundState !== "go") {
      return;
    }

    const timeout = safeTimeout(() => {
      if (roundState === "go") {
        handleWait();
      }
    }, getSelectiveWaitTime(level));

    return () => clearTimeout(timeout);
  }, [gameMode, handleWait, level, roundState, safeTimeout]);

  return {
    engine,
    feedback,
    gameMode,
    roundState,
    currentColor,
    currentReactionTime,
    reactionMetrics,
    gamePerformance,
    navigation: getBackNavigation(examMode, Boolean(location.state?.arcadeMode)),
    startCustomGame,
    handleClick,
    resetToWelcome,
  };
};
