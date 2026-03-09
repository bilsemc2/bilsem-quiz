import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Shapes } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from "../../hooks/useSafeTimeout";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../hooks/useGamePerformanceTracker";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useGameEngine } from "./shared/useGameEngine";
import {
  areWagonStatesEqual,
  calculateWagonState,
  generateOptions,
  generatePattern,
} from "./patternIQ/logic";
import { PatternIQBoard } from "./patternIQ/PatternIQBoard";
import type { PatternData, WagonState } from "./patternIQ/types";

const GAME_ID = "patterniq-express";
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const WAGON_COUNT = 5;

const PatternIQGame: React.FC = () => {
  const questionStartedAtRef = useRef(0);
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
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [currentPattern, setCurrentPattern] = useState<PatternData | null>(null);
  const [options, setOptions] = useState<WagonState[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const setupRound = useCallback((level: number) => {
    const pattern = generatePattern(level);
    setCurrentPattern(pattern);
    setOptions(generateOptions(pattern, WAGON_COUNT - 1));
    setRevealed(false);
    setSelectedIndex(null);
    questionStartedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (engine.phase === "playing" && !currentPattern) {
      playSound("slide");
      setupRound(engine.level);
    } else if (
      engine.phase === "welcome" ||
      engine.phase === "game_over" ||
      engine.phase === "victory"
    ) {
      setCurrentPattern(null);
      setOptions([]);
      setSelectedIndex(null);
      setRevealed(false);
      questionStartedAtRef.current = 0;
      resetPerformance();
    }
  }, [
    engine.phase,
    engine.level,
    currentPattern,
    playSound,
    resetPerformance,
    setupRound,
  ]);

  const handleAnswer = useCallback(
    (index: number) => {
      if (
        engine.phase !== "playing" ||
        revealed ||
        !currentPattern ||
        !!feedbackState
      ) {
        return;
      }

      setSelectedIndex(index);
      setRevealed(true);

      const targetState = calculateWagonState(currentPattern, WAGON_COUNT - 1);
      const isCorrect = areWagonStatesEqual(options[index], targetState);

      recordAttempt({
        isCorrect,
        responseMs:
          questionStartedAtRef.current > 0
            ? Date.now() - questionStartedAtRef.current
            : null,
      });

      showFeedback(isCorrect);
      playSound(isCorrect ? "correct" : "incorrect");

      safeTimeout(() => {
        dismissFeedback();
        if (isCorrect) {
          engine.addScore(10 * engine.level);
          if (engine.level >= MAX_LEVEL) {
            engine.setGamePhase("victory");
            playSound("success");
          } else {
            engine.nextLevel();
            setupRound(engine.level + 1);
          }
        } else {
          engine.loseLife();
          if (engine.lives > 1) {
            setupRound(engine.level);
          }
        }
      }, 1500);
    },
    [
      currentPattern,
      dismissFeedback,
      engine,
      feedbackState,
      options,
      playSound,
      recordAttempt,
      revealed,
      safeTimeout,
      setupRound,
      showFeedback,
    ],
  );

  const skipQuestion = useCallback(() => {
    if (engine.phase !== "playing" || revealed || !!feedbackState) {
      return;
    }

    engine.addScore(-10);
    playSound("click");
    setupRound(engine.level);
  }, [engine, feedbackState, playSound, revealed, setupRound]);

  const extraHudItems = (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={skipQuestion}
      disabled={engine.phase !== "playing" || !!feedbackState}
      className={`flex items-center gap-2 rounded-xl border-2 border-black/10 bg-white px-3 py-2 font-nunito text-sm font-bold text-black shadow-neo-sm transition-all dark:bg-slate-800 dark:text-white sm:px-4 ${
        engine.phase !== "playing" || !!feedbackState
          ? "cursor-not-allowed opacity-50"
          : "hover:bg-slate-50"
      }`}
    >
      <RefreshCw size={16} className="stroke-[3] text-black dark:text-white" />
      <span>Atla</span>
    </motion.button>
  );

  const gameConfig = {
    title: "PatternIQ Express",
    description:
      "Görsel örüntülerin gizemini çöz ve bir sonraki şekli tahmin et. Mantık ve dikkat yeteneğini zirveye taşı!",
    tuzoCode: "TUZÖ 5.5.1 Örüntü Analizi",
    icon: Shapes,
    accentColor: "cyber-pink",
    wideLayout: true,
    maxLevel: MAX_LEVEL,
    howToPlay: [
      <>Şekillerin nasıl değiştiğine <strong>dikkat et</strong></>,
      <>Oluşan <strong>örüntü kuralını bul</strong></>,
      <>Sıradaki vagonu <strong>en hızlı şekilde seç</strong></>,
    ],
    extraHudItems:
      engine.phase === "playing" || engine.phase === "feedback"
        ? extraHudItems
        : undefined,
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() =>
        currentPattern ? (
          <PatternIQBoard
            pattern={currentPattern}
            options={options}
            revealed={revealed}
            selectedIndex={selectedIndex}
            feedbackState={feedbackState}
            wagonCount={WAGON_COUNT}
            onAnswer={handleAnswer}
          />
        ) : null
      }
    </BrainTrainerShell>
  );
};

export default PatternIQGame;
