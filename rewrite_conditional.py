import re

content = """import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "kosullu-yonerge";
const GAME_TITLE = "Koşullu Yönerge";
const GAME_DESCRIPTION = "Verilen mantıksal koşulu dikkatle oku, sahnedeki nesneleri analiz et ve doğru hedefi seç!";
const TUZO_TEXT = "TUZÖ 5.2.1 Mantıksal Akıl Yürütme ve Koşullu Yönerge Takibi";

// Variables from original
type ShapeType = "Circle" | "Square" | "Triangle" | "Star" | "Diamond";
type ColorType = "Red" | "Blue" | "Green" | "Yellow" | "Purple";

interface GameObject {
  id: string;
  shape: ShapeType;
  color: ColorType;
}

const SHAPES: ShapeType[] = ["Circle", "Square", "Triangle", "Star", "Diamond"];
const COLORS: ColorType[] = ["Red", "Blue", "Green", "Yellow", "Purple"];

const SHAPE_NAMES: Record<ShapeType, string> = {
  Circle: "Daire",
  Square: "Kare",
  Triangle: "Üçgen",
  Star: "Yıldız",
  Diamond: "Elmas",
};

const COLOR_NAMES: Record<ColorType, string> = {
  Red: "Kırmızı",
  Blue: "Mavi",
  Green: "Yeşil",
  Yellow: "Sarı",
  Purple: "Mor",
};

const COLOR_VALUES: Record<ColorType, string> = {
  Red: "#ef4444",
  Blue: "#3b82f6",
  Green: "#22c55e",
  Yellow: "#eab308",
  Purple: "#8b5cf6",
};

interface RoundData {
  objects: GameObject[];
  instruction: string;
  targetId: string;
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const uid = () => Math.random().toString(36).substring(2, 8);

const generateRound = (level: number): RoundData => {
  const count = level <= 5 ? 4 : level <= 12 ? 6 : 8;
  const objects: GameObject[] = [];
  for (let i = 0; i < count; i++) {
    objects.push({ id: uid(), shape: pick(SHAPES), color: pick(COLORS) });
  }
  const comboCounts: Record<string, number> = {};
  objects.forEach((o) => {
    const key = `${o.color}-${o.shape}`;
    comboCounts[key] = (comboCounts[key] || 0) + 1;
  });
  const singletons = objects.filter(
    (o) => comboCounts[`${o.color}-${o.shape}`] === 1,
  );
  if (singletons.length < 2) return generateRound(level);
  
  const targetA = pick(singletons);
  let targetB = pick(singletons);
  while (targetB.id === targetA.id) targetB = pick(singletons);
  
  const logicType = Math.floor(Math.random() * (level < 5 ? 3 : 6));
  let condText = "";
  let condTrue = false;
  
  switch (logicType) {
    case 0: {
      const test =
        Math.random() > 0.5
          ? pick(objects)
          : { color: pick(COLORS), shape: pick(SHAPES) };
      // Note: Object identity or partial identity. Test is partial, need to cast back nicely.
      condTrue = objects.some(
        (o) => o.color === test.color && o.shape === test.shape,
      );
      condText = `bir ${COLOR_NAMES[test.color as ColorType]} ${SHAPE_NAMES[test.shape as ShapeType]} varsa`;
      break;
    }
    case 1: {
      const c = pick(COLORS);
      const n = objects.filter((o) => o.color === c).length;
      const t = Math.max(0, n - 1 + Math.floor(Math.random() * 2));
      condTrue = n > t;
      condText = `${t} taneden fazla ${COLOR_NAMES[c]} nesne varsa`;
      break;
    }
    case 2: {
      const s = pick(SHAPES);
      const n = objects.filter((o) => o.shape === s).length;
      const t = Math.max(1, n - 1 + Math.floor(Math.random() * 2));
      condTrue = n < t;
      condText = `${t} taneden az ${SHAPE_NAMES[s]} varsa`;
      break;
    }
    case 3: {
      const c = pick(COLORS);
      condTrue = objects.filter((o) => o.color === c).length === 0;
      condText = `hiç ${COLOR_NAMES[c]} nesne yoksa`;
      break;
    }
    case 4: {
      const c1 = pick(COLORS);
      let c2 = pick(COLORS);
      while (c1 === c2) c2 = pick(COLORS);
      condTrue =
        objects.filter((o) => o.color === c1).length >
        objects.filter((o) => o.color === c2).length;
      condText = `${COLOR_NAMES[c1]} nesne sayısı ${COLOR_NAMES[c2]} olanlardan fazlaysa`;
      break;
    }
    case 5: {
      const s = pick(SHAPES);
      const c = pick(COLORS);
      condTrue =
        objects.filter((o) => o.shape === s).length ===
        objects.filter((o) => o.color === c).length;
      condText = `${SHAPE_NAMES[s]} sayısı ${COLOR_NAMES[c]} nesne sayısına eşitse`;
      break;
    }
  }
  
  const finalTarget = condTrue ? targetA : targetB;
  const descA = `${COLOR_NAMES[targetA.color]} ${SHAPE_NAMES[targetA.shape]}`;
  const descB = `${COLOR_NAMES[targetB.color]} ${SHAPE_NAMES[targetB.shape]}`;
  const instruction = `Eğer ${condText}, ${descA} nesnesini seç, değilse ${descB} nesnesini seç.`;
  
  return { objects, instruction, targetId: finalTarget.id };
};


const ShapeIcon: React.FC<{
  shape: ShapeType;
  color: ColorType;
  size?: number;
}> = ({ shape, color, size = 64 }) => {
  const fill = COLOR_VALUES[color];
  const s = size;
  switch (shape) {
    case "Circle":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill={fill}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="3"
          />
          <ellipse
            cx="40"
            cy="35"
            rx="14"
            ry="8"
            fill="rgba(255,255,255,0.25)"
            transform="rotate(-20 40 35)"
          />
        </svg>
      );
    case "Square":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <rect
            x="12"
            y="12"
            width="76"
            height="76"
            rx="12"
            fill={fill}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="3"
          />
          <rect
            x="20"
            y="18"
            width="28"
            height="12"
            rx="4"
            fill="rgba(255,255,255,0.2)"
          />
        </svg>
      );
    case "Triangle":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <polygon
            points="50,10 90,85 10,85"
            fill={fill}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="3"
          />
          <polygon points="50,24 36,55 50,55" fill="rgba(255,255,255,0.2)" />
        </svg>
      );
    case "Star":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <polygon
            points="50,5 61,35 95,35 68,55 79,88 50,68 21,88 32,55 5,35 39,35"
            fill={fill}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="3"
          />
          <polygon points="50,18 55,33 45,33" fill="rgba(255,255,255,0.2)" />
        </svg>
      );
    case "Diamond":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <polygon
            points="50,8 92,50 50,92 8,50"
            fill={fill}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="3"
          />
          <polygon points="50,20 38,50 50,50" fill="rgba(255,255,255,0.2)" />
        </svg>
      );
    default:
      return null;
  }
};


const ConditionalLogicGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const feedback = useGameFeedback({ duration: 1000 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const {
    phase,
    level,
    addScore,
    loseLife,
    nextLevel,
  } = engine;

  const [round, setRound] = useState<RoundData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase === "playing" && !selectedId) {
      setRound(generateRound(level));
    } else if (phase === "welcome") {
      setRound(null);
      setSelectedId(null);
    }
  }, [phase, level, selectedId]);

  const handleObjectClick = useCallback(
    (id: string) => {
      if (!round || phase !== "playing" || selectedId || !!feedbackState) return;
      
      const correct = id === round.targetId;
      setSelectedId(id);
      showFeedback(correct);
      playSound(correct ? "correct" : "incorrect");
      
      const t = setTimeout(() => {
        dismissFeedback();
        if (correct) {
          addScore(10 * level);
          nextLevel();
        } else {
          loseLife();
        }
        setSelectedId(null);
      }, 1200);
      timeoutsRef.current.push(t);
    },
    [round, phase, selectedId, feedbackState, showFeedback, playSound, dismissFeedback, addScore, level, nextLevel, loseLife],
  );

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: BrainCircuit,
    accentColor: "cyber-blue",
    maxLevel: 20,
    howToPlay: [
      "Ekranda verilen yönergeyi dikkatle oku",
      "Yönergedeki koşulun doğru olup olmadığını objelere bakarak test et",
      "Eğer doğruysa ilk nesneyi, yanlışsa ikinci nesneyi seç",
      // Remove fourth line, simplify standard
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
          <AnimatePresence mode="wait">
            {phase === "playing" && round && (
              <motion.div
                key={`level-${level}-${round.instruction}`} // Force unmount/remount on level change for entrance animation
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-4xl flex flex-col items-center gap-8"
              >
                {/* Instruction Card */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-slate-800 border-4 border-black p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[8px_8px_0_#000] text-center max-w-2xl w-full -rotate-1 relative"
                >
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-cyber-pink border-4 border-black rounded-full flex items-center justify-center rotate-12 shadow-[4px_4px_0_#000]">
                    <span className="font-syne font-black text-black">!</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-syne font-black text-slate-800 dark:text-slate-100 leading-relaxed italic">
                    "{round.instruction}"
                  </h3>
                </motion.div>

                {/* Objects Grid */}
                <div className="bg-slate-100 dark:bg-slate-800/80 border-4 border-black p-6 sm:p-8 rounded-2xl w-full shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1)]">
                  <div
                    className={`grid gap-4 sm:gap-6 justify-center ${
                      round.objects.length <= 4
                        ? "grid-cols-2 sm:grid-cols-4"
                        : round.objects.length <= 6
                          ? "grid-cols-3 sm:grid-cols-3"
                          : "grid-cols-3 sm:grid-cols-4"
                    }`}
                  >
                    {round.objects.map((obj, i) => {
                      const isSelected = selectedId === obj.id;
                      const isRevealedTarget =
                        selectedId && obj.id === round.targetId;
                      const isMissedTarget =
                        selectedId &&
                        selectedId !== obj.id &&
                        obj.id === round.targetId;

                      let borderClass = "border-black";
                      let bgClass = "bg-white dark:bg-slate-700";
                      let opacityClass =
                        selectedId && !isSelected && !isRevealedTarget
                          ? "opacity-40"
                          : "opacity-100";
                      let animClass = "";

                      if (isSelected) {
                        if (obj.id === round.targetId) {
                          borderClass = "border-cyber-green";
                          bgClass = "bg-green-100 dark:bg-green-900";
                          animClass = "animate-bounce";
                        } else {
                          borderClass = "border-cyber-pink";
                          bgClass = "bg-red-100 dark:bg-red-900";
                        }
                      } else if (isMissedTarget) {
                        borderClass = "border-cyber-green border-dashed";
                        opacityClass = "opacity-70";
                      }

                      return (
                        <motion.button
                          key={obj.id}
                          initial={{ scale: 0, rotate: Math.random() * 40 - 20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.3 + i * 0.05, type: "spring", stiffness: 200, damping: 15 }}
                          whileHover={!selectedId ? { scale: 1.1, y: -5 } : {}}
                          whileTap={!selectedId ? { scale: 0.95 } : {}}
                          onClick={() => handleObjectClick(obj.id)}
                          disabled={!!selectedId}
                          className={`aspect-square rounded-2xl sm:rounded-[2rem] border-4 flex items-center justify-center p-4 transition-all duration-300 ${borderClass} ${bgClass} ${opacityClass} ${animClass} relative group shadow-[4px_4px_0_#000] hover:shadow-[8px_8px_0_#000]`}
                        >
                          <ShapeIcon
                            shape={obj.shape}
                            color={obj.color}
                            size={72}
                          />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
            {/* General game over feedback is handled by shell */}
          </AnimatePresence>
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default ConditionalLogicGame;
"""

with open("/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/BrainTrainer/ConditionalLogicGame.tsx", "w") as f:
    f.write(content)
