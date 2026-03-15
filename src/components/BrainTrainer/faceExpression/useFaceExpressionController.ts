import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback.ts";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker.ts";
import { useGameEngine } from "../shared/useGameEngine.ts";
import {
  FEEDBACK_DURATION_MS,
  GAME_ID,
  MAX_LEVEL,
  buildFaceExpressionFeedbackMessage,
  checkAnswer,
  computeScore,
  generateQuestion,
} from "./logic.ts";
import type { FaceQuestion } from "./logic.ts";

export const useFaceExpressionController = () => {
  const questionStartedAtRef = useRef(0);
  const { performanceRef, recordAttempt, resetPerformance } = useGamePerformanceTracker();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: 5,
    timeLimit: 180,
    getPerformanceSnapshot: () => performanceRef.current,
  });

  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const { phase, level, lives, addScore, loseLife, nextLevel } = engine;

  const [currentQuestion, setCurrentQuestion] = useState<FaceQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const answerTimeoutRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);

  const clearAnswerTimeout = useCallback(() => {
    if (answerTimeoutRef.current !== null) {
      window.clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = null;
    }
  }, []);

  const startLevel = useCallback(() => {
    setCurrentQuestion(generateQuestion());
    setSelectedAnswer(null);
    questionStartedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => clearAnswerTimeout, [clearAnswerTimeout]);

  useEffect(() => {
    if (phase === "playing" && !currentQuestion) {
      startLevel();
    } else if (phase === "welcome" || phase === "game_over" || phase === "victory") {
      clearAnswerTimeout();
      dismissFeedback();
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setStreak(0);
      resetPerformance();
    }
  }, [phase, currentQuestion, startLevel, resetPerformance, clearAnswerTimeout, dismissFeedback]);

  const handleAnswer = useCallback(
    (emotionId: string) => {
      if (phase !== "playing" || !!feedbackState || !currentQuestion || selectedAnswer !== null) return;

      setSelectedAnswer(emotionId);
      const isCorrect = checkAnswer(emotionId, currentQuestion);
      recordAttempt({
        isCorrect,
        responseMs: questionStartedAtRef.current > 0 ? Date.now() - questionStartedAtRef.current : null,
      });
      showFeedback(
        isCorrect,
        buildFaceExpressionFeedbackMessage(isCorrect, currentQuestion.correctEmotion.name, level, MAX_LEVEL),
      );
      clearAnswerTimeout();

      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        addScore(computeScore(level, newStreak));

        answerTimeoutRef.current = window.setTimeout(() => {
          answerTimeoutRef.current = null;
          dismissFeedback();
          if (phaseRef.current !== "playing") return;

          if (level >= MAX_LEVEL) {
            engine.setGamePhase("victory");
          } else {
            nextLevel();
            startLevel();
          }
        }, FEEDBACK_DURATION_MS);
      } else {
        setStreak(0);
        loseLife();
        answerTimeoutRef.current = window.setTimeout(() => {
          answerTimeoutRef.current = null;
          dismissFeedback();
          if (phaseRef.current === "playing" && lives > 1) {
            startLevel();
          }
        }, FEEDBACK_DURATION_MS);
      }
    },
    [
      phase,
      feedbackState,
      currentQuestion,
      selectedAnswer,
      showFeedback,
      dismissFeedback,
      streak,
      addScore,
      level,
      nextLevel,
      loseLife,
      lives,
      startLevel,
      engine,
      recordAttempt,
      clearAnswerTimeout,
    ],
  );

  return { engine, feedback, currentQuestion, selectedAnswer, handleAnswer };
};
