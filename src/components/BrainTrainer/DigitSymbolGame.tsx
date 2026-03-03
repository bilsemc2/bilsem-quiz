import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Hash } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "simge-kodlama";
const GAME_TITLE = "Simge Kodlama";
const GAME_DESCRIPTION = "Sayılarla şekiller arasındaki bağı hızla kur, dikkatinle sembolleri eşleştirerek rekor kır!";
const TUZO_TEXT = "TUZÖ 5.6.1 Rakam-Sembol Eşleştirme & Hız";
const MAX_LEVEL = 20;

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
    maxLevel: MAX_LEVEL,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const { phase, addScore, loseLife, nextLevel } = engine;

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
  }, [phase, symbolMap, startLevel, engine.level]);

  const handleAnswer = useCallback(
    (sym: string) => {
      if (phase !== "playing" || !!feedbackState) return;

      const correct = symbolMap[currentNumber] === sym;

      if (correct) {
        playSound("pop");
        addScore(15 + engine.level * 2);

        const ns = scoreInLevel + 1;
        const targetScore = 5 + Math.floor(engine.level / 4);

        if (ns >= targetScore) {
          playSound("correct");
          showFeedback(true);
          safeTimeout(() => {
            dismissFeedback();
            if (engine.level >= MAX_LEVEL) {
              engine.setGamePhase("victory");
              playSound("success");
            } else {
              nextLevel();
              startLevel();
            }
          }, 1000);
        } else {
          setScoreInLevel(ns);
          setCurrentNumber(Math.floor(Math.random() * 9) + 1);
        }
      } else {
        playSound("incorrect");
        showFeedback(false);
        loseLife();
        safeTimeout(() => {
          dismissFeedback();
          setCurrentNumber(Math.floor(Math.random() * 9) + 1);
        }, 1000);
      }
    },
    [phase, feedbackState, symbolMap, currentNumber, scoreInLevel, playSound, addScore, showFeedback, dismissFeedback, loseLife, nextLevel, engine, safeTimeout, startLevel],
  );

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Hash,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Üstteki anahtardan her rakamın sembolünü öğren.",
      "Ortada sorulan rakama karşılık gelen sembolü aşağıdaki seçeneklerden bul.",
      "Süre bitmeden tüm eşleştirmeleri hızla tamamla!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full max-w-3xl mx-auto">
          {phase === "playing" && Object.keys(symbolMap).length > 0 && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full space-y-4 flex flex-col items-center"
            >
              <div className="flex flex-col items-center gap-2 relative">
                <span className="bg-cyber-pink px-3 py-1 absolute -top-6 z-20 shadow-neo-sm border-2 border-black/10 rounded-lg text-[10px] font-nunito font-black uppercase text-black tracking-widest">
                  HEDEF RAKAM
                </span>
                <motion.div
                  key={currentNumber}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-24 h-24 md:w-32 md:h-32 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl shadow-neo-sm flex items-center justify-center relative z-10"
                >
                  <span className="text-5xl md:text-6xl font-nunito font-black text-black dark:text-white">
                    {currentNumber}
                  </span>
                </motion.div>

                <div className="flex gap-1.5 mt-2 bg-white dark:bg-slate-800 border-2 border-black/10 px-3 py-1.5 rounded-lg shadow-neo-sm">
                  {Array.from({ length: 5 + Math.floor(engine.level / 4) }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full border-2 border-black/10 ${i < scoreInLevel ? "bg-cyber-yellow" : "bg-slate-200 dark:bg-slate-600"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 md:p-4 border-2 border-black/10 shadow-neo-sm w-full max-w-2xl">
                <div className="flex flex-wrap sm:grid sm:grid-cols-9 gap-1.5 sm:gap-2 justify-center">
                  {Object.entries(symbolMap).map(([num, sym]) => (
                    <div
                      key={num}
                      className="bg-cyber-yellow flex-1 sm:flex-auto min-w-[3rem] border-2 border-black/10 rounded-xl p-1.5 flex flex-col items-center justify-center gap-0.5 shadow-neo-sm"
                    >
                      <span className="text-lg sm:text-xl font-nunito font-black text-black">{num}</span>
                      <div className="h-0.5 w-full max-w-[1.5rem] bg-black/20 rounded-full" />
                      <span className="text-xl sm:text-2xl font-black text-black">{sym}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 w-full max-w-2xl mx-auto">
                {SYMBOLS.map((sym) => (
                  <motion.button
                    key={sym}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAnswer(sym)}
                    className="aspect-[4/3] sm:aspect-square bg-white dark:bg-slate-700 border-2 border-black/10 rounded-xl flex items-center justify-center shadow-neo-sm transition-all active:translate-y-1 active:shadow-none"
                  >
                    <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
                      {sym}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default DigitSymbolGame;
