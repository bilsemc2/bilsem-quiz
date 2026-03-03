import re

content = """import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Grid3X3, Eye } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "renk-sekans";
const GAME_TITLE = "Renk Sekansı";
const GAME_DESCRIPTION = "Renklerin yanış sırasını aklında tut ve aynı sırayla tekrarla! Görsel hafızanı zirveye taşı.";
const TUZO_TEXT = "TUZÖ 5.4.2 Görsel Kısa Süreli Bellek";

const COLORS = [
  { id: "red", name: "Kırmızı", hex: "#FF6B6B" },
  { id: "blue", name: "Mavi", hex: "#4ECDC4" },
  { id: "yellow", name: "Sarı", hex: "#FFD93D" },
  { id: "green", name: "Yeşil", hex: "#6BCB77" },
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
  const feedback = useGameFeedback({ duration: 1000 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

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
      
      const t = setTimeout(() => {
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

    setTimeout(() => {
      setCells((prev) => prev.map((c) => (c.id === cellId ? { ...c, activeColor: null } : c)));
      if (newUserSequence.length === sequence.length) {
        setLocalPhase("feedback");
        showFeedback(true);
        setTimeout(() => {
          dismissFeedback();
          addScore(level * 50);
          nextLevel();
          generateSequence(level + 1);
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
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-4 mb-4 mt-8 w-full max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {phase === "playing" && (
              <motion.div
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <div className="text-center mb-8">
                  <motion.div
                    animate={{
                      scale: localPhase === "showing" ? [1, 1.05, 1] : 1,
                      rotate: localPhase === "showing" ? [0, 2, -2, 0] : 0,
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`inline-block px-6 py-3 border-4 border-black shadow-[4px_4px_0_#000] rotate-1 rounded-xl ${localPhase === "showing" ? "bg-white dark:bg-slate-800" : "bg-cyber-yellow"}`}
                  >
                    <p className="text-xl sm:text-2xl font-syne font-black uppercase tracking-widest text-black dark:text-white">
                      {localPhase === "showing" ? "👀 DİKKATLE İZLE" : "🎯 SIRA SENDE"}
                    </p>
                  </motion.div>
                </div>
                
                <div className="p-4 sm:p-6 rounded-[2.5rem] bg-white dark:bg-slate-800 border-4 border-black shadow-[8px_8px_0_#000] aspect-square flex flex-col justify-center -rotate-1">
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 h-full">
                    {cells.map((cell) => {
                      const color = COLORS.find((c) => c.id === cell.activeColor);
                      return (
                        <motion.button
                          key={cell.id}
                          whileHover={localPhase === "playing" ? { scale: 0.95 } : {}}
                          whileTap={localPhase === "playing" ? { scale: 0.9 } : {}}
                          onClick={() => handleCellClick(cell.id)}
                          className={`rounded-2xl sm:rounded-3xl border-4 border-black transition-all duration-300 w-full h-full ${cell.activeColor ? "shadow-none translate-y-2 translate-x-1" : "shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#000]"}`}
                          style={{
                            backgroundColor: cell.activeColor ? color?.hex : "var(--tw-colors-slate-100)",
                          }}
                        >
                          {!cell.activeColor && (
                            <div className="w-full h-full rounded-[14px] sm:rounded-2xl transition-colors dark:bg-slate-700 bg-slate-50" />
                          )}
                          {cell.activeColor && (
                            <div
                              className="w-full h-full rounded-[14px] sm:rounded-2xl shadow-[inset_-2px_-4px_0_rgba(0,0,0,0.2)]"
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
          </AnimatePresence>
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default ColorGrid;
"""

with open("src/components/BrainTrainer/ColorGrid.tsx", "w") as f:
    f.write(content)
