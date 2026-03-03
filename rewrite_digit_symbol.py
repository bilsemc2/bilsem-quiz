import re

content = """import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Sparkles } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "rakam-sembol";
const GAME_TITLE = "Rakam Sembol";
const GAME_DESCRIPTION = "Sayılarla şekiller arasındaki bağı hızla kur, dikkatinle sembolleri eşleştirerek rekor kır!";
const TUZO_TEXT = "TUZÖ 5.6.1 Rakam-Sembol Eşleştirme & Hız";

const SYMBOLS = ["◯", "△", "□", "◇", "★", "♡", "⬡", "⬢", "✕"];

const createSymbolMap = () => {
  const shuffled = [...SYMBOLS].sort(() => Math.random() - 0.5);
  const map: Record<number, string> = {};
  for (let i = 1; i <= 9; i++) map[i] = shuffled[i - 1];
  return map;
};

const DigitSymbolGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const { phase, level, addScore, loseLife, nextLevel } = engine;

  const [symbolMap, setSymbolMap] = useState<Record<number, string>>({});
  const [currentNumber, setCurrentNumber] = useState<number>(1);
  const [scoreInLevel, setScoreInLevel] = useState(0);

  const startLevel = useCallback(() => {
    setSymbolMap(createSymbolMap());
    setCurrentNumber(Math.floor(Math.random() * 9) + 1);
    setScoreInLevel(0);
    playSound("slide");
  }, [playSound]);

  useEffect(() => {
    if (phase === "playing" && Object.keys(symbolMap).length === 0) {
      startLevel();
    } else if (phase === "welcome") {
      setSymbolMap({});
    }
  }, [phase, symbolMap, startLevel]);

  const handleAnswer = (sym: string) => {
    if (phase !== "playing" || !!feedbackState) return;

    const correct = symbolMap[currentNumber] === sym;

    if (correct) {
      playSound("pop");
      addScore(15 + level * 2);
      
      const ns = scoreInLevel + 1;
      const targetScore = 5 + Math.floor(level / 4);
      
      if (ns >= targetScore) {
        playSound("correct");
        showFeedback(true);
        setTimeout(() => {
          dismissFeedback();
          nextLevel();
          startLevel();
        }, 1000);
      } else {
        setScoreInLevel(ns);
        setCurrentNumber(Math.floor(Math.random() * 9) + 1);
      }
    } else {
      playSound("incorrect");
      showFeedback(false);
      loseLife();
      setTimeout(dismissFeedback, 1000);
    }
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Hash,
    accentColor: "cyber-pink",
    maxLevel: 20,
    howToPlay: [
      "Üstteki anahtardan her rakamın sembolünü öğren.",
      "Ortada sorulan rakama karşılık gelen sembolü aşağıdaki seçeneklerden bul.",
      "Süre bitmeden tüm eşleştirmeleri hızla tamamla!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-start sm:justify-center flex-1 p-4 mb-4 mt-8 w-full max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {phase === "playing" && !feedbackState && Object.keys(symbolMap).length > 0 && (
              <motion.div
                key="game"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full space-y-8 flex flex-col items-center"
              >
                {/* Target Number Highlight */}
                <div className="flex flex-col items-center gap-2 relative mt-4">
                  <span className="bg-cyber-pink px-4 py-2 top-0 -mt-8 translate-y-4 absolute z-20 shadow-[4px_4px_0_#000] border-2 border-black rounded-lg text-xs font-syne font-black uppercase text-black tracking-widest rotate-3">
                    HEDEF RAKAM
                  </span>
                  <motion.div
                    key={currentNumber}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="w-32 h-32 md:w-40 md:h-40 bg-white dark:bg-slate-800 border-4 border-black rounded-[2rem] shadow-[12px_12px_0_#000] flex items-center justify-center -rotate-2 relative z-10"
                  >
                    <span className="text-6xl md:text-7xl font-syne font-black text-black dark:text-white drop-shadow-sm">
                      {currentNumber}
                    </span>
                  </motion.div>

                  <div className="flex gap-2 mt-4 bg-white dark:bg-slate-800 border-2 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0_#000] rotate-1">
                    {Array.from({ length: 5 + Math.floor(level / 4) }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full border-2 border-black ${i < scoreInLevel ? "bg-cyber-yellow" : "bg-slate-200 dark:bg-slate-600"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Symbol Map Key */}
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] md:rounded-[3rem] p-4 md:p-6 lg:p-8 border-4 border-black shadow-[16px_16px_0_#000] rotate-1 w-full max-w-3xl">
                  <div className="flex flex-wrap sm:grid sm:grid-cols-9 gap-2 sm:gap-3 justify-center">
                    {Object.entries(symbolMap).map(([num, sym]) => (
                      <div
                        key={num}
                        className="bg-cyber-yellow flex-1 sm:flex-auto min-w-[3.5rem] border-4 border-black rounded-[20px] p-2 flex flex-col items-center justify-center gap-1 sm:gap-2 shadow-[4px_4px_0_#000] -rotate-1 group hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] transition-transform"
                      >
                        <span className="text-xl sm:text-2xl font-syne font-black text-black">{num}</span>
                        <div className="h-1 w-full max-w-[2rem] bg-black/20 rounded-full" />
                        <span className="text-2xl sm:text-3xl font-black text-black drop-shadow-sm group-hover:scale-110 transition-transform">{sym}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selection Options */}
                <div className="grid grid-cols-3 sm:grid-cols-9 gap-3 w-full max-w-3xl mx-auto">
                  {SYMBOLS.map((sym) => (
                    <motion.button
                      key={sym}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAnswer(sym)}
                      className="aspect-[4/3] sm:aspect-square bg-white dark:bg-slate-700 border-4 border-black rounded-[20px] flex items-center justify-center shadow-[6px_6px_0_#000] hover:shadow-[10px_10px_0_#000] hover:bg-cyber-blue hover:text-white transition-all group"
                    >
                      <span className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white group-hover:scale-110 transition-transform">
                        {sym}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default DigitSymbolGame;
"""

with open("src/components/BrainTrainer/DigitSymbolGame.tsx", "w") as f:
    f.write(content)
