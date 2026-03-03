import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Grid3X3 } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { GAME_COLORS } from './shared/gameColors';

const GAME_ID = "renk-sekans";
const GAME_TITLE = "Renk Sekansı";
const GAME_DESCRIPTION = "Renklerin yanış sırasını aklında tut ve aynı sırayla tekrarla! Görsel hafızanı zirveye taşı.";
const TUZO_TEXT = "TUZÖ 5.4.2 Görsel Kısa Süreli Bellek";

const COLORS = [
  { id: "red", name: "Kırmızı", hex: "#FF6B6B" },
  { id: "blue", name: "Mavi", hex: "#4ECDC4" },
  { id: "yellow", name: "Sarı", hex: GAME_COLORS.yellow },
  { id: "green", name: "Yeşil", hex: GAME_COLORS.emerald },
  { id: "purple", name: "Mor", hex: "#9B59B6" },
];

type LocalPhase = "showing" | "playing" | "feedback";

const ColorGrid: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1000 });
  const { showFeedback, dismissFeedback } = feedback;

  const { phase, level, addScore, loseLife, nextLevel } = engine;

  const [localPhase, setLocalPhase] = useState<LocalPhase>("showing");
  const [sequence, setSequence] = useState<Array<{ cellId: number; colorId: string }>>([]);
  const [userSequence, setUserSequence] = useState<Array<{ cellId: number; colorId: string }>>([]);
  const [cells, setCells] = useState(
    Array(9).fill(null).map((_, i) => ({ id: i, activeColor: null as string | null }))
  );

  const sequenceRunningRef = useRef(false);

  const showSequenceAnimation = useCallback(async (seq: Array<{ cellId: number; colorId: string }>, lvl: number) => {
    sequenceRunningRef.current = true;
    setLocalPhase("showing");
    const displayTime = Math.max(300, 1000 - lvl * 30);
    const delayTime = Math.max(100, 400 - lvl * 10);

    await new Promise((r) => setTimeout(r, 600));

    for (let i = 0; i < seq.length; i++) {
      if (!sequenceRunningRef.current) return;
      const { cellId, colorId } = seq[i];
      setCells((prev) => prev.map((c) => (c.id === cellId ? { ...c, activeColor: colorId } : c)));
      playSound("pop");
      await new Promise((r) => setTimeout(r, displayTime));
      if (!sequenceRunningRef.current) return;
      setCells((prev) => prev.map((c) => (c.id === cellId ? { ...c, activeColor: null } : c)));
      if (i < seq.length - 1) {
        await new Promise((r) => setTimeout(r, delayTime));
      }
    }
    if (!sequenceRunningRef.current) return;
    setLocalPhase("playing");
    setUserSequence([]);
  }, [playSound]);

  const generateSequence = useCallback((lvl: number) => {
    const count = lvl + 1;
    const newSeq: Array<{ cellId: number; colorId: string }> = [];
    for (let i = 0; i < count; i++) {
      newSeq.push({
        cellId: Math.floor(Math.random() * 9),
        colorId: COLORS[Math.floor(Math.random() * COLORS.length)].id,
      });
    }
    setSequence(newSeq);
    setCells((prev) => prev.map((c) => ({ ...c, activeColor: null })));
    showSequenceAnimation(newSeq, lvl);
  }, [showSequenceAnimation]);

  useEffect(() => {
    if (phase === "playing" && sequence.length === 0) {
      generateSequence(level);
    } else if (phase === "welcome") {
      sequenceRunningRef.current = false;
      setSequence([]);
      setUserSequence([]);
      setCells((prev) => prev.map((c) => ({ ...c, activeColor: null })));
    }
  }, [phase, level, sequence.length, generateSequence]);

  useEffect(() => {
    return () => {
      sequenceRunningRef.current = false;
    };
  }, []);

  const handleCellClick = (cellId: number) => {
    if (localPhase !== "playing" || phase !== "playing") return;

    const currentStep = userSequence.length;
    const expected = sequence[currentStep];

    if (cellId !== expected.cellId) {
      playSound("incorrect");
      showFeedback(false);
      setLocalPhase("feedback");

      safeTimeout(() => {
        dismissFeedback();
        loseLife();
        if (engine.lives > 1) {
          generateSequence(level); // Retry level
        }
      }, 1000);
      return;
    }

    setCells((prev) => prev.map((c) => c.id === cellId ? { ...c, activeColor: expected.colorId } : c));
    playSound("select");

    const newUserSequence = [...userSequence, expected];
    setUserSequence(newUserSequence);

    safeTimeout(() => {
      setCells((prev) => prev.map((c) => (c.id === cellId ? { ...c, activeColor: null } : c)));
      if (newUserSequence.length === sequence.length) {
        setLocalPhase("feedback");
        showFeedback(true);
        safeTimeout(() => {
          dismissFeedback();
          addScore(level * 50);
          nextLevel();
          if (level < 20) {
            generateSequence(level + 1);
          }
        }, 1000);
      }
    }, 300);
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Grid3X3,
    accentColor: "cyber-pink",
    maxLevel: 20,
    howToPlay: [
      "Ekranda yanıp sönen renkli kutuları izle",
      "Sıra sana geldiğinde aynı kutulara aynı sırayla tıkla",
      "Her seviyede kutu sayısı ve hız artacak!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full max-w-md mx-auto">
          {phase === "playing" && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              <div className="text-center mb-4">
                <motion.div
                  animate={{
                    scale: localPhase === "showing" ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`inline-block px-4 py-2 border-2 border-black/10 shadow-neo-sm rounded-xl ${localPhase === "showing" ? "bg-white dark:bg-slate-800" : "bg-cyber-yellow"}`}
                >
                  <p className="text-lg sm:text-xl font-nunito font-black uppercase tracking-widest text-black dark:text-white">
                    {localPhase === "showing" ? "👀 DİKKATLE İZLE" : "🎯 SIRA SENDE"}
                  </p>
                </motion.div>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-black/10 shadow-neo-sm aspect-square flex flex-col justify-center">
                <div className="grid grid-cols-3 gap-2 sm:gap-3 h-full">
                  {cells.map((cell) => {
                    const color = COLORS.find((c) => c.id === cell.activeColor);
                    return (
                      <motion.button
                        key={cell.id}
                        whileTap={localPhase === "playing" ? { scale: 0.9 } : {}}
                        onClick={() => handleCellClick(cell.id)}
                        className={`rounded-xl sm:rounded-2xl border-2 border-black/10 transition-all duration-300 w-full h-full ${cell.activeColor ? "shadow-none translate-y-1" : "shadow-neo-sm"}`}
                        style={{
                          backgroundColor: cell.activeColor ? color?.hex : "var(--tw-colors-slate-100)",
                        }}
                      >
                        {!cell.activeColor && (
                          <div className="w-full h-full rounded-lg sm:rounded-xl transition-colors dark:bg-slate-700 bg-slate-50" />
                        )}
                        {cell.activeColor && (
                          <div
                            className="w-full h-full rounded-lg sm:rounded-xl shadow-[inset_-2px_-4px_0_rgba(0,0,0,0.2)]"
                            style={{ backgroundColor: color?.hex }}
                          />
                        )}
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

export default ColorGrid;
