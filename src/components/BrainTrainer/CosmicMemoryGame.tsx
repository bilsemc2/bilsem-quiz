import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const GAME_ID = "kozmik-hafiza";
const GAME_TITLE = "Kozmik Hafıza";
const GAME_DESCRIPTION = "Yıldızların sırasını hatırla! Parlayan ışıkları takip et ve hafızanı kanıtla.";
const TUZO_TEXT = "TUZÖ 5.4.2 Görsel Kısa Süreli Bellek";

type GameMode = "NORMAL" | "REVERSE";

type LocalPhase = "WAITING" | "DISPLAYING" | "INPUT";

interface GameState {
  sequence: number[];
  userSequence: number[];
  isDisplaying: number | null;
  gridSize: number;
  mode: GameMode;
}

const generateSequence = (level: number, size: number) => {
  const length = 2 + Math.floor(level / 2.5); // Difficulty curve
  const newSequence = [];
  for (let i = 0; i < length; i++) {
    newSequence.push(Math.floor(Math.random() * (size * size)));
  }
  return newSequence;
};

const CosmicMemoryGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1000 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const {
    phase,
    level,
    addScore,
    loseLife,
    nextLevel,
  } = engine;

  const [localPhase, setLocalPhase] = useState<LocalPhase>("WAITING");
  const [state, setState] = useState<GameState>({
    sequence: [],
    userSequence: [],
    isDisplaying: null,
    gridSize: 3,
    mode: "NORMAL",
  });

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    const intervals = intervalsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
      intervals.forEach(clearInterval);
    };
  }, []);

  const startLevel = useCallback(() => {
    const gridSize = level <= 5 ? 3 : level <= 12 ? 4 : 5;
    const newSequence = generateSequence(level, gridSize);
    const mode: GameMode =
      level > 7 ? (Math.random() > 0.5 ? "REVERSE" : "NORMAL") : "NORMAL";

    setState({
      sequence: newSequence,
      userSequence: [],
      isDisplaying: null,
      gridSize,
      mode,
    });
    setLocalPhase("DISPLAYING");
  }, [level]);

  useEffect(() => {
    if (phase === "playing" && localPhase === "WAITING") {
      startLevel();
    } else if (phase === "welcome") {
      setLocalPhase("WAITING");
      setState({
        sequence: [],
        userSequence: [],
        isDisplaying: null,
        gridSize: 3,
        mode: "NORMAL",
      });
    }
  }, [phase, localPhase, startLevel]);

  useEffect(() => {
    if (phase !== "playing" || localPhase !== "DISPLAYING") return;

    let i = 0;
    const displayTime = Math.max(400, 1000 - level * 40);
    const pauseTime = Math.max(200, 400 - level * 20);

    const interval = setInterval(() => {
      if (i >= state.sequence.length) {
        clearInterval(interval);
        setLocalPhase("INPUT");
        setState((prev) => ({ ...prev, isDisplaying: null }));
        return;
      }

      const currentIdx = state.sequence[i];
      setState((prev) => ({ ...prev, isDisplaying: currentIdx }));
      playSound("pop");

      const t = safeTimeout(() => {
        setState((prev) => ({ ...prev, isDisplaying: null }));
      }, displayTime);
      timeoutsRef.current.push(t);

      i++;
    }, displayTime + pauseTime);

    intervalsRef.current.push(interval);

    return () => clearInterval(interval);
  }, [localPhase, phase, state.sequence, playSound, level]);

  const handleCellClick = (idx: number) => {
    if (localPhase !== "INPUT" || state.isDisplaying !== null || phase !== "playing" || !!feedbackState) return;

    const nextUserSequence = [...state.userSequence, idx];
    const currentStep = state.userSequence.length;

    let isCorrect = false;
    if (state.mode === "NORMAL") {
      isCorrect = state.sequence[currentStep] === idx;
    } else {
      isCorrect = state.sequence[state.sequence.length - 1 - currentStep] === idx;
    }

    if (isCorrect) {
      playSound("pop");
      setState((prev) => ({ ...prev, userSequence: nextUserSequence }));

      if (nextUserSequence.length === state.sequence.length) {
        playSound("correct");
        showFeedback(true);
        const t = safeTimeout(() => {
          dismissFeedback();
          addScore(10 * level);
          nextLevel();
          setLocalPhase("WAITING");
        }, 1000);
        timeoutsRef.current.push(t);
      }
    } else {
      playSound("incorrect");
      showFeedback(false);
      loseLife();
      const t = safeTimeout(() => {
        dismissFeedback();
        if (engine.lives > 1) { // It is handled properly via phase change if game over
          setLocalPhase("WAITING");
        }
      }, 1000);
      timeoutsRef.current.push(t);
    }
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Star,
    accentColor: "cyber-pink",
    maxLevel: 20,
    wideLayout: true,
    howToPlay: [
      "Parlayan yıldızların sırasını dikkatle izle",
      "NORMAL modda aynı sırada, REVERSE modda ters sırada tıkla",
      "Sırayı bozmadan tüm yıldızları doğru sırayla işaretle"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 w-full flex flex-col items-center justify-center flex-1 p-2">
          {phase === "playing" && state.sequence.length > 0 && (
            <motion.div
              key={`level-${level}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl flex flex-col items-center gap-3">
              {/* Mode Indicator */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`px-4 py-2 rounded-xl border-2 border-black/10 shadow-neo-sm font-nunito font-black text-lg sm:text-xl uppercase tracking-widest ${state.mode === "NORMAL"
                  ? "bg-cyber-blue text-white"
                  : "bg-cyber-pink text-black"
                  }`}>
                {state.mode === "NORMAL" ? "Düz Sıra" : "Ters Sıra"}
              </motion.div>

              {localPhase === "DISPLAYING" && (
                <div className="absolute top-0 right-2 px-4 py-1.5 bg-white dark:bg-slate-800 rounded-xl text-sm font-nunito font-black tracking-widest text-black dark:text-white border-2 border-black/10 uppercase shadow-neo-sm z-20">
                  İZLE!
                </div>
              )}
              {localPhase === "INPUT" && (
                <div className="absolute top-0 right-2 px-4 py-1.5 bg-cyber-green rounded-xl text-sm font-nunito font-black tracking-widest text-black border-2 border-black/10 uppercase shadow-neo-sm z-20">
                  TEKRARLA!
                </div>
              )}

              {/* Grid */}
              <div className="w-full aspect-square max-w-[480px] bg-slate-100 dark:bg-slate-800/80 p-3 sm:p-4 rounded-2xl border-2 border-black/10 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1)]">
                <div
                  className="grid gap-1.5 sm:gap-2 h-full"
                  style={{
                    gridTemplateColumns: `repeat(${state.gridSize}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${state.gridSize}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: state.gridSize * state.gridSize }).map(
                    (_, idx) => {
                      const isDisplaying = state.isDisplaying === idx;
                      const isUserInput = state.userSequence.includes(idx);
                      const isWaitingForInput =
                        localPhase === "INPUT" &&
                        state.isDisplaying === null;
                      const isActive = isDisplaying || isUserInput;

                      return (
                        <motion.button
                          key={idx}
                          whileTap={
                            isWaitingForInput ? { scale: 0.95 } : {}
                          }
                          onClick={() => handleCellClick(idx)}
                          disabled={!isWaitingForInput}
                          className={`
                              w-full h-full rounded-lg sm:rounded-xl border-2 transition-all duration-200 
                              flex items-center justify-center shadow-neo-sm
                              ${isActive
                              ? state.mode === "REVERSE"
                                ? "bg-cyber-pink border-black/10 scale-105"
                                : "bg-cyber-yellow border-black/10 scale-105"
                              : "bg-white dark:bg-slate-700 border-black/20 dark:border-white/20"
                            }
                            `}>
                          <AnimatePresence>
                            {isActive && (
                              <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 45 }}
                                className="w-1/2 h-1/2"
                              >
                                <Star
                                  className={`w-full h-full ${state.mode === "REVERSE"
                                    ? "text-black fill-black"
                                    : "text-black fill-black"
                                    }`}
                                  strokeWidth={3}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Progress Indicators */}
              <div className="flex gap-1.5 sm:gap-2 p-2 sm:p-3 bg-white dark:bg-slate-800 rounded-xl border-2 border-black/10 shadow-neo-sm">
                {state.sequence.map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-black/10 transition-colors ${i < state.userSequence.length
                      ? state.mode === "REVERSE"
                        ? "bg-cyber-pink"
                        : "bg-cyber-yellow"
                      : "bg-slate-200 dark:bg-slate-700"
                      }`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default CosmicMemoryGame;
