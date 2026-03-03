import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Grid3X3, Delete, Check } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = "matematik-grid";
const GAME_TITLE = "Matematik Grid";
const GAME_DESCRIPTION = "3x3 tablodaki gizli sayıları bul! Satırlar arasındaki matematiksel bağı keşfet ve boşlukları doldur.";
const TUZO_TEXT = "TUZÖ 5.2.1 Sayısal Akıl Yürütme";

// ──────────── Types ────────────

interface CellData {
  value: number;
  row: number;
  col: number;
  isMissing: boolean;
  userValue?: string;
}

type GridMatrix = CellData[][];
type Operator = "+" | "-" | "*" | "/";

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const generatePuzzle = (
  level: number,
): { grid: GridMatrix; ruleDescription: string } => {
  const gridSize = 3;
  const grid: GridMatrix = [];

  // Operator progression across 20 levels
  const availableOps: Operator[] = ["+"];
  if (level >= 3) availableOps.push("-");
  if (level >= 6) availableOps.push("*");
  if (level >= 10) availableOps.push("/");

  const selectedOp: Operator =
    availableOps[Math.floor(Math.random() * availableOps.length)];

  let ruleDesc = "";
  switch (selectedOp) {
    case "+":
      ruleDesc = "A + B = C";
      break;
    case "-":
      ruleDesc = "A - B = C";
      break;
    case "*":
      ruleDesc = "A × B = C";
      break;
    case "/":
      ruleDesc = "A ÷ B = C";
      break;
  }

  const difficultyFactor = Math.ceil(level / 3);

  for (let r = 0; r < gridSize; r++) {
    let a: number, b: number, c: number;
    if (selectedOp === "+") {
      const max = 10 + difficultyFactor * 10;
      a = getRandomInt(1, max);
      b = getRandomInt(1, max);
      c = a + b;
    } else if (selectedOp === "-") {
      const max = 10 + difficultyFactor * 10;
      b = getRandomInt(1, max);
      c = getRandomInt(1, max);
      a = b + c;
    } else if (selectedOp === "*") {
      const maxFactor = 2 + Math.floor(difficultyFactor / 2);
      a = getRandomInt(2, maxFactor);
      b = getRandomInt(2, maxFactor + 2);
      c = a * b;
    } else {
      const maxDivisor = 2 + Math.floor(difficultyFactor / 3);
      const maxResult = 5 + difficultyFactor * 2;
      b = getRandomInt(2, maxDivisor + 3);
      c = getRandomInt(2, maxResult);
      a = b * c;
    }

    const rowValues = [a, b, c];
    const rowCells = rowValues.map((val, cIndex) => ({
      value: val,
      row: r,
      col: cIndex,
      isMissing: false,
    }));
    grid.push(rowCells);
  }

  // Hide cells based on level
  const rowIndices = [0, 1, 2].sort(() => Math.random() - 0.5);
  const rowsToHideCount = level < 5 ? 1 : level < 12 ? 2 : 3;
  for (let i = 0; i < rowsToHideCount; i++) {
    const rowIndex = rowIndices[i];
    const colIndex = getRandomInt(0, 2);
    grid[rowIndex][colIndex].isMissing = true;
  }

  return { grid, ruleDescription: ruleDesc };
};

const MathGridGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1000 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [grid, setGrid] = useState<GridMatrix>([]);
  const [ruleDesc, setRuleDesc] = useState("");
  const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const startLevel = useCallback((lvl: number) => {
    const puzzle = generatePuzzle(lvl);
    setGrid(puzzle.grid);
    setRuleDesc(puzzle.ruleDescription);
    setShowErrors(false);
    const firstMissing = puzzle.grid.flat().find((c) => c.isMissing);
    if (firstMissing) setActiveCell({ r: firstMissing.row, c: firstMissing.col });
  }, []);

  const prevPhaseRef = useRef<string>("");
  useEffect(() => {
    if (engine.phase === "playing" && prevPhaseRef.current !== "playing") {
      startLevel(engine.level);
    } else if (engine.phase === "welcome") {
      setGrid([]);
      setActiveCell(null);
      setShowErrors(false);
    }
    prevPhaseRef.current = engine.phase;
  }, [engine.phase, engine.level, startLevel]);

  const handleCellClick = (r: number, c: number) => {
    if (engine.phase !== "playing") return;
    const cell = grid[r]?.[c];
    if (cell?.isMissing) {
      setActiveCell({ r, c });
      setShowErrors(false);
      playSound("select");
    }
  };

  const handleNumberInput = (num: string) => {
    if (!activeCell || engine.phase !== "playing") return;
    setGrid((prev) => {
      const newGrid = prev.map((row) => row.map((cell) => ({ ...cell })));
      const cell = newGrid[activeCell.r][activeCell.c];
      if ((cell.userValue || "").length < 3) {
        cell.userValue = (cell.userValue || "") + num;
      }
      return newGrid;
    });
    setShowErrors(false);
    playSound("pop");
  };

  const handleDelete = () => {
    if (!activeCell || engine.phase !== "playing") return;
    setGrid((prev) => {
      const newGrid = prev.map((row) => row.map((cell) => ({ ...cell })));
      const cell = newGrid[activeCell.r][activeCell.c];
      cell.userValue = cell.userValue?.slice(0, -1) || "";
      return newGrid;
    });
    setShowErrors(false);
  };

  const handleSubmit = () => {
    if (engine.phase !== "playing" || feedbackState) return;
    let allCorrect = true;
    let anyFilled = false;
    let anyWrong = false;
    grid.forEach((row) =>
      row.forEach((cell) => {
        if (cell.isMissing) {
          if (!cell.userValue) {
            allCorrect = false;
          } else {
            anyFilled = true;
            if (parseInt(cell.userValue) !== cell.value) {
              allCorrect = false;
              anyWrong = true;
            }
          }
        }
      })
    );

    if (!anyFilled) return;

    if (allCorrect) {
      playSound("correct");
      showFeedback(true);
      engine.addScore(10 * engine.level);
      safeTimeout(() => {
        dismissFeedback();
        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
          playSound("success");
        } else {
          engine.nextLevel();
          startLevel(engine.level + 1);
        }
      }, 1200);
    } else if (anyWrong) {
      playSound("incorrect");
      showFeedback(false);
      setShowErrors(true);
      engine.loseLife();
      safeTimeout(() => {
        dismissFeedback();
      }, 1200);
    }
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Grid3X3,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Satırlardaki sayıların birbirine nasıl dönüştüğünü bul.",
      "Soru işareti olan hücrelere tıkla ve sayıyı gir.",
      "Tüm hücreleri doldurduktan sonra Kontrol Et butonuna bas!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full max-w-sm mx-auto">
          {engine.phase === "playing" && grid.length > 0 && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center"
            >
              <div className="mb-3 bg-white dark:bg-slate-800 px-4 py-2 border-2 border-black/10 shadow-neo-sm rounded-xl">
                <p className="text-xs sm:text-sm text-cyber-blue font-nunito font-black tracking-wider uppercase text-center">
                  {showErrors ? `İlişki: ${ruleDesc}` : "Tablodaki Boşlukları Doldur"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-700 border-2 border-black/10 shadow-neo-sm w-full transition-all">
                {grid.map((row, r) =>
                  row.map((cell, c) => {
                    const isSelected = activeCell?.r === r && activeCell?.c === c;
                    const isWrong = showErrors && cell.isMissing && cell.userValue && parseInt(cell.userValue) !== cell.value;
                    return (
                      <motion.div
                        key={`${r}-${c}`}
                        whileTap={cell.isMissing ? { scale: 0.95 } : {}}
                        onClick={() => handleCellClick(r, c)}
                        className={`aspect-square rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-nunito font-black relative transition-all duration-200 border-2 border-black/10 shadow-neo-sm ${cell.isMissing ? "cursor-pointer" : ""} ${isSelected ? "border-cyber-pink shadow-none translate-y-1 bg-cyber-pink text-white" : isWrong ? "bg-cyber-pink text-black animate-pulse" : cell.isMissing ? "bg-white dark:bg-slate-800 text-cyber-yellow" : "bg-cyber-yellow text-black"}`}
                      >
                        {cell.isMissing ? (
                          <span>{cell.userValue || "?"}</span>
                        ) : (
                          <span>{cell.value}</span>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>

              <div className="w-full mt-3">
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, "DEL", 0, "✓"].map((btn, i) => {
                    if (btn === "DEL")
                      return (
                        <motion.button
                          key={i}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleDelete}
                          className="h-11 sm:h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-black/10 text-black dark:text-white flex items-center justify-center shadow-neo-sm active:translate-y-1 active:shadow-none transition-all"
                        >
                          <Delete size={20} className="stroke-[3]" />
                        </motion.button>
                      );
                    if (btn === "✓")
                      return (
                        <motion.button
                          key={i}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSubmit}
                          className="h-11 sm:h-12 rounded-xl bg-cyber-green border-2 border-black/10 text-black flex items-center justify-center shadow-neo-sm active:translate-y-1 active:shadow-none transition-all"
                        >
                          <Check size={22} className="stroke-[4]" />
                        </motion.button>
                      );
                    return (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleNumberInput(btn.toString())}
                        className="h-11 sm:h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-black/10 text-black dark:text-white text-xl sm:text-2xl font-nunito font-black shadow-neo-sm active:translate-y-1 active:shadow-none transition-all"
                      >
                        {btn}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default MathGridGame;
