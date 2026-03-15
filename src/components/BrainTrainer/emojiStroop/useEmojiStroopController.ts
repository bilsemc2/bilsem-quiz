import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback.ts";
import { useSound } from "../../../hooks/useSound.ts";
import { useGameEngine } from "../shared/useGameEngine.ts";
import { buildEmojiStroopFeedbackMessage } from "./logic.ts";

const GAME_ID = "emoji-stroop";
const MAX_LEVEL = 20;
const FEEDBACK_DURATION_MS = 1200;

export const EMOTIONS = [
  { emoji: "😊", name: "Mutlu", word: "MUTLU" },
  { emoji: "😢", name: "Üzgün", word: "ÜZGÜN" },
  { emoji: "😠", name: "Kızgın", word: "KIZGIN" },
  { emoji: "😨", name: "Korkmuş", word: "KORKMUŞ" },
  { emoji: "😮", name: "Şaşkın", word: "ŞAŞKIN" },
  { emoji: "😴", name: "Uykulu", word: "UYKULU" },
  { emoji: "🤔", name: "Düşünceli", word: "DÜŞÜNCELİ" },
  { emoji: "😍", name: "Aşık", word: "AŞIK" },
];

export interface EmojiStroopRound {
  emoji: string;
  word: string;
  correctAnswer: string;
  options: string[];
}

export { MAX_LEVEL };

const shuffleItems = <T,>(items: readonly T[], random: () => number): T[] => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

const generateRound = (random: () => number = Math.random): EmojiStroopRound => {
  const emoIdx = Math.floor(random() * EMOTIONS.length);
  const emoji = EMOTIONS[emoIdx].emoji;
  const correctAnswer = EMOTIONS[emoIdx].name;

  let wordIdx: number;
  do {
    wordIdx = Math.floor(random() * EMOTIONS.length);
  } while (wordIdx === emoIdx);

  const word = EMOTIONS[wordIdx].word;
  const opts = new Set<string>([correctAnswer]);

  while (opts.size < 4) {
    opts.add(EMOTIONS[Math.floor(random() * EMOTIONS.length)].name);
  }

  return {
    emoji,
    word,
    correctAnswer,
    options: shuffleItems(Array.from(opts), random),
  };
};

export const useEmojiStroopController = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const { phase, level, addScore, loseLife, nextLevel } = engine;
  const [currentRound, setCurrentRound] = useState<EmojiStroopRound | null>(null);
  const answerTimeoutRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);

  const clearAnswerTimeout = useCallback(() => {
    if (answerTimeoutRef.current !== null) {
      window.clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = null;
    }
  }, []);

  const startLevel = useCallback(() => {
    setCurrentRound(generateRound());
    playSound("slide");
  }, [playSound]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => clearAnswerTimeout, [clearAnswerTimeout]);

  useEffect(() => {
    if (phase === "playing" && !currentRound) {
      startLevel();
    } else if (
      phase === "welcome" ||
      phase === "game_over" ||
      phase === "victory"
    ) {
      clearAnswerTimeout();
      dismissFeedback();
      setCurrentRound(null);
    }
  }, [phase, currentRound, startLevel, clearAnswerTimeout, dismissFeedback]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (phase !== "playing" || !!feedbackState || !currentRound) return;

      const correct = answer === currentRound.correctAnswer;
      const feedbackMessage = buildEmojiStroopFeedbackMessage(
        correct,
        currentRound.correctAnswer,
        level,
        MAX_LEVEL,
      );

      clearAnswerTimeout();

      if (correct) {
        showFeedback(true, feedbackMessage);
        addScore(20 + level * 5);

        answerTimeoutRef.current = window.setTimeout(() => {
          answerTimeoutRef.current = null;
          dismissFeedback();
          if (phaseRef.current !== "playing") return;

          if (level >= MAX_LEVEL) {
            engine.setGamePhase("victory");
          } else {
            nextLevel();
            startLevel();
          }
        }, FEEDBACK_DURATION_MS);
      } else {
        showFeedback(false, feedbackMessage);
        loseLife();
        answerTimeoutRef.current = window.setTimeout(() => {
          answerTimeoutRef.current = null;
          dismissFeedback();
        }, FEEDBACK_DURATION_MS);
      }
    },
    [
      phase,
      feedbackState,
      currentRound,
      clearAnswerTimeout,
      level,
      showFeedback,
      addScore,
      dismissFeedback,
      engine,
      nextLevel,
      startLevel,
      loseLife,
    ],
  );

  return { engine, feedback, currentRound, handleAnswer };
};
