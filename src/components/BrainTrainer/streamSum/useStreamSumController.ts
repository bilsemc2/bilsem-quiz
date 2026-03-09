import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker";
import { useSound } from "../../../hooks/useSound";
import { useGameEngine } from "../shared/useGameEngine";
import {
  CORRECT_TRANSITION_MS,
  FEEDBACK_DURATION_MS,
  GAME_ID,
  INITIAL_LIVES,
  MAX_LEVEL,
  REVEAL_DELAY_MS,
  TIME_LIMIT,
} from "./constants";
import {
  calculateStreamSumScore,
  evaluateInput,
  generateNumber,
  getAnswerTime,
  getExpectedTotal,
  shouldAdvanceLevel,
  shouldTriggerVictory,
} from "./logic";
import type { StreamSumPhase } from "./types";

export const useStreamSumController = () => {
  const deadlineRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);
  const prevPhaseRef = useRef<ReturnType<typeof useGameEngine>["phase"]>("welcome");
  const answerStartedAtRef = useRef(0);
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
  const { phase, level, lives, addScore, loseLife, nextLevel, setGamePhase } =
    engine;
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [current, setCurrent] = useState<number | null>(null);
  const [previous, setPrevious] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [streak, setStreak] = useState(0);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [streamPhase, setStreamPhase] = useState<StreamSumPhase>("memorize");

  const clearDeadline = useCallback(() => {
    if (deadlineRef.current !== null) {
      window.clearTimeout(deadlineRef.current);
      deadlineRef.current = null;
    }
  }, []);

  const clearFeedbackTimeout = useCallback(() => {
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  }, []);

  const clearRevealTimeout = useCallback(() => {
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }, []);

  const clearAllTimeouts = useCallback(() => {
    clearDeadline();
    clearFeedbackTimeout();
    clearRevealTimeout();
  }, [clearDeadline, clearFeedbackTimeout, clearRevealTimeout]);

  const getResponseMs = useCallback(() => {
    return answerStartedAtRef.current > 0
      ? Date.now() - answerStartedAtRef.current
      : null;
  }, []);

  const resetRoundState = useCallback(() => {
    answerStartedAtRef.current = 0;
    setCurrent(null);
    setPrevious(null);
    setInput("");
    setWaitingForInput(false);
    setStreamPhase("memorize");
  }, []);

  const startNewRound = useCallback(() => {
    clearAllTimeouts();
    answerStartedAtRef.current = 0;
    setWaitingForInput(false);
    setInput("");
    setStreamPhase("memorize");

    const firstNumber = generateNumber();
    setPrevious(null);
    setCurrent(firstNumber);

    revealTimeoutRef.current = window.setTimeout(() => {
      const secondNumber = generateNumber();
      setPrevious(firstNumber);
      setCurrent(secondNumber);
      setInput("");
      setWaitingForInput(true);
      setStreamPhase("answer");
      answerStartedAtRef.current = Date.now();
      playSound("pop");
    }, REVEAL_DELAY_MS);
  }, [clearAllTimeouts, playSound]);

  const handleWrongAnswer = useCallback(() => {
    const canRetry = lives > 1;
    recordAttempt({ isCorrect: false, responseMs: getResponseMs() });
    showFeedback(false);
    playSound("wrong");
    setStreak(0);
    setWaitingForInput(false);
    setStreamPhase("memorize");
    loseLife();
    clearAllTimeouts();

    feedbackTimeoutRef.current = window.setTimeout(() => {
      dismissFeedback();
      if (canRetry) {
        startNewRound();
      }
    }, FEEDBACK_DURATION_MS);
  }, [
    clearAllTimeouts,
    dismissFeedback,
    getResponseMs,
    lives,
    loseLife,
    playSound,
    recordAttempt,
    showFeedback,
    startNewRound,
  ]);

  useEffect(() => clearAllTimeouts, [clearAllTimeouts]);

  useEffect(() => {
    const previousPhase = prevPhaseRef.current;

    if (
      phase === "playing" &&
      (previousPhase === "welcome" ||
        previousPhase === "game_over" ||
        previousPhase === "victory")
    ) {
      setStreak(0);
      startNewRound();
    } else if (
      phase === "welcome" ||
      phase === "game_over" ||
      phase === "victory"
    ) {
      clearAllTimeouts();
      resetRoundState();
      setStreak(0);

      if (phase === "welcome") {
        resetPerformance();
      }
    }

    prevPhaseRef.current = phase;
  }, [clearAllTimeouts, phase, resetPerformance, resetRoundState, startNewRound]);

  useEffect(() => {
    if (phase !== "playing" || !waitingForInput || feedbackState) {
      clearDeadline();
      return;
    }

    deadlineRef.current = window.setTimeout(() => {
      handleWrongAnswer();
    }, getAnswerTime(level));

    return clearDeadline;
  }, [
    clearDeadline,
    feedbackState,
    handleWrongAnswer,
    level,
    phase,
    waitingForInput,
  ]);

  const handleInput = useCallback(
    (digit: string) => {
      if (
        phase !== "playing" ||
        feedbackState ||
        !waitingForInput ||
        previous === null ||
        current === null
      ) {
        return;
      }

      const expected = getExpectedTotal(previous, current);
      const nextInput = `${input}${digit}`;
      const result = evaluateInput(nextInput, expected);

      setInput(nextInput);

      if (result === "correct") {
        const nextStreak = streak + 1;
        recordAttempt({ isCorrect: true, responseMs: getResponseMs() });
        clearDeadline();
        clearFeedbackTimeout();
        setWaitingForInput(false);
        setStreamPhase("memorize");
        showFeedback(true);
        playSound("correct");
        addScore(calculateStreamSumScore(level, streak));
        setStreak(nextStreak);

        if (shouldAdvanceLevel(nextStreak, level)) {
          nextLevel();
        }

        feedbackTimeoutRef.current = window.setTimeout(() => {
          dismissFeedback();

          if (shouldTriggerVictory(level, nextStreak)) {
            setGamePhase("victory");
            return;
          }

          startNewRound();
        }, CORRECT_TRANSITION_MS);
        return;
      }

      if (result === "wrong") {
        handleWrongAnswer();
        return;
      }

      playSound("click");
    },
    [
      addScore,
      clearDeadline,
      clearFeedbackTimeout,
      current,
      dismissFeedback,
      feedbackState,
      getResponseMs,
      handleWrongAnswer,
      input,
      level,
      nextLevel,
      phase,
      playSound,
      previous,
      recordAttempt,
      setGamePhase,
      showFeedback,
      startNewRound,
      streak,
      waitingForInput,
    ],
  );

  return {
    current,
    engine,
    feedback,
    handleDelete: () => setInput((value) => value.slice(0, -1)),
    handleInput,
    input,
    previous,
    streamPhase,
    waitingForInput,
  };
};
