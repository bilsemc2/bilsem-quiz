import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer as TimerIcon, EyeOff, Plus, Grid3X3 } from "lucide-react";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const GAME_ID = "hedef-sayi";
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GRID_SIZE = 16;
const PREVIEW_TIME = 4;

interface Card {
  id: string;
  value: number;
  isRevealed: boolean;
  isSolved: boolean;
}

const TargetGridGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
    initialLives: INITIAL_LIVES,
  });

  const feedback = useGameFeedback({
    duration: 1200,
  });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();

  const [cards, setCards] = useState<Card[]>([]);
  const [targetSum, setTargetSum] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [currentSum, setCurrentSum] = useState(0);
  const [previewTimer, setPreviewTimer] = useState(PREVIEW_TIME);
  const [isPreview, setIsPreview] = useState(false);

  const previewIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevPhaseRef = useRef(engine.phase);

  const generateGrid = useCallback((lvl: number) => {
    const newCards: Card[] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      newCards.push({
        id: `card-${lvl}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        value: Math.floor(Math.random() * 9) + 1,
        isRevealed: true,
        isSolved: false,
      });
    }

    const numToCombine = Math.random() > 0.7 && lvl > 5 ? 3 : 2;
    const targetIdxs: number[] = [];
    while (targetIdxs.length < numToCombine) {
      const idx = Math.floor(Math.random() * GRID_SIZE);
      if (!targetIdxs.includes(idx)) targetIdxs.push(idx);
    }

    const sum = targetIdxs.reduce((acc, idx) => acc + newCards[idx].value, 0);
    setTargetSum(sum);
    setCards(newCards);
    setSelectedIndices([]);
    setCurrentSum(0);

    const previewTime = Math.max(1, PREVIEW_TIME - Math.floor(lvl / 5));
    setPreviewTimer(previewTime);
    setIsPreview(true);
  }, []);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;

    if (
      engine.phase === "playing" &&
      (prevPhase === "welcome" || prevPhase === "game_over" || prevPhase === "victory")
    ) {
      generateGrid(engine.level);
    } else if (engine.phase === "welcome" || engine.phase === "game_over" || engine.phase === "victory") {
      if (previewIntervalRef.current) clearTimeout(previewIntervalRef.current);
      setCards([]);
      setSelectedIndices([]);
      setCurrentSum(0);
      setIsPreview(false);
    }

    prevPhaseRef.current = engine.phase;
  }, [engine.phase, engine.level, generateGrid]);

  useEffect(() => {
    if (engine.phase === "playing" && isPreview) {
      if (previewTimer > 0) {
        previewIntervalRef.current = setTimeout(() => {
          setPreviewTimer((p) => p - 1);
          playSound("pop");
        }, 1000);
      } else {
        setIsPreview(false);
        setCards((p) => p.map((c) => ({ ...c, isRevealed: false })));
        playSound("pop");
      }
    }
    return () => {
      if (previewIntervalRef.current) clearTimeout(previewIntervalRef.current);
    };
  }, [engine.phase, isPreview, previewTimer, engine, playSound]);

  const handleCard = (idx: number) => {
    if (
      engine.phase !== "playing" ||
      isPreview ||
      cards[idx].isRevealed ||
      cards[idx].isSolved ||
      feedbackState
    )
      return;

    const card = cards[idx];
    const newSum = currentSum + card.value;
    setCurrentSum(newSum);
    setSelectedIndices((p) => [...p, idx]);

    setCards((p) =>
      p.map((c, i) => (i === idx ? { ...c, isRevealed: true } : c))
    );
    playSound("pop");

    if (newSum === targetSum) {
      showFeedback(true);
      playSound("correct");
      engine.addScore(20 * engine.level);

      safeTimeout(() => {
        dismissFeedback();
        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
        } else {
          engine.nextLevel();
          generateGrid(engine.level + 1);
        }
      }, 1000);
    } else if (newSum > targetSum) {
      showFeedback(false);
      playSound("incorrect");
      engine.loseLife();

      safeTimeout(() => {
        dismissFeedback();
        if (engine.lives > 1) {
          // Reset revealed cards for this attempt
          setCards((p) =>
            p.map((c, i) =>
              selectedIndices.includes(i) || i === idx
                ? { ...c, isRevealed: false }
                : c
            )
          );
          setSelectedIndices([]);
          setCurrentSum(0);
        }
      }, 1000);
    }
  };

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Hedef Sayı",
        icon: Grid3X3,
        description:
          "Sayıları ezberle, hedef toplamı bul ve zihinden hesaplama becerini geliştir!",
        howToPlay: [
          "Sayıları kısa sürede ezberle - sonra gizlenecekler.",
          "Hedef sayıya ulaşan doğru kartları seç.",
          "Toplamı aşmamaya dikkat et - can kaybedersin.",
        ],
        tuzoCode: "5.4.2 Görsel Kısa Süreli Bellek",
        accentColor: "cyber-blue",
        maxLevel: MAX_LEVEL,
      }}
    >
      {() => (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">

          {engine.phase === "playing" && cards.length > 0 && (
            <motion.div
              key={`grid-${engine.level}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-4xl"
            >
              {/* Target Panel */}
              <div className="w-full md:w-1/3 flex flex-col items-center p-6 sm:p-10 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 shadow-neo-sm -rotate-1 shrink-0">
                {isPreview ? (
                  /* Preview mode: hide target, show countdown */
                  <>
                    <span className="bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 border-2 border-black/10 px-6 py-2 rounded-xl text-xs sm:text-sm font-nunito font-black uppercase tracking-widest shadow-neo-sm mb-6 rotate-2">
                      Sayıları Ezberle!
                    </span>
                    <div className="text-6xl sm:text-7xl font-black font-nunito text-slate-300 dark:text-slate-600 drop-shadow-sm mb-6 select-none">
                      ?
                    </div>
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-2 px-6 py-3 bg-cyber-pink border-2 border-black/10 text-black rounded-2xl font-nunito font-black shadow-neo-sm rotate-2"
                    >
                      <TimerIcon size={20} className="animate-spin-slow" />
                      <span className="text-lg">Ezberle: {previewTimer}</span>
                    </motion.div>
                  </>
                ) : (
                  /* Cards hidden: show target and current sum */
                  <>
                    <span className="bg-cyber-yellow text-black border-2 border-black/10 px-6 py-2 rounded-xl text-xs sm:text-sm font-nunito font-black uppercase tracking-widest shadow-neo-sm mb-6 rotate-2">
                      Hedef Sayı
                    </span>
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", bounce: 0.4 }}
                      className="text-6xl sm:text-7xl font-black font-nunito text-black dark:text-white drop-shadow-sm mb-6"
                    >
                      {targetSum}
                    </motion.div>

                    <div className="w-full bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl border-2 border-black/10 shadow-inner flex flex-col items-center">
                      <span className="text-xs font-nunito font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                        Mevcut Toplam
                      </span>
                      <div
                        className={`text-4xl font-black font-nunito flex items-center gap-3 transition-colors ${currentSum > targetSum
                          ? "text-cyber-pink"
                          : currentSum === targetSum
                            ? "text-cyber-green"
                            : "text-cyber-blue"
                          }`}
                      >
                        <Plus size={24} strokeWidth={4} />
                        {currentSum}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Grid Panel */}

              <div className="w-full md:w-2/3 flex-1 relative">

                <div
                  className={`grid grid-cols-4 gap-2 sm:gap-4 p-4 sm:p-6 bg-slate-200 dark:bg-slate-700 rounded-2xl border-2 border-black/10 shadow-neo-sm aspect-square transition-all ${isPreview ? "border-cyber-green" : ""
                    }`}
                >
                  {cards.map((card, i) => {
                    const isSelected = selectedIndices.includes(i);
                    const isFeedbackAndTarget = feedbackState?.correct && isSelected;
                    const isFeedbackAndWrong = feedbackState?.correct === false && isSelected;

                    let bgClass = "bg-white dark:bg-slate-800 text-black dark:text-white border-black/10 shadow-neo-sm";
                    if (card.isRevealed || isPreview) {
                      if (isFeedbackAndTarget) {
                        bgClass = "bg-cyber-green text-black border-black/10 shadow-neo-sm";
                      } else if (isFeedbackAndWrong) {
                        bgClass = "bg-cyber-pink text-black border-black/10 shadow-neo-sm";
                      } else if (isSelected) {
                        bgClass = "bg-cyber-blue text-white border-black/10 shadow-neo-sm";
                      } else {
                        bgClass = "bg-white dark:bg-slate-800 text-black dark:text-white border-black/10 shadow-neo-sm";
                      }
                    } else {
                      bgClass = "bg-slate-300 dark:bg-slate-600 border-black/10 shadow-neo-sm";
                    }

                    return (
                      <motion.button
                        key={card.id}
                        whileTap={
                          !isPreview && !card.isRevealed && !feedbackState
                            ? { scale: 0.95 }
                            : {}
                        }
                        onClick={() => handleCard(i)}
                        disabled={isPreview || card.isRevealed || feedbackState !== null}
                        className={`w-full h-full rounded-2xl sm:rounded-xl border-4 flex items-center justify-center text-3xl sm:text-5xl font-nunito font-black transition-all overflow-hidden ${bgClass} ${card.isRevealed || isPreview ? "translate-y-1 translate-x-1" : ""
                          }`}
                      >
                        <AnimatePresence mode="popLayout">
                          {card.isRevealed || isPreview ? (
                            <motion.span
                              key="value"
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", bounce: 0.5 }}
                            >
                              {card.value}
                            </motion.span>
                          ) : (
                            <motion.span
                              key="hidden"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <EyeOff
                                className="text-slate-400/50 w-8 h-8 sm:w-12 sm:h-12"
                                strokeWidth={3}
                              />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

        </div>
      )}
    </BrainTrainerShell>
  );
};

export default TargetGridGame;
