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
  appendDigit,
  createRoundCards,
  generateQuestion,
  getLevelScore,
  getRoundSequencePlan,
  isAnswerCorrect,
} from "./logic";
import type { GameCardData, QuestionData } from "./types";

export const useMathMagicController = () => {
  const questionShownAtRef = useRef(0);
  const previousPhaseRef = useRef<ReturnType<typeof useGameEngine>["phase"]>(
    "welcome",
  );
  const sequenceTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
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

  const [cards, setCards] = useState<GameCardData[]>([]);
  const [visibleIndices, setVisibleIndices] = useState<number[]>([]);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [numberInput, setNumberInput] = useState("");

  const clearSequenceTimeouts = useCallback(() => {
    sequenceTimeoutsRef.current.forEach(clearTimeout);
    sequenceTimeoutsRef.current = [];
  }, []);

  const scheduleSequenceTimeout = useCallback(
    (fn: () => void, delay: number) => {
      const id = setTimeout(fn, delay);
      sequenceTimeoutsRef.current.push(id);
      return id;
    },
    [],
  );

  const resetRoundState = useCallback(() => {
    setCards([]);
    setVisibleIndices([]);
    setQuestion(null);
    setNumberInput("");
    questionShownAtRef.current = 0;
  }, []);

  const getResponseMs = useCallback(() => {
    return questionShownAtRef.current > 0
      ? Date.now() - questionShownAtRef.current
      : null;
  }, []);

  const startRound = useCallback(
    (roundLevel: number) => {
      clearSequenceTimeouts();
      resetRoundState();

      const nextCards = createRoundCards(roundLevel);
      const sequencePlan = getRoundSequencePlan(nextCards.length, roundLevel);
      setCards(nextCards);

      nextCards.forEach((_, index) => {
        scheduleSequenceTimeout(() => {
          setVisibleIndices((current) => [...current, index]);
          playSound("pop");
        }, sequencePlan.initialFocusDelay + sequencePlan.revealDelay * index);
      });

      scheduleSequenceTimeout(() => {
        setVisibleIndices([]);
      }, sequencePlan.closeAllAt);

      scheduleSequenceTimeout(() => {
        setQuestion(generateQuestion(nextCards));
        questionShownAtRef.current = Date.now();
      }, sequencePlan.questionAt);
    },
    [clearSequenceTimeouts, playSound, resetRoundState, scheduleSequenceTimeout],
  );

  useEffect(() => clearSequenceTimeouts, [clearSequenceTimeouts]);

  useEffect(() => {
    const previousPhase = previousPhaseRef.current;

    if (
      engine.phase === "playing" &&
      (previousPhase === "welcome" ||
        previousPhase === "game_over" ||
        previousPhase === "victory")
    ) {
      clearSequenceTimeouts();
      resetRoundState();
      scheduleSequenceTimeout(() => startRound(engine.level), 50);
    } else if (engine.phase === "welcome") {
      clearSequenceTimeouts();
      resetRoundState();
      resetPerformance();
    } else if (engine.phase === "game_over" || engine.phase === "victory") {
      clearSequenceTimeouts();
    }

    previousPhaseRef.current = engine.phase;
  }, [
    clearSequenceTimeouts,
    engine.level,
    engine.phase,
    resetPerformance,
    resetRoundState,
    scheduleSequenceTimeout,
    startRound,
  ]);

  const handleAnswer = useCallback(
    (userAnswer: string | number) => {
      if (engine.phase !== "playing" || !question || feedback.feedbackState) {
        return;
      }

      const isCorrect = isAnswerCorrect(question, userAnswer);
      recordAttempt({ isCorrect, responseMs: getResponseMs() });
      feedback.showFeedback(isCorrect);
      playSound(isCorrect ? "correct" : "incorrect");

      safeTimeout(() => {
        feedback.dismissFeedback();

        if (isCorrect) {
          engine.addScore(getLevelScore(engine.level));

          if (engine.level >= MAX_LEVEL) {
            engine.setGamePhase("victory");
            return;
          }

          engine.nextLevel();
          startRound(engine.level + 1);
          return;
        }

        const willGameOver = engine.lives <= 1;
        engine.loseLife();

        if (!willGameOver) {
          startRound(engine.level);
        }
      }, ROUND_TRANSITION_MS);
    },
    [
      engine,
      feedback,
      getResponseMs,
      playSound,
      question,
      recordAttempt,
      safeTimeout,
      startRound,
    ],
  );

  const handleDigit = useCallback((digit: string) => {
    setNumberInput((current) => appendDigit(current, digit));
  }, []);

  const clearNumberInput = useCallback(() => {
    setNumberInput("");
  }, []);

  const submitNumberInput = useCallback(() => {
    if (!numberInput) {
      return;
    }

    handleAnswer(Number(numberInput));
  }, [handleAnswer, numberInput]);

  const answerColor = useCallback(
    (colorName: string) => {
      handleAnswer(colorName);
    },
    [handleAnswer],
  );

  return {
    engine,
    feedback,
    cards,
    visibleIndices,
    question,
    numberInput,
    answerColor,
    handleDigit,
    clearNumberInput,
    submitNumberInput,
  };
};
