import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Link2 } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { GAME_COLORS } from './shared/gameColors';

const GAME_ID = "cift-mod-hafiza";
const GAME_TITLE = "Çift Mod Hafıza";
const GAME_DESCRIPTION = "Hem şekilleri hem renkleri hafızana yaz! Çift yönlü sorularla zihnini test et.";
const TUZO_TEXT = "TUZÖ 5.2.1 Görsel Hafıza";

interface SymbolColor {
  symbol: string;
  color: string;
  colorName: string;
}

interface Question {
  type: "color-to-symbol" | "symbol-to-color";
  query: string;
  hint: string;
  correctAnswer: string;
  options: string[];
}

const SYMBOLS = ["⭐", "▲", "●", "◆", "⬟", "⬢", "♠", "♥"];
const COLORS = [
  { hex: GAME_COLORS.incorrect, name: "Kırmızı" },
  { hex: GAME_COLORS.blue, name: "Mavi" },
  { hex: GAME_COLORS.emerald, name: "Yeşil" },
  { hex: GAME_COLORS.yellow, name: "Sarı" },
  { hex: GAME_COLORS.purple, name: "Mor" },
  { hex: GAME_COLORS.pink, name: "Pembe" },
  { hex: GAME_COLORS.orange, name: "Turuncu" },
];

type LocalPhase = "memorize" | "question" | "feedback";

const DualBindGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1000 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;
  const { phase, level, lives, addScore, loseLife, nextLevel } = engine;

  const [localPhase, setLocalPhase] = useState<LocalPhase>("memorize");
  const [symbolColors, setSymbolColors] = useState<SymbolColor[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [countdown, setCountdown] = useState(6);
  const [streak, setStreak] = useState(0);

  const generateSymbolColors = useCallback((lvl: number) => {
    const count = lvl <= 5 ? 3 : lvl <= 12 ? 4 : 5;
    const shuffledSymbols = [...SYMBOLS].sort(() => Math.random() - 0.5).slice(0, count);
    const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5).slice(0, count);
    return shuffledSymbols.map((symbol, i) => ({
      symbol,
      color: shuffledColors[i].hex,
      colorName: shuffledColors[i].name,
    }));
  }, []);

  const generateDualQuestions = useCallback((pairs: SymbolColor[]): Question[] => {
    const targetPair = pairs[Math.floor(Math.random() * pairs.length)];
    const otherPairs = pairs.filter((p) => p !== targetPair);
    const wrongSymbols = otherPairs.map((p) => p.symbol).slice(0, 3);
    const symbolOptions = [targetPair.symbol, ...wrongSymbols].sort(() => Math.random() - 0.5);
    const q1: Question = {
      type: "color-to-symbol",
      query: "Bu renkteki şekil hangisiydi?",
      hint: targetPair.color,
      correctAnswer: targetPair.symbol,
      options: symbolOptions,
    };

    const wrongColors = otherPairs.map((p) => p.colorName).slice(0, 3);
    const colorOptions = [targetPair.colorName, ...wrongColors].sort(() => Math.random() - 0.5);
    const q2: Question = {
      type: "symbol-to-color",
      query: "Bu şekil hangi renkteydi?",
      hint: targetPair.symbol,
      correctAnswer: targetPair.colorName,
      options: colorOptions,
    };
    return [q1, q2];
  }, []);

  const startRound = useCallback((lvl: number) => {
    const pairs = generateSymbolColors(lvl);
    setSymbolColors(pairs);
    setQuestions(generateDualQuestions(pairs));
    setCurrentQuestionIndex(0);
    const mTime = Math.max(3, 7 - Math.floor(lvl / 4));
    setCountdown(mTime);
    setLocalPhase("memorize");
  }, [generateSymbolColors, generateDualQuestions]);

  const prevPhaseRef = useRef<string>("");
  useEffect(() => {
    if (phase === "playing" && prevPhaseRef.current !== "playing") {
      startRound(level);
    } else if (phase === "welcome") {
      setSymbolColors([]);
      setQuestions([]);
      setStreak(0);
    }
    prevPhaseRef.current = phase;
  }, [phase, level, startRound]);

  useEffect(() => {
    if (localPhase === "memorize" && countdown > 0 && phase === "playing") {
      const timer = safeTimeout(() => setCountdown(p => p - 1), 1000);
      return () => clearTimeout(timer);
    } else if (localPhase === "memorize" && countdown === 0 && phase === "playing") {
      setLocalPhase("question");
    }
  }, [localPhase, countdown, phase, safeTimeout]);

  const handleAnswer = useCallback((answer: string) => {
    if (feedbackState || questions.length === 0 || localPhase !== "question") return;

    const currentQ = questions[currentQuestionIndex];
    const isCorrect = answer === currentQ.correctAnswer;

    showFeedback(isCorrect);
    playSound(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      addScore(10 * level + newStreak * 5);
      setLocalPhase("feedback");

      safeTimeout(() => {
        dismissFeedback();
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
          setLocalPhase("question");
        } else {
          if (level >= 20) {
            engine.setGamePhase("victory");
          } else {
            nextLevel();
            startRound(level + 1);
          }
        }
      }, 1200);
    } else {
      setStreak(0);
      setLocalPhase("feedback");
      const willGameOver = lives <= 1;

      safeTimeout(() => {
        dismissFeedback();
        loseLife();
        if (!willGameOver) {
          startRound(level);
        }
      }, 1200);
    }
  }, [feedbackState, questions, localPhase, currentQuestionIndex, streak, level, lives, showFeedback, playSound, addScore, dismissFeedback, nextLevel, loseLife, startRound, safeTimeout, engine]);

  const currentQuestion = questions[currentQuestionIndex];

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Link2,
    accentColor: "cyber-pink",
    maxLevel: 20,
    howToPlay: [
      "Şekil ve renk eşleşmelerini kısa sürede ezberle.",
      "'Bu renk hangi şekildi?' veya 'Bu şekil hangi renkti?' sorularını cevapla.",
      "20 seviyeyi tamamlayarak şampiyonluğa ulaş!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full max-w-2xl mx-auto">
          {localPhase === "memorize" && phase === "playing" && (
            <motion.div
              key="memorize"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center w-full max-w-lg space-y-4"
            >
              <div className="flex flex-col items-center gap-1 mb-3">
                <span className="bg-cyber-yellow border-2 border-black/10 px-3 py-1.5 shadow-neo-sm rounded-lg text-xs font-nunito font-black uppercase text-black tracking-widest">
                  EZBERLE
                </span>
                <span className="text-5xl md:text-6xl font-nunito font-black text-black dark:text-white drop-shadow-sm mt-1">
                  {countdown}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 shadow-neo-sm">
                {symbolColors.map((sc, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex flex-col items-center gap-3 p-4 sm:p-6 rounded-xl bg-slate-50 dark:bg-slate-700/50 border-2 border-black/10 shadow-neo-sm"
                  >
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl border-2 border-black/10 shadow-neo-sm" style={{ backgroundColor: sc.color }} />
                    <span className="text-6xl sm:text-7xl font-black drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]" style={{ color: sc.color }}>
                      {sc.symbol}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {(localPhase === "question" || localPhase === "feedback") && phase === "playing" && currentQuestion && (
            <motion.div
              key="question"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md text-center space-y-4"
            >
              <div className="flex justify-center mb-1">
                <span className={`px-4 py-1.5 rounded-xl text-xs font-nunito font-black tracking-widest border-2 border-black/10 shadow-neo-sm ${currentQuestion.type === "color-to-symbol" ? "bg-cyber-blue text-white" : "bg-cyber-pink text-black"}`}>
                  {currentQuestion.type === "color-to-symbol" ? "RENK ➤ ŞEKİL" : "ŞEKİL ➤ RENK"}
                </span>
              </div>

              <div className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 shadow-neo-sm mb-4">
                <p className="text-slate-800 dark:text-slate-200 font-nunito font-black mb-4 text-lg sm:text-xl tracking-wide uppercase">
                  {currentQuestion.query}
                </p>
                {currentQuestion.type === "color-to-symbol" ? (
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl mx-auto border-2 border-black/10 shadow-neo-sm" style={{ backgroundColor: currentQuestion.hint }} />
                ) : (
                  <div className="text-7xl sm:text-8xl mb-2 drop-shadow-[3px_3px_0_rgba(0,0,0,0.3)]">
                    {currentQuestion.hint}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {currentQuestion.options.map((option, idx) => {
                  const colorHex = COLORS.find((c) => c.name === option)?.hex;
                  return (
                    <motion.button
                      key={idx}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAnswer(option)}
                      className="p-5 sm:p-6 rounded-xl font-nunito font-black text-4xl sm:text-5xl transition-all border-2 border-black/10 flex flex-col items-center justify-center gap-2 shadow-neo-sm active:translate-y-1 active:shadow-none bg-white dark:bg-slate-700 text-black dark:text-white"
                      style={currentQuestion.type === "symbol-to-color" && colorHex ? { backgroundColor: colorHex, color: "#000" } : undefined}
                    >
                      <span className={`relative z-10 ${currentQuestion.type === "symbol-to-color" ? "text-white drop-shadow-neo-sm" : ""}`}>
                        {option}
                      </span>
                    </motion.button>
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

export default DualBindGame;
