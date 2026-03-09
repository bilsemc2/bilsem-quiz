import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker";
import { useSound } from "../../../hooks/useSound";
import { useGameEngine } from "../shared/useGameEngine";
import {
  FEEDBACK_DURATION_MS,
  GAME_ID,
  INITIAL_LIVES,
  MAX_LEVEL,
  TIME_LIMIT,
} from "./constants";
import { calculateDeyimlerScore, createQuestion } from "./logic.ts";
import { fetchDeyimlerRows } from "./repository.ts";
import type { DeyimlerQuestion, DeyimRow } from "./types.ts";

export const useDeyimlerController = () => {
  const actionTimeoutRef = useRef<number | null>(null);
  const loadRequestIdRef = useRef(0);
  const questionStartedAtRef = useRef(0);
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
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { dismissFeedback, feedbackState, showFeedback } = feedback;
  const [allDeyimler, setAllDeyimler] = useState<DeyimRow[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<DeyimlerQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);

  const clearActionTimeout = useCallback(() => {
    if (actionTimeoutRef.current !== null) {
      window.clearTimeout(actionTimeoutRef.current);
      actionTimeoutRef.current = null;
    }
  }, []);

  const getResponseMs = useCallback(
    () => (questionStartedAtRef.current > 0 ? Math.round(performance.now() - questionStartedAtRef.current) : null),
    [],
  );

  const setupQuestion = useCallback(() => {
    const nextQuestion = createQuestion(allDeyimler);
    setCurrentQuestion(nextQuestion);
    setSelectedAnswer(null);
    setShowExplanation(false);
    questionStartedAtRef.current = performance.now();
  }, [allDeyimler]);

  useEffect(() => clearActionTimeout, [clearActionTimeout]);

  useEffect(() => {
    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;
    setIsLoading(true);

    const loadDeyimler = async () => {
      try {
        const rows = await fetchDeyimlerRows();

        if (loadRequestIdRef.current !== requestId) {
          return;
        }

        setAllDeyimler(rows);
      } catch {
        if (loadRequestIdRef.current !== requestId) {
          return;
        }

        setAllDeyimler([]);
      } finally {
        if (loadRequestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    };

    void loadDeyimler();
    return () => {
      loadRequestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (
      engine.phase === "playing" &&
      !currentQuestion &&
      !isLoading &&
      allDeyimler.length > 0
    ) {
      setupQuestion();
      return;
    }

    if (
      engine.phase === "welcome" ||
      engine.phase === "game_over" ||
      engine.phase === "victory"
    ) {
      clearActionTimeout();
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setShowExplanation(false);
      questionStartedAtRef.current = 0;

      if (engine.phase === "welcome") {
        resetPerformance();
      }
    }
  }, [
    allDeyimler.length,
    clearActionTimeout,
    currentQuestion,
    engine.phase,
    isLoading,
    resetPerformance,
    setupQuestion,
  ]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (
        engine.phase !== "playing" ||
        feedbackState ||
        !currentQuestion ||
        selectedAnswer !== null
      ) {
        return;
      }

      setSelectedAnswer(answer);
      setShowExplanation(true);

      const isCorrect = answer === currentQuestion.missingWord;
      const willGameOver = !isCorrect && engine.lives <= 1;
      recordAttempt({ isCorrect, responseMs: getResponseMs() });
      showFeedback(isCorrect);
      playSound(isCorrect ? "correct" : "incorrect");

      if (isCorrect) {
        engine.addScore(calculateDeyimlerScore(engine.level));
      } else {
        engine.loseLife();
      }

      clearActionTimeout();
      actionTimeoutRef.current = window.setTimeout(() => {
        dismissFeedback();

        if (isCorrect) {
          engine.nextLevel();
          if (engine.level < MAX_LEVEL) {
            setupQuestion();
          }
          return;
        }

        if (!willGameOver) {
          setupQuestion();
        }
      }, FEEDBACK_DURATION_MS);
    },
    [
      clearActionTimeout,
      currentQuestion,
      dismissFeedback,
      engine,
      feedbackState,
      getResponseMs,
      playSound,
      recordAttempt,
      selectedAnswer,
      setupQuestion,
      showFeedback,
    ],
  );

  return {
    currentQuestion,
    engine,
    feedback,
    handleAnswer,
    isLoading,
    selectedAnswer,
    showExplanation,
  };
};
