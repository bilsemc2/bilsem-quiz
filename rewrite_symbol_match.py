import re

content = """import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Shapes,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Diamond,
  Pentagon,
  Octagon,
  Heart,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import { BrainTrainerShell } from "./shared/BrainTrainerShell";

const GAME_ID = "sekil-hafizasi";
const GAME_TITLE = "Şekil Hafızası";
const GAME_DESCRIPTION = "Şekillerin renklerini kısa sürede ezberle ve sorulan sorulara doğru cevap ver. Görsel çalışma belleğini test et!";
const TUZO_TEXT = "TUZÖ 4.2.1 Görsel Çalışma Belleği";

const SHAPE_DEFS: { name: string; Icon: LucideIcon; fill?: boolean }[] = [
  { name: "Yıldız", Icon: Star, fill: true },
  { name: "Daire", Icon: Circle, fill: true },
  { name: "Kare", Icon: Square, fill: true },
  { name: "Üçgen", Icon: Triangle, fill: true },
  { name: "Altıgen", Icon: Hexagon, fill: true },
  { name: "Elmas", Icon: Diamond, fill: true },
  { name: "Beşgen", Icon: Pentagon, fill: true },
  { name: "Sekizgen", Icon: Octagon, fill: true },
  { name: "Kalp", Icon: Heart, fill: true },
];

const COLORS = [
  { hex: "#ef4444", name: "Kırmızı" },
  { hex: "#3b82f6", name: "Mavi" },
  { hex: "#22c55e", name: "Yeşil" },
  { hex: "#f59e0b", name: "Sarı" },
  { hex: "#a855f7", name: "Mor" },
  { hex: "#ec4899", name: "Pembe" },
  { hex: "#f97316", name: "Turuncu" },
  { hex: "#06b6d4", name: "Turkuaz" },
  { hex: "#14b8a6", name: "Deniz Yeşili" },
  { hex: "#8b5cf6", name: "Lila" },
  { hex: "#e11d48", name: "Bordo" },
  { hex: "#84cc16", name: "Lime" },
  { hex: "#0ea5e9", name: "Gök Mavi" },
  { hex: "#d946ef", name: "Fuşya" },
];

interface ShapeColor {
  shapeName: string;
  Icon: LucideIcon;
  fill: boolean;
  color: string;
  colorName: string;
}

type QuestionType = "color" | "symbol";

interface Question {
  type: QuestionType;
  query: string;
  correctAnswer: string;
  options: string[];
  targetShapeName?: string;
}

const SymbolMatchGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const feedback = useGameFeedback({ duration: 2000 });

  const {
    phase,
    level,
    lives,
    addScore,
    loseLife,
    nextLevel,
  } = engine;

  const { showFeedback } = feedback;

  const [localPhase, setLocalPhase] = useState<"memorize" | "question">("memorize");
  const [symbolColors, setSymbolColors] = useState<ShapeColor[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [memorizeCountdown, setMemorizeCountdown] = useState(5);
  const [streak, setStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const isGameEndingRef = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  const getSymbolCount = useCallback(
    () => (level <= 6 ? 4 : level <= 13 ? 5 : 6),
    [level],
  );

  const getMemorizeTime = useCallback(
    () => (level <= 5 ? 5 : level <= 10 ? 4 : level <= 15 ? 3 : 2),
    [level],
  );

  const generateSymbolColors = useCallback(() => {
    const count = getSymbolCount();
    const ss = [...SHAPE_DEFS].sort(() => Math.random() - 0.5).slice(0, count);
    const cc = [...COLORS].sort(() => Math.random() - 0.5).slice(0, count);
    return ss.map((s, i) => ({
      shapeName: s.name,
      Icon: s.Icon,
      fill: !!s.fill,
      color: cc[i].hex,
      colorName: cc[i].name,
    }));
  }, [getSymbolCount]);

  const generateQuestion = useCallback((pairs: ShapeColor[]): Question => {
    const t: QuestionType = Math.random() > 0.5 ? "color" : "symbol";
    const target = pairs[Math.floor(Math.random() * pairs.length)];
    const others = pairs.filter((p) => p !== target);

    if (t === "color") {
      const corr = target.shapeName;
      const wrongs = others.map((p) => p.shapeName).slice(0, 3);
      return {
        type: "color",
        query: `${target.colorName} renkteki şekil hangisiydi?`,
        correctAnswer: corr,
        options: [corr, ...wrongs].sort(() => Math.random() - 0.5),
      };
    } else {
      const corr = target.colorName;
      const wrongs = others.map((p) => p.colorName).slice(0, 3);
      return {
        type: "symbol",
        query: `${target.shapeName} hangi renkteydi?`,
        correctAnswer: corr,
        options: [corr, ...wrongs].sort(() => Math.random() - 0.5),
        targetShapeName: target.shapeName,
      };
    }
  }, []);

  const startRound = useCallback(() => {
    const pairs = generateSymbolColors();
    setSymbolColors(pairs);
    const time = getMemorizeTime();
    setMemorizeCountdown(time);
    setLocalPhase("memorize");
    setSelectedAnswer(null);
  }, [generateSymbolColors, getMemorizeTime]);

  // Handle phase transitions mapped from engine
  useEffect(() => {
    if (phase === "playing" && !isGameEndingRef.current) {
        startRound();
    } else if (phase === "welcome") {
       setStreak(0);
       isGameEndingRef.current = false;
    }
  }, [phase, level]); // startRound triggers here on new level or play

  useEffect(() => {
    if (phase !== "playing") return;

    if (localPhase === "memorize" && memorizeCountdown > 0) {
      const t = setTimeout(() => setMemorizeCountdown((c) => c - 1), 1000);
      timeoutsRef.current.push(t);
    } else if (localPhase === "memorize" && memorizeCountdown === 0) {
      setCurrentQuestion(generateQuestion(symbolColors));
      setLocalPhase("question");
      playSound("pop");
    }
  }, [phase, localPhase, memorizeCountdown, symbolColors, generateQuestion, playSound]);

  const handleAnswer = (ans: string) => {
    if (localPhase !== "question" || selectedAnswer !== null) return;
    setSelectedAnswer(ans);

    const correct = ans === currentQuestion?.correctAnswer;
    showFeedback(correct);
    playSound(correct ? "correct" : "incorrect");

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      addScore(100 + level * 10 + newStreak * 15);
      
      const tId = setTimeout(() => {
        if (isGameEndingRef.current) return;
        nextLevel(); // This triggers startRound via engine level bump
      }, 1500);
      timeoutsRef.current.push(tId);
    } else {
      setStreak(0);
      loseLife();

      if (lives - 1 > 0) {
         const tId = setTimeout(() => {
            if (isGameEndingRef.current) return;
            startRound(); // retry round
         }, 1500);
         timeoutsRef.current.push(tId);
      } else {
         isGameEndingRef.current = true;
         timeoutsRef.current.forEach(clearTimeout);
      }
    }
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoText: TUZO_TEXT,
    icon: <Shapes size={52} className="text-black drop-shadow-sm" strokeWidth={2.5} />,
    colorClass: "bg-cyber-pink",
    instructions: [
       { text: "Ekrana gelen renkli şekilleri ezberle", icon: "1", colorClass: "bg-cyber-yellow" },
       { text: "Sana sorulan şekli veya rengi bul", icon: "2", colorClass: "bg-cyber-green" },
       { text: "Seviye ilerledikçe şekil sayısı artar, süre azalır!", icon: "3", colorClass: "bg-cyber-pink" },
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-start sm:justify-center p-4 flex-1 mb-10 w-full max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            {localPhase === "memorize" && (
              <motion.div
                key="memorize"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-8 w-full max-w-lg"
              >
                <div className="flex items-center justify-center gap-4 bg-white dark:bg-slate-800 px-6 py-3 border-4 border-black shadow-[8px_8px_0_#000] rounded-2xl rotate-1 w-fit mx-auto">
                  <Eye className="w-8 h-8 text-cyber-blue" strokeWidth={3} />
                  <span className="text-black dark:text-white text-xl font-syne font-black uppercase tracking-wider">
                    Ezberle:
                  </span>
                  <motion.span
                    key={memorizeCountdown}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-black text-cyber-pink drop-shadow-[2px_2px_0_#000]"
                  >
                    {memorizeCountdown}
                  </motion.span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-[3rem] p-8 border-4 border-black shadow-[16px_16px_0_#000] -rotate-1 min-h-[300px] flex items-center justify-center">
                  <div className="flex justify-center gap-6 sm:gap-8 flex-wrap">
                    {symbolColors.map((sc, idx) => {
                      const ShapeComp = sc.Icon;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0, rotate: -180 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          transition={{ delay: idx * 0.1, type: "spring" }}
                          className="flex flex-col items-center gap-3"
                        >
                          <ShapeComp
                            size={72}
                            style={{
                              color: sc.color,
                              filter: "drop-shadow(4px 4px 0px rgba(0,0,0,0.8))",
                            }}
                            fill={sc.fill ? sc.color : "none"}
                            strokeWidth={sc.fill ? 1.5 : 2.5}
                          />
                          <span className="text-xs font-syne font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border-2 border-black">
                            {sc.shapeName}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
                <div className="h-6 bg-white dark:bg-slate-800 rounded-full overflow-hidden border-4 border-black p-0.5 shadow-[4px_4px_0_#000] w-full max-w-md mx-auto">
                  <motion.div
                    className="h-full rounded-full bg-cyber-pink shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: getMemorizeTime(), ease: "linear" }}
                  />
                </div>
              </motion.div>
            )}

            {localPhase === "question" && currentQuestion && (
              <motion.div
                key="question"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="text-center space-y-6 w-full max-w-lg"
              >
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border-4 border-black shadow-[12px_12px_0_#000] rotate-1">
                  <p className="text-cyber-blue text-sm font-syne font-black uppercase tracking-widest mb-3">
                    Zihin Sorusu
                  </p>
                  <h2 className="text-2xl lg:text-3xl font-syne font-black text-black dark:text-white leading-tight">
                    {currentQuestion.query}
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:gap-5">
                  {currentQuestion.options.map((opt, idx) => {
                    const q = currentQuestion!;
                    const isSel = selectedAnswer === opt;
                    const c =
                      q.type === "symbol"
                        ? COLORS.find((cl) => cl.name === opt)?.hex || "#64748b"
                        : undefined;
                    const optShape =
                      q.type === "color"
                        ? SHAPE_DEFS.find((s) => s.name === opt)
                        : null;
                    const targetShape =
                      q.type === "symbol" && q.targetShapeName
                        ? SHAPE_DEFS.find((s) => s.name === q.targetShapeName)
                        : null;
                    return (
                      <motion.button
                        key={idx}
                        onClick={() => handleAnswer(opt)}
                        disabled={localPhase !== "question" || selectedAnswer !== null}
                        whileHover={
                          localPhase === "question" && !selectedAnswer ? { scale: 1.05, y: -4 } : {}
                        }
                        whileTap={localPhase === "question" && !selectedAnswer ? { scale: 0.95 } : {}}
                        className={`relative aspect-[4/3] rounded-3xl font-syne font-black text-xl sm:text-2xl transition-all border-4 flex flex-col items-center justify-center gap-3 overflow-hidden shadow-[6px_6px_0_#000] hover:shadow-[10px_10px_0_#000] active:translate-y-2 active:shadow-none bg-white dark:bg-slate-700 border-black text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 ${idx % 2 === 0 ? "rotate-1 hover:rotate-2" : "-rotate-1 hover:-rotate-2"} ${isSel ? "border-cyber-pink shadow-none translate-y-2" : ""}`}
                      >
                        {q.type === "color" && optShape ? (
                          <>
                            <optShape.Icon
                              size={48}
                              style={{
                                color: "black",
                                filter: "drop-shadow(2px 2px 0px rgba(0,0,0,0.3))",
                              }}
                              fill={optShape.fill ? "black" : "none"}
                              strokeWidth={2}
                              className="dark:text-white dark:fill-white"
                            />
                            <span>{opt}</span>
                          </>
                        ) : q.type === "symbol" ? (
                          <>
                            {targetShape && (
                              <targetShape.Icon
                                size={36}
                                style={{
                                  color: c || "black",
                                  filter: "drop-shadow(2px 2px 0px rgba(0,0,0,0.3))",
                                }}
                                fill={targetShape.fill ? c || "black" : "none"}
                                strokeWidth={2}
                              />
                            )}
                            <span
                              style={{ color: c || "black" }}
                              className="px-3 bg-white border-2 border-black rounded-lg text-sm"
                            >
                              {opt}
                            </span>
                          </>
                        ) : (
                          <span>{opt}</span>
                        )}
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

export default SymbolMatchGame;
"""

with open("/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/BrainTrainer/SymbolMatchGame.tsx", "w") as f:
    f.write(content)
