import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Diamond,
  Cloud,
  Sun,
  Moon,
  Anchor,
  Music,
  Ghost,
  Flower,
  Crown,
  Star as StarIcon,
  Zap as ZapIcon,
  Heart as HeartIcon
} from "lucide-react";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { GAME_COLORS } from './shared/gameColors';

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = "gorsel-hafiza";

type InternalPhase =
  | "memorize"
  | "transition"
  | "recall";

type IconType =
  | "Star"
  | "Circle"
  | "Square"
  | "Triangle"
  | "Hexagon"
  | "Diamond"
  | "Heart"
  | "Cloud"
  | "Sun"
  | "Moon"
  | "Zap"
  | "Anchor"
  | "Music"
  | "Ghost"
  | "Flower"
  | "Crown";

interface GridCell {
  id: string;
  icon: IconType | null;
  color: string;
}

const ICON_MAP: Record<IconType, React.ElementType> = {
  Star: StarIcon,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Diamond,
  Heart: HeartIcon,
  Cloud,
  Sun,
  Moon,
  Zap: ZapIcon,
  Anchor,
  Music,
  Ghost,
  Flower,
  Crown,
};

const ICON_TYPES = Object.keys(ICON_MAP) as IconType[];

// Cyber-pop palette
const COLORS = [
  GAME_COLORS.pink, // cyber-pink
  GAME_COLORS.emerald, // cyber-green
  GAME_COLORS.blue, // cyber-blue
  GAME_COLORS.yellow, // cyber-yellow
  GAME_COLORS.orange, // cyber-orange
  GAME_COLORS.purple, // cyber-magenta
];

interface LevelConfig {
  gridSize: number;
  items: number;
  memorizeMs: number;
}

const LEVEL_CONFIG: Record<number, LevelConfig> = {
  1: { gridSize: 3, items: 3, memorizeMs: 3000 },
  2: { gridSize: 3, items: 3, memorizeMs: 2800 },
  3: { gridSize: 3, items: 4, memorizeMs: 3000 },
  4: { gridSize: 3, items: 5, memorizeMs: 3000 },
  5: { gridSize: 3, items: 5, memorizeMs: 2500 },
  6: { gridSize: 3, items: 6, memorizeMs: 3000 },
  7: { gridSize: 3, items: 7, memorizeMs: 2500 },
  8: { gridSize: 4, items: 6, memorizeMs: 3500 },
  9: { gridSize: 4, items: 7, memorizeMs: 3000 },
  10: { gridSize: 4, items: 8, memorizeMs: 3000 },
  11: { gridSize: 4, items: 9, memorizeMs: 2500 },
  12: { gridSize: 4, items: 9, memorizeMs: 2000 },
  13: { gridSize: 4, items: 10, memorizeMs: 2500 },
  14: { gridSize: 4, items: 11, memorizeMs: 2500 },
  15: { gridSize: 4, items: 12, memorizeMs: 2000 },
  16: { gridSize: 5, items: 10, memorizeMs: 3000 },
  17: { gridSize: 5, items: 12, memorizeMs: 2500 },
  18: { gridSize: 5, items: 13, memorizeMs: 2000 },
  19: { gridSize: 5, items: 14, memorizeMs: 1800 },
  20: { gridSize: 5, items: 15, memorizeMs: 1500 },
};

const getRandom = <T,>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const genGrid = (gs: number, ic: number): GridCell[] => {
  const cells: GridCell[] = Array.from({ length: gs * gs }, (_, i) => ({
    id: `c-${i}`,
    icon: null,
    color: "#6B7280",
  }));
  shuffle(Array.from({ length: gs * gs }, (_, i) => i))
    .slice(0, ic)
    .forEach((idx) => {
      cells[idx] = {
        ...cells[idx],
        icon: getRandom(ICON_TYPES),
        color: getRandom(COLORS),
      };
    });
  return cells;
};

const createModified = (orig: GridCell[]) => {
  const grid = orig.map((c) => ({ ...c }));
  const act = grid.map((c, i) => (c.icon ? i : -1)).filter((i) => i !== -1);
  const idx = getRandom(act);
  const old = grid[idx].icon;
  let next;
  do {
    next = getRandom(ICON_TYPES);
  } while (next === old);
  grid[idx] = { ...grid[idx], icon: next, color: getRandom(COLORS) };
  return { grid, targetId: grid[idx].id };
};

const VisualMemoryGame: React.FC = () => {
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
    initialLives: INITIAL_LIVES,
  });

  const feedback = useGameFeedback({
    duration: 1500,
  });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [internalPhase, setInternalPhase] = useState<InternalPhase>("memorize");
  const [gridBefore, setGridBefore] = useState<GridCell[]>([]);
  const [gridAfter, setGridAfter] = useState<GridCell[]>([]);
  const [targetCellId, setTargetCellId] = useState<string | null>(null);
  const [userSelectedId, setUserSelectedId] = useState<string | null>(null);
  const [memTimeLeft, setMemTimeLeft] = useState(0);
  const [memTimeMax, setMemTimeMax] = useState(0);
  const [gridSize, setGridSize] = useState(3);

  const memTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startLevel = useCallback((lvl: number) => {
    const conf = LEVEL_CONFIG[lvl] || LEVEL_CONFIG[MAX_LEVEL];
    const b = genGrid(conf.gridSize, conf.items);
    const { grid: a, targetId: t } = createModified(b);

    setGridBefore(b);
    setGridAfter(a);
    setTargetCellId(t);
    setUserSelectedId(null);
    setGridSize(conf.gridSize);
    setMemTimeLeft(conf.memorizeMs);
    setMemTimeMax(conf.memorizeMs);
    setInternalPhase("memorize");
    playSound("pop");
  }, [playSound]);

  useEffect(() => {
    if (engine.phase === "playing" && gridBefore.length === 0) {
      startLevel(engine.level);
    } else if (engine.phase === "welcome") {
      setGridBefore([]);
      setGridAfter([]);
      setTargetCellId(null);
      setUserSelectedId(null);
      setInternalPhase("memorize");
    }
  }, [engine.phase, engine.level, gridBefore.length, startLevel]);

  // Memorize Timer
  useEffect(() => {
    if (engine.phase === "playing" && internalPhase === "memorize" && memTimeLeft > 0) {
      memTimerRef.current = setTimeout(() => {
        setMemTimeLeft((p) => {
          if (p <= 100) {
            setInternalPhase("transition");
            playSound("slide");
            safeTimeout(() => {
              setInternalPhase("recall");
            }, 600);
            return 0;
          }
          return p - 100;
        });
      }, 100);
      return () => {
        if (memTimerRef.current) clearTimeout(memTimerRef.current);
      };
    }
  }, [engine.phase, internalPhase, memTimeLeft, engine, playSound]);

  const handleCellClick = (id: string) => {
    if (internalPhase !== "recall" || feedbackState || engine.phase !== "playing") return;

    setUserSelectedId(id);
    const isCorrect = id === targetCellId;

    playSound(isCorrect ? "correct" : "incorrect");
    showFeedback(isCorrect);

    const willGameOver = !isCorrect && engine.lives <= 1;

    if (isCorrect) {
      engine.addScore(15 * engine.level);
    } else {
      engine.loseLife();
    }

    safeTimeout(() => {
      dismissFeedback();
      if (isCorrect) {
        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
          playSound("success");
        } else {
          engine.nextLevel();
          startLevel(engine.level + 1);
          playSound("slide");
        }
      } else if (!willGameOver) {
        // Generate fresh grid for retry (don't re-show same pattern)
        startLevel(engine.level);
      }
    }, 1500);
  };

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Görsel Hafıza",
        icon: Eye,
        description:
          "Izgaradaki şekilleri hafızanda tut, değişen şekli bul!",
        howToPlay: [
          "Izgarayı dikkatlice incele ve şekilleri ezberle.",
          "Süre bitince ızgara kapanacak ve kısa bir süre sonra geri açılacak.",
          "Izgara tekrar açıldığında DEĞİŞEN şekli bul ve tıkla.",
        ],
        tuzoCode: "2.1.2 Görsel Süreli Bellek",
        accentColor: "cyber-blue",
        maxLevel: MAX_LEVEL,
      }}
    >
      {() => {
        return (
          <div className="w-full flex justify-center items-center flex-1 h-full pt-4 pb-24 sm:pb-4">

            {engine.phase === "playing" && (
              <motion.div
                key={`lvl-${engine.level}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl flex flex-col items-center"
              >
                <div className="mb-4 sm:mb-8 text-center bg-white dark:bg-slate-800 border-2 border-black/10 px-4 sm:px-8 py-3 sm:py-4 rounded-xl shadow-neo-sm rotate-1">
                  <h2 className="text-xl sm:text-2xl font-nunito font-black uppercase text-black dark:text-white tracking-widest">
                    {internalPhase === "memorize" && "Aklında Tut!"}
                    {internalPhase === "transition" && "Hazır Ol..."}
                    {internalPhase === "recall" && "Hangisi Değişti?"}
                  </h2>

                  {internalPhase === "memorize" && (
                    <div className="w-48 sm:w-64 h-3 bg-slate-200 dark:bg-slate-700 rounded-full mt-3 sm:mt-4 mx-auto overflow-hidden border-2 border-black/10">
                      <motion.div
                        className="h-full bg-cyber-pink"
                        initial={{ width: "100%" }}
                        animate={{ width: `${(memTimeLeft / memTimeMax) * 100}%` }}
                        transition={{ duration: 0.1, ease: "linear" }}
                      />
                    </div>
                  )}
                </div>

                <div className="bg-slate-200 dark:bg-slate-700 p-2 sm:p-4 rounded-xl border-2 border-black/10 shadow-neo-sm -rotate-1 relative">
                  <div
                    className="grid gap-2 sm:gap-3 p-3 sm:p-5 bg-white dark:bg-slate-800 rounded-2xl relative overflow-hidden"
                    style={{
                      gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    }}
                  >
                    <div className="absolute inset-0 pattern-grid opacity-10 dark:opacity-5 pointer-events-none" />

                    {internalPhase === "transition" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-cyber-blue z-20 flex items-center justify-center border-2 border-black/10 rounded-xl m-1 sm:m-2"
                      >
                        <ZapIcon size={48} className="text-white animate-pulse" />
                      </motion.div>
                    )}

                    <AnimatePresence>
                      {internalPhase !== "transition" && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="contents"
                        >
                          {(internalPhase === "memorize" ? gridBefore : gridAfter).map(
                            (c) => {
                              const IconTag = c.icon ? ICON_MAP[c.icon] : null;
                              const isSelected = userSelectedId === c.id;
                              const isTarget = c.id === targetCellId;
                              const showResult = !!feedbackState && internalPhase === "recall";

                              let bgClass = "bg-slate-100 dark:bg-slate-700";
                              let borderClass = "border-2 border-slate-300 dark:border-slate-500";

                              if (showResult) {
                                if (isTarget) {
                                  bgClass = "bg-cyber-green";
                                  borderClass = "border-2 border-black/10 shadow-neo-sm z-10 scale-105";
                                } else if (isSelected) {
                                  bgClass = "bg-cyber-pink opacity-80";
                                  borderClass = "border-2 border-black/10";
                                } else {
                                  bgClass = "opacity-40";
                                }
                              } else if (isSelected) {
                                bgClass = "bg-cyber-yellow";
                                borderClass = "border-2 border-black/10 shadow-neo-sm";
                              } else if (internalPhase === "recall" && c.icon) {
                                bgClass = "bg-white dark:bg-slate-600 hover:bg-slate-50 dark:hover:bg-slate-500 cursor-pointer";
                                borderClass = "border-2 border-black/10 hover:border-cyber-purple";
                              }

                              return (
                                <motion.button
                                  key={c.id}
                                  whileTap={internalPhase === "recall" && !showResult && c.icon ? { scale: 0.95 } : {}}
                                  onClick={() => handleCellClick(c.id)}
                                  disabled={internalPhase !== "recall" || showResult || !c.icon}
                                  className={`
                                      flex items-center justify-center transition-all duration-300
                                      ${bgClass} ${borderClass} rounded-xl relative aspect-square
                                      ${gridSize === 3 ? 'min-w-[60px] sm:min-w-[90px] md:min-w-[110px]' :
                                      gridSize === 4 ? 'min-w-[50px] sm:min-w-[70px] md:min-w-[90px]' :
                                        'min-w-[40px] sm:min-w-[56px] md:min-w-[72px]'}
                                    `}
                                >
                                  {IconTag && (
                                    <div className="w-[55%] h-[55%] flex items-center justify-center">
                                      <IconTag
                                        className="w-full h-full"
                                        color={showResult && isTarget ? "white" : c.color}
                                        strokeWidth={gridSize <= 4 ? 2.5 : 3}
                                      />
                                    </div>
                                  )}
                                </motion.button>
                              );
                            },
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            <style>{`
              .pattern-grid {
                background-image: 
                  linear-gradient(to right, #000 1px, transparent 1px),
                  linear-gradient(to bottom, #000 1px, transparent 1px);
                background-size: 20px 20px;
              }
              .dark .pattern-grid {
                background-image: 
                  linear-gradient(to right, #fff 1px, transparent 1px),
                  linear-gradient(to bottom, #fff 1px, transparent 1px);
              }
            `}</style>
          </div>
        );
      }}
    </BrainTrainerShell>
  );
};

export default VisualMemoryGame;
