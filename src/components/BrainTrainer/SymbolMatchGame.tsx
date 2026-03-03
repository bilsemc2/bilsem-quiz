import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
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
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { GAME_COLORS } from './shared/gameColors';
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

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
  { hex: GAME_COLORS.incorrect, name: "Kırmızı" },
  { hex: GAME_COLORS.blue, name: "Mavi" },
  { hex: GAME_COLORS.emerald, name: "Yeşil" },
  { hex: GAME_COLORS.orange, name: "Sarı" },
  { hex: GAME_COLORS.purple, name: "Mor" },
  { hex: GAME_COLORS.pink, name: "Pembe" },
  { hex: GAME_COLORS.orange, name: "Turuncu" },
  { hex: GAME_COLORS.blue, name: "Turkuaz" },
  { hex: "#14b8a6", name: "Deniz Yeşili" },
  { hex: GAME_COLORS.purple, name: "Lila" },
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
  const safeTimeout = useSafeTimeout();
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
  }, [phase, level, startRound]); // startRound triggers here on new level or play

  useEffect(() => {
    if (phase !== "playing") return;

    if (localPhase === "memorize" && memorizeCountdown > 0) {
      const t = safeTimeout(() => setMemorizeCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (localPhase === "memorize" && memorizeCountdown === 0) {
      setCurrentQuestion(generateQuestion(symbolColors));
      setLocalPhase("question");
      playSound("pop");
    }
  }, [phase, localPhase, memorizeCountdown, symbolColors, generateQuestion, playSound, safeTimeout]);

  const handleAnswer = useCallback((ans: string) => {
    if (localPhase !== "question" || selectedAnswer !== null) return;
    setSelectedAnswer(ans);

    const correct = ans === currentQuestion?.correctAnswer;
    showFeedback(correct);
    playSound(correct ? "correct" : "incorrect");

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      addScore(100 + level * 10 + newStreak * 15);

      safeTimeout(() => {
        if (isGameEndingRef.current) return;
        nextLevel();
      }, 1500);
    } else {
      setStreak(0);
      loseLife();

      if (lives - 1 > 0) {
        safeTimeout(() => {
          if (isGameEndingRef.current) return;
          startRound();
        }, 1500);
      } else {
        isGameEndingRef.current = true;
      }
    }
  }, [localPhase, selectedAnswer, currentQuestion, showFeedback, playSound, streak, addScore, level, nextLevel, loseLife, lives, startRound, safeTimeout]);

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Shapes,
    accentColor: "cyber-pink",
    maxLevel: 20,
    wideLayout: true,
    howToPlay: [
      "Ekrana gelen renkli şekilleri ezberle",
      "Sana sorulan şekli veya rengi bul",
      "Seviye ilerledikçe şekil sayısı artar, süre azalır!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-start sm:justify-center p-4 flex-1 mb-4 w-full max-w-4xl mx-auto">
          {localPhase === "memorize" && (
            <motion.div
              key="memorize"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-8 w-full max-w-4xl"
            >
              <div className="flex items-center justify-center gap-4 bg-white dark:bg-slate-800 px-6 py-3 border-2 border-black/10 shadow-neo-sm rounded-2xl rotate-1 w-fit mx-auto">
                <Eye className="w-8 h-8 text-cyber-blue" strokeWidth={3} />
                <span className="text-black dark:text-white text-xl font-nunito font-black uppercase tracking-wider">
                  Ezberle:
                </span>
                <motion.span
                  key={memorizeCountdown}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-black text-cyber-pink drop-shadow-neo-sm"
                >
                  {memorizeCountdown}
                </motion.span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-6 sm:p-8 border-2 border-black/10 shadow-neo-sm -rotate-1 min-h-[200px] flex items-center justify-center">
                <div className="flex justify-center gap-8 sm:gap-12 flex-wrap">
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
                          size={96}
                          style={{
                            color: sc.color,
                            filter: "drop-shadow(4px 4px 0px rgba(0,0,0,0.8))",
                          }}
                          fill={sc.fill ? sc.color : "none"}
                          strokeWidth={sc.fill ? 1.5 : 2.5}
                        />
                        <span className="text-sm font-nunito font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-4 py-1.5 rounded-full border-2 border-black/10">
                          {sc.shapeName}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              <div className="h-6 bg-white dark:bg-slate-800 rounded-full overflow-hidden border-2 border-black/10 p-0.5 shadow-neo-sm w-full max-w-xl mx-auto">
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
              className="text-center space-y-6 w-full max-w-4xl"
            >
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border-2 border-black/10 shadow-neo-sm rotate-1">
                <p className="text-cyber-blue text-sm font-nunito font-black uppercase tracking-widest mb-3">
                  Zihin Sorusu
                </p>
                <h2 className="text-2xl lg:text-3xl font-nunito font-black text-black dark:text-white leading-tight">
                  {currentQuestion.query}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
                      whileTap={localPhase === "question" && !selectedAnswer ? { scale: 0.95 } : {}}
                      className={`relative py-6 sm:py-8 rounded-3xl font-nunito font-black text-xl sm:text-2xl transition-all border-4 flex flex-col items-center justify-center gap-3 overflow-hidden shadow-neo-sm hover:shadow-neo-sm active:translate-y-2 active:shadow-none bg-white dark:bg-slate-700 border-black/10 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 ${idx % 2 === 0 ? "rotate-1 hover:rotate-2" : "-rotate-1 hover:-rotate-2"} ${isSel ? "border-cyber-pink shadow-none translate-y-2" : ""}`}
                    >
                      {q.type === "color" && optShape ? (
                        <>
                          <optShape.Icon
                            size={56}
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
                              size={48}
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
                            className="px-3 bg-white border-2 border-black/10 rounded-lg text-sm"
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
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default SymbolMatchGame;
