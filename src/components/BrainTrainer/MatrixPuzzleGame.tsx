import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Grid3X3, CheckCircle2, ChevronLeft } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { ShapeRenderer } from "./matrix/ShapeRenderer";
import { MatrixCell, GameOption, BaseShape } from "../../types/matrixRules";
import { generateMatrix, generateWrongOption } from "../../utils/ruleExecutors";
import { getRandomRuleForLevel, shouldUseInnerGrid } from "../../data/matrixRules";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const GAME_ID = "matris-bulmaca";
const GAME_TITLE = "Matris Bulmaca";
const GAME_DESCRIPTION = "3x3 ızgaradaki deseni analiz et ve gizli hücreyi bul! Her satırda belirli bir kural var.";
const TUZO_TEXT = "TUZÖ 5.5.2 Kural Çıkarsama";
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const OPTIONS_COUNT = 5;
interface QuestionHistory {
  level: number;
  ruleName: string;
  ruleDescription: string;
  grid: MatrixCell[][];
  correctAnswer: BaseShape;
  selectedAnswer: BaseShape;
  isCorrect: boolean;
}
const MatrixPuzzleGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1000 });
  const { showFeedback, dismissFeedback } = feedback;

  const [grid, setGrid] = useState<MatrixCell[][]>([]);
  const [options, setOptions] = useState<GameOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [currentRuleName, setCurrentRuleName] = useState("");
  const [currentRuleDescription, setCurrentRuleDescription] = useState("");
  const [questionHistory, setQuestionHistory] = useState<QuestionHistory[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const pendingTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const prevPhaseRef = useRef(engine.phase);

  const clearPendingTimeouts = useCallback(() => {
    pendingTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    pendingTimeoutsRef.current = [];
  }, []);

  const generateQuestion = useCallback(() => {
    const useInnerGrid = shouldUseInnerGrid(engine.level);
    const rule = getRandomRuleForLevel(engine.level);
    setCurrentRuleName(rule.name);
    setCurrentRuleDescription(rule.description);

    const matrix = generateMatrix([rule], useInnerGrid);
    const newGrid: MatrixCell[][] = matrix.map((row, rowIdx) =>
      row.map((shape, colIdx) => ({
        row: rowIdx,
        col: colIdx,
        shape,
        isHidden: false,
      })),
    );

    const hiddenRow = Math.floor(Math.random() * 2) + 1;
    const hiddenCol = Math.floor(Math.random() * 2) + 1;
    newGrid[hiddenRow][hiddenCol].isHidden = true;

    const correctShape = matrix[hiddenRow][hiddenCol];
    const newOptions: GameOption[] = [
      { id: "correct", shape: correctShape, isCorrect: true },
    ];

    for (let i = 0; i < OPTIONS_COUNT - 1; i++) {
      const wrongShape = generateWrongOption(
        correctShape,
        newOptions.map((o) => o.shape),
      );
      newOptions.push({
        id: `wrong-${i}`,
        shape: wrongShape,
        isCorrect: false,
      });
    }

    setGrid(newGrid);
    setOptions(newOptions.sort(() => Math.random() - 0.5));
    setSelectedOption(null);
  }, [engine.level]);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;

    if (
      engine.phase === "playing" &&
      (prevPhase === "welcome" ||
        prevPhase === "game_over" ||
        prevPhase === "victory")
    ) {
      clearPendingTimeouts();
      generateQuestion();
      setQuestionHistory([]);
      setIsReviewing(false);
    } else if (engine.phase === "welcome") {
      clearPendingTimeouts();
      setGrid([]);
      setOptions([]);
      setSelectedOption(null);
      setCurrentRuleName("");
      setCurrentRuleDescription("");
      setQuestionHistory([]);
      setIsReviewing(false);
    } else if (engine.phase === "game_over" || engine.phase === "victory") {
      clearPendingTimeouts();
    }

    prevPhaseRef.current = engine.phase;
  }, [engine.phase, generateQuestion, clearPendingTimeouts]);

  useEffect(() => {
    return () => {
      clearPendingTimeouts();
    };
  }, [clearPendingTimeouts]);

  const handleOptionSelect = useCallback(
    (option: GameOption) => {
      if (selectedOption || engine.phase !== "playing") return;
      setSelectedOption(option.id);
      const isCorrect = option.isCorrect;
      showFeedback(isCorrect);

      const correctOption = options.find((o) => o.isCorrect);
      setQuestionHistory((prev) => [
        ...prev,
        {
          level: engine.level,
          ruleName: currentRuleName,
          ruleDescription: currentRuleDescription,
          grid: grid.map((row) => row.map((cell) => ({ ...cell }))),
          correctAnswer: correctOption?.shape || option.shape,
          selectedAnswer: option.shape,
          isCorrect: option.isCorrect,
        },
      ]);

      if (isCorrect) {
        playSound("correct");
        engine.addScore(10 * engine.level);
      } else {
        playSound("incorrect");
        engine.loseLife();
      }

      const timeoutId = safeTimeout(() => {
        pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter(
          (id) => id !== timeoutId,
        );

        dismissFeedback();

        if (prevPhaseRef.current !== "playing") return;

        if (isCorrect) {
          if (engine.level >= MAX_LEVEL) {
            engine.setGamePhase("victory");
            playSound("success");
          } else {
            engine.nextLevel();
            generateQuestion();
          }
        } else if (engine.lives > 1) {
          generateQuestion();
        }
      }, 1200);

      pendingTimeoutsRef.current.push(timeoutId);
    },
    [
      selectedOption,
      engine,
      options,
      grid,
      currentRuleName,
      currentRuleDescription,
      playSound,
      generateQuestion,
      showFeedback,
      dismissFeedback,
      safeTimeout,
    ],
  );

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Grid3X3,
    accentColor: "cyber-blue",
    maxLevel: MAX_LEVEL,
    wideLayout: true,
    howToPlay: [
      "Satır ve sütunlardaki değişim kuralını belirle",
      "Soru işareti yerine gelecek şekli seç",
      "Yanlış seçimler can götürür, dikkatli ol!"
    ],
    extraGameOverActions: questionHistory.some((q) => !q.isCorrect) && (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsReviewing(true)}
        className="w-full sm:w-auto px-6 py-4 bg-cyber-blue text-white font-nunito font-black text-lg uppercase tracking-widest border-2 border-black/10 shadow-neo-sm rounded-2xl hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3"
      >
        <CheckCircle2 size={24} className="stroke-[3]" />
        <span>Hata Analizi</span>
      </motion.button>
    )
  };

  if (isReviewing) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col font-nunito tracking-tight relative overflow-hidden items-center justify-center p-4">
        <motion.div
          key="review"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full max-w-4xl text-center relative z-10"
        >
          <h2 className="text-3xl font-nunito font-black text-black dark:text-white mb-6 uppercase tracking-widest inline-block px-8 py-4 bg-white dark:bg-slate-800 border-2 border-black/10 shadow-neo-sm rounded-2xl">
            SORU ANALİZİ 🔍
          </h2>
          <div className="space-y-8 max-h-[70vh] overflow-y-auto px-4 py-6 custom-scrollbar pr-4">
            {questionHistory
              .filter((q) => !q.isCorrect)
              .map((q, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 sm:p-8 border-2 border-black/10 shadow-neo-sm relative"
                >
                  <div className="absolute top-0 right-6 -translate-y-1/2">
                    <span className="px-4 py-2 bg-cyber-blue text-white rounded-xl text-sm font-nunito font-black border-2 border-black/10 shadow-neo-sm">
                      Seviye {q.level}
                    </span>
                  </div>

                  <div className="text-left mb-6 pt-4">
                    <span className="text-sm font-nunito font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      {q.ruleName}
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-8 mb-6">
                    <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-3xl border-2 border-black/10">
                      {q.grid.map((row, rIdx) =>
                        row.map((cell, cIdx) => (
                          <div
                            key={`${rIdx}-${cIdx}`}
                            className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border-2 border-black/20 dark:border-white/10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm"
                          >
                            {cell.isHidden ? (
                              <span className="text-2xl font-nunito font-black text-cyber-pink drop-shadow-neo-sm">
                                ?
                              </span>
                            ) : (
                              <ShapeRenderer
                                shape={cell.shape}
                                size={48}
                                isHidden={cell.isHidden}
                              />
                            )}
                          </div>
                        )),
                      )}
                    </div>

                    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-800 border-2 border-black/10 border-l-8 border-l-cyber-blue p-6 rounded-2xl text-left shadow-neo-sm">
                      <p className="text-xs font-nunito font-black text-cyber-blue uppercase tracking-widest mb-2">
                        Düşünme Yolu:
                      </p>
                      <p className="text-base font-nunito font-medium text-slate-700 dark:text-slate-200">
                        {q.ruleDescription}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 sm:gap-8">
                    <div className="text-center bg-cyber-pink/20 dark:bg-cyber-pink/10 rounded-3xl p-6 border-4 border-cyber-pink border-dashed">
                      <p className="text-sm font-nunito font-black text-cyber-pink uppercase tracking-widest mb-4">
                        Senin Seçimin
                      </p>
                      <div className="inline-block p-4 bg-white dark:bg-slate-800 rounded-[2rem] border-2 border-black/10 shadow-neo-sm">
                        <ShapeRenderer shape={q.selectedAnswer} size={60} />
                      </div>
                    </div>
                    <div className="text-center bg-cyber-green/20 dark:bg-cyber-green/10 rounded-3xl p-6 border-4 border-cyber-green border-dashed">
                      <p className="text-sm font-nunito font-black text-cyber-green uppercase tracking-widest mb-4">
                        Doğru Şekil
                      </p>
                      <div className="inline-block p-4 bg-white dark:bg-slate-800 rounded-[2rem] border-2 border-black/10 shadow-neo-sm">
                        <ShapeRenderer shape={q.correctAnswer} size={60} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
          <div className="flex justify-center gap-4 mt-10">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsReviewing(false)}
              className="px-8 py-5 bg-white dark:bg-slate-800 text-black dark:text-white rounded-2xl font-nunito font-black flex items-center gap-2 border-2 border-black/10 shadow-neo-sm hover:shadow-neo-sm active:translate-y-2 active:shadow-none transition-all uppercase tracking-widest"
            >
              <ChevronLeft size={24} className="stroke-[3]" /> Geri
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <>
          <div className="flex justify-center mb-2 w-full max-w-lg">
            <div className="grid grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-6 bg-slate-50 dark:bg-slate-700 rounded-2xl border-2 border-black/10 shadow-neo-sm w-full aspect-square">
              {grid.map((row, rIdx) =>
                row.map((cell, cIdx) => (
                  <motion.div
                    key={`${rIdx}-${cIdx}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: (rIdx * 3 + cIdx) * 0.05 }}
                    className={`aspect-square flex items-center justify-center border-2 border-black/10 shadow-neo-sm rounded-2xl bg-white dark:bg-slate-800`}
                  >
                    {cell.isHidden ? (
                      <span className="text-3xl sm:text-5xl font-nunito font-black text-cyber-pink">
                        ?
                      </span>
                    ) : (
                      <ShapeRenderer
                        shape={cell.shape}
                        size={90}
                        isHidden={cell.isHidden}
                      />
                    )}
                  </motion.div>
                )),
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-7 w-full max-w-4xl mx-auto">
            {options.map((option, idx) => {
              const isSelected = selectedOption === option.id;
              const showResult = selectedOption !== null;
              return (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileTap={!showResult ? { scale: 0.95 } : {}}
                  onClick={() => handleOptionSelect(option)}
                  disabled={showResult}
                  className={`aspect-square w-[88px] sm:w-[104px] md:w-[118px] lg:w-[128px] flex items-center justify-center p-2 sm:p-3 rounded-2xl border-2 transition-all duration-300 flex-shrink-0 ${isSelected ? (option.isCorrect ? "bg-cyber-green/15 border-cyber-green ring-2 ring-cyber-green shadow-none" : "bg-cyber-pink/15 border-cyber-pink ring-2 ring-cyber-pink shadow-none") : showResult && option.isCorrect ? "bg-cyber-green/15 border-cyber-green ring-2 ring-cyber-green shadow-none" : showResult ? "opacity-40 bg-white dark:bg-slate-700 border-black/10 shadow-neo-sm" : "bg-white dark:bg-slate-700 border-black/10 shadow-neo-sm hover:shadow-neo-sm hover:bg-cyber-yellow dark:hover:bg-cyber-yellow active:translate-y-2 active:shadow-none"}`}
                >
                  <ShapeRenderer shape={option.shape} size={72} />
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </BrainTrainerShell>
  );
};
export default MatrixPuzzleGame;
