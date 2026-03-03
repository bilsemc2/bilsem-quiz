const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/BrainTrainer/ReflectionSumGame.tsx');

const content = `import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, FlipHorizontal, RotateCcw, CheckCircle2 } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useGameEngine } from "./shared/useGameEngine";
import { useGameFeedback } from "../../hooks/useGameFeedback";

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = "yansima-toplami";

type InternalStatus = "display" | "input_sequence" | "input_sum";

const ReflectionSumGame: React.FC = () => {
  const { playSound } = useSound();

  const engine = useGameEngine({
    gameId: GAME_ID,
    timeLimit: TIME_LIMIT,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
  });

  const feedback = useGameFeedback({ duration: 1500 });

  const [status, setStatus] = useState<InternalStatus>("display");
  const [digits, setDigits] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [userSum, setUserSum] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isMirrored, setIsMirrored] = useState(false);
  const [streak, setStreak] = useState(0);

  const generateSequence = useCallback((lvl: number) => {
    const len = Math.min(10, 4 + Math.floor(lvl / 2));
    const newDigits = Array.from(
      { length: len },
      () => Math.floor(Math.random() * 9) + 1,
    );
    setDigits(newDigits);
    setUserSequence([]);
    setUserSum("");
    setCurrentIndex(-1);
    setIsMirrored(lvl > 2 && Math.random() < 0.4);
    setStatus("display");
  }, []);

  useEffect(() => {
    if (engine.phase === "playing" && digits.length === 0) {
      generateSequence(1);
    } else if (engine.phase !== "playing" && digits.length > 0) {
      setDigits([]); // reset on unmount or game over
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.phase, digits.length]);

  useEffect(() => {
    if (engine.phase === "playing" && status === "display") {
      if (currentIndex < digits.length - 1) {
        const speed = Math.max(600, 1200 - engine.level * 40);
        const t = setTimeout(() => {
          setCurrentIndex((p) => p + 1);
          playSound("pop");
        }, speed);
        return () => clearTimeout(t);
      } else if (digits.length > 0) {
        const t = setTimeout(() => {
          setCurrentIndex(-1);
          setStatus("input_sequence");
        }, 1000);
        return () => clearTimeout(t);
      }
    }
  }, [engine.phase, status, currentIndex, digits, playSound, engine.level]);

  const handleDigitClick = (digit: number) => {
    if (status !== "input_sequence" || feedback.feedbackState || engine.phase !== "playing") return;

    const ns = [...userSequence, digit];
    setUserSequence(ns);

    const rev = [...digits].reverse();
    if (digit !== rev[ns.length - 1]) {
      playSound("wrong");
      feedback.showFeedback(false);
      setStreak(0);
      
      setTimeout(() => {
        feedback.dismissFeedback();
        engine.loseLife();
        if (engine.lives > 1) {
          generateSequence(engine.level);
        }
      }, 1500);
      return;
    }

    playSound("click");

    if (ns.length === digits.length) {
      playSound("success");
      setTimeout(() => setStatus("input_sum"), 500);
    }
  };

  const handleSumSubmit = () => {
    if (feedback.feedbackState || !userSum || engine.phase !== "playing") return;
    const total = digits.reduce((a, b) => a + b, 0);
    const correct = parseInt(userSum) === total;

    feedback.showFeedback(correct);
    playSound(correct ? "correct" : "wrong");

    setTimeout(() => {
      feedback.dismissFeedback();
      if (correct) {
        setStreak((p) => p + 1);
        engine.addScore(engine.level * 10 + Math.floor(engine.timeLeft / 10));
        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
          playSound("success");
        } else {
          engine.nextLevel();
          generateSequence(engine.level + 1);
        }
      } else {
        setStreak(0);
        engine.loseLife();
        if (engine.lives > 1) {
          generateSequence(engine.level);
        }
      }
    }, 1500);
  };

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Yansıma Toplamı",
        description: "Sayıları izle, zihninde ters çevir ve toplamlarını bul. Çalışma belleğini bir üst seviyeye taşı!",
        tuzoCode: "TUZÖ 5.4.1 Çalışma Belleği Güncelleme",
        accentColor: "cyber-purple",
        icon: FlipHorizontal,
        howToPlay: [
          <span key="1"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-pink text-black border-2 border-black rounded-lg items-center justify-center font-syne font-black text-sm shadow-[2px_2px_0_#000] rotate-2 mr-2">1</span> Sırayla ekrana gelen <strong>sayıları aklında tut</strong></span>,
          <span key="2"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-yellow text-black border-2 border-black rounded-lg items-center justify-center font-syne font-black text-sm shadow-[2px_2px_0_#000] -rotate-3 mr-2">2</span> Gördüğün sayıları <strong>en sondan başa doğru</strong> tuşla</span>,
          <span key="3"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-blue text-black border-2 border-black rounded-lg items-center justify-center font-syne font-black text-sm shadow-[2px_2px_0_#000] rotate-1 mr-2">3</span> Son aşamada tüm sayıların <strong>toplamını hesapla</strong></span>
        ]
      }}
    >
      {({ phase, feedbackState }) => (
        <div className="relative z-10 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-160px)] flex-1 w-full">
          <AnimatePresence mode="wait">
            {phase === "playing" && status === "display" && (
              <motion.div
                key="display"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center gap-12"
              >
                <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
                  <motion.div
                    className="absolute inset-0 border-[8px] border-black border-dashed rounded-[3rem] shadow-[8px_8px_0_#000] opacity-20 dark:opacity-40"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />

                  <AnimatePresence mode="wait">
                    {currentIndex >= 0 && (
                      <motion.div
                        key={currentIndex}
                        initial={{
                          scale: 0.5,
                          opacity: 0,
                          rotateY: isMirrored ? 180 : 0,
                          y: 20,
                        }}
                        animate={{
                          scale: 1,
                          opacity: 1,
                          rotateY: isMirrored ? 180 : 0,
                          y: 0,
                        }}
                        exit={{ scale: 1.5, opacity: 0, y: -20 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className="w-32 h-32 sm:w-48 sm:h-48 bg-cyber-purple border-8 border-black rounded-[2rem] shadow-[12px_12px_0_#000] flex items-center justify-center relative overflow-hidden rotate-2"
                      >
                        <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20" />
                        <span className="text-7xl sm:text-9xl font-syne font-black text-white drop-shadow-[4px_4px_0_#000]">
                          {digits[currentIndex]}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-2 p-3 bg-white dark:bg-slate-800 border-4 border-black rounded-2xl shadow-[4px_4px_0_#000] -rotate-1">
                  {digits.map((_, i) => (
                    <div
                      key={i}
                      className={\`w-4 h-4 rounded-md border-2 border-black transition-all duration-300 \${i <= currentIndex ? "bg-cyber-yellow scale-125" : "bg-slate-200 dark:bg-slate-700"}\`}
                    />
                  ))}
                </div>

                <p className="text-black dark:text-white font-syne font-black uppercase tracking-widest text-lg sm:text-xl bg-cyber-pink border-4 border-black px-6 py-2 rounded-xl shadow-[4px_4px_0_#000] animate-pulse">
                  Sayıları Aklında Tut
                </p>
              </motion.div>
            )}

            {phase === "playing" && status === "input_sequence" && !feedbackState && (
              <motion.div
                key="sequence"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-2xl flex flex-col gap-6"
              >
                <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-6 sm:p-10 border-4 border-black shadow-[16px_16px_0_#000] dark:shadow-[16px_16px_0_#0f172a] text-center rotate-1 relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyber-blue border-4 border-black text-white px-6 py-2 rounded-full font-syne font-black uppercase tracking-widest shadow-[4px_4px_0_#000] flex items-center gap-2">
                    <RotateCcw size={18} className="stroke-[3]" /> Tersine Tuşla
                  </div>

                  <div className="flex justify-center gap-2 sm:gap-3 flex-wrap mt-6">
                    {userSequence.map((d, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="w-12 h-14 sm:w-16 sm:h-20 bg-cyber-yellow border-4 border-black rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-syne font-black text-black shadow-[4px_4px_0_#000] -rotate-2"
                      >
                        {d}
                      </motion.div>
                    ))}
                    {Array.from({
                      length: digits.length - userSequence.length,
                    }).map((_, i) => (
                      <div
                        key={i + 100}
                        className="w-12 h-14 sm:w-16 sm:h-20 border-4 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-600 text-3xl sm:text-4xl font-syne font-black"
                      >
                        ?
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-3 sm:gap-4 -rotate-1 mt-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
                    <motion.button
                      key={n}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95, y: 0, shadow: "none" }}
                      onClick={() => handleDigitClick(n)}
                      className="aspect-square sm:aspect-auto sm:py-6 rounded-2xl sm:rounded-[2rem] text-2xl sm:text-4xl font-syne font-black bg-white dark:bg-slate-800 border-4 border-black hover:bg-cyber-purple hover:text-white dark:hover:bg-cyber-purple transition-colors shadow-[6px_6px_0_#000] text-black dark:text-white flex items-center justify-center"
                    >
                      {n}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {phase === "playing" && status === "input_sum" && !feedbackState && (
              <motion.div
                key="sum"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-md flex flex-col gap-6 mx-auto"
              >
                <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-8 sm:p-10 border-4 border-black shadow-[16px_16px_0_#000] dark:shadow-[16px_16px_0_#0f172a] text-center -rotate-2 relative">
                  <div className="w-20 h-20 mx-auto bg-cyber-pink border-4 border-black rounded-[2rem] flex items-center justify-center shadow-[6px_6px_0_#000] mb-6 rotate-3">
                    <Calculator
                      className="text-black"
                      size={40}
                      strokeWidth={2.5}
                    />
                  </div>

                  <p className="text-black dark:text-white text-xl sm:text-2xl font-syne font-black uppercase tracking-tight mb-6">
                    Toplamı Nedir?
                  </p>

                  <div className="relative">
                    <input
                      type="number"
                      value={userSum}
                      onChange={(e) => setUserSum(e.target.value)}
                      autoFocus
                      onKeyPress={(e) => e.key === "Enter" && handleSumSubmit()}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-4 border-black text-center text-5xl sm:text-6xl font-syne font-black text-black dark:text-white py-6 rounded-2xl focus:border-cyber-blue focus:outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-inner"
                      placeholder="0"
                    />
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-black rounded-full opacity-20 blur-sm" />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSumSubmit}
                  className="w-full py-6 bg-cyber-green text-black border-4 border-black rounded-[2rem] font-syne font-black text-2xl uppercase tracking-widest shadow-[8px_8px_0_#000] hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 rotate-1"
                >
                  <CheckCircle2 size={32} className="stroke-[3]" />
                  <span>Onayla</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default ReflectionSumGame;
`;
fs.writeFileSync(filePath, content);
console.log('ReflectionSumGame rewritten');
