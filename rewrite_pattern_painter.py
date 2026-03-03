import re

content = """import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Sparkles, CheckCircle2, HelpCircle, Eye, RotateCcw } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "desen-boyama";
const GAME_TITLE = "Desen Boyama";
const GAME_DESCRIPTION = "Örüntüdeki boşluğu doğru renklerle doldur ve deseni tamamla. Renkli bir mantık yolculuğuna hazır mısın?";
const TUZO_TEXT = "TUZÖ 5.3.2 Desen Analizi";

const COLORS = [
  "#FF3366", // pink-red
  "#00BFFF", // deep sky blue
  "#00FF7F", // spring green
  "#FFD700", // gold/yellow
  "#9B59B6", // amethyst/purple
  "#FF6B35", // electric orange
  "#00CED1", // dark turquoise
  "#E91E63", // pink
];

const PATTERN_TYPES = [
  "checkered",
  "stripes",
  "diagonal",
  "center-out",
  "random-repeating",
] as const;
type PatternType = (typeof PATTERN_TYPES)[number];

interface GameLevel {
  size: number;
  patternType: PatternType;
  gapPos: { r: number; c: number };
  grid: string[][];
  correctOption: string[][];
}

const generatePattern = (size: number, type: PatternType): string[][] => {
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(""));
  const palette = [...COLORS].sort(() => Math.random() - 0.5).slice(0, 4);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      switch (type) {
        case "checkered":
          grid[r][c] = palette[(r + c) % 2];
          break;
        case "stripes":
          grid[r][c] = palette[r % 2];
          break;
        case "diagonal":
          grid[r][c] = palette[(r + c) % palette.length];
          break;
        case "center-out":
          const dist = Math.max(
            Math.abs(r - Math.floor(size / 2)),
            Math.abs(c - Math.floor(size / 2)),
          );
          grid[r][c] = palette[dist % palette.length];
          break;
        default:
          const br = Math.floor(r / 2),
            bc = Math.floor(c / 2);
          grid[r][c] = palette[(br + bc) % palette.length];
          break;
      }
    }
  }
  return grid;
};

const createLevel = (idx: number): GameLevel => {
  const size = idx < 5 ? 6 : idx < 10 ? 7 : idx < 15 ? 8 : 9;
  const type = PATTERN_TYPES[idx % PATTERN_TYPES.length];
  const grid = generatePattern(size, type);
  const gs = 2,
    gr = Math.floor(Math.random() * (size - gs)),
    gc = Math.floor(Math.random() * (size - gs));
  const corr: string[][] = Array.from({ length: gs }, (_, r) =>
    Array.from({ length: gs }, (_, c) => grid[gr + r][gc + c]),
  );
  return {
    size,
    patternType: type,
    gapPos: { r: gr, c: gc },
    grid,
    correctOption: corr,
  };
};

const getTileStyle = (color: string) => ({
  backgroundColor: color,
});

const PatternPainterGame: React.FC = () => {
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
    addScore,
    loseLife,
    nextLevel,
  } = engine;

  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [currentLevel, setCurrentLevel] = useState<GameLevel | null>(null);
  const [userPainting, setUserPainting] = useState<(string | null)[][]>([]);
  const [activeColor, setActiveColor] = useState<string | null>(null);

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const availableColors = useMemo(() => {
    if (!currentLevel) return COLORS.slice(0, 4);
    return Array.from(new Set(currentLevel.grid.flat()));
  }, [currentLevel]);

  const setupLevel = useCallback((lvl: number) => {
    const nl = createLevel(lvl - 1);
    setCurrentLevel(nl);
    setUserPainting(Array.from({ length: 2 }, () => Array(2).fill(null)));
    const colors = Array.from(new Set(nl.grid.flat()));
    setActiveColor(colors[0]);
  }, []);

  useEffect(() => {
    if (phase === "playing" && !currentLevel) {
      setupLevel(level);
    } else if (phase === "welcome" && currentLevel) {
      setCurrentLevel(null);
    }
  }, [phase, level, currentLevel, setupLevel]);

  const handlePaintTile = (r: number, c: number) => {
    if (!activeColor || !!feedbackState || phase !== "playing") return;
    const np = userPainting.map((row) => [...row]);
    np[r][c] = activeColor;
    setUserPainting(np);
    playSound("pop");
  };

  const handleCheck = () => {
    if (!currentLevel || phase !== "playing" || !!feedbackState) return;
    const complete = userPainting.every((row) =>
      row.every((cell) => cell !== null),
    );
    if (!complete) return;

    const correct =
      JSON.stringify(userPainting) ===
      JSON.stringify(currentLevel.correctOption);
    showFeedback(correct);
    playSound(correct ? "correct" : "wrong");

    const t = setTimeout(() => {
      dismissFeedback();
      if (correct) {
        addScore(10 * level);
        nextLevel();
        setupLevel(level + 1);
      } else {
        loseLife();
        // Clear board on failure just like original game, but level stays the same
        setUserPainting(Array.from({ length: 2 }, () => Array(2).fill(null)));
      }
    }, 1500);
    timeoutsRef.current.push(t);
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Palette,
    accentColor: "cyber-pink",
    maxLevel: 20,
    howToPlay: [
      "Büyük desendeki kuralı anlamaya çalış",
      "Renk paletinden uygun renkleri seçerek boşluğu boya",
      "Tüm kutuları boyayınca kontrol et butonuna bas"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-160px)] flex-1 w-full max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {phase === "playing" && currentLevel && !feedbackState && (
              <motion.div
                key="game"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
              >
                <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-8 md:p-12 border-4 border-black shadow-[16px_16px_0_#000] dark:shadow-[16px_16px_0_#0f172a] text-center rotate-1 flex flex-col items-center">
                  <span className="text-sm font-syne font-black uppercase tracking-widest mb-6 flex items-center justify-center gap-2 bg-cyber-yellow text-black px-4 py-2 rounded-full border-2 border-black shadow-[4px_4px_0_#000]">
                    <Eye size={18} className="stroke-[3]" /> Deseni İncele
                  </span>

                  <div
                    className="grid gap-[2px] p-2 bg-black rounded-[2rem] border-4 border-black shadow-[8px_8px_0_#000] mx-auto mb-6"
                    style={{
                      gridTemplateColumns: `repeat(${currentLevel.size}, 1fr)`,
                      width: "min(70vw, 320px)",
                      aspectRatio: "1",
                    }}
                  >
                    {currentLevel.grid.map((row, r) =>
                      row.map((color, c) => {
                        const gr = r - currentLevel.gapPos.r,
                          gc = c - currentLevel.gapPos.c;
                        const isInGap = gr >= 0 && gr < 2 && gc >= 0 && gc < 2;
                        const pc = isInGap ? userPainting[gr]?.[gc] : null;

                        const isTopLeft = r === 0 && c === 0;
                        const isTopRight = r === 0 && c === currentLevel.size - 1;
                        const isBottomLeft =
                          r === currentLevel.size - 1 && c === 0;
                        const isBottomRight =
                          r === currentLevel.size - 1 &&
                          c === currentLevel.size - 1;

                        let borderRadius = "0";
                        if (isTopLeft) borderRadius = "1.5rem 0 0 0";
                        else if (isTopRight) borderRadius = "0 1.5rem 0 0";
                        else if (isBottomLeft) borderRadius = "0 0 0 1.5rem";
                        else if (isBottomRight) borderRadius = "0 0 1.5rem 0";

                        return (
                          <div
                            key={`${r}-${c}`}
                            className="w-full h-full relative"
                            style={{
                              ...(isInGap && !pc
                                ? {
                                    backgroundColor: "#fff",
                                    backgroundImage:
                                      "radial-gradient(#ddd 10%, transparent 10%)",
                                    backgroundSize: "10px 10px",
                                  }
                                : getTileStyle(isInGap ? pc || color : color)),
                              borderRadius,
                            }}
                          >
                            {isInGap && !pc && (
                              <div
                                className="absolute inset-0 border-2 border-dashed border-slate-300 dark:border-slate-500 pointer-events-none"
                                style={{ borderRadius }}
                              />
                            )}
                          </div>
                        );
                      }),
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-8 md:p-12 border-4 border-black shadow-[16px_16px_0_#000] dark:shadow-[16px_16px_0_#0f172a] -rotate-1 flex flex-col items-center">
                  <h2 className="text-3xl font-syne font-black text-center mb-8 flex items-center justify-center gap-3 uppercase text-black dark:text-white">
                    Boşluğu Tamamla ✨
                  </h2>

                  <div className="grid grid-cols-2 gap-2 w-48 h-48 mx-auto mb-10 bg-black p-2 rounded-[2rem] border-4 border-black shadow-[8px_8px_0_#000]">
                    {Array.from({ length: 2 }).map((_, r) =>
                      Array.from({ length: 2 }).map((_, c) => {
                        const isTopLeft = r === 0 && c === 0;
                        const isTopRight = r === 0 && c === 1;
                        const isBottomLeft = r === 1 && c === 0;
                        const isBottomRight = r === 1 && c === 1;

                        let borderRadius = "0";
                        if (isTopLeft) borderRadius = "1.5rem 0 0 0";
                        else if (isTopRight) borderRadius = "0 1.5rem 0 0";
                        else if (isBottomLeft) borderRadius = "0 0 0 1.5rem";
                        else if (isBottomRight) borderRadius = "0 0 1.5rem 0";

                        return (
                          <motion.button
                            key={`${r}-${c}`}
                            whileHover={{ scale: 0.95 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handlePaintTile(r, c)}
                            className="w-full h-full flex items-center justify-center transition-all bg-white relative overflow-hidden"
                            style={{
                              ...(userPainting[r][c]
                                ? getTileStyle(userPainting[r][c]!)
                                : {
                                    backgroundImage:
                                      "radial-gradient(#ddd 10%, transparent 10%)",
                                    backgroundSize: "10px 10px",
                                  }),
                              borderRadius,
                            }}
                          >
                            {!userPainting[r][c] && (
                              <HelpCircle
                                className="text-slate-300 dark:text-slate-500 absolute"
                                size={24}
                              />
                            )}
                          </motion.button>
                        );
                      }),
                    )}
                  </div>

                  <div className="flex flex-wrap justify-center gap-3 mb-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-3xl border-4 border-black shadow-inner">
                    {availableColors.map((color, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.15, y: -4 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setActiveColor(color);
                          playSound("click");
                        }}
                        className="w-12 h-12 rounded-xl border-4 border-black transition-all relative shadow-[4px_4px_0_#000]"
                        style={{
                          ...getTileStyle(color),
                          outline:
                            activeColor === color ? "4px solid #000" : "none",
                          outlineOffset: 3,
                        }}
                      >
                        {activeColor === color && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <CheckCircle2
                              size={16}
                              className="text-white drop-shadow-sm"
                              strokeWidth={3}
                            />
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setUserPainting(
                          Array.from({ length: 2 }, () => Array(2).fill(null)),
                        );
                        playSound("slide");
                      }}
                      className="flex-1 py-4 bg-white dark:bg-slate-700 text-black dark:text-white rounded-2xl font-syne font-bold border-4 border-black flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors shadow-[4px_4px_0_#000] active:translate-y-[2px] active:shadow-none uppercase tracking-wider"
                    >
                      <RotateCcw size={20} className="stroke-[3]" />
                      <span>Temizle</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCheck}
                      className="flex-[1.5] py-4 bg-cyber-green text-black rounded-2xl font-syne font-black border-4 border-black shadow-[6px_6px_0_#000] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 uppercase tracking-wider text-lg"
                    >
                      <CheckCircle2 size={24} className="stroke-[3]" />
                      <span>Kontrol Et</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default PatternPainterGame;
"""

with open("/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/BrainTrainer/PatternPainterGame.tsx", "w") as f:
    f.write(content)
