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
  ROUND_TRANSITION_MS,
  TIME_LIMIT,
} from "./constants";
import {
  generateQuestion,
  generateSymbolColors,
  getMemorizeTime,
  getSymbolMatchScore,
  isCorrectAnswer,
} from "./logic";
import type {
  QuestionData,
  ShapeColorAssignment,
  SymbolMatchPhase,
} from "./types";

export const useSymbolMatchController = () => {
  const questionShownAtRef = useRef(0);
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
  const { showFeedback } = feedback;
  const { addScore, level, lives, loseLife, nextLevel, phase } = engine;

  const [localPhase, setLocalPhase] = useState<SymbolMatchPhase>("memorize");
  const [symbolColors, setSymbolColors] = useState<ShapeColorAssignment[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(
    null,
  );
  const [memorizeCountdown, setMemorizeCountdown] = useState(
    getMemorizeTime(1),
  );
  const [memorizeDuration, setMemorizeDuration] = useState(getMemorizeTime(1));
  const [streak, setStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const resetRoundState = useCallback(() => {
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    questionShownAtRef.current = 0;
  }, []);

  const getResponseMs = useCallback(() => {
    return questionShownAtRef.current > 0
      ? Date.now() - questionShownAtRef.current
      : null;
  }, []);

  const startRound = useCallback(
    (roundLevel: number) => {
      const pairs = generateSymbolColors(roundLevel);
      const nextMemorizeTime = getMemorizeTime(roundLevel);

      setSymbolColors(pairs);
      resetRoundState();
      setMemorizeCountdown(nextMemorizeTime);
      setMemorizeDuration(nextMemorizeTime);
      setLocalPhase("memorize");
    },
    [resetRoundState],
  );

  useEffect(() => {
    if (phase === "playing" && !isGameEndingRef.current) {
      startRound(level);
      return;
    }

    if (phase === "welcome") {
      isGameEndingRef.current = false;
      setLocalPhase("memorize");
      setSymbolColors([]);
      setMemorizeCountdown(getMemorizeTime(1));
      setMemorizeDuration(getMemorizeTime(1));
      setStreak(0);
      resetRoundState();
      resetPerformance();
      return;
    }

    if (phase !== "playing") {
      questionShownAtRef.current = 0;
    }
  }, [level, phase, resetPerformance, resetRoundState, startRound]);

  useEffect(() => {
    if (phase !== "playing" || localPhase !== "memorize") {
      return;
    }

    if (memorizeCountdown > 0) {
      const timeoutId = safeTimeout(() => {
        setMemorizeCountdown((currentCountdown) => currentCountdown - 1);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }

    if (symbolColors.length === 0) {
      return;
    }

    setCurrentQuestion(generateQuestion(symbolColors));
    setLocalPhase("question");
    questionShownAtRef.current = Date.now();
    playSound("pop");
  }, [
    localPhase,
    memorizeCountdown,
    phase,
    playSound,
    safeTimeout,
    symbolColors,
  ]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (
        phase !== "playing" ||
        localPhase !== "question" ||
        selectedAnswer !== null ||
        !currentQuestion
      ) {
        return;
      }

      setSelectedAnswer(answer);

      const correct = isCorrectAnswer(currentQuestion, answer);
      recordAttempt({ isCorrect: correct, responseMs: getResponseMs() });
      showFeedback(correct);
      playSound(correct ? "correct" : "incorrect");

      if (correct) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        addScore(getSymbolMatchScore(level, nextStreak));

        safeTimeout(() => {
          if (isGameEndingRef.current) {
            return;
          }

          nextLevel();
        }, ROUND_TRANSITION_MS);

        return;
      }

      setStreak(0);
      loseLife();

      if (lives <= 1) {
        isGameEndingRef.current = true;
        return;
      }

      safeTimeout(() => {
        if (isGameEndingRef.current) {
          return;
        }

        startRound(level);
      }, ROUND_TRANSITION_MS);
    },
    [
      addScore,
      currentQuestion,
      getResponseMs,
      level,
      lives,
      localPhase,
      loseLife,
      nextLevel,
      phase,
      playSound,
      recordAttempt,
      safeTimeout,
      selectedAnswer,
      showFeedback,
      startRound,
      streak,
    ],
  );

  return {
    engine,
    feedback,
    localPhase,
    symbolColors,
    currentQuestion,
    memorizeCountdown,
    memorizeDuration,
    selectedAnswer,
    handleAnswer,
  };
};
