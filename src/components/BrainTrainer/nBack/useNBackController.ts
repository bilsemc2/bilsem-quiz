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
  NEXT_SHAPE_DELAY_MS,
  SHAPE_EXPOSURE_MS,
  TIME_LIMIT,
} from "./constants";
import {
  generateShape,
  getNBackScore,
  getNValueForLevel,
  getRequiredTrialsForLevel,
  isCorrectDecision,
} from "./logic";
import type { ShapeData } from "./types";

export const useNBackController = () => {
  const previousPhaseRef = useRef<ReturnType<typeof useGameEngine>["phase"]>(
    "welcome",
  );
  const decisionShownAtRef = useRef(0);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isGameEndingRef = useRef(false);
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
  const { dismissFeedback, showFeedback } = feedback;
  const { addScore, level, lives, loseLife, nextLevel, phase, setGamePhase } =
    engine;

  const [nValue, setNValue] = useState(getNValueForLevel(1));
  const [history, setHistory] = useState<ShapeData[]>([]);
  const [currentShape, setCurrentShape] = useState<ShapeData | null>(null);
  const [trials, setTrials] = useState(0);

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
    return decisionShownAtRef.current > 0
      ? Date.now() - decisionShownAtRef.current
      : null;
  }, []);

  const resetRoundState = useCallback(() => {
    setNValue(getNValueForLevel(1));
    setHistory([]);
    setCurrentShape(null);
    setTrials(0);
    decisionShownAtRef.current = 0;
  }, []);

  const showNextShape = useCallback(
    (historySnapshot: ShapeData[], nValueSnapshot: number) => {
      const nextShape = generateShape(historySnapshot, nValueSnapshot);
      setCurrentShape(nextShape);
      decisionShownAtRef.current =
        historySnapshot.length >= nValueSnapshot ? Date.now() : 0;

      if (historySnapshot.length < nValueSnapshot) {
        scheduleAction(() => {
          if (isGameEndingRef.current) {
            return;
          }

          const nextHistory = [...historySnapshot, nextShape];
          setHistory(nextHistory);
          setCurrentShape(null);
          showNextShape(nextHistory, nValueSnapshot);
        }, SHAPE_EXPOSURE_MS);
      }
    },
    [scheduleAction],
  );

  const startLevel = useCallback(
    (levelNumber: number) => {
      clearPendingActions();

      const nextNValue = getNValueForLevel(levelNumber);
      setNValue(nextNValue);
      setHistory([]);
      setCurrentShape(null);
      setTrials(0);
      decisionShownAtRef.current = 0;
      showNextShape([], nextNValue);
    },
    [clearPendingActions, showNextShape],
  );

  useEffect(() => clearPendingActions, [clearPendingActions]);

  useEffect(() => {
    const previousPhase = previousPhaseRef.current;

    if (
      phase === "playing" &&
      (previousPhase === "welcome" ||
        previousPhase === "game_over" ||
        previousPhase === "victory")
    ) {
      isGameEndingRef.current = false;
      startLevel(level);
    } else if (phase === "welcome") {
      isGameEndingRef.current = false;
      clearPendingActions();
      resetRoundState();
      resetPerformance();
    } else if (phase === "game_over" || phase === "victory") {
      isGameEndingRef.current = true;
      clearPendingActions();
      decisionShownAtRef.current = 0;
    }

    previousPhaseRef.current = phase;
  }, [
    clearPendingActions,
    level,
    phase,
    resetPerformance,
    resetRoundState,
    startLevel,
  ]);

  const continueRound = useCallback(
    (nextHistory: ShapeData[], nValueSnapshot: number) => {
      setHistory(nextHistory);
      setCurrentShape(null);
      decisionShownAtRef.current = 0;

      scheduleAction(() => {
        if (isGameEndingRef.current) {
          return;
        }

        showNextShape(nextHistory, nValueSnapshot);
      }, NEXT_SHAPE_DELAY_MS);
    },
    [scheduleAction, showNextShape],
  );

  const handleDecision = useCallback(
    (isSame: boolean) => {
      if (
        phase !== "playing" ||
        !currentShape ||
        history.length < nValue ||
        feedback.feedbackState ||
        lives <= 0 ||
        isGameEndingRef.current
      ) {
        return;
      }

      const nextTrials = trials + 1;
      const answerIsCorrect = isCorrectDecision(
        currentShape,
        history,
        nValue,
        isSame,
      );
      const nextHistory = [...history, currentShape];
      const willLevelAdvance =
        answerIsCorrect && nextTrials >= getRequiredTrialsForLevel(level);
      const willGameOver = !answerIsCorrect && lives <= 1;

      setTrials(nextTrials);
      recordAttempt({
        isCorrect: answerIsCorrect,
        responseMs: getResponseMs(),
      });
      showFeedback(answerIsCorrect);
      playSound(answerIsCorrect ? "correct" : "incorrect");

      if (answerIsCorrect) {
        addScore(getNBackScore(level, nValue));
      } else {
        loseLife();
      }

      if (willGameOver) {
        isGameEndingRef.current = true;
        return;
      }

      if (willLevelAdvance) {
        scheduleAction(() => {
          if (isGameEndingRef.current) {
            return;
          }

          dismissFeedback();

          if (level >= MAX_LEVEL) {
            setGamePhase("victory");
            playSound("success");
            return;
          }

          nextLevel();
          startLevel(level + 1);
        }, FEEDBACK_DURATION_MS);

        return;
      }

      scheduleAction(() => {
        if (isGameEndingRef.current) {
          return;
        }

        dismissFeedback();
        continueRound(nextHistory, nValue);
      }, FEEDBACK_DURATION_MS);
    },
    [
      addScore,
      continueRound,
      currentShape,
      dismissFeedback,
      feedback.feedbackState,
      getResponseMs,
      history,
      level,
      lives,
      loseLife,
      nValue,
      nextLevel,
      phase,
      playSound,
      recordAttempt,
      scheduleAction,
      setGamePhase,
      showFeedback,
      startLevel,
      trials,
    ],
  );

  return {
    engine,
    feedback,
    nValue,
    historyLength: history.length,
    currentShape,
    handleDecision,
  };
};
