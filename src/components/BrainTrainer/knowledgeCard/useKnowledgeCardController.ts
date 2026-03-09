import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

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
import {
  buildQuestions,
  calculateKnowledgeCardScore,
  getBackLink,
  normalizeAnswer,
} from "./logic";
import { fetchKnowledgeCardRows } from "./repository";
import type { KnowledgeQuestion, LocalPhase } from "./types";

const INSUFFICIENT_QUESTIONS_MESSAGE =
  "20 soru oluşturmak için yeterli bilgi kartı bulunamadı.";

export const useKnowledgeCardController = () => {
  const feedbackTimeoutRef = useRef<number | null>(null);
  const loadRequestIdRef = useRef(0);
  const questionStartedAtRef = useRef(0);
  const { performanceRef, recordAttempt, resetPerformance } =
    useGamePerformanceTracker();
  const { playSound } = useSound();
  const location = useLocation();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
    getPerformanceSnapshot: () => performanceRef.current,
  });
  const { phase, level, lives, addScore, loseLife, nextLevel } = engine;
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [localPhase, setLocalPhase] = useState<LocalPhase>("loading");
  const [questions, setQuestions] = useState<KnowledgeQuestion[]>([]);
  const [streak, setStreak] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const clearFeedbackTimeout = useCallback(() => {
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    clearFeedbackTimeout();
    loadRequestIdRef.current += 1;
    questionStartedAtRef.current = 0;
    setLocalPhase("loading");
    setQuestions([]);
    setStreak(0);
    setErrorMessage("");
  }, [clearFeedbackTimeout]);

  const getResponseMs = useCallback(() => {
    return questionStartedAtRef.current > 0
      ? Date.now() - questionStartedAtRef.current
      : null;
  }, []);

  const loadQuestions = useCallback(async () => {
    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;
    setLocalPhase("loading");
    setErrorMessage("");

    try {
      const rows = await fetchKnowledgeCardRows();

      if (loadRequestIdRef.current !== requestId) {
        return;
      }

      const nextQuestions = buildQuestions(rows, MAX_LEVEL);

      if (nextQuestions.length < MAX_LEVEL) {
        setQuestions([]);
        setErrorMessage(INSUFFICIENT_QUESTIONS_MESSAGE);
        setLocalPhase("error");
        return;
      }

      setQuestions(nextQuestions);
      setLocalPhase("ready");
      questionStartedAtRef.current = Date.now();
    } catch {
      if (loadRequestIdRef.current !== requestId) {
        return;
      }

      setQuestions([]);
      setErrorMessage("Yükleme hatası.");
      setLocalPhase("error");
    }
  }, []);

  useEffect(() => clearFeedbackTimeout, [clearFeedbackTimeout]);

  useEffect(() => {
    if (phase === "playing" && questions.length === 0 && localPhase === "loading") {
      void loadQuestions();
      return;
    }

    if (phase === "welcome") {
      resetState();
      resetPerformance();
      return;
    }

    if (phase !== "playing") {
      clearFeedbackTimeout();
    }
  }, [
    clearFeedbackTimeout,
    loadQuestions,
    localPhase,
    phase,
    questions.length,
    resetPerformance,
    resetState,
  ]);

  const currentQuestion = questions[level - 1] ?? null;

  useEffect(() => {
    if (phase === "playing" && localPhase === "ready" && currentQuestion) {
      questionStartedAtRef.current = Date.now();
    }
  }, [currentQuestion, level, localPhase, phase]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (
        feedbackState ||
        localPhase !== "ready" ||
        phase !== "playing" ||
        !currentQuestion
      ) {
        return;
      }

      const isCorrect =
        normalizeAnswer(answer) === normalizeAnswer(currentQuestion.correctAnswer);
      const nextStreak = isCorrect ? streak + 1 : 0;
      const canContinueAfterMiss = lives > 1;

      recordAttempt({ isCorrect, responseMs: getResponseMs() });
      showFeedback(isCorrect);
      playSound(isCorrect ? "correct" : "incorrect");

      if (isCorrect) {
        setStreak(nextStreak);
        addScore(calculateKnowledgeCardScore(level, nextStreak));
      } else {
        setStreak(0);
        loseLife();
      }

      clearFeedbackTimeout();
      feedbackTimeoutRef.current = window.setTimeout(() => {
        dismissFeedback();

        if (!isCorrect && !canContinueAfterMiss) {
          return;
        }

        nextLevel();
      }, FEEDBACK_DURATION_MS);
    },
    [
      addScore,
      clearFeedbackTimeout,
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
      showFeedback,
      streak,
    ],
  );

  return {
    backLink: getBackLink(Boolean(location.state?.arcadeMode)),
    currentQuestion,
    engine,
    errorMessage,
    feedback,
    handleAnswer,
    localPhase,
  };
};
