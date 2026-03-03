import re

content = """import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Palette } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "renk-algilama";
const GAME_TITLE = "Renk Algılama";
const GAME_DESCRIPTION = "Ekranda beliren renkleri hızla ezberle ve doğru seç! Görsel işlem hızını ve belleğini geliştir.";
const TUZO_TEXT = "TUZÖ 5.4.1 Görsel Kısa Süreli Bellek";

const COLORS: Record<string, string> = {
  kırmızı: "#FF5252",
  mavi: "#4285F4",
  sarı: "#FFC107",
  yeşil: "#0F9D58",
  pembe: "#E91E63",
  turuncu: "#FF9800",
  mor: "#9C27B0",
  turkuaz: "#00BCD4",
};

type LocalPhase = "showing" | "guessing" | "idle";

const ColorPerception: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const feedback = useGameFeedback({ duration: 1000 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const {
    phase,
    level,
    addScore,
    loseLife,
    nextLevel,
  } = engine;

  const [localPhase, setLocalPhase] = useState<LocalPhase>("idle");
  const [currentColors, setCurrentColors] = useState<string[]>([]);
  const [userSelections, setUserSelections] = useState<string[]>([]);
  
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const generateColors = useCallback((lvl: number) => {
    const colorNames = Object.keys(COLORS);
    const shuffled = [...colorNames].sort(() => 0.5 - Math.random());
    const colorCount = lvl <= 5 ? 2 : lvl <= 10 ? 3 : lvl <= 15 ? 4 : 5;
    const selectedColors = shuffled.slice(0, colorCount);

    setCurrentColors(selectedColors);
    setUserSelections([]);
    setLocalPhase("showing");

    const displayDuration = Math.max(800, 4000 - lvl * 150);

    const t = setTimeout(() => {
      setLocalPhase("guessing");
    }, displayDuration);
    timeoutsRef.current.push(t);
  }, []);

  useEffect(() => {
    if (phase === "playing" && localPhase === "idle") {
      generateColors(level);
    } else if (phase === "welcome") {
      setLocalPhase("idle");
      setCurrentColors([]);
      setUserSelections([]);
    }
  }, [phase, level, localPhase, generateColors]);

  const handleColorSelect = (colorName: string) => {
    if (localPhase !== "guessing" || phase !== "playing" || !!feedbackState) return;
    
    // Prevent selecting the same color twice
    if (userSelections.includes(colorName)) return;

    const newUserSelections = [...userSelections, colorName];
    setUserSelections(newUserSelections);
    playSound("select");

    if (newUserSelections.length === currentColors.length) {
      const correctSet = new Set(currentColors);
      const isCorrect = newUserSelections.every((color) => correctSet.has(color));

      showFeedback(isCorrect);
      playSound(isCorrect ? "correct" : "incorrect");

      const t = setTimeout(() => {
        dismissFeedback();
        
        if (isCorrect) {
          addScore(level * 100);
          nextLevel();
          setLocalPhase("idle");
        } else {
          loseLife();
          if (engine.lives > 1) { // It has not updated locally immediately
            setLocalPhase("idle");
          }
        }
      }, 1000);
      timeoutsRef.current.push(t);
    }
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Palette,
    accentColor: "cyber-pink",
    maxLevel: 20,
    howToPlay: [
      "Ekranda bir grup rengi göreceksin, onları aklında tut",
      "Renkler kaybolunca, gördüğün tüm renkleri butonlardan seç",
      "İlerledikçe renk sayısı artacak ve süre kısalacak!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-4 mb-10 w-full">
          <AnimatePresence mode="wait">
            {phase === "playing" && !feedbackState && (
              <motion.div
                key={`game-${level}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12"
              >
                <div className="rounded-[2.5rem] overflow-hidden aspect-square relative shadow-[8px_8px_0_#000] border-4 border-black bg-white dark:bg-slate-800 -rotate-1 p-2">
                  <AnimatePresence>
                    {localPhase === "showing" && (
                      <motion.div
                        key="colors"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        className="absolute inset-0 flex flex-col sm:flex-row gap-2 p-2"
                      >
                        {currentColors.map((colorName, idx) => (
                          <div
                            key={idx}
                            className="flex-1 w-full h-full rounded-[2rem] border-4 border-black mx-1 mb-1 sm:mb-0 shadow-inner"
                            style={{ backgroundColor: COLORS[colorName] }}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {localPhase === "guessing" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-6">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center bg-cyber-pink border-4 border-black shadow-[4px_4px_0_#000] rotate-3"
                      >
                        <Target
                          size={40}
                          className="text-black"
                          strokeWidth={2.5}
                        />
                      </motion.div>
                      <h4 className="text-2xl sm:text-3xl font-syne font-black text-black dark:text-white uppercase tracking-tighter">
                        Renkleri Seç!
                      </h4>
                      <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border-4 border-black shadow-[4px_4px_0_#000] -rotate-2 flex-wrap justify-center">
                        {currentColors.map((_, i) => (
                          <div
                            key={i}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl transition-all duration-300 border-4 border-black shadow-[2px_2px_0_#000]"
                            style={{
                              background: userSelections[i]
                                ? COLORS[userSelections[i]]
                                : "rgba(0,0,0,0.1)",
                              borderColor: userSelections[i]
                                ? "#000"
                                : "rgba(0,0,0,0.3)",
                              borderStyle: userSelections[i] ? "solid" : "dashed",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {localPhase === "showing" && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-white dark:bg-slate-800 rounded-xl text-lg font-syne font-black tracking-widest text-black dark:text-white border-4 border-black uppercase shadow-[4px_4px_0_#000] rotate-2 z-20">
                      EZBERLE!
                    </div>
                  )}
                </div>
                
                <div
                  className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 transition-all duration-300 ${localPhase === "guessing" ? "opacity-100 scale-100" : "opacity-30 scale-95 pointer-events-none"} md:h-full md:content-center`}
                >
                  {Object.entries(COLORS).map(([name, code]) => {
                    const isSelected = userSelections.includes(name);
                    return (
                      <motion.button
                        key={name}
                        whileHover={!isSelected ? { scale: 1.05, y: -4 } : {}}
                        whileTap={!isSelected ? { scale: 0.95 } : {}}
                        onClick={() => handleColorSelect(name)}
                        disabled={isSelected}
                        className={`aspect-square sm:aspect-auto sm:p-6 mb-2 rounded-2xl font-syne font-black text-black uppercase shadow-[6px_6px_0_#000] border-4 border-black transition-all ${!isSelected ? "hover:shadow-[8px_8px_0_#000] hover:z-10" : "opacity-50 shadow-[2px_2px_0_#000] translate-y-1"} bg-white`}
                      >
                        <div
                          className="w-full h-full sm:h-12 rounded-xl border-4 border-black mb-2 shadow-[inset_-2px_-4px_0_rgba(0,0,0,0.2)]"
                          style={{ backgroundColor: code }}
                        />
                        <span className="hidden sm:block text-sm sm:text-base tracking-widest text-black">
                          {name}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default ColorPerception;
"""

with open("/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/BrainTrainer/ColorPerception.tsx", "w") as f:
    f.write(content)
