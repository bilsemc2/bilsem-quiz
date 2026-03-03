import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { FlaskConical } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { GAME_COLORS } from './shared/gameColors';
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
type ShapeType =
  | "circle"
  | "square"
  | "triangle"
  | "pentagon"
  | "hexagon"
  | "star"
  | "diamond";
type ShapeColor =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "orange"
  | "cyan";
type ShapeFill = "solid" | "outline" | "striped";
interface ShapeData {
  id: string;
  type: ShapeType;
  color: ShapeColor;
  fill: ShapeFill;
  rotation: number;
}
interface ShapeGroupData {
  id: string;
  shapes: ShapeData[];
}
interface PuzzleData {
  ruleName: string;
  ruleDescription: string;
  examples: ShapeGroupData[];
  options: { group: ShapeGroupData; isCorrect: boolean }[];
}
const AVAILABLE_SHAPES: ShapeType[] = [
  "circle",
  "square",
  "triangle",
  "pentagon",
  "hexagon",
  "star",
  "diamond",
];
const AVAILABLE_COLORS: ShapeColor[] = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
  "cyan",
];
const COLORS_MAP: Record<ShapeColor, string> = {
  red: GAME_COLORS.incorrect,
  blue: "#60a5fa",
  green: GAME_COLORS.emerald,
  yellow: GAME_COLORS.yellow,
  purple: GAME_COLORS.purple,
  orange: "#fb923c",
  cyan: "#22d3ee",
};
const generateId = () => Math.random().toString(36).substr(2, 9);
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T,>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];
const shuffle = <T,>(array: T[]): T[] =>
  [...array].sort(() => Math.random() - 0.5);
const generateShape = (overrides: Partial<ShapeData> = {}): ShapeData => ({
  id: generateId(),
  type: randomItem(AVAILABLE_SHAPES),
  color: randomItem(AVAILABLE_COLORS),
  fill: randomItem(["solid", "outline", "striped"]),
  rotation: randomInt(0, 360),
  ...overrides,
});
const generateGroup = (
  count: number,
  constraintFn: (i: number) => Partial<ShapeData>,
): ShapeGroupData => {
  const shapes: ShapeData[] = [];
  for (let i = 0; i < count; i++)
    shapes.push({ ...generateShape(), ...constraintFn(i) });
  return { id: generateId(), shapes };
};
const translateColor = (c: string) =>
  ({
    red: "Kırmızı",
    blue: "Mavi",
    green: "Yeşil",
    yellow: "Sarı",
    purple: "Mor",
    orange: "Turuncu",
    cyan: "Turkuaz",
  })[c] || c;
const translateType = (t: string) =>
  ({
    circle: "Daire",
    square: "Kare",
    triangle: "Üçgen",
    pentagon: "Beşgen",
    hexagon: "Altıgen",
    star: "Yıldız",
    diamond: "Eşkenar Dörtgen",
  })[t] || t;
const puzzleSameColor = (): PuzzleData => {
  const target = randomItem(AVAILABLE_COLORS);
  const others = AVAILABLE_COLORS.filter((c) => c !== target);
  return {
    ruleName: "Renk Uyumu",
    ruleDescription: `Tüm şekiller ${translateColor(target)}.`,
    examples: [
      generateGroup(2, () => ({ color: target })),
      generateGroup(2, () => ({ color: target })),
    ],
    options: shuffle([
      { group: generateGroup(2, () => ({ color: target })), isCorrect: true },
      {
        group: generateGroup(2, () => ({ color: randomItem(others) })),
        isCorrect: false,
      },
      {
        group: generateGroup(2, () => ({ color: randomItem(others) })),
        isCorrect: false,
      },
      {
        group: generateGroup(2, () => ({ color: randomItem(others) })),
        isCorrect: false,
      },
    ]),
  };
};
const puzzleSameType = (): PuzzleData => {
  const target = randomItem(AVAILABLE_SHAPES);
  const others = AVAILABLE_SHAPES.filter((t) => t !== target);
  return {
    ruleName: "Şekil Benzerliği",
    ruleDescription: `Tüm şekiller birer ${translateType(target)}.`,
    examples: [
      generateGroup(2, () => ({ type: target })),
      generateGroup(2, () => ({ type: target })),
    ],
    options: shuffle([
      { group: generateGroup(2, () => ({ type: target })), isCorrect: true },
      {
        group: generateGroup(2, () => ({ type: randomItem(others) })),
        isCorrect: false,
      },
      {
        group: generateGroup(2, () => ({ type: randomItem(others) })),
        isCorrect: false,
      },
      {
        group: generateGroup(2, () => ({ type: randomItem(others) })),
        isCorrect: false,
      },
    ]),
  };
};
const puzzleCountMatch = (): PuzzleData => {
  const target = randomInt(1, 4);
  return {
    ruleName: "Sayı Kuralı",
    ruleDescription: `Grupta tam olarak ${target} adet şekil var.`,
    examples: [
      generateGroup(target, () => ({})),
      generateGroup(target, () => ({})),
    ],
    options: shuffle([
      { group: generateGroup(target, () => ({})), isCorrect: true },
      {
        group: generateGroup(target === 1 ? 2 : 1, () => ({})),
        isCorrect: false,
      },
      {
        group: generateGroup(target === 4 ? 3 : 4, () => ({})),
        isCorrect: false,
      },
      {
        group: generateGroup(target === 2 ? 3 : 2, () => ({})),
        isCorrect: false,
      },
    ]),
  };
};
const getShapePath = (t: ShapeType): string => {
  switch (t) {
    case "circle":
      return "M 50,50 m -45,0 a 45,45 0 1,0 90,0 a 45,45 0 1,0 -90,0";
    case "square":
      return "M 10,10 H 90 V 90 H 10 Z";
    case "triangle":
      return "M 50,10 L 90,90 H 10 Z";
    case "diamond":
      return "M 50,5 L 95,50 L 50,95 L 5,50 Z";
    case "pentagon":
      return "M 50,5 L 95,38 L 78,90 H 22 L 5,38 Z";
    case "hexagon":
      return "M 25,5 L 75,5 L 95,50 L 75,95 L 25,95 L 5,50 Z";
    case "star":
      return "M 50,5 L 63,35 L 95,38 L 70,58 L 78,90 L 50,75 L 22,90 L 30,58 L 5,38 L 37,35 Z";
    default:
      return "";
  }
};
const ShapeView: React.FC<{ data: ShapeData; size?: number }> = ({
  data,
  size = 50,
}) => {
  const colorHex = COLORS_MAP[data.color];
  const fillStyle =
    data.fill === "solid"
      ? colorHex
      : data.fill === "striped"
        ? `url(#stripe-${data.id})`
        : "none";
  return (
    <div
      className="inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        transform: `rotate(${data.rotation}deg)`,
      }}
    >
      {" "}
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        className="overflow-visible"
      >
        {" "}
        <defs>
          <pattern
            id={`stripe-${data.id}`}
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="10"
              stroke={colorHex}
              strokeWidth="4"
            />
          </pattern>
        </defs>{" "}
        <path
          d={getShapePath(data.type)}
          fill={fillStyle}
          stroke={colorHex}
          strokeWidth={4}
          strokeLinejoin="round"
        />{" "}
      </svg>{" "}
    </div>
  );
};
const GAME_ID = "mantik-bulmacasi";
const GAME_TITLE = "Mantık Bulmacası";
const GAME_DESCRIPTION = "Örnek gruplardaki gizli kuralları keşfet ve aynı kurala uyan yeni grubu bul! Analitik düşünme becerini kanıtla.";
const TUZO_TEXT = "TUZÖ 5.5.1 Kural Çıkarsama";

const LogicPuzzleGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;
  const { phase, level, addScore, loseLife, nextLevel } = engine;

  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const initLevel = useCallback(() => {
    const gens = [puzzleSameColor, puzzleSameType, puzzleCountMatch];
    setPuzzle(randomItem(gens)());
    setSelectedIdx(null);
  }, []);

  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;

    if (
      phase === "playing" &&
      (prevPhase === "welcome" || prevPhase === "game_over" || prevPhase === "victory")
    ) {
      // Fresh start or restart — generate new puzzle
      initLevel();
      playSound("slide");
    } else if (phase === "welcome" || phase === "game_over" || phase === "victory") {
      setPuzzle(null);
      setSelectedIdx(null);
    }

    prevPhaseRef.current = phase;
  }, [phase, initLevel, playSound]);

  const handleGuess = (i: number) => {
    if (phase !== "playing" || selectedIdx !== null || !puzzle || feedbackState) return;
    setSelectedIdx(i);
    const ok = puzzle.options[i].isCorrect;
    showFeedback(ok);
    playSound(ok ? "correct" : "incorrect");

    if (ok) {
      addScore(10 * level);
      safeTimeout(() => {
        dismissFeedback();
        nextLevel();
        if (level < MAX_LEVEL) {
          setSelectedIdx(null);
          initLevel();
        }
      }, 1500);
    } else {
      loseLife();
      safeTimeout(() => {
        dismissFeedback();
        if (engine.lives > 1) {
          setSelectedIdx(null);
          initLevel(); // Try a new puzzle for the same level
        }
      }, 1500);
    }
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: FlaskConical,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Üstteki örneklerin ortak özelliğini bul.",
      "Aynı özelliğe sahip olan seçeneği işaretle.",
      "Renk, şekil veya sayı kurallarına dikkat et!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full max-w-3xl mx-auto">
          {phase === "playing" && puzzle && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-2xl"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border-2 border-black/10 shadow-neo-sm mb-4">
                <h2 className="text-xs font-nunito font-black text-cyber-blue uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                  <FlaskConical size={16} className="stroke-[3]" />
                  REFERANS GRUPLAR
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {puzzle.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border-2 border-black/10 flex items-center justify-center gap-3 shadow-[inset_0_4px_8px_rgba(0,0,0,0.1)]"
                    >
                      {ex.shapes.map((s) => (
                        <div key={s.id}>
                          <ShapeView data={s} size={42} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {puzzle.options.map((opt, i) => {
                  const isSel = selectedIdx === i;
                  const isCorrectOption = opt.isCorrect;
                  const hasSelected = selectedIdx !== null;

                  let btnClass = "border-black/10 bg-white dark:bg-slate-800";

                  if (hasSelected) {
                    if (isSel && isCorrectOption) {
                      // User selected the correct answer
                      btnClass = "border-cyber-green bg-cyber-green/20 ring-2 ring-cyber-green shadow-none translate-y-1";
                    } else if (isSel && !isCorrectOption) {
                      // User selected a wrong answer
                      btnClass = "border-cyber-pink bg-cyber-pink/20 ring-2 ring-cyber-pink shadow-none translate-y-1";
                    } else if (!isSel && isCorrectOption) {
                      // Show where the correct answer was (when user picked wrong)
                      btnClass = "border-cyber-green bg-cyber-green/10 ring-2 ring-cyber-green";
                    } else {
                      // Other unselected wrong options
                      btnClass = "border-black/5 bg-slate-100 dark:bg-slate-700 opacity-40";
                    }
                  }

                  return (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleGuess(i)}
                      disabled={selectedIdx !== null}
                      className={`p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-center gap-3 transition-all duration-300 border-2 shadow-neo-sm active:translate-y-1 active:shadow-none ${btnClass}`}
                    >
                      {opt.group.shapes.map((s) => (
                        <div key={s.id}>
                          <ShapeView data={s} size={42} />
                        </div>
                      ))}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default LogicPuzzleGame;
