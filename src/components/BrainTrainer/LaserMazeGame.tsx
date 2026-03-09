import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Crosshair } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { createLaserMazeEngine, type LaserMazeEngine } from "./laserMazeEngine";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = "lazer-labirent";
const GAME_TITLE = "Lazer Labirent";
const GAME_DESCRIPTION = "Görünmez lazerin aynalardan yansıyarak hangi çıkışa ulaştığını tahmin et! Uzamsal zekanı ve analiz yeteneğini kullan.";
const TUZO_TEXT = "TUZÖ 5.3.3 Uzamsal İlişki Çözümleme";

const LaserMazeGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1500 });
  const { showFeedback, dismissFeedback } = feedback;
  const { phase, level, addScore, loseLife, nextLevel } = engine;

  const [exitCount, setExitCount] = useState(3);
  const [puzzleKey, setPuzzleKey] = useState(0);
  const [localPhase, setLocalPhase] = useState<"loading" | "playing" | "animating">("loading");

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<LaserMazeEngine | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearGuessTimeouts = useCallback(() => {
    if (revealTimeoutRef.current) { clearTimeout(revealTimeoutRef.current); revealTimeoutRef.current = null; }
    if (settleTimeoutRef.current) { clearTimeout(settleTimeoutRef.current); settleTimeoutRef.current = null; }
  }, []);

  const initEngine = useCallback(() => {
    if (!canvasRef.current || phase !== "playing") return;
    if (engineRef.current) engineRef.current.dispose();

    const cfg =
      level <= 4 ? { s: 6, e: 3 }
        : level <= 8 ? { s: 6, e: 4 }
          : level <= 12 ? { s: 8, e: 4 }
            : level <= 16 ? { s: 8, e: 5 }
              : { s: 10, e: 6 };

    const e = createLaserMazeEngine(canvasRef.current, cfg.s, cfg.e);
    engineRef.current = e;
    setExitCount(e.exitCount);
    setLocalPhase("playing");
    playSound("detective_mystery");
  }, [level, phase, playSound]);

  useEffect(() => {
    clearGuessTimeouts();
    if (phase === "playing") {
      setLocalPhase("loading");
      const timer = safeTimeout(initEngine, 50);
      return () => clearTimeout(timer);
    } else {
      if (engineRef.current) { engineRef.current.dispose(); engineRef.current = null; }
    }
  }, [phase, level, puzzleKey, initEngine, clearGuessTimeouts, safeTimeout]);

  useEffect(() => {
    if (phase === "welcome") setPuzzleKey(0);
  }, [phase]);

  useEffect(() => {
    return () => {
      clearGuessTimeouts();
      if (engineRef.current) engineRef.current.dispose();
    };
  }, [clearGuessTimeouts]);

  const handleGuess = (idx: number) => {
    if (!engineRef.current || localPhase !== "playing" || phase !== "playing") return;
    clearGuessTimeouts();
    setLocalPhase("animating");

    const ok = engineRef.current.guess(idx);
    const willGameOver = !ok && engine.lives <= 1;
    playSound(ok ? "detective_correct" : "detective_incorrect");

    revealTimeoutRef.current = safeTimeout(() => {
      revealTimeoutRef.current = null;
      showFeedback(ok);
      if (ok) {
        addScore(10 * level);
        settleTimeoutRef.current = safeTimeout(() => {
          settleTimeoutRef.current = null;
          dismissFeedback();
          nextLevel();
        }, 1500);
      } else {
        loseLife();
        settleTimeoutRef.current = safeTimeout(() => {
          settleTimeoutRef.current = null;
          dismissFeedback();
          if (!willGameOver) setPuzzleKey((k) => k + 1);
        }, 1500);
      }
    }, ok ? 3000 : 1500);
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Crosshair,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Aynaların yerlerini ve yönlerini analiz et.",
      "Lazerin izleyeceği yolu zihninde canlandır.",
      "Doğru çıkışı seç ve lazeri ateşle!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full max-w-2xl mx-auto">
          {phase === "playing" && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full flex flex-col items-center"
            >
              <div
                ref={canvasRef}
                className="w-full aspect-square max-h-[55vh] rounded-2xl overflow-hidden border-2 border-black/10 shadow-neo-sm mb-3 bg-[#1a1a2e]"
              />
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {Array.from({ length: exitCount }).map((_, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleGuess(i)}
                    disabled={localPhase !== "playing"}
                    className="px-5 py-3 bg-cyber-blue text-white rounded-xl border-2 border-black/10 shadow-neo-sm font-nunito font-black text-base sm:text-lg active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    ÇIKIŞ {i + 1}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default LaserMazeGame;
