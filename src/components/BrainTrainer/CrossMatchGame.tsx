import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Circle, Square, Triangle, Hexagon, Star, Pentagon, Cross, Moon, Heart, Zap, Eye, Grid3X3,
} from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { GAME_COLORS } from './shared/gameColors';
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const GAME_ID = "capraz-eslesme";
const GAME_TITLE = "Çapraz Eşleşme";
const GAME_DESCRIPTION = "Hem renkleri hem şekilleri hatırla! Dikkat et, kartlar yer değiştirebilir.";
const TUZO_TEXT = "TUZÖ 5.4.2 Görsel Kısa Süreli Bellek";
const MAX_LEVEL = 20;

const SHAPE_ICONS = [Circle, Square, Triangle, Hexagon, Star, Pentagon, Cross, Moon, Heart];
const COLORS = [
  { name: "Yeşil", hex: GAME_COLORS.emerald },
  { name: "Turuncu", hex: GAME_COLORS.orange },
  { name: "Mavi", hex: GAME_COLORS.blue },
  { name: "Pembe", hex: GAME_COLORS.pink },
  { name: "Mor", hex: GAME_COLORS.purple },
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
    maxLevel: MAX_LEVEL,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1000 });
  const { showFeedback, dismissFeedback } = feedback;

  const { phase, level, lives, addScore, loseLife, nextLevel } = engine;

  const [localPhase, setLocalPhase] = useState<LocalPhase>("preview");
  const [cards, setCards] = useState<Card[]>([]);
  const cardsRef = useRef<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);

  // Keep cardsRef always in sync with latest cards state
  useEffect(() => { cardsRef.current = cards; }, [cards]);

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

    safeTimeout(() => {
      setCards((prev) => prev.map((c) => ({ ...c, isFlipped: false })));
      setLocalPhase("playing");
    }, 3000);
  }, [generateCards, safeTimeout]);

  const prevPhaseRef = useRef<string>("");
  useEffect(() => {
    if (phase === "playing" && prevPhaseRef.current !== "playing") {
      startLevel(level);
    } else if (phase === "welcome") {
      if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
      setCards([]);
      setFlippedIndices([]);
    } else if (phase === "game_over" || phase === "victory") {
      if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
    }
    prevPhaseRef.current = phase;
  }, [phase, level, startLevel]);

  useEffect(() => {
    if (localPhase === "playing" && phase === "playing" && level > 3) {
      const intervalTime = Math.max(3000, 8000 - level * 400);
      shuffleIntervalRef.current = setInterval(shufflePositions, intervalTime);
    }
    return () => {
      if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
    };
  }, [localPhase, phase, level, shufflePositions]);

  const handleCardClick = useCallback((idx: number) => {
    const latestCards = cardsRef.current;
    if (localPhase !== "playing" || phase !== "playing" || latestCards[idx].isFlipped || latestCards[idx].isMatched || flippedIndices.length >= 2) return;

    playSound("pop");
    const newFlipped = [...flippedIndices, idx];
    setFlippedIndices(newFlipped);
    setCards((prev) => prev.map((c, i) => (i === idx ? { ...c, isFlipped: true } : c)));

    if (newFlipped.length === 2) {
      const [firstIdx, secondIdx] = newFlipped;
      const first = latestCards[firstIdx];
      const second = latestCards[secondIdx];

      if (first.symbolIdx === second.symbolIdx && first.colorIdx === second.colorIdx) {
        safeTimeout(() => {
          playSound("correct");
          showFeedback(true);
          setFlippedIndices([]);
          addScore(level * 10);

          setCards((prev) => {
            const updated = prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c
            );
            const allMatched = updated.every((c) => c.isMatched);
            if (allMatched) {
              setLocalPhase("feedback");
              safeTimeout(() => {
                dismissFeedback();
                if (level >= MAX_LEVEL) {
                  engine.setGamePhase("victory");
                } else {
                  nextLevel();
                  startLevel(level + 1);
                }
              }, 1000);
            }
            return updated;
          });
        }, 500);
      } else {
        safeTimeout(() => {
          playSound("incorrect");
          showFeedback(false);
          setLocalPhase("feedback");
          const willGameOver = lives <= 1;

          safeTimeout(() => {
            dismissFeedback();
            loseLife();
            if (!willGameOver) {
              setCards((prev) => prev.map((c, i) => i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c));
              setFlippedIndices([]);
              setLocalPhase("playing");
            }
          }, 1000);
        }, 1000);
      }
    }
  }, [localPhase, phase, flippedIndices, playSound, showFeedback, dismissFeedback, addScore, level, lives, nextLevel, loseLife, startLevel, safeTimeout, engine]);

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Grid3X3,
    accentColor: "cyber-blue",
    maxLevel: MAX_LEVEL,
    wideLayout: true,
    howToPlay: [
      "Kartları 3 saniye boyunca ezberle.",
      "Aynı renk ve şekle sahip kartları eşleştir.",
      "İleri seviyelerde kartların yer değişimini takip et!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full max-w-3xl mx-auto">
          {phase === "playing" && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full relative flex flex-col items-center"
            >
              <motion.div className={`max-w-sm sm:max-w-xl w-full mx-auto text-center mb-3 border-2 border-black/10 px-4 py-2.5 rounded-xl shadow-neo-sm ${localPhase === "preview" ? "bg-cyber-yellow" : "bg-cyber-pink"}`}>
                <p className="text-lg sm:text-xl font-black font-nunito uppercase tracking-wider text-black flex items-center justify-center gap-2">
                  {localPhase === "preview" ? (<><Eye size={20} className="stroke-[3]" /> KARTLARI EZBERLE!</>) : (<><Zap size={20} className="fill-black" /> EŞLEŞTİR!</>)}
                </p>
              </motion.div>

              <div className="w-full bg-white dark:bg-slate-800 p-3 sm:p-5 rounded-2xl border-2 border-black/10 shadow-neo-sm">
                <div className={`grid gap-2 sm:gap-3 ${cards.length <= 12 ? "grid-cols-4" : "grid-cols-5"}`}>
                  {cards.map((card, idx) => {
                    const Icon = SHAPE_ICONS[card.symbolIdx];
                    const color = COLORS[card.colorIdx];
                    const isRevealed = card.isFlipped || card.isMatched || localPhase === "preview";

                    return (
                      <motion.button
                        key={card.id}
                        layout
                        whileTap={!isRevealed && localPhase === "playing" ? { scale: 0.95 } : {}}
                        onClick={() => handleCardClick(idx)}
                        className={`aspect-square rounded-xl relative transition-all duration-300 flex items-center justify-center border-3 ${card.isMatched ? "opacity-30 scale-90 shadow-none grayscale" : isRevealed ? "shadow-none translate-y-1 bg-slate-50 dark:bg-slate-700" : "bg-slate-200 dark:bg-slate-600 border-black/10 shadow-neo-sm"}`}
                        style={{ borderColor: isRevealed ? color.hex : "#000", backgroundColor: isRevealed ? `${color.hex}15` : undefined }}
                        disabled={isRevealed || localPhase !== "playing"}
                      >
                        {isRevealed ? (
                          <div className="flex items-center justify-center h-full w-full">
                            <Icon size={Math.max(20, 40 - (cards.length > 12 ? 8 : 0))} color={color.hex} strokeWidth={3} className="drop-shadow-sm" />
                          </div>
                        ) : (
                          <div className="opacity-10 dark:opacity-20">
                            <Grid3X3 size={24} className="text-black dark:text-white" strokeWidth={3} />
                          </div>
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

export default CrossMatchGame;
