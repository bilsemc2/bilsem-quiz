import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Eye, CheckCircle2 } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

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
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1500 });

  const {
    phase,
    level,
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
    if (phase === "playing" && grid.length === 0) {
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

      const t = safeTimeout(() => {
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
      addScore(-10);
      playSound("incorrect");
      loseLife();

      showFeedback(false);
      const t = safeTimeout(dismissFeedback, 1000);
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
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1 w-full max-w-xl mx-auto">
          {grid.length > 0 && (
            <motion.div
              key={`game-${level}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full space-y-3"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border-2 border-black/10 shadow-neo-sm flex items-center justify-center gap-6 relative overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-nunito font-black uppercase text-slate-400 tracking-widest">
                    HEDEF:
                  </span>
                  <div className="w-12 h-12 bg-cyber-pink border-2 border-black/10 rounded-xl flex items-center justify-center shadow-neo-sm">
                    <span className="text-3xl text-black font-black">
                      {targetSymbol}
                    </span>
                  </div>
                </div>
                <div className="h-10 w-1 bg-black rounded-full" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-nunito font-black uppercase text-slate-400 tracking-widest">
                    KALAN:
                  </span>
                  <div className="text-3xl font-nunito font-black text-cyber-blue">
                    {remaining}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-8 gap-1 sm:gap-1.5 p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border-2 border-black/10 shadow-neo-sm">
                {grid.map((c, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleCellClick(i)}
                    className={`aspect-square rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 relative overflow-hidden border-2 ${c.isClicked ? "bg-cyber-green border-black/10 scale-95 shadow-none" : c.isWrongClick ? "bg-cyber-pink border-black/10 scale-95 shadow-none" : "bg-white dark:bg-slate-800 border-black/10 shadow-neo-sm"}`}
                  >
                    <span
                      className={`text-xl sm:text-2xl font-black ${c.isClicked || c.isWrongClick ? "text-black" : "text-slate-800 dark:text-slate-100"}`}
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
                          className="text-black"
                          size={20}
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
                  className="text-center"
                >
                  <span className="px-4 py-1.5 bg-cyber-pink border-2 border-black/10 rounded-xl text-black font-nunito font-black text-sm uppercase tracking-widest shadow-neo-sm inline-block">
                    KOMBO x{streak} 🔥
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}

        </div>
      )}
    </BrainTrainerShell>
  );
};

export default VisualScanningGame;
