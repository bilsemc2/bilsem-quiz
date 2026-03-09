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
  START_ROUND_DELAY_MS,
  TIME_LIMIT,
} from "./constants";
import { calculateNumberMemoryScore, createQuestion, generateSequence } from "./logic";
import type { LocalPhase, Question } from "./types";
import { useNumberSequencePlayback } from "./useNumberSequencePlayback";

export const useNumberMemoryController = () => {
  const questionShownAtRef = useRef(0);
  const pendingLevelRef = useRef<number | null>(null);
  const nextQuestionRef = useRef<Question | null>(null);
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
  const { addScore, level, lives, loseLife, nextLevel, phase, setGamePhase } =
    engine;

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [localPhase, setLocalPhase] = useState<LocalPhase>("idle");
  const [numberSequence, setNumberSequence] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const getResponseMs = useCallback(() => {
    return questionShownAtRef.current > 0
      ? Date.now() - questionShownAtRef.current
      : null;
  }, []);

  const resetRoundState = useCallback(() => {
    setCurrentQuestion(null);
    setLocalPhase("idle");
    setNumberSequence([]);
    setSelectedAnswer(null);
    nextQuestionRef.current = null;
    pendingLevelRef.current = null;
    questionShownAtRef.current = 0;
  }, []);

  const handleListeningStart = useCallback(() => {
    setLocalPhase("listening");
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    questionShownAtRef.current = 0;
  }, []);

  const handleQuestionReady = useCallback(() => {
    setCurrentQuestion(nextQuestionRef.current);
    setLocalPhase("question");
    questionShownAtRef.current = Date.now();
  }, []);

  const {
    clearScheduledActions,
    currentPlayIndex,
    playSequence,
    scheduleAction,
    syncPhase,
  } = useNumberSequencePlayback({
    onListeningStart: handleListeningStart,
    onQuestionReady: handleQuestionReady,
  });

  const startRound = useCallback(
    (roundLevel: number) => {
      const nextSequence = generateSequence(roundLevel);
      setNumberSequence(nextSequence);
      setSelectedAnswer(null);
      nextQuestionRef.current = createQuestion(nextSequence, roundLevel);
      pendingLevelRef.current = roundLevel;
      playSound("slide");
      scheduleAction(() => {
        void playSequence(nextSequence);
      }, START_ROUND_DELAY_MS);
    },
    [playSequence, playSound, scheduleAction],
  );

  useEffect(() => {
    syncPhase(phase);
  }, [phase, syncPhase]);

  useEffect(() => {
    return clearScheduledActions;
  }, [clearScheduledActions]);

  useEffect(() => {
    if (phase === "playing") {
      if (pendingLevelRef.current !== level) {
        clearScheduledActions();
        startRound(level);
      }
      return;
    }

    clearScheduledActions();

    if (phase === "welcome") {
      resetRoundState();
      resetPerformance();
      return;
    }

    resetRoundState();
  }, [
    clearScheduledActions,
    level,
    phase,
    resetPerformance,
    resetRoundState,
    startRound,
  ]);

  const handleAnswer = useCallback(
    (value: number) => {
      if (localPhase !== "question" || phase !== "playing" || feedbackState) {
        return;
      }

      if (!currentQuestion || selectedAnswer !== null) {
        return;
      }

      const correct = value === currentQuestion.answer;
      const canRetry = lives > 1;

      setSelectedAnswer(value);
      clearScheduledActions();
      recordAttempt({ isCorrect: correct, responseMs: getResponseMs() });

      if (correct) {
        playSound("correct");
        showFeedback(true);

        scheduleAction(() => {
          dismissFeedback();
          addScore(calculateNumberMemoryScore(level));

          if (level >= MAX_LEVEL) {
            setGamePhase("victory");
            playSound("success");
            return;
          }

          setLocalPhase("idle");
          setCurrentQuestion(null);
          nextLevel();
        }, FEEDBACK_DURATION_MS);
        return;
      }

      playSound("incorrect");
      showFeedback(false);

      scheduleAction(() => {
        dismissFeedback();
        loseLife();

        if (canRetry) {
          setLocalPhase("idle");
          setCurrentQuestion(null);
          startRound(level);
        }
      }, FEEDBACK_DURATION_MS);
    },
    [
      addScore,
      clearScheduledActions,
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
      scheduleAction,
      selectedAnswer,
      setGamePhase,
      showFeedback,
      startRound,
    ],
  );

  return {
    currentPlayIndex,
    engine,
    feedback,
    handleAnswer,
    localPhase,
    numberSequence,
    question: currentQuestion,
    selectedAnswer,
  };
};
