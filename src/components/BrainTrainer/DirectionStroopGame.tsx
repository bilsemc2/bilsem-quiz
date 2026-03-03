import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Compass, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from "../../hooks/useSafeTimeout";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "yon-stroop";
const GAME_TITLE = "Yön Stroop";
const GAME_DESCRIPTION =
  "Hedefe ulaşmak için Stroop etkisini atlatmalısın! Kelimenin ne dediğine değil, nerede olduğuna bak.";
const TUZO_TEXT = "TUZÖ 5.1.2 Uzamsal Stroop & İnhibisyon";
const MAX_LEVEL = 20;

interface Round {
  word: string;
  position: "left" | "right" | "top" | "bottom";
  correctAnswer: string;
}

interface GridPos {
  row: number;
  col: number;
}

const DIRECTIONS = [
  { word: "SOL", position: "left" as const, turkishName: "Sol" },
  { word: "SAĞ", position: "right" as const, turkishName: "Sağ" },
  { word: "YUKARI", position: "top" as const, turkishName: "Yukarı" },
  { word: "AŞAĞI", position: "bottom" as const, turkishName: "Aşağı" },
];

const POSITION_CLASS: Record<string, string> = {
  top: "top-1 left-1/2 -translate-x-1/2",
  bottom: "bottom-1 left-1/2 -translate-x-1/2",
  left: "left-1 top-1/2 -translate-y-1/2",
  right: "right-1 top-1/2 -translate-y-1/2",
};

const DirectionStroopGame: React.FC = () => {
  const engine = useGameEngine({ gameId: GAME_ID, maxLevel: MAX_LEVEL, initialLives: 5, timeLimit: 180 });
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;
  const { phase, level, addScore, loseLife, nextLevel } = engine;

  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [playerPos, setPlayerPos] = useState<GridPos>({ row: 2, col: 2 });
  const [targetPos, setTargetPos] = useState<GridPos>({ row: 0, col: 0 });

  const gridSize = useMemo(() => (level <= 8 ? 5 : 7), [level]);

  const generateTarget = useCallback((pPos: GridPos, size: number): GridPos => {
    let pos: GridPos;
    do {
      pos = { row: Math.floor(Math.random() * size), col: Math.floor(Math.random() * size) };
    } while (pos.row === pPos.row && pos.col === pPos.col || Math.abs(pos.row - pPos.row) + Math.abs(pos.col - pPos.col) < 2);
    return pos;
  }, []);

  const generateRound = useCallback((): Round => {
    const wordIdx = Math.floor(Math.random() * DIRECTIONS.length);
    let posIdx: number;
    do { posIdx = Math.floor(Math.random() * DIRECTIONS.length); } while (posIdx === wordIdx);
    return { word: DIRECTIONS[wordIdx].word, position: DIRECTIONS[posIdx].position, correctAnswer: DIRECTIONS[posIdx].turkishName };
  }, []);

  const initLevel = useCallback((lvl: number) => {
    const size = lvl <= 8 ? 5 : 7;
    const center = Math.floor(size / 2);
    const pPos = { row: center, col: center };
    setPlayerPos(pPos);
    setTargetPos(generateTarget(pPos, size));
    setCurrentRound(generateRound());
    playSound("slide");
  }, [generateTarget, generateRound, playSound]);

  useEffect(() => {
    if (phase === "playing" && !currentRound) {
      initLevel(level);
    } else if (phase === "welcome") {
      setCurrentRound(null);
    }
  }, [phase, currentRound, level, initLevel]);

  const moveTowardTarget = useCallback((current: GridPos, target: GridPos): GridPos => {
    const dr = target.row - current.row;
    const dc = target.col - current.col;
    if (dr === 0 && dc === 0) return current;
    return Math.abs(dr) >= Math.abs(dc)
      ? { ...current, row: current.row + Math.sign(dr) }
      : { ...current, col: current.col + Math.sign(dc) };
  }, []);

  const handleAnswer = useCallback((answer: string) => {
    if (phase !== "playing" || !!feedbackState || !currentRound) return;
    const correct = answer === currentRound.correctAnswer;

    if (correct) {
      playSound("correct");
      showFeedback(true);
      const newPos = moveTowardTarget(playerPos, targetPos);
      setPlayerPos(newPos);
      const reached = newPos.row === targetPos.row && newPos.col === targetPos.col;

      safeTimeout(() => {
        dismissFeedback();
        if (reached) {
          addScore(20 + level * 5);
          playSound("success");
          if (level >= MAX_LEVEL) { engine.setGamePhase("victory"); }
          else { nextLevel(); setCurrentRound(null); }
        } else {
          setCurrentRound(generateRound());
        }
      }, 800);
    } else {
      playSound("incorrect");
      showFeedback(false);
      loseLife();
      safeTimeout(() => { dismissFeedback(); setCurrentRound(generateRound()); }, 1000);
    }
  }, [phase, feedbackState, currentRound, playSound, showFeedback, dismissFeedback, addScore, level, nextLevel, loseLife, moveTowardTarget, playerPos, targetPos, generateRound, safeTimeout, engine]);

  const stepsRemaining = useMemo(
    () => Math.abs(playerPos.row - targetPos.row) + Math.abs(playerPos.col - targetPos.col),
    [playerPos, targetPos]
  );

  const gameConfig = {
    title: GAME_TITLE, description: GAME_DESCRIPTION, tuzoCode: TUZO_TEXT,
    icon: Compass, accentColor: "cyber-blue", maxLevel: MAX_LEVEL, wideLayout: true,
    howToPlay: [
      "Ekrandaki kelimenin anlamına ALDANMA, bulunduğu konuma bak.",
      "Doğru konumu seçerek hedefe doğru ilerle!",
      "Her doğru cevap seni hedefe bir adım yaklaştırır.",
    ],
  };

  const cellSize = gridSize <= 5 ? "w-10 h-10 sm:w-11 sm:h-11" : "w-8 h-8 sm:w-9 sm:h-9";

  const btnClass = "p-2.5 sm:p-3 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl flex flex-col items-center justify-center gap-0.5 shadow-neo-sm active:translate-y-1 active:shadow-none transition-all text-black dark:text-white";

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1 w-full max-w-4xl mx-auto">
          {phase === "playing" && currentRound && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 w-full"
            >
              {/* Grid area with Stroop word */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative p-8 sm:p-10 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 shadow-neo-sm">
                  {/* Stroop word at edge of container */}
                  <motion.div
                    key={`${currentRound.word}-${currentRound.position}`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`absolute z-10 bg-cyber-blue px-4 py-1.5 sm:px-5 sm:py-2 rounded-lg shadow-neo-sm select-none ${POSITION_CLASS[currentRound.position]}`}
                  >
                    <span className="text-lg sm:text-xl font-black tracking-widest italic text-white">{currentRound.word}</span>
                  </motion.div>

                  {/* Navigation grid */}
                  <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
                    {Array.from({ length: gridSize * gridSize }).map((_, i) => {
                      const row = Math.floor(i / gridSize);
                      const col = i % gridSize;
                      const isPlayer = row === playerPos.row && col === playerPos.col;
                      const isTarget = row === targetPos.row && col === targetPos.col;

                      return (
                        <div
                          key={i}
                          className={`${cellSize} rounded-lg border-2 flex items-center justify-center transition-colors duration-300 ${isPlayer ? "bg-cyber-blue border-cyber-blue"
                              : isTarget ? "bg-cyber-pink/20 border-cyber-pink border-dashed"
                                : "bg-slate-100 dark:bg-slate-700/40 border-transparent"
                            }`}
                        >
                          {isPlayer && (
                            <motion.div
                              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white shadow"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )}
                          {isTarget && !isPlayer && (
                            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                              <Star size={gridSize <= 5 ? 20 : 16} className="text-cyber-pink fill-cyber-pink" />
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <p className="text-sm font-bold text-black/50 dark:text-white/50 tracking-wide">🎯 {stepsRemaining} adım kaldı</p>
              </div>

              {/* Direction buttons — cross pattern */}
              <div className="grid grid-cols-3 gap-2 w-[200px] sm:w-[220px] flex-shrink-0">
                <div />
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAnswer("Yukarı")} className={btnClass}>
                  <ArrowUp size={22} strokeWidth={3} />
                  <span className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase">Yukarı</span>
                </motion.button>
                <div />

                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAnswer("Sol")} className={btnClass}>
                  <ArrowLeft size={22} strokeWidth={3} />
                  <span className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase">Sol</span>
                </motion.button>
                <div />
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAnswer("Sağ")} className={btnClass}>
                  <ArrowRight size={22} strokeWidth={3} />
                  <span className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase">Sağ</span>
                </motion.button>

                <div />
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAnswer("Aşağı")} className={btnClass}>
                  <ArrowDown size={22} strokeWidth={3} />
                  <span className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase">Aşağı</span>
                </motion.button>
                <div />
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default DirectionStroopGame;
