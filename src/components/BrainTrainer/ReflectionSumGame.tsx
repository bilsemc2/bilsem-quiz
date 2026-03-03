import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, FlipHorizontal, RotateCcw, CheckCircle2 } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
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
  const safeTimeout = useSafeTimeout();

  const engine = useGameEngine({
    gameId: GAME_ID,
    timeLimit: TIME_LIMIT,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
  });
  const { phase, level, lives, timeLeft, addScore, loseLife, nextLevel, setGamePhase } = engine;

  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [status, setStatus] = useState<InternalStatus>("display");
  const [digits, setDigits] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [userSum, setUserSum] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isMirrored, setIsMirrored] = useState(false);


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
    if (phase === "playing" && digits.length === 0) {
      generateSequence(1);
    } else if (phase !== "playing" && digits.length > 0) {
      setDigits([]); // reset on unmount or game over
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, digits.length]);

  useEffect(() => {
    if (phase === "playing" && status === "display") {
      if (currentIndex < digits.length - 1) {
        const speed = Math.max(600, 1200 - level * 40);
        const t = safeTimeout(() => {
          setCurrentIndex((p) => p + 1);
          playSound("pop");
        }, speed);
        return () => clearTimeout(t);
      } else if (digits.length > 0) {
        const t = safeTimeout(() => {
          setCurrentIndex(-1);
          setStatus("input_sequence");
        }, 1000);
        return () => clearTimeout(t);
      }
    }
  }, [phase, status, currentIndex, digits, playSound, level, safeTimeout]);

  const handleDigitClick = useCallback((digit: number) => {
    if (status !== "input_sequence" || feedbackState || phase !== "playing") return;

    const ns = [...userSequence, digit];
    setUserSequence(ns);

    const rev = [...digits].reverse();
    if (digit !== rev[ns.length - 1]) {
      playSound("wrong");
      showFeedback(false);
      safeTimeout(() => {
        dismissFeedback();
        loseLife();
        if (lives > 1) {
          generateSequence(level);
        }
      }, 1500);
      return;
    }

    playSound("click");

    if (ns.length === digits.length) {
      playSound("success");
      safeTimeout(() => setStatus("input_sum"), 500);
    }
  }, [status, feedbackState, phase, userSequence, digits, playSound, showFeedback, dismissFeedback, loseLife, lives, level, generateSequence, safeTimeout]);

  const handleSumSubmit = useCallback(() => {
    if (feedbackState || !userSum || phase !== "playing") return;
    const total = digits.reduce((a, b) => a + b, 0);
    const correct = parseInt(userSum) === total;

    showFeedback(correct);
    playSound(correct ? "correct" : "wrong");

    safeTimeout(() => {
      dismissFeedback();
      if (correct) {
        addScore(level * 10 + Math.floor(timeLeft / 10));
        if (level >= MAX_LEVEL) {
          setGamePhase("victory");
          playSound("success");
        } else {
          nextLevel();
          generateSequence(level + 1);
        }
      } else {
        loseLife();
        if (lives > 1) {
          generateSequence(level);
        }
      }
    }, 1500);
  }, [feedbackState, userSum, phase, digits, showFeedback, dismissFeedback, playSound, addScore, level, timeLeft, setGamePhase, nextLevel, loseLife, lives, generateSequence, safeTimeout]);

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
        wideLayout: true,
        howToPlay: [
          <span key="1"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-pink text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm rotate-2 mr-2">1</span> Sırayla ekrana gelen <strong>sayıları aklında tut</strong></span>,
          <span key="2"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-yellow text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm -rotate-3 mr-2">2</span> Gördüğün sayıları <strong>en sondan başa doğru</strong> tuşla</span>,
          <span key="3"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-blue text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm rotate-1 mr-2">3</span> Son aşamada tüm sayıların <strong>toplamını hesapla</strong></span>
        ]
      }}
    >
      {({ phase }) => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1 w-full">
          {phase === "playing" && status === "display" && (
            <motion.div
              key="display"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative w-40 h-40 sm:w-52 sm:h-52 flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 border-[6px] border-black/10 border-dashed rounded-2xl shadow-neo-sm opacity-20 dark:opacity-40"
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
                      className="w-28 h-28 sm:w-40 sm:h-40 bg-cyber-purple border-2 border-black/10 rounded-2xl shadow-neo-sm flex items-center justify-center relative overflow-hidden"
                    >
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20" />
                      <span className="text-6xl sm:text-8xl font-nunito font-black text-white drop-shadow-neo-sm">
                        {digits[currentIndex]}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-1.5 p-2 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl shadow-neo-sm">
                {digits.map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-md border-2 border-black/10 transition-all duration-300 ${i <= currentIndex ? "bg-cyber-yellow scale-125" : "bg-slate-200 dark:bg-slate-700"}`}
                  />
                ))}
              </div>

              <p className="text-black dark:text-white font-nunito font-black uppercase tracking-widest text-sm sm:text-base bg-cyber-pink border-2 border-black/10 px-4 py-1.5 rounded-lg shadow-neo-sm animate-pulse">
                Sayıları Aklında Tut
              </p>
            </motion.div>
          )}

          {phase === "playing" && status === "input_sequence" && (
            <motion.div
              key="sequence"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-3xl flex flex-col gap-4"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border-2 border-black/10 shadow-neo-sm text-center relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyber-blue border-2 border-black/10 text-white px-4 py-1.5 rounded-full font-nunito font-black uppercase tracking-widest text-xs shadow-neo-sm flex items-center gap-1.5">
                  <RotateCcw size={14} className="stroke-[3]" /> Tersine Tuşla
                </div>

                <div className="flex justify-center gap-2 flex-wrap mt-4">
                  {userSequence.map((d, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      className="w-10 h-12 sm:w-14 sm:h-16 bg-cyber-yellow border-2 border-black/10 rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-nunito font-black text-black shadow-neo-sm"
                    >
                      {d}
                    </motion.div>
                  ))}
                  {Array.from({
                    length: digits.length - userSequence.length,
                  }).map((_, i) => (
                    <div
                      key={i + 100}
                      className="w-10 h-12 sm:w-14 sm:h-16 border-3 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-600 text-2xl sm:text-3xl font-nunito font-black"
                    >
                      ?
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 sm:gap-3 mt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
                  <motion.button
                    key={n}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDigitClick(n)}
                    className="aspect-square sm:aspect-auto sm:py-4 rounded-xl text-xl sm:text-3xl font-nunito font-black bg-white dark:bg-slate-800 border-2 border-black/10 transition-colors shadow-neo-sm text-black dark:text-white flex items-center justify-center active:translate-y-1 active:shadow-none"
                  >
                    {n}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {phase === "playing" && status === "input_sum" && (
            <motion.div
              key="sum"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md flex flex-col gap-4 mx-auto"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border-2 border-black/10 shadow-neo-sm text-center relative">
                <div className="w-16 h-16 mx-auto bg-cyber-pink border-2 border-black/10 rounded-xl flex items-center justify-center shadow-neo-sm mb-4">
                  <Calculator
                    className="text-black"
                    size={32}
                    strokeWidth={2.5}
                  />
                </div>

                <p className="text-black dark:text-white text-lg sm:text-xl font-nunito font-black uppercase tracking-tight mb-4">
                  Toplamı Nedir?
                </p>

                <div className="relative">
                  <input
                    type="number"
                    value={userSum}
                    onChange={(e) => setUserSum(e.target.value)}
                    autoFocus
                    onKeyPress={(e) => e.key === "Enter" && handleSumSubmit()}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-black/10 text-center text-4xl sm:text-5xl font-nunito font-black text-black dark:text-white py-4 rounded-xl focus:border-cyber-blue focus:outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-inner"
                    placeholder="0"
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSumSubmit}
                className="w-full py-4 bg-cyber-green text-black border-2 border-black/10 rounded-xl font-nunito font-black text-xl uppercase tracking-widest shadow-neo-sm active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={24} className="stroke-[3]" />
                <span>Onayla</span>
              </motion.button>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default ReflectionSumGame;
