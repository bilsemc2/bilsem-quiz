import { useCallback, useEffect, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback.ts";
import { useSound } from "../../../hooks/useSound.ts";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout.ts";
import { useGameEngine } from "../shared/useGameEngine.ts";
import {
  FEEDBACK_DURATION_MS,
  GAME_ID,
  MAX_LEVEL,
  buildLastLetterFeedbackMessage,
  checkAnswer,
  computeScore,
  generatePuzzle,
} from "./logic.ts";
import type { Puzzle } from "./logic.ts";

export const useLastLetterController = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const { phase, level, lives, addScore, loseLife, nextLevel } = engine;

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [revealWords, setRevealWords] = useState(false);

  const startPuzzle = useCallback(
    (lvl: number) => {
      setPuzzle(generatePuzzle(lvl));
      setRevealWords(false);
      playSound("detective_mystery");
    },
    [playSound],
  );

  useEffect(() => {
    if (phase === "playing" && !puzzle) {
      startPuzzle(level);
    } else if (phase === "welcome") {
      setPuzzle(null);
      setRevealWords(false);
    }
  }, [phase, level, puzzle, startPuzzle]);

  const handleGuess = useCallback(
    (opt: string) => {
      if (!puzzle || phase !== "playing" || !!feedbackState) return;

      const ok = checkAnswer(opt, puzzle);
      setRevealWords(true);
      showFeedback(
        ok,
        buildLastLetterFeedbackMessage({
          isCorrect: ok,
          level,
          maxLevel: MAX_LEVEL,
          correctAnswer: puzzle.correctAnswer,
        }),
      );
      playSound(ok ? "correct" : "incorrect");

      safeTimeout(() => {
        dismissFeedback();
        if (ok) {
          addScore(computeScore(level));
          if (level >= MAX_LEVEL) {
            engine.setGamePhase("victory");
            playSound("success");
          } else {
            nextLevel();
            startPuzzle(level + 1);
          }
        } else {
          loseLife();
          if (lives > 1) {
            startPuzzle(level);
          }
        }
      }, FEEDBACK_DURATION_MS);
    },
    [
      puzzle,
      phase,
      feedbackState,
      level,
      lives,
      playSound,
      showFeedback,
      dismissFeedback,
      addScore,
      loseLife,
      nextLevel,
      safeTimeout,
      startPuzzle,
      engine,
    ],
  );

  return { engine, feedback, puzzle, revealWords, handleGuess };
};
