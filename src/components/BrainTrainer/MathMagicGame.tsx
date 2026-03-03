import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Zap, Sparkles } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { GAME_COLORS } from './shared/gameColors';
// ============== TYPES ==============
type ColorInfo = { name: string; hex: string };
type GameCardData = { id: string; number: number; color: ColorInfo };
enum QuestionType {
  NUMBER = "NUMBER",
  COLOR = "COLOR",
  ADDITION = "ADDITION",
  SUBTRACTION = "SUBTRACTION",
}
type QuestionData = {
  type: QuestionType;
  text: string;
  answer: string | number;
  targetIndices: number[];
}; // ============== CONSTANTS ==============
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const COLORS: ColorInfo[] = [
  { name: "Kırmızı", hex: GAME_COLORS.pink },
  { name: "Mavi", hex: GAME_COLORS.blue },
  { name: "Yeşil", hex: GAME_COLORS.emerald },
  { name: "Sarı", hex: GAME_COLORS.yellow },
  { name: "Mor", hex: GAME_COLORS.purple },
  { name: "Turuncu", hex: GAME_COLORS.orange },
];
const CARD_DISPLAY_TIME = 2000;
const CARD_SEQUENCE_DELAY = 800;
// ============== GAME CARD COMPONENT ==============
const GameCard: React.FC<{
  card: GameCardData;
  isVisible: boolean;
  isTarget?: boolean;
}> = ({ card, isVisible, isTarget = false }) => {
  return (
    <motion.div
      className={`perspective-1000 w-24 h-32 sm:w-32 sm:h-44 transition-all duration-500 ${isTarget ? "scale-110 z-10" : ""}`}
      style={{ perspective: "1000px" }}
      animate={
        isTarget && !isVisible
          ? { scale: [1, 1.03, 1] }
          : {}
      }
      transition={{ repeat: Infinity, duration: 2 }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isVisible ? 0 : 180 }}
        transition={{ duration: 0.6 }}
      >
        {/* Front Face (Visible Content) */}
        <div
          className="absolute w-full h-full rounded-2xl border-2 border-black/10 shadow-neo-sm flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
            backgroundColor: card.color.hex,
          }}
        >
          <span className="text-black text-4xl sm:text-6xl font-nunito font-black drop-shadow-sm">
            {card.number}
          </span>
          <div className="mt-1 bg-white/90 px-2 py-0.5 rounded-lg border-2 border-black/10 shadow-neo-sm">
            <p className="text-black font-nunito font-bold text-[9px] sm:text-[10px] uppercase tracking-wider">
              {card.color.name}
            </p>
          </div>
        </div>

        {/* Back Face (Hidden/Cover) */}
        <div
          className={`absolute w-full h-full rounded-2xl border-4 shadow-neo-sm overflow-hidden flex items-center justify-center bg-white dark:bg-slate-800 ${isTarget ? "border-cyber-green ring-4 ring-cyber-green/30" : "border-black"}`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Subtle grid pattern background */}
          <svg
            className="absolute inset-0 w-full h-full opacity-5 pointer-events-none"
            viewBox="0 0 100 100"
          >
            <line
              x1="50"
              y1="5"
              x2="50"
              y2="15"
              stroke="currentColor"
              strokeWidth="4"
            />
            <line
              x1="95"
              y1="50"
              x2="85"
              y2="50"
              stroke="currentColor"
              strokeWidth="4"
            />
            <line
              x1="50"
              y1="95"
              x2="50"
              y2="85"
              stroke="currentColor"
              strokeWidth="4"
            />
            <line
              x1="5"
              y1="50"
              x2="15"
              y2="50"
              stroke="currentColor"
              strokeWidth="4"
            />
            <circle cx="50" cy="50" r="3" fill="currentColor" />
          </svg>
          <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-700 border-2 border-black/10 flex items-center justify-center shadow-neo-sm">
            <Zap
              size={28}
              className="text-slate-400 dark:text-slate-500 fill-current"
            />
          </div>
          {isTarget && (
            <motion.div
              className="absolute -top-3 -right-3 bg-cyber-green w-10 h-10 rounded-full flex items-center justify-center shadow-neo-sm border-2 border-black/10"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            >
              <Sparkles size={18} className="text-black" />
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
const GAME_ID = "sayi-sihirbazi";
const GAME_TITLE = "Sayı Sihirbazı";
const GAME_DESCRIPTION = "Kartları dikkatle izle, renkleri ve sayıları aklında tut! Sihirli soruları cevaplayarak hafızanı kanıtla.";
const TUZO_TEXT = "TUZÖ 5.9.1 Çalışma Belleği";

const MathMagicGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1000 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;
  const { phase, level, addScore, loseLife, nextLevel } = engine;

  const [cards, setCards] = useState<GameCardData[]>([]);
  const [visibleIndices, setVisibleIndices] = useState<number[]>([]);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [numberInput, setNumberInput] = useState("");
  const cardSequenceRef = useRef<NodeJS.Timeout[]>([]);
  const roundTopRef = useRef<HTMLDivElement | null>(null);


  const generateQuestion = useCallback((currentCards: GameCardData[]) => {
    const types = Object.values(QuestionType);
    const type = types[Math.floor(Math.random() * types.length)];
    const cardIndex = Math.floor(Math.random() * currentCards.length);
    const targetCard = currentCards[cardIndex];
    let q: QuestionData;
    switch (type) {
      case QuestionType.COLOR:
        q = {
          type,
          text: `İşaretli kartın rengi neydi?`,
          answer: targetCard.color.name,
          targetIndices: [cardIndex],
        };
        break;
      case QuestionType.NUMBER:
        q = {
          type,
          text: `İşaretli kartın sayısı kaçtı?`,
          answer: targetCard.number,
          targetIndices: [cardIndex],
        };
        break;
      case QuestionType.ADDITION: {
        const idx2 = (cardIndex + 1) % currentCards.length;
        const card2 = currentCards[idx2];
        q = {
          type,
          text: `İşaretli kartların toplamı nedir?`,
          answer: targetCard.number + card2.number,
          targetIndices: [cardIndex, idx2],
        };
        break;
      }
      case QuestionType.SUBTRACTION: {
        const idx2 = (cardIndex + 1) % currentCards.length;
        const card2 = currentCards[idx2];
        q = {
          type,
          text: `İşaretli kartların farkı nedir?`,
          answer: Math.abs(targetCard.number - card2.number),
          targetIndices: [cardIndex, idx2],
        };
        break;
      }
      default:
        q = {
          type: QuestionType.NUMBER,
          text: "Hata",
          answer: 0,
          targetIndices: [],
        };
    }
    setQuestion(q);
  }, []);

  const startNewRound = useCallback(() => {
    cardSequenceRef.current.forEach((t) => clearTimeout(t));
    cardSequenceRef.current = [];
    const numCards = Math.min(2 + Math.floor(level / 4), 6);
    const newCards: GameCardData[] = Array.from({ length: numCards }).map(
      () => ({
        id: Math.random().toString(36).substr(2, 9),
        number: Math.floor(Math.random() * (level + 5)),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }),
    );
    setCards(newCards);
    setVisibleIndices([]);
    setQuestion(null);
    setNumberInput("");
    // All cards open one by one with a staggered delay
    let cumulativeDelay = 800; // Give user time to focus
    newCards.forEach((_, index) => {
      const openTimeout = setTimeout(() => {
        setVisibleIndices((prev) => [...prev, index]);
        playSound("pop");
      }, cumulativeDelay);
      cardSequenceRef.current.push(openTimeout);
      cumulativeDelay += Math.max(600, CARD_SEQUENCE_DELAY - level * 20);
    });
    // After all cards are open, keep them visible for memorization time
    const allOpenTime = cumulativeDelay;
    const displayTime = Math.max(1200, CARD_DISPLAY_TIME - level * 50);
    // Then close ALL cards at once
    const closeAllTime = allOpenTime + displayTime;
    const closeTimeout = setTimeout(() => {
      setVisibleIndices([]);
    }, closeAllTime);
    cardSequenceRef.current.push(closeTimeout);
    // Wait for flip animation to complete, then show question
    const questionDelay = closeAllTime + 800;
    const questionTimeout = setTimeout(() => {
      generateQuestion(newCards);
    }, questionDelay);
    cardSequenceRef.current.push(questionTimeout);
  }, [level, generateQuestion, playSound]);

  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;

    if (
      phase === "playing" &&
      (prevPhase === "welcome" || prevPhase === "game_over" || prevPhase === "victory")
    ) {
      // Clear any old state and start fresh
      cardSequenceRef.current.forEach((t) => clearTimeout(t));
      cardSequenceRef.current = [];
      setCards([]);
      setVisibleIndices([]);
      setQuestion(null);
      setNumberInput("");
      // Small delay for React state to settle, then start
      const initTimeout = setTimeout(() => {
        startNewRound();
      }, 50);
      cardSequenceRef.current.push(initTimeout);
    } else if (phase === "welcome") {
      cardSequenceRef.current.forEach((t) => clearTimeout(t));
      cardSequenceRef.current = [];
      setCards([]);
      setVisibleIndices([]);
      setQuestion(null);
      setNumberInput("");
    } else if (phase === "game_over" || phase === "victory") {
      cardSequenceRef.current.forEach((t) => clearTimeout(t));
      cardSequenceRef.current = [];
    }

    prevPhaseRef.current = phase;
  }, [phase, startNewRound]);

  const handleAnswer = useCallback(
    (userAnswer: string | number) => {
      if (phase !== "playing" || !question || feedbackState) return;
      const correct =
        String(userAnswer).toLowerCase() ===
        String(question.answer).toLowerCase();

      showFeedback(correct);
      playSound(correct ? "correct" : "incorrect");

      safeTimeout(() => {
        dismissFeedback();
        if (correct) {
          addScore(10 * level);
          if (level >= MAX_LEVEL) {
            engine.setGamePhase("victory");
          } else {
            nextLevel();
            startNewRound();
          }
        } else {
          loseLife();
          if (engine.lives > 1) { // Will decrement natively on engine, so check current > 1
            startNewRound();
          }
        }
      }, 1200);
    },
    [
      question,
      level,
      engine.lives,
      playSound,
      startNewRound,
      dismissFeedback,
      addScore,
      feedbackState,
      loseLife,
      nextLevel,
      phase,
      showFeedback,
    ],
  );

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Zap,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Ekranda sıra ile açılan kartları ezberle.",
      "Kartların rengini, sayısını ve sırasını aklında tut.",
      "İşaretlenen kart hakkındaki mantık sorularını cevapla!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full">
          {phase === "playing" && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-3xl"
              ref={roundTopRef}
            >
              <div className="flex flex-wrap justify-center mb-6 gap-3 sm:gap-4 min-h-[140px]">
                {cards.map((card, idx) => (
                  <GameCard
                    key={card.id}
                    card={card}
                    isVisible={visibleIndices.includes(idx)}
                    isTarget={question?.targetIndices.includes(idx)}
                  />
                ))}
              </div>
              {question && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-black/10 shadow-neo-sm max-w-md mx-auto"
                >
                  <div className="text-center mb-4">
                    <div className="inline-block p-3 rounded-xl bg-cyber-pink border-2 border-black/10 shadow-neo-sm mb-3">
                      <Zap size={24} className="text-black fill-black" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-nunito font-black text-black dark:text-white uppercase tracking-tight">
                      {question.text}
                    </h3>
                  </div>

                  {question.type === QuestionType.COLOR ? (
                    <div className="flex flex-wrap justify-center gap-4">
                      {COLORS.map((color, i) => (
                        <motion.button
                          key={i}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleAnswer(color.name)}
                          className="flex flex-col items-center gap-1.5 group"
                          title={color.name}
                        >
                          <div
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-black/10 shadow-neo-sm transition-all group-active:translate-y-1 group-active:shadow-none"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-[10px] font-nunito font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{color.name}</span>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-full p-4 rounded-xl bg-slate-100 dark:bg-slate-700 border-2 border-black/10 shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)] text-center mb-4">
                        <span className="text-4xl font-nunito font-black text-black dark:text-white">
                          {numberInput || "?"}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 mb-4 w-full">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
                          <motion.button
                            key={n}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              numberInput.length < 3 &&
                              setNumberInput((p) => p + n)
                            }
                            className="aspect-square bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl text-xl font-nunito font-black text-black dark:text-white shadow-neo-sm transition-all active:translate-y-1 active:shadow-none"
                          >
                            {n}
                          </motion.button>
                        ))}
                      </div>
                      <div className="flex gap-3 w-full">
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setNumberInput("")}
                          className="flex-1 py-3 rounded-xl bg-white dark:bg-slate-800 text-black dark:text-white font-nunito font-black border-2 border-black/10 shadow-neo-sm uppercase tracking-widest text-sm border-dashed active:translate-y-1 active:shadow-none"
                        >
                          SİL
                        </motion.button>
                        <motion.button
                          whileTap={numberInput ? { scale: 0.98 } : {}}
                          onClick={() =>
                            numberInput && handleAnswer(Number(numberInput))
                          }
                          disabled={!numberInput}
                          className={`flex-[2] py-3 rounded-xl font-nunito font-black uppercase tracking-widest text-sm border-2 border-black/10 shadow-neo-sm transition-all active:translate-y-1 active:shadow-none ${numberInput ? "bg-cyber-blue text-white" : "bg-slate-200 text-slate-400 opacity-50 cursor-not-allowed"}`}
                        >
                          DENETLE
                        </motion.button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

        </div>
      )}
    </BrainTrainerShell>
  );
};

export default MathMagicGame;
