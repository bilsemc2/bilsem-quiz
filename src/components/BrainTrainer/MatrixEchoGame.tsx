import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Grid3X3 } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "matris-yankisi";
const GAME_TITLE = "Matris Yankısı";
const GAME_DESCRIPTION = "3x3 matristeki sayıları ezberle, kutular kapandıktan sonra sorulan soruları doğru cevapla!";
const TUZO_TEXT = "TUZÖ 5.9.2 Görsel Çalışma Belleği";
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
interface CellData {
  gridIndex: number;
  value: number;
}
interface QuestionData {
  text: string;
  answer: number;
  options: number[];
}
function generateQuestion(cells: CellData[], level: number): QuestionData {
  const posName = (idx: number) => `${idx + 1}. kutu`;
  const questionTypes = [
    () => {
      const cell = cells[Math.floor(Math.random() * cells.length)];
      return {
        text: `${posName(cell.gridIndex)}'da hangi sayı var?`,
        answer: cell.value,
      };
    },
    () => {
      const cell = cells[Math.floor(Math.random() * cells.length)];
      return {
        text: `${cell.value} sayısı kaçıncı kutuda?`,
        answer: cell.gridIndex + 1,
      };
    },
    () => {
      const maxCell = [...cells].sort((a, b) => b.value - a.value)[0];
      return {
        text: `En büyük sayı kaçıncı kutuda?`,
        answer: maxCell.gridIndex + 1,
      };
    },
    () => {
      const minCell = [...cells].sort((a, b) => a.value - b.value)[0];
      return {
        text: `En küçük sayı kaçıncı kutuda?`,
        answer: minCell.gridIndex + 1,
      };
    },
  ];
  if (level >= 5 && cells.length >= 2) {
    questionTypes.push(() => {
      const shuffled = [...cells].sort(() => Math.random() - 0.5);
      const c1 = shuffled[0],
        c2 = shuffled[1];
      return {
        text: `${posName(c1.gridIndex)} + ${posName(c2.gridIndex)} toplamı?`,
        answer: c1.value + c2.value,
      };
    });
  }
  if (level >= 10 && cells.length >= 2) {
    questionTypes.push(() => {
      const shuffled = [...cells].sort(() => Math.random() - 0.5);
      const c1 = shuffled[0],
        c2 = shuffled[1];
      const bigger = Math.max(c1.value, c2.value),
        smaller = Math.min(c1.value, c2.value);
      return {
        text: `${posName(c1.gridIndex)} ile ${posName(c2.gridIndex)} farkı?`,
        answer: bigger - smaller,
      };
    });
  }
  const randomType =
    questionTypes[Math.floor(Math.random() * questionTypes.length)];
  const q = randomType();
  const opts = new Set([q.answer]);
  while (opts.size < 4) {
    const offset = Math.floor(Math.random() * 8) - 4;
    const fake = q.answer + (offset === 0 ? 1 : offset);
    if (fake > 0) opts.add(fake);
  }
  return {
    text: q.text,
    answer: q.answer,
    options: [...opts].sort(() => Math.random() - 0.5),
  };
}
function generateCells(level: number): CellData[] {
  const cellCount = Math.min(7, 3 + Math.floor((level - 1) / 3));
  const maxNumber = Math.min(30, 9 + level * 2);
  const shuffledIndices = Array.from({ length: 9 }, (_, i) => i).sort(
    () => Math.random() - 0.5,
  );
  const selectedIndices = shuffledIndices.slice(0, cellCount);
  const usedValues = new Set<number>();
  return selectedIndices.map((gridIndex) => {
    let value;
    do {
      value = Math.floor(Math.random() * maxNumber) + 1;
    } while (usedValues.has(value));
    usedValues.add(value);
    return { gridIndex, value };
  });
}
function getMemorizeTime(level: number): number {
  return Math.max(1500, 4000 - (level - 1) * 150);
}
const MatrixEchoGame: React.FC = () => {
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

  const [cells, setCells] = useState<CellData[]>([]);
  const [question, setQuestion] = useState<QuestionData | null>(null);

  // Custom sub-phases for internal logic within "playing" phase
  // "welcome" is handled by engine. "playing" takes over.
  // Within "playing", we have: "memorize" -> "hidden" -> "question"
  const [subPhase, setSubPhase] = useState<"memorize" | "hidden" | "question" | "idle">("idle");

  const startRound = useCallback((lvl: number) => {
    const newCells = generateCells(lvl);
    setCells(newCells);
    setQuestion(null);
    setSubPhase("memorize");
    playSound("slide");

    safeTimeout(() => {
      setSubPhase("hidden");
      safeTimeout(() => {
        setQuestion(generateQuestion(newCells, lvl));
        setSubPhase("question");
      }, 600);
    }, getMemorizeTime(lvl));
  }, [playSound, safeTimeout]);

  // Hook to start from the engine's perspective
  useEffect(() => {
    if (engine.phase === "playing" && subPhase === "idle") {
      startRound(engine.level);
    } else if (engine.phase === "welcome") {
      setSubPhase("idle");
      setCells([]);
      setQuestion(null);
    }
  }, [engine.phase, engine.level, subPhase, startRound]);

  const handleAnswer = useCallback((selected: number) => {
    if (subPhase !== "question" || engine.phase !== "playing" || feedbackState || !question) return;
    const ok = selected === question.answer;
    showFeedback(ok);
    playSound(ok ? "correct" : "incorrect");

    safeTimeout(() => {
      dismissFeedback();
      if (ok) {
        engine.addScore(10 * engine.level);
        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
          playSound("success");
        } else {
          engine.nextLevel();
          startRound(engine.level + 1);
        }
      } else {
        engine.loseLife();
        if (engine.lives > 1) {
          startRound(engine.level);
        } else {
          setSubPhase("idle");
        }
      }
    }, 1500);
  }, [subPhase, engine, feedbackState, question, showFeedback, playSound, safeTimeout, dismissFeedback, startRound]);

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Grid3X3,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Matristeki sayıların yerlerini ezberle",
      "Sayılar gizlendikten sonra gelen soruyu oku",
      "Doğru seçeneği işaretleyerek puanları topla"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full max-w-lg mx-auto">
          {engine.phase === "playing" && subPhase !== "idle" && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 w-full"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border-2 border-black/10 shadow-neo-sm flex flex-col items-center gap-4 w-full">
                <div className="text-center w-full">
                  <h2
                    className={`text-lg sm:text-xl font-black font-nunito uppercase tracking-widest px-4 py-2 rounded-xl border-2 border-black/10 inline-block shadow-neo-sm ${subPhase === "memorize" ? "bg-cyber-blue text-white" : subPhase === "hidden" ? "bg-cyber-yellow text-black" : "bg-cyber-pink text-black"}`}
                  >
                    {subPhase === "memorize"
                      ? "SAYILARI EZBERLE"
                      : subPhase === "hidden"
                        ? "HAZIR OL..."
                        : "CEVAPLA!"}
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full aspect-square max-w-[280px] mx-auto p-3 sm:p-4 bg-slate-50 dark:bg-slate-700 border-2 border-black/10 rounded-xl">
                  {Array.from({ length: 9 }).map((_, idx) => {
                    const cell = cells.find((c) => c.gridIndex === idx);
                    const showN = subPhase === "memorize";
                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-xl flex items-center justify-center relative border-2 border-black/10 transition-all duration-300 ${cell ? (showN ? "bg-cyber-green text-black shadow-neo-sm" : "bg-cyber-blue shadow-neo-sm") : "bg-slate-200 dark:bg-slate-600 border-2 border-black/50 border-dashed"}`}
                      >
                        {cell && (
                          <span
                            className={`text-2xl sm:text-3xl font-nunito font-black ${showN ? "text-black" : "opacity-0"}`}
                          >
                            {showN ? cell.value : ""}
                          </span>
                        )}
                        {!showN && cell && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white font-nunito font-bold text-2xl opacity-50">
                              ?
                            </span>
                          </div>
                        )}
                        <div className="absolute top-1 right-1.5 text-[10px] font-nunito font-black text-black/40">
                          {idx + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {subPhase === "question" && question && (
                <div className="w-full flex flex-col gap-3">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center border-2 border-black/10 shadow-neo-sm">
                    <h3 className="text-lg sm:text-xl font-nunito font-black tracking-tight">
                      {question.text}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {question.options.map((opt, i) => (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(opt)}
                        className="py-3 sm:py-4 text-2xl sm:text-3xl font-nunito font-black rounded-xl border-2 border-black/10 transition-all duration-300 bg-cyber-yellow text-black shadow-neo-sm active:translate-y-1 active:shadow-none"
                      >
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </div>
      )}
    </BrainTrainerShell>
  );
};
export default MatrixEchoGame;
