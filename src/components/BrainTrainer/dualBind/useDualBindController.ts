import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";
import { useSound } from "../../../hooks/useSound";
import { useGameEngine } from "../shared/useGameEngine";
import {
  ANSWER_RESULT_DELAY_MS,
  FEEDBACK_DURATION_MS,
  GAME_ID,
  INITIAL_LIVES,
  MAX_LEVEL,
  MEMORIZE_TICK_MS,
  TIME_LIMIT,
} from "./constants";
import {
  calculateDualBindScore,
  createRound,
  getMemorizeCountdown,
  isMaxLevel,
} from "./logic";
import type {
  DualBindQuestion,
  LocalPhase,
  SymbolColor,
} from "./types";

export const useDualBindController = () => {
  const pendingLevelRef = useRef<number | null>(null);
  const questionStartedAtRef = useRef(0);
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
  const {
    addScore,
    level,
    lives,
    loseLife,
    nextLevel,
    phase,
    setGamePhase,
  } = engine;

  const [countdown, setCountdown] = useState(getMemorizeCountdown(1));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [localPhase, setLocalPhase] = useState<LocalPhase>("memorize");
  const [questions, setQuestions] = useState<DualBindQuestion[]>([]);
  const [streak, setStreak] = useState(0);
  const [symbolColors, setSymbolColors] = useState<SymbolColor[]>([]);

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
    return questionStartedAtRef.current > 0
      ? Date.now() - questionStartedAtRef.current
      : null;
  }, []);

  const resetRoundState = useCallback(() => {
    pendingLevelRef.current = null;
    questionStartedAtRef.current = 0;
    setCountdown(getMemorizeCountdown(1));
    setCurrentQuestionIndex(0);
    setLocalPhase("memorize");
    setQuestions([]);
    setSymbolColors([]);
  }, []);

  const startRound = useCallback(
    (roundLevel: number) => {
      clearPendingActions();
      const round = createRound(roundLevel);

      pendingLevelRef.current = roundLevel;
      questionStartedAtRef.current = 0;
      setCountdown(round.countdown);
      setCurrentQuestionIndex(0);
      setLocalPhase("memorize");
      setQuestions(round.questions);
      setSymbolColors(round.symbolColors);
    },
    [clearPendingActions],
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
    if (phase !== "playing" || localPhase !== "memorize") {
      return;
    }

    clearPendingActions();

    if (countdown > 0) {
      scheduleAction(() => {
        setCountdown((currentCountdown) => currentCountdown - 1);
      }, MEMORIZE_TICK_MS);
      return;
    }

    setLocalPhase("question");
    questionStartedAtRef.current = Date.now();
  }, [
    clearPendingActions,
    countdown,
    localPhase,
    phase,
    scheduleAction,
  ]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (
        phase !== "playing" ||
        localPhase !== "question" ||
        feedbackState ||
        questions.length === 0
      ) {
        return;
      }

      const currentQuestion = questions[currentQuestionIndex];

      if (!currentQuestion) {
        return;
      }

      const isCorrect = answer === currentQuestion.correctAnswer;
      const canRetry = lives > 1;
      const nextStreak = isCorrect ? streak + 1 : 0;

      clearPendingActions();
      recordAttempt({ isCorrect, responseMs: getResponseMs() });
      showFeedback(isCorrect);
      playSound(isCorrect ? "correct" : "incorrect");
      setLocalPhase("feedback");

      if (isCorrect) {
        setStreak(nextStreak);
        addScore(calculateDualBindScore(level, nextStreak));

        scheduleAction(() => {
          dismissFeedback();

          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((index) => index + 1);
            setLocalPhase("question");
            questionStartedAtRef.current = Date.now();
            return;
          }

          if (isMaxLevel(level)) {
            setGamePhase("victory");
            return;
          }

          nextLevel();
        }, ANSWER_RESULT_DELAY_MS);
        return;
      }

      setStreak(0);

      scheduleAction(() => {
        dismissFeedback();
        loseLife();

        if (canRetry) {
          startRound(level);
        }
      }, ANSWER_RESULT_DELAY_MS);
    },
    [
      addScore,
      clearPendingActions,
      currentQuestionIndex,
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
      questions,
      recordAttempt,
      scheduleAction,
      setGamePhase,
      showFeedback,
      startRound,
      streak,
    ],
  );

  return {
    countdown,
    currentQuestion: questions[currentQuestionIndex] ?? null,
    engine,
    feedback,
    handleAnswer,
    isLocked:
      Boolean(feedbackState) || localPhase !== "question" || phase !== "playing",
    localPhase,
    symbolColors,
  };
};
