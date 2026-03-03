import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import GameOptionButton from "./shared/GameOptionButton";
import type { FeedbackResult } from "./shared/GameOptionButton";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { GAME_COLORS } from './shared/gameColors';

const GAME_ID = "stroop";
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

interface Round {
  word: string;
  textColor: string;
  correctAnswer: string;
  options: string[];
}

const COLORS = [
  { name: "KIRMIZI", hex: "#E53935" },
  { name: "MAVİ", hex: "#00E5FF" },
  { name: "YEŞİL", hex: "#00FF66" },
  { name: "SARI", hex: GAME_COLORS.yellow },
  { name: "TURUNCU", hex: "#FF9900" },
  { name: "MOR", hex: "#9D4EDD" },
  { name: "PEMBE", hex: "#FF69B4" },
  { name: "SİYAH", hex: "#000000" },
];

const StroopGame: React.FC = () => {
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
    initialLives: INITIAL_LIVES,
  });
  const { phase, level, lives, addScore, loseLife, nextLevel, setGamePhase } = engine;

  const feedback = useGameFeedback({
    duration: 1000,
  });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);

  const generateRound = useCallback((): Round => {
    const wordColorIndex = Math.floor(Math.random() * COLORS.length);
    const textColorIndex = Math.floor(Math.random() * COLORS.length);

    // Sometimes force them to be the same, sometimes different
    const isMatching = Math.random() > 0.6;
    const txtIdx = isMatching ? wordColorIndex : textColorIndex;

    const word = COLORS[wordColorIndex].name;
    const textColor = COLORS[txtIdx].hex;
    const correctAnswer = COLORS[txtIdx].name;

    const wrongOptions = COLORS.filter((c) => c.name !== correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => c.name);

    const options = [correctAnswer, ...wrongOptions].sort(
      () => Math.random() - 0.5
    );

    return { word, textColor, correctAnswer, options };
  }, []);

  useEffect(() => {
    if (phase === "playing" && !currentRound) {
      setCurrentRound(generateRound());
      setCorrectCount(0);
      setStreak(0);
    } else if (phase === "welcome") {
      setCurrentRound(null);
    }
  }, [phase, currentRound, generateRound]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (phase !== "playing" || feedbackState || !currentRound) return;

      const isCorrect = answer === currentRound.correctAnswer;
      showFeedback(isCorrect);
      playSound(isCorrect ? "correct" : "incorrect");

      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        setStreak((s) => s + 1);
        addScore(level * 20 + streak * 5);

        const newCorrect = correctCount + 1;
        // Level up every 8 correct answers
        if (newCorrect % 8 === 0 && level < MAX_LEVEL) {
          nextLevel();
          playSound("success");
        } else if (newCorrect % 8 === 0 && level >= MAX_LEVEL) {
          setGamePhase("victory");
          return;
        }
      } else {
        setStreak(0);
        loseLife();
      }

      safeTimeout(() => {
        dismissFeedback();
        if (phase === "playing" && (isCorrect || lives > 1)) {
          setCurrentRound(generateRound());
          playSound("slide");
        }
      }, 1000);
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
      generateRound,
      safeTimeout,
    ]
  );

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Stroop Testi",
        icon: Target,
        description:
          "Yazının RENGİNİ okumaya çalış, KELİMEYİ değil! Beyni şaşırtan bu klasik testte renk-kelime algını hızlandır.",
        howToPlay: [
          "Ekranda yazılı olan kelimeye odaklanma.",
          "Kelimenin HANGİ RENKTE YAZILDIĞINI işaretle.",
          "Süre bitmeden olabildiğince çok eşleşme yap.",
        ],
        tuzoCode: "2.1.2 Seçici Dikkat",
        accentColor: "cyber-yellow",
        maxLevel: MAX_LEVEL,
      }}
    >
      {() => (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          {phase === "playing" && currentRound && (
            <motion.div
              key={`round-${correctCount + (10 - lives) * 100}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-lg flex flex-col gap-6 sm:gap-8"
            >


              {/* Question Area */}
              <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-8 sm:p-12 shadow-neo-sm flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden -rotate-1">
                <div className="absolute inset-0 pattern-grid opacity-10 dark:opacity-5 pointer-events-none" />

                <motion.h2
                  className="relative z-10 w-full max-w-full px-2 text-center leading-tight font-nunito font-black uppercase text-[clamp(1.8rem,10vw,3.5rem)] sm:text-[clamp(2rem,7vw,4.5rem)] tracking-[0.04em] sm:tracking-[0.08em] break-words"
                  style={{
                    color: currentRound.textColor,
                  }}
                  animate={{
                    scale: feedbackState ? (feedbackState.correct ? 1.05 : 0.95) : 1,
                    rotate: feedbackState ? (feedbackState.correct ? 2 : -2) : 0
                  }}
                >
                  {currentRound.word}
                </motion.h2>

                {/* Floating labels for extra distraction */}
                <div className="absolute top-4 left-6 text-2xl font-black font-nunito text-slate-200 dark:text-slate-700 -rotate-12 blur-[1px]">MAVİ</div>
                <div className="absolute bottom-6 right-8 text-3xl font-black font-nunito text-slate-200 dark:text-slate-700 rotate-12 blur-[1px]">SARI</div>
              </div>



              {/* Options Grid */}
              <div className="grid grid-cols-2 gap-4">
                {currentRound.options.map((opt, idx) => {
                  const isCorrect = opt === currentRound.correctAnswer;
                  const rotateClass = idx % 2 === 0 ? "rotate-1" : "-rotate-1";

                  let result: FeedbackResult = null;
                  if (feedbackState) {
                    result = isCorrect ? "correct" : "dimmed";
                  }

                  return (
                    <GameOptionButton
                      key={`${opt}-${idx}`}
                      variant="text"
                      label={opt}
                      onClick={() => handleAnswer(opt)}
                      disabled={!!feedbackState}
                      feedbackResult={result}
                      className={`h-20 sm:h-24 text-base sm:text-xl lg:text-2xl uppercase tracking-[0.08em] sm:tracking-[0.14em] ${!feedbackState ? rotateClass : ""}`}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default StroopGame;
