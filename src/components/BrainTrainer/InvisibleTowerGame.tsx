import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Zap, TrendingUp } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const GAME_ID = "gorunmez-kule";
const GAME_TITLE = "Görünmez Kule";
const GAME_DESCRIPTION = "Zihninde bir kule inşa et ve sayıları topla! Görünmez blokların değerlerini hatırla ve zirveye ulaş.";
const TUZO_TEXT = "TUZÖ 2.1.1 Ardışık Hafıza & Hesaplama";

interface TowerSegment {
  id: string;
  value: number;
  multiplier?: number;
  isNegative: boolean;
  row: number;
  col: number;
}

type LocalPhase = "building" | "flashing" | "question";

const InvisibleTowerGame: React.FC = () => {
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

  const { phase, level, addScore, loseLife, nextLevel } = engine;

  const [localPhase, setLocalPhase] = useState<LocalPhase>("building");
  const [tower, setTower] = useState<TowerSegment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateTower = useCallback((lvl: number) => {
    const rows = Math.min(6, 2 + Math.floor(lvl / 4));
    const newTower: TowerSegment[] = [];
    let totalSum = 0;

    for (let r = 0; r < rows; r++) {
      const colsInRow = rows - r;
      for (let c = 0; c < colsInRow; c++) {
        const isNegative = lvl > 5 && Math.random() < 0.15;
        const multiplier =
          lvl > 8 && Math.random() < 0.1
            ? Math.random() < 0.7 ? 2 : 3
            : undefined;

        let val = Math.floor(Math.random() * 9) + 1;
        if (isNegative) val = -val;

        const effectiveVal = val * (multiplier || 1);
        totalSum += effectiveVal;

        newTower.push({
          id: Math.random().toString(36).substr(2, 9),
          value: Math.abs(val),
          multiplier,
          isNegative,
          row: r,
          col: c,
        });
      }
    }

    const opts = [totalSum];
    while (opts.length < 4) {
      const fake = totalSum + (Math.floor(Math.random() * 20) - 10);
      if (!opts.includes(fake)) opts.push(fake);
    }

    setTower(newTower);
    setCorrectAnswer(totalSum);
    setOptions(opts.sort(() => Math.random() - 0.5));
  }, []);

  const startRound = useCallback((lvl: number) => {
    generateTower(lvl);
    setCurrentIndex(-1);
    setLocalPhase("building");
    playSound("detective_mystery");
  }, [generateTower, playSound]);

  const prevPhaseRef = useRef<string>("");
  useEffect(() => {
    if (phase === "playing" && prevPhaseRef.current !== "playing") {
      startRound(level);
    } else if (phase === "welcome") {
      setTower([]);
      setStreak(0);
    }
    prevPhaseRef.current = phase;
  }, [phase, level, startRound]);

  useEffect(() => {
    return () => { if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current); };
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;

    if (localPhase === "building") {
      const timer = safeTimeout(() => setLocalPhase("flashing"), 1000);
      return () => clearTimeout(timer);
    }

    if (localPhase === "flashing") {
      if (currentIndex < tower.length - 1) {
        const timer = safeTimeout(() => {
          setCurrentIndex((p) => p + 1);
        }, 1000 - Math.min(600, level * 30));
        return () => clearTimeout(timer);
      } else {
        const timer = safeTimeout(() => {
          setLocalPhase("question");
          playSound("complete");
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, localPhase, currentIndex, tower.length, level, playSound]);

  const handleSelect = (val: number) => {
    if (localPhase !== "question" || phase !== "playing" || feedbackState) return;

    const isCorrect = val === correctAnswer;
    showFeedback(isCorrect);
    playSound(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      addScore(10 * level + newStreak * 5);

      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = safeTimeout(() => {
        answerTimeoutRef.current = null;
        dismissFeedback();
        nextLevel();
        if (level < 20) {
          startRound(level + 1);
        }
      }, 1200);
    } else {
      setStreak(0);
      loseLife();

      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = safeTimeout(() => {
        answerTimeoutRef.current = null;
        dismissFeedback();
        if (engine.lives > 1) {
          startRound(level);
        }
      }, 1200);
    }
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: TrendingUp,
    accentColor: "cyber-pink",
    maxLevel: 20,
    howToPlay: [
      "Bloklarda parlayan sayıları dikkatle takip et.",
      "Sayıları zihninde toplayarak ilerle (Eksilere DİKKAT!).",
      "20 katı başarıyla tırmanarak kule fatihi ol!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full max-w-2xl mx-auto">
          {phase === "playing" && (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-lg flex flex-col items-center gap-4"
            >
              <div className="flex flex-col-reverse items-center gap-1 sm:gap-1.5 relative pt-8">
                {localPhase === "flashing" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -top-4 px-3 py-1.5 rounded-xl text-xs font-nunito font-black bg-cyber-green border-2 border-black/10 text-black shadow-neo-sm animate-pulse flex items-center gap-1.5 uppercase tracking-widest z-20"
                  >
                    <Zap size={12} fill="currentColor" /> TARAMA: {currentIndex + 1}/{tower.length}
                  </motion.div>
                )}

                {Array.from({ length: tower.length > 0 ? Math.max(...tower.map((t) => t.row)) + 1 : 0 }).map((_, rIdx) => (
                  <div key={rIdx} className="flex gap-1 sm:gap-1.5">
                    {tower.filter((t) => t.row === rIdx).map((segment) => {
                      const gIdx = tower.findIndex((t) => t.id === segment.id);
                      const isActive = gIdx === currentIndex;
                      const isPast = gIdx < currentIndex;
                      const isQuestion = localPhase === "question";

                      return (
                        <motion.div
                          key={segment.id}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{
                            scale: isActive ? 1.15 : 1,
                            opacity: isQuestion && !isPast ? 0.3 : 1,
                          }}
                          className={`w-14 h-10 sm:w-16 sm:h-12 rounded-xl border-3 transition-all duration-300 relative flex items-center justify-center ${isActive ? "bg-cyber-yellow border-black/10 shadow-neo-sm z-10" : "bg-white dark:bg-slate-700 border-black/80 shadow-neo-sm opacity-90"}`}
                        >
                          {isActive && (
                            <motion.div
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="flex flex-col items-center"
                            >
                              <span className={`text-xl sm:text-2xl font-nunito font-black drop-shadow-sm ${segment.isNegative ? "text-cyber-pink" : "text-black"}`}>
                                {segment.isNegative ? "-" : ""}
                                {segment.value}
                              </span>
                              {segment.multiplier && (
                                <span className="absolute -top-2.5 -right-2.5 text-[9px] sm:text-[10px] font-nunito font-black px-1.5 py-0.5 rounded-lg bg-cyber-pink border-2 border-black/10 text-black shadow-neo-sm animate-bounce uppercase tracking-tighter">
                                  x{segment.multiplier}
                                </span>
                              )}
                            </motion.div>
                          )}
                          {isQuestion && isPast && (
                            <CheckCircle2 className="text-cyber-green opacity-50 absolute" size={20} />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {localPhase === "question" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-sm p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 shadow-neo-sm text-center"
                >
                  <h3 className="text-lg sm:text-xl font-nunito font-black text-slate-800 dark:text-slate-100 mb-4 tracking-widest uppercase">
                    Kulenin Toplam Değeri?
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {options.map((opt, i) => (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelect(opt)}
                        className="py-3 sm:py-4 rounded-xl text-2xl sm:text-3xl font-nunito font-black transition-all duration-300 border-2 border-black/10 shadow-neo-sm active:translate-y-1 active:shadow-none bg-slate-50 dark:bg-slate-700 text-black dark:text-white"
                      >
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default InvisibleTowerGame;
