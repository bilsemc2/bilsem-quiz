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
  TIME_LIMIT,
} from "./constants";
import {
  addMinutesToClockTime,
  formatClockTime,
  getNextDisplayHour,
  getRandomTime,
  getTargetOffset,
  getTimeExplorerScore,
  isCorrectClockAnswer,
} from "./logic";
import type { ClockTime } from "./types";

export const useTimeExplorerController = () => {
  const answerStartedAtRef = useRef(0);
  const previousMinutesRef = useRef(0);
  const { performanceRef, recordAttempt, resetPerformance } =
    useGamePerformanceTracker();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
    initialLives: INITIAL_LIVES,
    getPerformanceSnapshot: () => performanceRef.current,
  });
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { dismissFeedback, feedbackState, showFeedback } = feedback;
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const { addScore, level, lives, loseLife, nextLevel, phase, setGamePhase } =
    engine;

  const [questionTime, setQuestionTime] = useState<ClockTime | null>(null);
  const [targetOffset, setTargetOffset] = useState(5);
  const [userMinutes, setUserMinutes] = useState(0);
  const [displayHour, setDisplayHour] = useState(12);

  const getResponseMs = useCallback(() => {
    return answerStartedAtRef.current > 0
      ? Date.now() - answerStartedAtRef.current
      : null;
  }, []);

  const setupQuestion = useCallback((nextLevelNumber: number) => {
    const nextTime = getRandomTime(nextLevelNumber);
    const nextOffset = getTargetOffset(nextLevelNumber);
    setQuestionTime(nextTime);
    setTargetOffset(nextOffset);
    setUserMinutes(nextTime.minutes);
    setDisplayHour(nextTime.hours);
    previousMinutesRef.current = nextTime.minutes;
    answerStartedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (phase === "playing" && !questionTime) {
      setupQuestion(level);
      return;
    }

    if (phase === "welcome") {
      setQuestionTime(null);
      setTargetOffset(5);
      setUserMinutes(0);
      setDisplayHour(12);
      previousMinutesRef.current = 0;
      answerStartedAtRef.current = 0;
      resetPerformance();
      return;
    }

    if (phase !== "playing") {
      setQuestionTime(null);
    }
  }, [level, phase, questionTime, resetPerformance, setupQuestion]);

  const handleMinuteChange = useCallback(
    (newMinutes: number) => {
      if (phase !== "playing" || feedbackState) {
        return;
      }

      setDisplayHour((currentHour) =>
        getNextDisplayHour(currentHour, previousMinutesRef.current, newMinutes),
      );
      previousMinutesRef.current = newMinutes;
      setUserMinutes(newMinutes);
    },
    [feedbackState, phase],
  );

  const handleCheck = useCallback(() => {
    if (phase !== "playing" || feedbackState || !questionTime) {
      return;
    }

    const targetTime = addMinutesToClockTime(questionTime, targetOffset);
    const isCorrect = isCorrectClockAnswer(targetTime, displayHour, userMinutes);
    recordAttempt({ isCorrect, responseMs: getResponseMs() });
    showFeedback(
      isCorrect,
      isCorrect ? "Dogru zaman!" : `Dogru cevap: ${formatClockTime(targetTime)}`,
    );
    playSound(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      addScore(getTimeExplorerScore(level));

      safeTimeout(() => {
        dismissFeedback();

        if (level >= MAX_LEVEL) {
          setGamePhase("victory");
          playSound("success");
          return;
        }

        nextLevel();
        setupQuestion(level + 1);
        playSound("slide");
      }, FEEDBACK_DURATION_MS);

      return;
    }

    const canRetry = lives > 1;
    loseLife();

    safeTimeout(() => {
      dismissFeedback();

      if (canRetry) {
        setupQuestion(level);
      }
    }, FEEDBACK_DURATION_MS);
  }, [
    addScore,
    dismissFeedback,
    displayHour,
    feedbackState,
    getResponseMs,
    level,
    lives,
    loseLife,
    nextLevel,
    phase,
    playSound,
    questionTime,
    recordAttempt,
    safeTimeout,
    setGamePhase,
    setupQuestion,
    showFeedback,
    targetOffset,
    userMinutes,
  ]);

  return {
    engine,
    feedback,
    questionTime,
    targetOffset,
    userMinutes,
    displayHour,
    handleCheck,
    handleMinuteChange,
  };
};
