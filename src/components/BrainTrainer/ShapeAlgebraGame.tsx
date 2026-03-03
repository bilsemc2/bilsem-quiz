import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Equal, Plus, Delete, Check, Brain } from "lucide-react";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { GAME_COLORS } from './shared/gameColors';

const MAX_LEVEL = 20;
const GAME_ID = "sekil-cebiri";
const TIME_LIMIT = 180;

type ShapeType =
  | "circle"
  | "square"
  | "triangle"
  | "star"
  | "hexagon"
  | "diamond";
type ColorType =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "orange"
  | "pink"
  | "cyan";

interface VariableDef {
  id: string;
  shape: ShapeType;
  color: ColorType;
  dotted: boolean;
  value: number;
}
interface EquationTerm {
  variableId: string;
}
interface EquationDef {
  id: string;
  items: EquationTerm[];
  result: number;
}
interface QuestionDef {
  items: EquationTerm[];
  answer: number;
  text: string;
}
interface LevelData {
  variables: VariableDef[];
  equations: EquationDef[];
  question: QuestionDef;
}

const SHAPES: ShapeType[] = [
  "circle",
  "square",
  "triangle",
  "star",
  "hexagon",
  "diamond",
];
const COLORS: ColorType[] = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
  "pink",
  "cyan",
];
const COLOR_MAP: Record<ColorType, string> = {
  red: GAME_COLORS.pink,
  blue: GAME_COLORS.blue,
  green: GAME_COLORS.emerald,
  yellow: GAME_COLORS.yellow,
  purple: "#b82aff",
  orange: GAME_COLORS.orange,
  pink: GAME_COLORS.pink,
  cyan: GAME_COLORS.blue,
};

const ShapeIcon = ({
  shape,
  color,
  dotted,
  size,
}: {
  shape: ShapeType;
  color: ColorType;
  dotted: boolean;
  size: number;
}) => {
  const getPath = () => {
    switch (shape) {
      case "circle":
        return <circle cx="50" cy="50" r="45" />;
      case "square":
        return <rect x="5" y="5" width="90" height="90" rx="15" />;
      case "triangle":
        return <polygon points="50,5 95,95 5,95" strokeLinejoin="round" />;
      case "star":
        return (
          <polygon
            points="50,5 61,35 95,35 68,55 78,85 50,65 22,85 32,55 5,35 39,35"
            strokeLinejoin="round"
          />
        );
      case "hexagon":
        return (
          <polygon
            points="25,5 75,5 95,50 75,95 25,95 5,50"
            strokeLinejoin="round"
          />
        );
      case "diamond":
        return <polygon points="50,5 95,50 50,95 5,50" strokeLinejoin="round" />;
    }
  };

  return (
    <div
      style={{ width: size, height: size }}
      className="filter drop-shadow-[4px_4px_0_rgba(0,0,0,1)]"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ overflow: "visible" }}
      >
        <g stroke="#000" strokeWidth="6" fill={COLOR_MAP[color]}>
          {getPath()}
        </g>
        <g
          stroke={dotted ? "rgba(0,0,0,0.8)" : "none"}
          strokeWidth="4"
          fill="none"
          strokeDasharray="6 6"
        >
          {getPath()}
        </g>
        <circle
          cx="35"
          cy="30"
          r="8"
          fill="white"
          opacity="0.8"
          style={{ filter: "blur(2px)" }}
        />
        <circle
          cx="45"
          cy="25"
          r="4"
          fill="white"
          opacity="0.6"
          style={{ filter: "blur(1px)" }}
        />
      </svg>
    </div>
  );
};

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => 0.5 - Math.random());

const genLevel = (level: number): LevelData => {
  const numVars = Math.min(3 + Math.floor(level / 5), 5);
  const termsPerEq = Math.min(2 + Math.floor(level / 8), 4);
  const maxValue = Math.min(10 + level * 2, 50);

  const availableColors = shuffle([...COLORS]);
  const availableShapes = shuffle([...SHAPES]);

  const vars: VariableDef[] = [];
  for (let i = 0; i < numVars; i++) {
    const isDotted = level > 10 && Math.random() > 0.5;
    vars.push({
      id: `v${i}`,
      shape: availableShapes[i % availableShapes.length],
      color: availableColors[i % availableColors.length],
      dotted: isDotted,
      value: randInt(1, maxValue),
    });
  }

  const equations: EquationDef[] = [];
  const referencedVarIds = new Set<string>();
  const solvableVars = vars.slice(0, Math.max(1, numVars - 1));

  const anchor = solvableVars[0];
  equations.push({
    id: "e0",
    items: [{ variableId: anchor.id }],
    result: anchor.value,
  });
  referencedVarIds.add(anchor.id);

  for (let i = 1; i < solvableVars.length; i++) {
    const target = solvableVars[i];
    const knownVars = solvableVars.slice(0, i);
    const supportCount = Math.min(termsPerEq - 1, knownVars.length);
    const items: EquationTerm[] = [{ variableId: target.id }];
    let sum = target.value;

    for (let j = 0; j < supportCount; j++) {
      const support = pick(knownVars);
      items.push({ variableId: support.id });
      sum += support.value;
      referencedVarIds.add(support.id);
    }

    referencedVarIds.add(target.id);
    equations.push({
      id: "e" + i,
      items,
      result: sum,
    });
  }

  const questionPool = vars.filter((v) => referencedVarIds.has(v.id));

  const qItems: EquationTerm[] = [];
  let qSum = 0;
  for (let j = 0; j < termsPerEq + (level > 15 ? 1 : 0); j++) {
    const v = pick(questionPool);
    qItems.push({ variableId: v.id });
    qSum += v.value;
  }

  return {
    variables: vars,
    equations,
    question: {
      items: qItems,
      answer: qSum,
      text: "Sonuç?",
    },
  };
};

const ShapeAlgebraGame: React.FC = () => {
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
  });
  const { phase, level, addScore, loseLife, nextLevel, setGamePhase } = engine;

  const feedback = useGameFeedback(
    {
      duration: 1500,
    });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [userAnswer, setUserAnswer] = useState("");

  const prevPhaseRef = useRef<string>("");
  useEffect(() => {
    if (phase === "playing" && prevPhaseRef.current !== "playing") {
      setLevelData(genLevel(level));
      setUserAnswer("");
    }
    prevPhaseRef.current = phase;
  }, [phase, level]);

  const handleSubmit = useCallback(() => {
    if (!levelData || !userAnswer || !!feedbackState || phase !== "playing") return;
    const correct = levelData.question.answer === parseInt(userAnswer, 10);
    playSound(correct ? "correct" : "incorrect");
    showFeedback(correct);
    safeTimeout(() => {
      dismissFeedback();
      if (correct) {
        addScore(level * 10);
        if (level >= MAX_LEVEL) {
          setGamePhase("victory");
        } else {
          nextLevel();
          setLevelData(genLevel(level + 1));
          setUserAnswer("");
        }
      } else {
        loseLife();
        setUserAnswer("");
      }
    }, 1500);
  }, [levelData, userAnswer, feedbackState, phase, level, addScore, loseLife, nextLevel, setGamePhase, showFeedback, dismissFeedback, playSound, safeTimeout]);

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Şekil Cebiri",
        icon: Brain,
        description:
          "Şekillerin gizli sayısal değerlerini bul, görsel denklemleri çöz ve matematik dehası olduğunu kanıtla!",
        howToPlay: [
          "Her satırdaki şekillerin toplam değerini incele.",
          "Her şeklin hangi sayıya karşılık geldiğini mantık yürüterek bul.",
          "En alttaki soruda istenen toplam değeri klavyeden yaz.",
        ],
        tuzoCode: "5.5.2 Kural Çıkarsama",
        accentColor: "cyber-blue",
        maxLevel: MAX_LEVEL,
      }}
    >
      {() => (
        <div className="w-full flex-1 flex items-center justify-center p-2 sm:p-4">
          {phase === "playing" && levelData && (
            <motion.div
              key={level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-4xl"
            >
              {/* Desktop: side-by-side | Mobile: stacked */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 sm:gap-4 items-start">

                {/* LEFT: Equations + Question */}
                <div className="space-y-2">
                  {levelData.equations.map((eq, i) => (
                    <motion.div
                      key={eq.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-center bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border-2 border-black/10 shadow-neo-sm"
                    >
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {eq.items.map((item, idx) => {
                          const v = levelData.variables.find(
                            (x) => x.id === item.variableId,
                          );
                          return (
                            <React.Fragment key={idx}>
                              {idx > 0 && (
                                <Plus
                                  className="text-black dark:text-white"
                                  size={20}
                                  strokeWidth={3}
                                />
                              )}
                              <ShapeIcon
                                shape={v!.shape}
                                color={v!.color}
                                dotted={v!.dotted}
                                size={36}
                              />
                            </React.Fragment>
                          );
                        })}
                        <Equal
                          className="text-black dark:text-white mx-1"
                          size={22}
                          strokeWidth={3}
                        />
                        <span className="text-2xl sm:text-3xl font-nunito font-black text-black dark:text-white drop-shadow-sm">
                          {eq.result}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Question card */}
                  <div className="bg-cyber-yellow border-2 border-black/10 rounded-2xl p-4 sm:p-5 flex flex-col items-center gap-3 shadow-neo-sm">
                    <span className="text-black font-nunito font-black uppercase tracking-widest text-[10px] sm:text-xs bg-white border-2 border-black/10 px-3 py-1 rounded-lg shadow-neo-sm">
                      {levelData.question.text}
                    </span>

                    <div className="flex flex-wrap justify-center gap-2 items-center w-full">
                      <div className="flex flex-wrap justify-center gap-2">
                        {levelData.question.items.map((it, idx) => {
                          const v = levelData.variables.find(
                            (x) => x.id === it.variableId,
                          );
                          return (
                            <React.Fragment key={idx}>
                              {idx > 0 && (
                                <Plus
                                  className="text-black"
                                  size={22}
                                  strokeWidth={3}
                                />
                              )}
                              <ShapeIcon
                                shape={v!.shape}
                                color={v!.color}
                                dotted={v!.dotted}
                                size={40}
                              />
                            </React.Fragment>
                          );
                        })}
                      </div>

                      <Equal className="text-black" size={26} strokeWidth={3} />

                      <div
                        className={`w-20 sm:w-24 h-14 sm:h-16 rounded-xl border-2 flex items-center justify-center text-3xl sm:text-4xl font-nunito font-black transition-all shadow-inner ${feedbackState
                          ? feedbackState.correct
                            ? "bg-cyber-green border-black/10 text-black"
                            : "bg-cyber-pink border-black/10 text-black"
                          : "bg-white border-black/10 text-black"
                          }`}
                      >
                        {userAnswer || (
                          <span className="text-black/20 animate-pulse">?</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Numpad */}
                <div className="grid grid-cols-3 gap-2 w-full md:w-56">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((k) => (
                    <motion.button
                      key={k}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        userAnswer.length < 3 &&
                        !feedbackState &&
                        setUserAnswer((p) => p + k)
                      }
                      disabled={!!feedbackState}
                      className={`py-3 sm:py-3.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-black/10 text-xl sm:text-2xl font-nunito font-black text-black dark:text-white shadow-neo-sm flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 active:translate-y-0.5 active:shadow-none transition-all ${k === "0" ? "col-start-2" : ""
                        }`}
                    >
                      {k}
                    </motion.button>
                  ))}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      !feedbackState && setUserAnswer((p) => p.slice(0, -1))
                    }
                    disabled={!!feedbackState}
                    className="py-3 sm:py-3.5 rounded-xl bg-cyber-pink border-2 border-black/10 text-black flex items-center justify-center col-start-1 row-start-4 shadow-neo-sm active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    <Delete size={24} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    disabled={!userAnswer || !!feedbackState}
                    className="py-3 sm:py-3.5 rounded-xl bg-cyber-green border-2 border-black/10 text-black flex items-center justify-center col-start-3 row-start-4 shadow-neo-sm active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                  >
                    <Check size={24} strokeWidth={3} />
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

export default ShapeAlgebraGame;
