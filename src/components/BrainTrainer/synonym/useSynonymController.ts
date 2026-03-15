import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker";
import { useSound } from "../../../hooks/useSound";
import { useGameEngine } from "../shared/useGameEngine";
import {
  EMPTY_QUESTIONS_MESSAGE,
  FEEDBACK_DURATION_MS,
  GAME_ID,
  INITIAL_LIVES,
  LOAD_ERROR_MESSAGE,
  MAX_LEVEL,
  TIME_LIMIT,
} from "./constants";
import {
  buildQuestions,
  buildSynonymFeedbackMessage,
  calculateSynonymScore,
  getErrorActionLabel,
} from "./logic";
import { fetchSynonymRows } from "./repository";
import type { SynonymPhase, SynonymQuestion } from "./types";

export const useSynonymController = () => {
  const actionTimeoutRef = useRef<number | null>(null);
  const loadRequestIdRef = useRef(0);
  const questionStartedAtRef = useRef(0);
  const { performanceRef, recordAttempt, resetPerformance } =
    useGamePerformanceTracker();
  const { playSound } = useSound();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
    initialLives: INITIAL_LIVES,
    getPerformanceSnapshot: () => performanceRef.current,
  });
  const { addScore, examMode, level, lives, loseLife, nextLevel, phase, setGamePhase } = engine;
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { dismissFeedback, feedbackState, showFeedback } = feedback;
  const [questions, setQuestions] = useState<SynonymQuestion[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [localPhase, setLocalPhase] = useState<SynonymPhase>("loading");

  const clearActionTimeout = useCallback(() => {
    if (actionTimeoutRef.current !== null) {
      window.clearTimeout(actionTimeoutRef.current);
      actionTimeoutRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    clearActionTimeout();
    loadRequestIdRef.current += 1;
    questionStartedAtRef.current = 0;
    setQuestions([]);
    setErrorMessage("");
    setCurrentQuestionIndex(0);
    setStreak(0);
    setLocalPhase("loading");
  }, [clearActionTimeout]);

  const getResponseMs = useCallback(
    () => (questionStartedAtRef.current > 0 ? Math.round(performance.now() - questionStartedAtRef.current) : null),
    [],
  );

  const loadQuestions = useCallback(async () => {
    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;
    setLocalPhase("loading");
    setErrorMessage("");

    try {
      const rows = await fetchSynonymRows();

      if (loadRequestIdRef.current !== requestId) {
        return;
      }

      const nextQuestions = buildQuestions(rows, MAX_LEVEL);

      if (nextQuestions.length === 0) {
        setQuestions([]);
        setErrorMessage(EMPTY_QUESTIONS_MESSAGE);
        setLocalPhase("error");
        setGamePhase("welcome");
        return;
      }

      setQuestions(nextQuestions);
      setCurrentQuestionIndex(0);
      setLocalPhase("ready");
      questionStartedAtRef.current = performance.now();
    } catch (error) {
      if (loadRequestIdRef.current !== requestId) {
        return;
      }

      setQuestions([]);
      setErrorMessage(
        error instanceof Error && error.message ? error.message : LOAD_ERROR_MESSAGE,
      );
      setLocalPhase("error");
      setGamePhase("welcome");
    }
  }, [setGamePhase]);

  useEffect(() => clearActionTimeout, [clearActionTimeout]);

  useEffect(() => {
    if (
      phase === "playing" &&
      questions.length === 0 &&
      localPhase === "loading" &&
      !errorMessage
    ) {
      void loadQuestions();
      return;
    }

    if (phase === "welcome") {
      clearActionTimeout();

      if (localPhase !== "error") {
        resetState();
        resetPerformance();
      }

      return;
    }

    if (phase !== "playing") {
      clearActionTimeout();
    }
  }, [clearActionTimeout, errorMessage, loadQuestions, localPhase, phase, questions.length, resetPerformance, resetState]);

  useEffect(() => {
    if (
      phase === "playing" &&
      questions.length > 0 &&
      currentQuestionIndex >= questions.length
    ) {
      setGamePhase(level >= MAX_LEVEL ? "victory" : "game_over");
    }
  }, [currentQuestionIndex, level, phase, questions.length, setGamePhase]);

  const currentQuestion = questions[currentQuestionIndex] ?? null;

  useEffect(() => {
    if (phase === "playing" && localPhase === "ready" && currentQuestion) {
      questionStartedAtRef.current = performance.now();
    }
  }, [currentQuestion, currentQuestionIndex, localPhase, phase]);

  const handleAnswer = useCallback(
    (answerId: string) => {
      if (
        phase !== "playing" ||
        localPhase !== "ready" ||
        feedbackState ||
        !currentQuestion
      ) {
        return;
      }

      const isCorrect = answerId === currentQuestion.correctOptionId;
      const willGameOver = !isCorrect && lives <= 1;
      recordAttempt({ isCorrect, responseMs: getResponseMs() });
      showFeedback(
        isCorrect,
        buildSynonymFeedbackMessage({
          isCorrect,
          level,
          maxLevel: MAX_LEVEL,
          synonym: currentQuestion.synonym,
        }),
      );
      playSound(isCorrect ? "correct" : "incorrect");

      if (isCorrect) {
        setStreak((value) => value + 1);
        addScore(calculateSynonymScore(streak));
      } else {
        setStreak(0);
        loseLife();
      }

      clearActionTimeout();
      actionTimeoutRef.current = window.setTimeout(() => {
        dismissFeedback();

        if (isCorrect) {
          if (level >= MAX_LEVEL) {
            setGamePhase("victory");
            playSound("success");
            return;
          }

          nextLevel();
          setCurrentQuestionIndex((value) => value + 1);
          playSound("slide");
          return;
        }

        if (!willGameOver) {
          setCurrentQuestionIndex((value) => value + 1);
          playSound("slide");
        }
      }, FEEDBACK_DURATION_MS);
    },
    [
      addScore,
      clearActionTimeout,
      currentQuestion,
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
      setGamePhase,
      showFeedback,
      streak,
    ],
  );

  const handleErrorAction = useCallback(() => {
    resetState();
    if (examMode) {
      setGamePhase("game_over");
      return;
    }
    setGamePhase("welcome");
  }, [examMode, resetState, setGamePhase]);

  return {
    currentQuestion,
    engine,
    errorActionLabel: getErrorActionLabel(examMode),
    errorMessage,
    feedback,
    handleAnswer,
    handleErrorAction,
    localPhase,
  };
};
