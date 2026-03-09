import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker";
import { useSound } from "../../../hooks/useSound";
import { useGameEngine } from "../shared/useGameEngine";
import {
  CORRECT_TO_ADVANCE,
  FEEDBACK_DURATION_MS,
  GAME_ID,
  INITIAL_LIVES,
  MAX_LEVEL,
  TIME_LIMIT,
} from "./constants.ts";
import {
  calculatePerceptualSpeedScore,
  createChallenge,
  getDigitLengthForLevel,
  isAnswerCorrect,
} from "./logic.ts";
import type { Challenge } from "./types.ts";

export const usePerceptualSpeedController = () => {
  const actionTimeoutRef = useRef<number | null>(null);
  const challengeLevelRef = useRef<number | null>(null);
  const challengeStartedAtRef = useRef(0);
  const { performanceRef, recordAttempt, resetPerformance } =
    useGamePerformanceTracker();
  const { playSound } = useSound();
  const engine = useGameEngine({
    gameId: GAME_ID,
    timeLimit: TIME_LIMIT,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    getPerformanceSnapshot: () => performanceRef.current,
  });
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { addScore, level, lives, loseLife, nextLevel, phase, setGamePhase } =
    engine;
  const { dismissFeedback, feedbackState, showFeedback } = feedback;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [correctInLevel, setCorrectInLevel] = useState(0);

  const clearActionTimeout = useCallback(() => {
    if (actionTimeoutRef.current !== null) {
      window.clearTimeout(actionTimeoutRef.current);
      actionTimeoutRef.current = null;
    }
  }, []);

  const getResponseMs = useCallback(() => {
    return challengeStartedAtRef.current > 0
      ? Math.round(performance.now() - challengeStartedAtRef.current)
      : null;
  }, []);

  const startChallenge = useCallback((challengeLevel: number) => {
    challengeLevelRef.current = challengeLevel;
    challengeStartedAtRef.current = performance.now();
    setChallenge(createChallenge(getDigitLengthForLevel(challengeLevel)));
  }, []);

  useEffect(() => clearActionTimeout, [clearActionTimeout]);

  useEffect(() => {
    if (phase === "playing") {
      if (!challenge || challengeLevelRef.current !== level) {
        startChallenge(level);
      }
      return;
    }

    clearActionTimeout();
    dismissFeedback();
    challengeLevelRef.current = null;
    challengeStartedAtRef.current = 0;
    setChallenge(null);
    setCorrectInLevel(0);

    if (phase === "welcome") {
      resetPerformance();
    }
  }, [
    challenge,
    clearActionTimeout,
    dismissFeedback,
    level,
    phase,
    resetPerformance,
    startChallenge,
  ]);

  const handleAnswer = useCallback(
    (answerIsSame: boolean) => {
      if (!challenge || phase !== "playing" || feedbackState) {
        return;
      }

      const correct = isAnswerCorrect(answerIsSame, challenge);
      const nextCorrectCount = correct ? correctInLevel + 1 : correctInLevel;
      const levelsUp = correct && nextCorrectCount >= CORRECT_TO_ADVANCE;
      const reachesVictory = levelsUp && level >= MAX_LEVEL;
      const canRetry = lives > 1;

      recordAttempt({ isCorrect: correct, responseMs: getResponseMs() });
      showFeedback(correct);
      playSound(correct ? "correct" : "wrong");
      clearActionTimeout();

      actionTimeoutRef.current = window.setTimeout(() => {
        dismissFeedback();

        if (correct) {
          addScore(calculatePerceptualSpeedScore(level));

          if (reachesVictory) {
            setCorrectInLevel(0);
            setGamePhase("victory");
            playSound("success");
            return;
          }

          if (levelsUp) {
            setCorrectInLevel(0);
            nextLevel();
            return;
          }

          setCorrectInLevel(nextCorrectCount);
          startChallenge(level);
          return;
        }

        loseLife();

        if (canRetry) {
          startChallenge(level);
        }
      }, FEEDBACK_DURATION_MS);
    },
    [
      addScore,
      challenge,
      clearActionTimeout,
      correctInLevel,
      dismissFeedback,
      feedbackState,
      getResponseMs,
      level,
      lives,
      loseLife,
      nextLevel,
      phase,
      playSound,
      recordAttempt,
      setGamePhase,
      showFeedback,
      startChallenge,
    ],
  );

  useEffect(() => {
    if (phase !== "playing") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (feedbackState) {
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        handleAnswer(event.key === "ArrowLeft");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [feedbackState, handleAnswer, phase]);

  return {
    engine,
    feedback,
    challenge,
    correctInLevel,
    handleAnswer,
  };
};
