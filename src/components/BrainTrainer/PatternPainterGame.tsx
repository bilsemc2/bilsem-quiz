import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Palette, CheckCircle2, HelpCircle, Eye, RotateCcw } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { GAME_COLORS } from './shared/gameColors';
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const GAME_ID = "desen-boyama";
const GAME_TITLE = "Desen Boyama";
const GAME_DESCRIPTION = "Örüntüdeki boşluğu doğru renklerle doldur ve deseni tamamla. Renkli bir mantık yolculuğuna hazır mısın?";
const TUZO_TEXT = "TUZÖ 5.3.2 Desen Analizi";

const COLORS = [
  GAME_COLORS.pink, // pink-red
  "#00BFFF", // deep sky blue
  "#00FF7F", // spring green
  GAME_COLORS.yellow, // gold/yellow
  GAME_COLORS.purple, // amethyst/purple
  "#FF6B35", // electric orange
  "#00CED1", // dark turquoise
  GAME_COLORS.pink, // pink
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

  const centerCoords =
    size % 2 === 0
      ? [size / 2 - 1, size / 2]
      : [Math.floor(size / 2)];

  const chebyshevToNearestCenter = (r: number, c: number) =>
    Math.min(
      ...centerCoords.flatMap((cr) =>
        centerCoords.map((cc) => Math.max(Math.abs(r - cr), Math.abs(c - cc))),
      ),
    );

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
        case "center-out": {
          const dist = chebyshevToNearestCenter(r, c);
          grid[r][c] = palette[dist % palette.length];
          break;
        }
        default: {
          const br = Math.floor(r / 2),
            bc = Math.floor(c / 2);
          grid[r][c] = palette[(br + bc) % palette.length];
          break;
        }
      }
    }
  }
  return grid;
};

const createLevel = (idx: number): GameLevel => {
  const size = idx < 5 ? 6 : idx < 10 ? 7 : idx < 15 ? 8 : 9;
  const type = PATTERN_TYPES[idx % PATTERN_TYPES.length];
  const grid = generatePattern(size, type);
  const gs = 2;
  const fullRangeStartMax = size - gs;
  const interiorStartMax = size - gs - 1;
  const hasInteriorRange = interiorStartMax >= 1;

  const randInclusive = (min: number, max: number) =>
    min + Math.floor(Math.random() * (max - min + 1));

  // Keep the gap away from edges so surrounding context is visible.
  const gr = hasInteriorRange
    ? randInclusive(1, interiorStartMax)
    : randInclusive(0, fullRangeStartMax);
  const gc = hasInteriorRange
    ? randInclusive(1, interiorStartMax)
    : randInclusive(0, fullRangeStartMax);
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

    const t = safeTimeout(() => {
      dismissFeedback();
      if (correct) {
        addScore(10 * level);
        nextLevel();
        if (level < 20) {
          setupLevel(level + 1);
        }
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
    wideLayout: true,
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
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1 w-full max-w-5xl mx-auto">
          {phase === "playing" && currentLevel && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-center"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-6 border-2 border-black/10 shadow-neo-sm text-center flex flex-col items-center">
                <span className="text-xs font-nunito font-black uppercase tracking-widest mb-3 flex items-center justify-center gap-2 bg-cyber-yellow text-black px-3 py-1.5 rounded-full border-2 border-black/10 shadow-neo-sm">
                  <Eye size={14} className="stroke-[3]" /> Deseni İncele
                </span>

                <div
                  className="grid gap-[2px] p-1.5 bg-black rounded-xl border-2 border-black/10 shadow-neo-sm mx-auto mb-3"
                  style={{
                    gridTemplateColumns: `repeat(${currentLevel.size}, 1fr)`,
                    width: "min(60vw, 280px)",
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
                      const isBottomLeft = r === currentLevel.size - 1 && c === 0;
                      const isBottomRight = r === currentLevel.size - 1 && c === currentLevel.size - 1;

                      let borderRadius = "0";
                      if (isTopLeft) borderRadius = "1rem 0 0 0";
                      else if (isTopRight) borderRadius = "0 1rem 0 0";
                      else if (isBottomLeft) borderRadius = "0 0 0 1rem";
                      else if (isBottomRight) borderRadius = "0 0 1rem 0";

                      return (
                        <div
                          key={`${r}-${c}`}
                          className="w-full h-full relative"
                          style={{
                            ...(isInGap && !pc
                              ? {
                                backgroundColor: "#fff",
                                backgroundImage: "radial-gradient(#ddd 10%, transparent 10%)",
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

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-6 border-2 border-black/10 shadow-neo-sm flex flex-col items-center">
                <h2 className="text-xl font-nunito font-black text-center mb-4 flex items-center justify-center gap-2 uppercase text-black dark:text-white">
                  Boşluğu Tamamla ✨
                </h2>

                <div className="grid grid-cols-2 gap-1.5 w-36 h-36 mx-auto mb-4 bg-black p-1.5 rounded-xl border-2 border-black/10 shadow-neo-sm">
                  {Array.from({ length: 2 }).map((_, r) =>
                    Array.from({ length: 2 }).map((_, c) => {
                      const isTopLeft = r === 0 && c === 0;
                      const isTopRight = r === 0 && c === 1;
                      const isBottomLeft = r === 1 && c === 0;
                      const isBottomRight = r === 1 && c === 1;

                      let borderRadius = "0";
                      if (isTopLeft) borderRadius = "1rem 0 0 0";
                      else if (isTopRight) borderRadius = "0 1rem 0 0";
                      else if (isBottomLeft) borderRadius = "0 0 0 1rem";
                      else if (isBottomRight) borderRadius = "0 0 1rem 0";

                      return (
                        <motion.button
                          key={`${r}-${c}`}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handlePaintTile(r, c)}
                          className="w-full h-full flex items-center justify-center transition-all bg-white relative overflow-hidden"
                          style={{
                            ...(userPainting[r][c]
                              ? getTileStyle(userPainting[r][c]!)
                              : {
                                backgroundImage: "radial-gradient(#ddd 10%, transparent 10%)",
                                backgroundSize: "10px 10px",
                              }),
                            borderRadius,
                          }}
                        >
                          {!userPainting[r][c] && (
                            <HelpCircle className="text-slate-300 dark:text-slate-500 absolute" size={20} />
                          )}
                        </motion.button>
                      );
                    }),
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border-2 border-black/10 shadow-inner">
                  {availableColors.map((color, idx) => (
                    <motion.button
                      key={idx}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setActiveColor(color);
                        playSound("click");
                      }}
                      className="w-10 h-10 rounded-lg border-2 border-black/10 transition-all relative shadow-neo-sm active:translate-y-1 active:shadow-none"
                      style={{
                        ...getTileStyle(color),
                        outline: activeColor === color ? "3px solid #000" : "none",
                        outlineOffset: 2,
                      }}
                    >
                      {activeColor === color && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle2 size={14} className="text-white drop-shadow-sm" strokeWidth={3} />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setUserPainting(Array.from({ length: 2 }, () => Array(2).fill(null)));
                      playSound("slide");
                    }}
                    className="flex-1 py-3 bg-white dark:bg-slate-700 text-black dark:text-white rounded-xl font-nunito font-bold border-2 border-black/10 flex items-center justify-center gap-2 transition-colors shadow-neo-sm active:translate-y-[2px] active:shadow-none uppercase tracking-wider text-sm"
                  >
                    <RotateCcw size={16} className="stroke-[3]" />
                    <span>Temizle</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCheck}
                    className="flex-[1.5] py-3 bg-cyber-green text-black rounded-xl font-nunito font-black border-2 border-black/10 shadow-neo-sm active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 uppercase tracking-wider text-base"
                  >
                    <CheckCircle2 size={20} className="stroke-[3]" />
                    <span>Kontrol Et</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default PatternPainterGame;
