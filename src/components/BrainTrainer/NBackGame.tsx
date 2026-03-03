import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Square,
  Circle,
  Triangle,
  Pentagon,
  Hexagon,
  Check,
  X,
} from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import BrainTrainerShell, { GameShellConfig } from "./shared/BrainTrainerShell";
import { useGameEngine } from "./shared/useGameEngine";
import { GAME_COLORS } from './shared/gameColors';
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = "n-geri-sifresi";

interface Shape {
  id: string;
  icon: React.ReactNode;
  color: string;
}

const SHAPES: Omit<Shape, "id">[] = [
  { icon: <Square />, color: "#FFE81A" },
  { icon: <Circle />, color: "#00FF9D" },
  { icon: <Triangle />, color: "#FF1493" },
  { icon: <Pentagon />, color: GAME_COLORS.blue },
  { icon: <Hexagon />, color: "#FF5722" },
];

const config: GameShellConfig = {
  title: "N-Geri Şifresi",
  icon: Brain,
  description: "Şekilleri hatırla ve karşılaştır! Her şekli N adım öncekiyle karşılaştırarak belleğini test et.",
  tuzoCode: "TUZÖ 5.9.1 Çalışma Belleği",
  maxLevel: MAX_LEVEL,
  wideLayout: true,
  accentColor: "cyber-pink",
  howToPlay: [
    <span key="h1">Ekranda beliren şekilleri <strong>sırasıyla takip et</strong></span>,
    <span key="h2">Gördüğün şekil <strong>N adım öncekiyle aynı mı?</strong></span>,
    <span key="h3">Hızlı ve doğru karar vererek <strong>seviye atla</strong></span>
  ],
};

const NBackGame: React.FC = () => {
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1500 });
  const { showFeedback } = feedback;

  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
  });

  const {
    phase,
    level,
    lives,
    addScore,
    loseLife,
    nextLevel,
  } = engine;

  const [nValue, setNValue] = useState(1);
  const [history, setHistory] = useState<Shape[]>([]);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [trials, setTrials] = useState(0);

  const pendingTimeoutsRef = useRef<number[]>([]);
  const isGameEndingRef = useRef(false);

  const clearScheduledTimeouts = useCallback(() => {
    pendingTimeoutsRef.current.forEach((timeoutId) =>
      window.clearTimeout(timeoutId),
    );
    pendingTimeoutsRef.current = [];
  }, []);

  const scheduleGameTimeout = useCallback(
    (callback: () => void, delayMs: number) => {
      const timeoutId = window.setTimeout(() => {
        pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter(
          (id) => id !== timeoutId,
        );
        callback();
      }, delayMs);

      pendingTimeoutsRef.current.push(timeoutId);
      return timeoutId;
    },
    [],
  );

  const generateShape = useCallback(
    (historySnapshot: Shape[], nSnapshot: number) => {
      const isTarget =
        Math.random() > 0.5 && historySnapshot.length >= nSnapshot;
      let newShape: Omit<Shape, "id">;

      if (isTarget) {
        newShape = {
          icon: historySnapshot[historySnapshot.length - nSnapshot].icon,
          color: historySnapshot[historySnapshot.length - nSnapshot].color,
        };
      } else {
        newShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        if (historySnapshot.length >= nSnapshot) {
          let attempts = 0;
          while (
            newShape.color ===
            historySnapshot[historySnapshot.length - nSnapshot].color &&
            newShape.icon ===
            historySnapshot[historySnapshot.length - nSnapshot].icon &&
            attempts < 10
          ) {
            newShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            attempts++;
          }
        }
      }

      return { ...newShape, id: Math.random().toString(36).substr(2, 9) };
    },
    [],
  );

  // Setup initial state for playing phase when game starts
  useEffect(() => {
    if (phase === "playing" && trials === 0 && history.length === 0) {
      isGameEndingRef.current = false;
      clearScheduledTimeouts();
      setNValue(1);
      setHistory([]);
      setCurrentShape(generateShape([], 1));
      setTrials(0);
    }
  }, [phase, trials, history.length, clearScheduledTimeouts, generateShape]);

  // Clean up on unmount or game over
  useEffect(() => {
    if (phase === "game_over" || phase === "victory") {
      isGameEndingRef.current = true;
      clearScheduledTimeouts();
    }
    return () => {
      clearScheduledTimeouts();
    };
  }, [phase, clearScheduledTimeouts]);

  const advanceLevel = useCallback(() => {
    if (isGameEndingRef.current) return;
    playSound("correct");

    // Engine handles updating the level naturally
    nextLevel();

    // Reset local round state based on new level
    const nextLevelValue = level + 1; // Anticipate the new level value
    if (nextLevelValue <= MAX_LEVEL) {
      const nextNValue = nextLevelValue % 4 === 1 && nextLevelValue > 1 ? Math.min(nValue + 1, 4) : nValue;
      setNValue(nextNValue);
      setHistory([]);
      setCurrentShape(generateShape([], nextNValue));
      setTrials(0);
    }
  }, [playSound, nextLevel, level, nValue, generateShape]);

  const handleDecision = useCallback(
    (isSame: boolean) => {
      if (
        !currentShape ||
        history.length < nValue ||
        phase !== "playing" ||
        lives <= 0 ||
        isGameEndingRef.current
      ) {
        return;
      }

      const nextTrials = trials + 1;
      setTrials(nextTrials);

      const targetShape = history[history.length - nValue];
      const isCorrectDecision =
        (isSame &&
          currentShape.color === targetShape.color &&
          currentShape.icon === targetShape.icon) ||
        (!isSame &&
          (currentShape.color !== targetShape.color ||
            currentShape.icon !== targetShape.icon));

      if (isCorrectDecision) {
        playSound("correct");
        const gainedScore = 50 * level * nValue;
        addScore(gainedScore);
        showFeedback(true);

        if (nextTrials >= 10 + level * 2) {
          scheduleGameTimeout(() => {
            if (isGameEndingRef.current) return;
            advanceLevel();
          }, 1500);
        } else {
          const newHistory = [...history, currentShape];
          scheduleGameTimeout(() => {
            if (isGameEndingRef.current) return;
            setHistory(newHistory);
            setCurrentShape(null);
            scheduleGameTimeout(() => {
              if (isGameEndingRef.current) return;
              setCurrentShape(generateShape(newHistory, nValue));
            }, 500);
          }, 1500);
        }
      } else {
        playSound("incorrect");
        showFeedback(false);
        loseLife();

        // If engine dictates game over, engine will transition phase. We just wait.
        if (lives - 1 > 0) {
          const newHistory = [...history, currentShape];
          scheduleGameTimeout(() => {
            if (isGameEndingRef.current) return;
            setHistory(newHistory);
            setCurrentShape(null);
            scheduleGameTimeout(() => {
              if (isGameEndingRef.current) return;
              setCurrentShape(generateShape(newHistory, nValue));
            }, 500);
          }, 1500);
        } else {
          isGameEndingRef.current = true;
          clearScheduledTimeouts();
        }
      }
    },
    [
      currentShape,
      history,
      nValue,
      phase,
      lives,
      trials,
      level,
      addScore,
      loseLife,
      playSound,
      showFeedback,
      advanceLevel,
      generateShape,
      scheduleGameTimeout,
      clearScheduledTimeouts,
    ],
  );

  useEffect(() => {
    if (phase === "playing" && history.length <= nValue && !currentShape) {
      if (isGameEndingRef.current) return;
      setCurrentShape(generateShape(history, nValue));
    }
  }, [phase, history, nValue, currentShape, generateShape]);

  useEffect(() => {
    if (phase === "playing" && history.length < nValue && currentShape) {
      if (isGameEndingRef.current) return;
      const timer = safeTimeout(() => {
        if (isGameEndingRef.current) return;
        setHistory((prev) => [...prev, currentShape]);
        setCurrentShape(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, history, nValue, currentShape]);

  // Extend config with specific N-Back HUD item
  const gameConfig = {
    ...config,
    extraHudItems: (
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl shadow-neo-sm">
        <Brain className="text-cyber-blue" size={18} strokeWidth={3} />
        <span className="font-nunito font-black text-black dark:text-white">
          N={nValue}
        </span>
      </div>
    )
  }

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-8 w-full aspect-square max-w-[400px] flex items-center justify-center border-2 border-black/10 shadow-neo-sm relative mx-auto my-2 transition-colors duration-300">
            <AnimatePresence mode="popLayout">
              {currentShape && (
                <motion.div
                  key={currentShape.id}
                  initial={{ scale: 0, opacity: 0, rotate: -30 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.5, opacity: 0, rotate: 30 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="flex flex-col items-center gap-6"
                >
                  <div
                    className="w-32 h-32 sm:w-48 sm:h-48 flex items-center justify-center border-2 border-black/10 shadow-neo-sm rounded-[2rem] bg-white"
                    style={{
                      color: currentShape.color,
                      background:
                        "linear-gradient(135deg, white 0%, #f1f5f9 100%)",
                    }}
                  >
                    {React.cloneElement(
                      currentShape.icon as React.ReactElement,
                      {
                        size: 80,
                        strokeWidth: 3,
                        className: "drop-shadow-sm",
                      },
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {history.length < nValue && (
              <div className="absolute inset-x-6 bottom-6 text-center text-slate-500 font-nunito font-black uppercase tracking-widest text-sm bg-slate-100 dark:bg-slate-900/50 p-3 border-2 border-black/10 border-dashed rounded-xl">
                Bellekte {nValue - history.length} şekil eksik...
              </div>
            )}
          </div>

          {history.length >= nValue && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center gap-3 sm:gap-4 w-full max-w-md mx-auto"
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDecision(false)}
                disabled={feedback.isFeedbackActive}
                className="flex-1 py-3 sm:py-4 bg-cyber-pink text-black rounded-xl font-nunito font-black text-lg sm:text-xl border-2 border-black/10 shadow-neo-sm active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <X size={24} className="stroke-[3]" />
                Farklı
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDecision(true)}
                disabled={feedback.isFeedbackActive}
                className="flex-1 py-3 sm:py-4 bg-cyber-green text-black rounded-xl font-nunito font-black text-lg sm:text-xl border-2 border-black/10 shadow-neo-sm active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Check size={24} className="stroke-[3]" />
                Aynı
              </motion.button>
            </motion.div>
          )}
        </>
      )}
    </BrainTrainerShell>
  );
};

export default NBackGame;
