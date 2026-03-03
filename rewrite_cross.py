import re

content = """import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Circle, Square, Triangle, Hexagon, Star, Pentagon, Cross, Moon, Heart, Zap, Eye, Grid3X3,
} from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "capraz-eslesme";
const GAME_TITLE = "Çapraz Eşleşme";
const GAME_DESCRIPTION = "Hem renkleri hem şekilleri hatırla! Dikkat et, kartlar yer değiştirebilir.";
const TUZO_TEXT = "TUZÖ 5.4.2 Görsel Kısa Süreli Bellek";

const SHAPE_ICONS = [Circle, Square, Triangle, Hexagon, Star, Pentagon, Cross, Moon, Heart];
const COLORS = [
  { name: "Yeşil", hex: "#6BCB77" },
  { name: "Turuncu", hex: "#FFA500" },
  { name: "Mavi", hex: "#4ECDC4" },
  { name: "Pembe", hex: "#FF6B6B" },
  { name: "Mor", hex: "#9B59B6" },
];

interface Card {
  id: string;
  symbolIdx: number;
  colorIdx: number;
  isFlipped: boolean;
  isMatched: boolean;
  position: number;
}

type LocalPhase = "preview" | "playing" | "feedback";

const CrossMatchGame: React.FC = () => {
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

  const [localPhase, setLocalPhase] = useState<LocalPhase>("preview");
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  
  const shuffleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateCards = useCallback((lvl: number) => {
    const pairCount = Math.min(8, 2 + Math.floor(lvl / 2.5));
    const selectedPairs: { s: number; c: number }[] = [];
    while (selectedPairs.length < pairCount) {
      const s = Math.floor(Math.random() * SHAPE_ICONS.length);
      const c = Math.floor(Math.random() * COLORS.length);
      if (!selectedPairs.some((p) => p.s === s && p.c === c)) {
        selectedPairs.push({ s, c });
      }
    }
    const newCards: Card[] = [];
    [...selectedPairs, ...selectedPairs].forEach((pair, idx) => {
      newCards.push({
        id: Math.random().toString(36).substr(2, 9),
        symbolIdx: pair.s,
        colorIdx: pair.c,
        isFlipped: true,
        isMatched: false,
        position: idx,
      });
    });
    return newCards.sort(() => Math.random() - 0.5);
  }, []);

  const shufflePositions = useCallback(() => {
    if (localPhase !== "playing" || phase !== "playing") return;
    playSound("pop");
    setCards((prev) => {
      const newPositions = [...prev.map((_, i) => i)].sort(() => Math.random() - 0.5);
      return prev.map((card, idx) => ({ ...card, position: newPositions[idx] }));
    });
  }, [localPhase, phase, playSound]);

  const startLevel = useCallback((lvl: number) => {
    const newCards = generateCards(lvl);
    setCards(newCards);
    setFlippedIndices([]);
    setLocalPhase("preview");
    
    setTimeout(() => {
      setCards((prev) => prev.map((c) => ({ ...c, isFlipped: false })));
      setLocalPhase("playing");
    }, 3000);
  }, [generateCards]);

  useEffect(() => {
    if (phase === "playing" && cards.length === 0) {
      startLevel(level);
    } else if (phase === "welcome") {
      setCards([]);
      setFlippedIndices([]);
    }
  }, [phase, level, cards.length, startLevel]);

  useEffect(() => {
    if (localPhase === "playing" && phase === "playing" && level > 3) {
      const intervalTime = Math.max(3000, 8000 - level * 400);
      shuffleIntervalRef.current = setInterval(shufflePositions, intervalTime);
    }
    return () => {
      if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
    };
  }, [localPhase, phase, level, shufflePositions]);

  const handleCardClick = (idx: number) => {
    if (localPhase !== "playing" || phase !== "playing" || cards[idx].isFlipped || cards[idx].isMatched || flippedIndices.length >= 2) return;
    
    playSound("pop");
    const newFlipped = [...flippedIndices, idx];
    setFlippedIndices(newFlipped);
    setCards((prev) => prev.map((c, i) => (i === idx ? { ...c, isFlipped: true } : c)));
    
    if (newFlipped.length === 2) {
      const [firstIdx, secondIdx] = newFlipped;
      const first = cards[firstIdx];
      const second = cards[secondIdx];
      
      if (first.symbolIdx === second.symbolIdx && first.colorIdx === second.colorIdx) {
        setTimeout(() => {
          playSound("correct");
          showFeedback(true);
          setCards((prev) => prev.map((c, i) => i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c));
          setFlippedIndices([]);
          addScore(level * 10);
          
          setCards((currentCards) => {
            const allMatched = currentCards.every((c) => c.id === first.id || c.id === second.id ? true : c.isMatched);
            if (allMatched) {
              setLocalPhase("feedback");
              setTimeout(() => {
                dismissFeedback();
                nextLevel();
                startLevel(level + 1);
              }, 1000);
            }
            return currentCards;
          });
        }, 500);
      } else {
        setTimeout(() => {
          playSound("incorrect");
          showFeedback(false);
          setLocalPhase("feedback");
          
          setTimeout(() => {
             dismissFeedback();
             loseLife();
             if (engine.lives > 1) {
                 setCards((prev) => prev.map((c, i) => i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c));
                 setFlippedIndices([]);
                 setLocalPhase("playing");
             }
          }, 1000);
        }, 1000);
      }
    }
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Grid3X3,
    accentColor: "cyber-blue",
    maxLevel: 20,
    howToPlay: [
      "Kartları 3 saniye boyunca ezberle.",
      "Aynı renk ve şekle sahip kartları eşleştir.",
      "İleri seviyelerde kartların yer değişimini takip et!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-4 mb-4 mt-8 w-full max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {phase === "playing" && (
              <motion.div
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full relative flex flex-col items-center"
              >
                <motion.div className={`max-w-sm w-full mx-auto md:absolute md:top-[-60px] md:z-20 text-center mb-6 md:mb-0 border-4 border-black px-6 py-4 rounded-2xl shadow-[8px_8px_0_#000] -rotate-2 ${localPhase === "preview" ? "bg-cyber-yellow" : "bg-cyber-pink"}`}>
                  <p className="text-xl sm:text-2xl font-black font-syne uppercase tracking-wider text-black flex items-center justify-center gap-2">
                    {localPhase === "preview" ? (<><Eye size={24} className="stroke-[3]" /> KARTLARI EZBERLE!</>) : (<><Zap size={24} className="fill-black" /> EŞLEŞTİR!</>)}
                  </p>
                </motion.div>

                <div className="w-full bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[32px] border-4 border-black shadow-[16px_16px_0_#000]">
                  <div className={`grid gap-4 sm:gap-6 ${cards.length <= 12 ? "grid-cols-4" : "grid-cols-5"}`}>
                    {cards.map((card, idx) => {
                      const Icon = SHAPE_ICONS[card.symbolIdx];
                      const color = COLORS[card.colorIdx];
                      const isRevealed = card.isFlipped || card.isMatched || localPhase === "preview";

                      return (
                        <motion.button
                          key={card.id}
                          layout
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={!isRevealed && localPhase === "playing" ? { scale: 1.05, y: -4 } : {}}
                          whileTap={!isRevealed && localPhase === "playing" ? { scale: 0.95 } : {}}
                          onClick={() => handleCardClick(idx)}
                          className={`aspect-square rounded-[20px] relative transition-all duration-300 flex items-center justify-center border-4 ${card.isMatched ? "opacity-30 scale-90 shadow-none grayscale" : isRevealed ? "shadow-none translate-y-2 bg-slate-50 dark:bg-slate-700" : "bg-slate-200 dark:bg-slate-600 border-black shadow-[8px_8px_0_#000] hover:shadow-[12px_12px_0_#000]"}`}
                          style={{ borderColor: isRevealed ? color.hex : "#000", backgroundColor: isRevealed ? `${color.hex}15` : undefined }}
                          disabled={isRevealed || localPhase !== "playing"}
                        >
                          {isRevealed ? (
                            <div className="flex items-center justify-center h-full w-full">
                              <Icon size={Math.max(24, 48 - (cards.length > 12 ? 8 : 0))} color={color.hex} strokeWidth={3} className="drop-shadow-sm transition-transform duration-300 transform scale-110" />
                            </div>
                          ) : (
                            <div className="opacity-10 dark:opacity-20 transition-opacity">
                              <Grid3X3 size={32} className="text-black dark:text-white" strokeWidth={3} />
                            </div>
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

export default CrossMatchGame;
"""

with open("src/components/BrainTrainer/CrossMatchGame.tsx", "w") as f:
    f.write(content)
