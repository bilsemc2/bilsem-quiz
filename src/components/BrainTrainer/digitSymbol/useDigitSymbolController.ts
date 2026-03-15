import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback.ts";
import { useSound } from "../../../hooks/useSound.ts";
import { useGameEngine } from "../shared/useGameEngine.ts";
import {
  buildDigitSymbolFeedbackMessage,
  getDigitSymbolTargetScore,
} from "./logic.ts";

const GAME_ID = "simge-kodlama";
const MAX_LEVEL = 20;
const FEEDBACK_DURATION_MS = 1200;

const SYMBOLS = ["◯", "△", "□", "◇", "★", "♡", "⬡", "⬢", "✕"];

const shuffleItems = <T,>(items: readonly T[], random: () => number = Math.random): T[] => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

const createSymbolMap = () => {
  const shuffled = shuffleItems(SYMBOLS);
  const map: Record<number, string> = {};
  for (let i = 1; i <= 9; i++) map[i] = shuffled[i - 1];
  return map;
};

export { SYMBOLS, MAX_LEVEL };

export const useDigitSymbolController = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const { phase, level, lives, addScore, loseLife, nextLevel } = engine;

  const [symbolMap, setSymbolMap] = useState<Record<number, string>>({});
  const [currentNumber, setCurrentNumber] = useState<number>(1);
  const [scoreInLevel, setScoreInLevel] = useState(0);
  const resultTimeoutRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);

  const clearResultTimeout = useCallback(() => {
    if (resultTimeoutRef.current !== null) {
      window.clearTimeout(resultTimeoutRef.current);
      resultTimeoutRef.current = null;
    }
  }, []);

  const startLevel = useCallback(() => {
    setSymbolMap(createSymbolMap());
    setCurrentNumber(Math.floor(Math.random() * 9) + 1);
    setScoreInLevel(0);
    playSound("slide");
  }, [playSound]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => clearResultTimeout, [clearResultTimeout]);

  useEffect(() => {
    if (phase === "playing" && Object.keys(symbolMap).length === 0) {
      startLevel();
    } else if (
      phase === "welcome" ||
      phase === "game_over" ||
      phase === "victory"
    ) {
      clearResultTimeout();
      dismissFeedback();
      setSymbolMap({});
      setCurrentNumber(1);
      setScoreInLevel(0);
    }
  }, [phase, symbolMap, startLevel, clearResultTimeout, dismissFeedback]);

  const handleAnswer = useCallback(
    (sym: string) => {
      if (phase !== "playing" || !!feedbackState) return;

      const correctSymbol = symbolMap[currentNumber];
      const correct = correctSymbol === sym;

      if (correct) {
        playSound("pop");
        addScore(15 + level * 2);

        const ns = scoreInLevel + 1;
        const targetScore = getDigitSymbolTargetScore(level);

        if (ns >= targetScore) {
          showFeedback(
            true,
            buildDigitSymbolFeedbackMessage({
              correct: true,
              currentNumber,
              correctSymbol,
              level,
              maxLevel: MAX_LEVEL,
              remainingMatches: 0,
            }),
          );
          clearResultTimeout();
          resultTimeoutRef.current = window.setTimeout(() => {
            resultTimeoutRef.current = null;
            dismissFeedback();
            if (phaseRef.current !== "playing") return;

            if (level >= MAX_LEVEL) {
              engine.setGamePhase("victory");
              playSound("success");
            } else {
              nextLevel();
              startLevel();
            }
          }, FEEDBACK_DURATION_MS);
        } else {
          setScoreInLevel(ns);
          setCurrentNumber(Math.floor(Math.random() * 9) + 1);
        }
      } else {
        showFeedback(
          false,
          buildDigitSymbolFeedbackMessage({
            correct: false,
            currentNumber,
            correctSymbol,
            level,
            maxLevel: MAX_LEVEL,
            remainingMatches: getDigitSymbolTargetScore(level) - scoreInLevel,
          }),
        );
        loseLife();
        clearResultTimeout();
        resultTimeoutRef.current = window.setTimeout(() => {
          resultTimeoutRef.current = null;
          dismissFeedback();
          if (phaseRef.current === "playing" && lives > 1) {
            setCurrentNumber(Math.floor(Math.random() * 9) + 1);
          }
        }, FEEDBACK_DURATION_MS);
      }
    },
    [
      phase,
      feedbackState,
      symbolMap,
      currentNumber,
      scoreInLevel,
      playSound,
      addScore,
      level,
      showFeedback,
      clearResultTimeout,
      dismissFeedback,
      loseLife,
      lives,
      nextLevel,
      engine,
      startLevel,
    ],
  );

  return {
    engine,
    feedback,
    symbolMap,
    currentNumber,
    scoreInLevel,
    handleAnswer,
  };
};
