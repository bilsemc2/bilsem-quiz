import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback.ts";
import { useSound } from "../../../hooks/useSound.ts";
import { useGameEngine } from "../shared/useGameEngine.ts";
import {
  FEEDBACK_DURATION_MS,
  GAME_ID,
  INITIAL_LIVES,
  MAX_LEVEL,
  TIME_LIMIT,
  buildStroopFeedbackMessage,
  checkAnswer,
  computeScore,
  generateRound,
  shouldFinishGame,
  shouldLevelUp,
} from "./logic.ts";
import type { StroopRound } from "./logic.ts";

export const useStroopController = () => {
  const { playSound } = useSound();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
    initialLives: INITIAL_LIVES,
  });
  const { phase, level, lives, addScore, loseLife, nextLevel, setGamePhase } = engine;

  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [currentRound, setCurrentRound] = useState<StroopRound | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const roundResetTimeoutRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);

  const clearRoundResetTimeout = useCallback(() => {
    if (roundResetTimeoutRef.current !== null) {
      window.clearTimeout(roundResetTimeoutRef.current);
      roundResetTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase === "playing" && !currentRound) {
      setCurrentRound(generateRound());
      setCorrectCount(0);
      setStreak(0);
    } else if (phase === "welcome") {
      setCurrentRound(null);
    }
  }, [phase, currentRound]);

  useEffect(() => clearRoundResetTimeout, [clearRoundResetTimeout]);

  useEffect(() => {
    if (phase === "game_over" || phase === "victory" || phase === "welcome") {
      dismissFeedback();
      clearRoundResetTimeout();
    }
  }, [clearRoundResetTimeout, dismissFeedback, phase]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (phase !== "playing" || feedbackState || !currentRound) return;

      const isCorrect = checkAnswer(answer, currentRound);
      const newCorrect = isCorrect ? correctCount + 1 : correctCount;
      const levelUp = isCorrect && shouldLevelUp(newCorrect, level, MAX_LEVEL);
      const finish = isCorrect && shouldFinishGame(newCorrect, level, MAX_LEVEL);
      const feedbackMessage = buildStroopFeedbackMessage({
        correct: isCorrect,
        levelUp,
        finish,
        level,
      });
      showFeedback(isCorrect, feedbackMessage);
      clearRoundResetTimeout();

      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        setStreak((s) => s + 1);
        addScore(computeScore(level, streak));
        if (levelUp) {
          nextLevel();
          playSound("success");
        } else if (finish) {
          roundResetTimeoutRef.current = window.setTimeout(() => {
            roundResetTimeoutRef.current = null;
            dismissFeedback();
            setGamePhase("victory");
          }, FEEDBACK_DURATION_MS);
          return;
        }
      } else {
        setStreak(0);
        loseLife();
      }

      roundResetTimeoutRef.current = window.setTimeout(() => {
        roundResetTimeoutRef.current = null;
        dismissFeedback();
        if (phaseRef.current === "playing" && (isCorrect || lives > 1)) {
          setCurrentRound(generateRound());
          playSound("slide");
        }
      }, FEEDBACK_DURATION_MS);
    },
    [
      phase,
      level,
      lives,
      addScore,
      loseLife,
      nextLevel,
      setGamePhase,
      currentRound,
      feedbackState,
      showFeedback,
      dismissFeedback,
      playSound,
      correctCount,
      streak,
      clearRoundResetTimeout,
    ],
  );

  return { engine, feedback, currentRound, correctCount, streak, lives, handleAnswer };
};
