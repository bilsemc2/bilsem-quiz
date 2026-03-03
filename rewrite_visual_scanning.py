import re

content = """import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Sparkles, CheckCircle2 } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "gorsel-tarama";
const GAME_TITLE = "Görsel Tarama";
const GAME_DESCRIPTION = "Hızlı ve keskin bir bakışla kalabalık içindeki hedef sembolleri bul, seçici dikkatinle zirveye tırman!";
const TUZO_TEXT = "TUZÖ 5.2.1 Görsel Tarama & Seçici Dikkat";

const ALL_SYMBOLS = [
  "★", "●", "■", "▲", "◆", "♦", "♣", "♠", "♥", "○", "□", "△", "◇", "✕", "✓", "⬟",
];
const GRID_SIZE = 64; // 8x8

interface CellData {
  symbol: string;
  isTarget: boolean;
  isClicked: boolean;
  isWrongClick: boolean;
}

const VisualScanningGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const feedback = useGameFeedback({ duration: 1500 });

  const {
    phase,
    level,
    score, // Need score to enforce positive score
    lives,
    addScore,
    loseLife,
    nextLevel,
  } = engine;
  
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [targetSymbol, setTargetSymbol] = useState("★");
  const [grid, setGrid] = useState<CellData[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const isTransitioning = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const genLevelGrid = useCallback(
    (target: string, lvl: number): CellData[] => {
      const targetCount =
        lvl < 3 ? 6 : lvl < 6 ? 8 : lvl < 10 ? 10 : lvl < 15 ? 12 : 14;
      const distractorCount = lvl < 5 ? 3 : lvl < 10 ? 5 : lvl < 15 ? 7 : 10;
      const cells: CellData[] = [];
      const distractors = ALL_SYMBOLS.filter((s) => s !== target)
        .sort(() => Math.random() - 0.5)
        .slice(0, distractorCount);
      const targetPos = new Set<number>();
      while (targetPos.size < targetCount) {
        targetPos.add(Math.floor(Math.random() * GRID_SIZE));
      }
      for (let i = 0; i < GRID_SIZE; i++) {
        const symbols = targetPos.has(i)
          ? target
          : distractors[Math.floor(Math.random() * distractors.length)];
        cells.push({
          symbol: symbols,
          isTarget: targetPos.has(i),
          isClicked: false,
          isWrongClick: false,
        });
      }
      return cells;
    },
    [],
  );

  const startRound = useCallback(
    (lvl: number) => {
      const nextTarget =
        ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
      setTargetSymbol(nextTarget);
      setGrid(genLevelGrid(nextTarget, lvl));
      isTransitioning.current = false;
    },
    [genLevelGrid],
  );

  // Sync to engine restarts
  useEffect(() => {
    if (phase === "playing" && !isTransitioning.current && grid.length === 0) {
      startRound(level);
    } else if (phase === "welcome") {
      setStreak(0);
      setBestStreak(0);
      setGrid([]);
      isTransitioning.current = false;
    }
  }, [phase, level, grid.length, startRound]);

  // Win condition per level
  useEffect(() => {
    if (phase !== "playing") return;
    const remaining = grid.filter((c) => c.isTarget && !c.isClicked).length;
    if (remaining === 0 && grid.length > 0 && !isTransitioning.current) {
      isTransitioning.current = true;
      playSound("correct");
      showFeedback(true);
      
      const t = setTimeout(() => {
        dismissFeedback();
        nextLevel(); // advance to next level, or victory (engine handles it)
        setGrid([]); // clears grid to trigger startRound effect
      }, 1000);
      timeoutsRef.current.push(t);
    }
  }, [
    grid,
    phase,
    nextLevel,
    playSound,
    showFeedback,
    dismissFeedback,
  ]);

  const handleCellClick = (idx: number) => {
    if (phase !== "playing" || !!feedbackState || isTransitioning.current)
      return;
    const cell = grid[idx];
    if (cell.isClicked || cell.isWrongClick) return;

    const newGrid = [...grid];
    if (cell.isTarget) {
      newGrid[idx] = { ...cell, isClicked: true };
      setStreak((s) => {
        const ns = s + 1;
        if (ns > bestStreak) setBestStreak(ns);
        return ns;
      });
      const bonus = Math.min(streak * 2, 20);
      addScore(25 + bonus);
      playSound("pop");
    } else {
      newGrid[idx] = { ...cell, isWrongClick: true };
      setStreak(0);
      if (score > 0) {
        addScore(-Math.min(10, score)); // Prevent negative total score 
      }
      playSound("incorrect");
      loseLife();

      showFeedback(false);
      const t = setTimeout(dismissFeedback, 1000);
      timeoutsRef.current.push(t);
    }
    setGrid(newGrid);
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Eye,
    accentColor: "cyber-pink",
    maxLevel: 20,
    howToPlay: [
      "Üstte gösterilen hedef sembolü aklında tut",
      "Grid içindeki tüm hedef sembolleri en kısa sürede bulup dokun",
      "Yanlış tıklarsan can kaybedersin, dikkatli ol!"
    ]
  };

  const remaining = grid.filter((c) => c.isTarget && !c.isClicked).length;

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-start sm:justify-center p-4 flex-1 mb-10 w-full max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {!feedbackState && grid.length > 0 && (
              <motion.div
                key={`game-${level}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full space-y-6"
              >
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border-4 border-black shadow-[12px_12px_0_#000] flex items-center justify-center gap-8 relative overflow-hidden group">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-syne font-black uppercase text-slate-400 tracking-widest">
                      HEDEF:
                    </span>
                    <div className="w-16 h-16 bg-cyber-pink border-4 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0_#000]">
                      <span className="text-4xl text-black drop-shadow-sm font-black">
                        {targetSymbol}
                      </span>
                    </div>
                  </div>
                  <div className="h-12 w-1.5 bg-black rounded-full" />
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-syne font-black uppercase text-slate-400 tracking-widest">
                      KALAN:
                    </span>
                    <div className="text-4xl font-syne font-black text-cyber-blue drop-shadow-[2px_2px_0_#000]">
                      {remaining}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-8 gap-1.5 sm:gap-2 p-4 sm:p-6 bg-slate-50 dark:bg-slate-700/50 rounded-3xl sm:rounded-[2.5rem] border-4 border-black shadow-[16px_16px_0_#000]">
                  {grid.map((c, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.15, zIndex: 10, rotate: i % 2 === 0 ? 5 : -5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleCellClick(i)}
                      className={`aspect-square rounded-[0.8rem] sm:rounded-2xl flex items-center justify-center transition-all duration-200 relative overflow-hidden border-4 ${c.isClicked ? "bg-cyber-green border-black scale-95 shadow-none" : c.isWrongClick ? "bg-cyber-pink border-black scale-95 shadow-none" : "bg-white dark:bg-slate-800 border-black shadow-[2px_2px_0_#000] hover:shadow-[4px_4px_0_#000]"}`}
                    >
                      <span
                        className={`text-2xl sm:text-3xl font-black ${c.isClicked || c.isWrongClick ? "text-black" : "text-slate-800 dark:text-slate-100"}`}
                      >
                        {c.symbol}
                      </span>
                      {c.isClicked && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute inset-0 flex items-center justify-center bg-transparent"
                        >
                          <CheckCircle2
                            className="text-black drop-shadow-sm"
                            size={28}
                            strokeWidth={3}
                          />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                {streak > 1 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center absolute bottom-0 left-0 right-0 pointer-events-none"
                  >
                    <span className="px-6 py-2 bg-cyber-pink border-4 border-black rounded-2xl text-black font-syne font-black text-base uppercase tracking-widest shadow-[6px_6px_0_#000] inline-block -rotate-2">
                      KOMBO x{streak} 🔥
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default VisualScanningGame;
"""

with open("/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/BrainTrainer/VisualScanningGame.tsx", "w") as f:
    f.write(content)
