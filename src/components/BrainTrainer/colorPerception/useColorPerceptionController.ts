import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback.ts";
import { useSound } from "../../../hooks/useSound.ts";
import { useGameEngine } from "../shared/useGameEngine.ts";
import { GAME_COLORS } from "../shared/gameColors.ts";
import {
  buildColorPerceptionFeedbackMessage,
  getColorCountForLevel,
  getColorDisplayDuration,
  isColorSelectionCorrect,
} from "./logic.ts";

const GAME_ID = "renk-algilama";
const MAX_LEVEL = 20;
const FEEDBACK_DURATION_MS = 1200;

export const COLORS: Record<string, string> = {
  kırmızı: "#FF5252",
  mavi: "#4285F4",
  sarı: "#FFC107",
  yeşil: "#0F9D58",
  pembe: GAME_COLORS.pink,
  turuncu: "#FF9800",
  mor: "#9C27B0",
  turkuaz: "#00BCD4",
};

type LocalPhase = "showing" | "guessing" | "idle";

export { MAX_LEVEL };

export const useColorPerceptionController = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const { phase, level, lives, addScore, loseLife, nextLevel } = engine;

  const [localPhase, setLocalPhase] = useState<LocalPhase>("idle");
  const [currentColors, setCurrentColors] = useState<string[]>([]);
  const [userSelections, setUserSelections] = useState<string[]>([]);

  const revealTimeoutRef = useRef<number | null>(null);
  const answerTimeoutRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);

  const clearRevealTimeout = useCallback(() => {
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }, []);

  const clearAnswerTimeout = useCallback(() => {
    if (answerTimeoutRef.current !== null) {
      window.clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => clearRevealTimeout, [clearRevealTimeout]);
  useEffect(() => clearAnswerTimeout, [clearAnswerTimeout]);

  const generateColors = useCallback(
    (lvl: number) => {
      const colorNames = Object.keys(COLORS);
      const shuffled = [...colorNames].sort(() => 0.5 - Math.random());
      const colorCount = getColorCountForLevel(lvl);
      const selectedColors = shuffled.slice(0, colorCount);

      clearRevealTimeout();
      clearAnswerTimeout();
      setCurrentColors(selectedColors);
      setUserSelections([]);
      setLocalPhase("showing");

      revealTimeoutRef.current = window.setTimeout(() => {
        revealTimeoutRef.current = null;
        if (phaseRef.current === "playing") {
          setLocalPhase("guessing");
        }
      }, getColorDisplayDuration(lvl));
    },
    [clearAnswerTimeout, clearRevealTimeout],
  );

  useEffect(() => {
    if (phase === "playing" && localPhase === "idle") {
      generateColors(level);
    } else if (
      phase === "welcome" ||
      phase === "game_over" ||
      phase === "victory"
    ) {
      clearRevealTimeout();
      clearAnswerTimeout();
      dismissFeedback();
      setLocalPhase("idle");
      setCurrentColors([]);
      setUserSelections([]);
    }
  }, [
    phase,
    level,
    localPhase,
    generateColors,
    clearAnswerTimeout,
    clearRevealTimeout,
    dismissFeedback,
  ]);

  const handleColorSelect = (colorName: string) => {
    if (localPhase !== "guessing" || phase !== "playing" || !!feedbackState) return;
    if (userSelections.includes(colorName)) return;

    const newUserSelections = [...userSelections, colorName];
    setUserSelections(newUserSelections);
    playSound("select");

    if (newUserSelections.length === currentColors.length) {
      const isCorrect = isColorSelectionCorrect(newUserSelections, currentColors);
      const feedbackMessage = buildColorPerceptionFeedbackMessage({
        correct: isCorrect,
        currentColors,
        level,
        maxLevel: MAX_LEVEL,
      });

      showFeedback(isCorrect, feedbackMessage);
      clearAnswerTimeout();

      answerTimeoutRef.current = window.setTimeout(() => {
        answerTimeoutRef.current = null;
        dismissFeedback();
        if (phaseRef.current !== "playing") return;

        if (isCorrect) {
          addScore(level * 100);
          if (level >= MAX_LEVEL) {
            engine.setGamePhase("victory");
          } else {
            nextLevel();
            setLocalPhase("idle");
          }
        } else {
          loseLife();
          if (lives > 1) {
            setLocalPhase("idle");
          }
        }
      }, FEEDBACK_DURATION_MS);
    }
  };

  return {
    engine,
    feedback,
    localPhase,
    currentColors,
    userSelections,
    handleColorSelect,
  };
};
