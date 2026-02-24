import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Code2 } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "dikkat-kodlama";
const GAME_TITLE = "Dikkat Kodlama";
const GAME_DESCRIPTION = "Sayılarla şekilleri eşleştir, zihnindeki kodları en hızlı şekilde çözerek zirveye ulaş!";
const TUZO_TEXT = "TUZÖ 5.6.1 Dikkat Kodlama & Sembol Eşleştirme";

type ShapeType =
  | "circle"
  | "square"
  | "triangle"
  | "plus"
  | "star"
  | "diamond"
  | "hexagon";

interface KeyMapping {
  number: number;
  shape: ShapeType;
}

interface TestItem {
  id: string;
  targetNumber: number;
  userShape: ShapeType | null;
}

const ALL_SHAPES: ShapeType[] = [
  "circle",
  "square",
  "triangle",
  "plus",
  "star",
  "diamond",
  "hexagon",
];

const SHAPE_LABELS: Record<ShapeType, string> = {
  circle: "Daire",
  square: "Kare",
  triangle: "Üçgen",
  plus: "Artı",
  star: "Yıldız",
  diamond: "Elmas",
  hexagon: "Altıgen",
};

const ShapeIcon: React.FC<{
  type: ShapeType;
  className?: string;
  size?: number;
  strokeWidth?: number;
}> = ({ type, className = "text-slate-300", size = 24, strokeWidth = 2 }) => {
  const props = {
    width: size,
    height: size,
    stroke: "currentColor",
    strokeWidth,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
  switch (type) {
    case "circle":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    case "square":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      );
    case "triangle":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M12 3L22 20H2L12 3Z" />
        </svg>
      );
    case "plus":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M12 5V19M5 12H19" strokeWidth={strokeWidth + 1} />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M12 2L22 12L12 22L2 12L12 2Z" />
        </svg>
      );
    case "hexagon":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z" />
        </svg>
      );
    default:
      return null;
  }
};

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const AttentionCodingGame: React.FC = () => {
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
    addTime,
  } = engine;

  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [keyMappings, setKeyMappings] = useState<KeyMapping[]>([]);
  const [items, setItems] = useState<TestItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const startLevel = useCallback(
    (lvl: number) => {
      const shapeCount = lvl <= 5 ? 5 : lvl <= 10 ? 6 : 7;
      const shapes = shuffle(ALL_SHAPES).slice(0, shapeCount);
      const mappings = shapes.map((shape, i) => ({ number: i + 1, shape }));
      setKeyMappings(mappings);

      const itemCount =
        lvl <= 3 ? 5 : lvl <= 7 ? 6 : lvl <= 12 ? 7 : lvl <= 16 ? 8 : 9;
      const newItems: TestItem[] = Array.from(
        { length: itemCount },
        (_, i) => ({
          id: `${lvl}-${i}`,
          targetNumber: Math.floor(Math.random() * shapeCount) + 1,
          userShape: null,
        }),
      );

      setItems(newItems);
      setCurrentIndex(0);
      playSound("slide");
    },
    [playSound],
  );

  useEffect(() => {
    if (phase === "playing" && items.length === 0) {
      startLevel(level);
    } else if (phase === "welcome" && items.length > 0) {
      setItems([]);
    }
  }, [phase, level, items.length, startLevel]);

  const handleLevelComplete = useCallback(() => {
    playSound("correct");
    showFeedback(true);

    const t = setTimeout(() => {
      dismissFeedback();
      addTime(10); // Orjinal oyunda bölüm bitince +10s veriliyordu
      nextLevel();
      startLevel(level + 1);
    }, 1000); // reduced timeout for snappier feel like original
    timeoutsRef.current.push(t);
  }, [playSound, showFeedback, dismissFeedback, addTime, nextLevel, startLevel, level]);

  const handleCrash = useCallback(() => {
    playSound("incorrect");
    loseLife();
    showFeedback(false);

    const t = setTimeout(() => {
      dismissFeedback();
    }, 1000);
    timeoutsRef.current.push(t);
  }, [playSound, loseLife, showFeedback, dismissFeedback]);

  const handleAnswer = (shape: ShapeType) => {
    if (phase !== "playing" || !!feedbackState || items.length === 0) return;

    const currentItem = items[currentIndex];
    const correctShape = keyMappings.find(
      (m) => m.number === currentItem.targetNumber,
    )?.shape;

    const isCorrect = shape === correctShape;

    if (isCorrect) {
      playSound("pop");
      addScore(20 + level * 5);

      if (currentIndex === items.length - 1) {
        handleLevelComplete();
      } else {
        setCurrentIndex((p) => p + 1);
      }
    } else {
      handleCrash();
    }
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Code2,
    accentColor: "cyber-pink",
    maxLevel: 20,
    howToPlay: [
      "Üstteki tablodan her sayıya karşılık gelen şekli bul",
      "Sorulan sayıya ait doğru şekli aşağıdaki butonlardan seç",
      "Tüm eşleştirmeleri hata yapmadan ve hızla tamamla"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1 mt-4">
          <AnimatePresence mode="wait">
            {phase === "playing" && !feedbackState && items.length > 0 && (
              <motion.div
                key="game"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full max-w-4xl space-y-8"
              >
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border-4 border-black shadow-[12px_12px_0_#000] dark:shadow-[12px_12px_0_#0f172a] rotate-1">
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                    {keyMappings.map((m) => (
                      <div
                        key={m.number}
                        className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-3 border-4 border-black flex flex-col items-center gap-2 shadow-[4px_4px_0_#000] group transition-all"
                      >
                        <span className="text-2xl font-syne font-black text-cyber-blue drop-shadow-sm">
                          {m.number}
                        </span>
                        <div className="h-1 w-8 bg-black dark:bg-slate-600 rounded-full" />
                        <ShapeIcon
                          type={m.shape}
                          className="text-black dark:text-white transition-transform"
                          size={24}
                          strokeWidth={3}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <span className="text-sm font-syne font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest bg-white dark:bg-slate-800 px-4 py-1.5 rounded-xl border-4 border-black shadow-[4px_4px_0_#000] -rotate-2">
                    SIRADAKİ SORU
                  </span>
                  <div className="flex items-center gap-4 flex-wrap justify-center">
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`w-16 h-16 rounded-2xl border-4 border-black flex flex-col items-center justify-center transition-all duration-300 ${idx === currentIndex ? "bg-cyber-pink scale-125 shadow-[8px_8px_0_#000] z-10" : idx < currentIndex ? "bg-cyber-green opacity-80 shadow-[4px_4px_0_#000]" : "bg-white dark:bg-slate-800 opacity-50 shadow-none border-dashed dark:border-slate-500"}`}
                      >
                        <span
                          className={`text-2xl font-syne font-black ${idx === currentIndex ? "text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]" : "text-black dark:text-white"}`}
                        >
                          {item.targetNumber}
                        </span>
                        {idx < currentIndex && (
                          <CheckCircle2
                            size={14}
                            className="text-black fill-black mt-1"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-4">
                  {ALL_SHAPES.filter((s) =>
                    keyMappings.some((m) => m.shape === s),
                  ).map((shape) => (
                    <motion.button
                      key={shape}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAnswer(shape)}
                      className="aspect-square bg-white dark:bg-slate-800 border-4 border-black rounded-[1.5rem] flex flex-col items-center justify-center gap-2 shadow-[8px_8px_0_#000] hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:shadow-[12px_12px_0_#000] transition-all group active:translate-y-2 active:shadow-none"
                    >
                      <ShapeIcon
                        type={shape}
                        className="text-black dark:text-white group-hover:scale-110 transition-transform"
                        size={36}
                        strokeWidth={2.5}
                      />
                      <span className="text-xs font-syne font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                        {SHAPE_LABELS[shape]}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* The shell handles "game_over" and "victory" UI, as well as general feedback popups. */}

          </AnimatePresence>
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default AttentionCodingGame;
