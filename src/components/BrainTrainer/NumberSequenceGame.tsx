import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = "sayisal-dizi";
type PatternType =
  | "arithmetic"
  | "geometric"
  | "fibonacci"
  | "square"
  | "cube"
  | "prime"
  | "alternating"
  | "doubleStep";
interface Question {
  sequence: number[];
  answer: number;
  options: number[];
  patternType: PatternType;
  patternDescription: string;
}
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
const NumberSequenceGame: React.FC = () => {
  const generatePattern = useCallback((lvl: number): Question => {
    const types: PatternType[] =
      lvl <= 3
        ? ["arithmetic", "geometric"]
        : lvl <= 6
          ? ["arithmetic", "geometric", "square", "fibonacci"]
          : lvl <= 10
            ? [
              "arithmetic",
              "geometric",
              "square",
              "fibonacci",
              "cube",
              "alternating",
            ]
            : [
              "arithmetic",
              "geometric",
              "square",
              "fibonacci",
              "cube",
              "alternating",
              "prime",
              "doubleStep",
            ];
    const type = types[Math.floor(Math.random() * types.length)];
    const len = Math.min(4 + Math.floor(lvl / 5), 6);
    let seq: number[] = [],
      ans = 0,
      desc = "";
    switch (type) {
      case "arithmetic": {
        const s = Math.floor(Math.random() * 10) + 1;
        const d = Math.floor(Math.random() * (lvl + 2)) + 1;
        seq = Array.from({ length: len }, (_, i) => s + i * d);
        ans = s + len * d;
        desc = `+${d}`;
        break;
      }
      case "geometric": {
        const s = Math.floor(Math.random() * 3) + 1;
        const r = lvl <= 5 ? 2 : Math.floor(Math.random() * 2) + 2;
        seq = Array.from({ length: len }, (_, i) => s * Math.pow(r, i));
        ans = s * Math.pow(r, len);
        desc = `x${r}`;
        break;
      }
      case "fibonacci": {
        const a = Math.floor(Math.random() * 3) + 1,
          b = Math.floor(Math.random() * 3) + 1;
        seq = [a, b];
        for (let i = 2; i < len; i++) seq.push(seq[i - 1] + seq[i - 2]);
        ans = seq[len - 1] + seq[len - 2];
        desc = "Toplayarak";
        break;
      }
      case "square": {
        const s = Math.floor(Math.random() * 3) + 1;
        seq = Array.from({ length: len }, (_, i) => Math.pow(s + i, 2));
        ans = Math.pow(s + len, 2);
        desc = "Kareler";
        break;
      }
      case "cube": {
        const s = Math.floor(Math.random() * 2) + 1;
        seq = Array.from({ length: len }, (_, i) => Math.pow(s + i, 3));
        ans = Math.pow(s + len, 3);
        desc = "Küpler";
        break;
      }
      case "alternating": {
        const s = Math.floor(Math.random() * 10) + 5;
        const d1 = Math.floor(Math.random() * 4) + 1,
          d2 = Math.floor(Math.random() * 3) + 1;
        seq = [s];
        for (let i = 1; i < len; i++)
          seq.push(i % 2 === 1 ? seq[i - 1] + d1 : seq[i - 1] - d2);
        ans = len % 2 === 1 ? seq[len - 1] + d1 : seq[len - 1] - d2;
        desc = `+${d1}/-${d2}`;
        break;
      }
      case "doubleStep": {
        const s = Math.floor(Math.random() * 5) + 1;
        seq = [s];
        let d = 2;
        for (let i = 1; i < len; i++) {
          seq.push(seq[i - 1] + d);
          d += 1;
        }
        ans = seq[len - 1] + d;
        desc = "Artan Fark";
        break;
      }
      case "prime": {
        const idx = Math.floor(Math.random() * (PRIMES.length - len - 1));
        seq = PRIMES.slice(idx, idx + len);
        ans = PRIMES[idx + len];
        desc = "Asallar";
        break;
      }
    }
    const opts = new Set<number>([ans]);
    while (opts.size < 4)
      opts.add(ans + (Math.floor(Math.random() * 20) - 10) || ans + 5);
    return {
      sequence: seq,
      answer: ans,
      options: Array.from(opts).sort(() => Math.random() - 0.5),
      patternType: type,
      patternDescription: desc,
    };
  }, []);

  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;


  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const startLevel = useCallback(
    (lvl: number) => {
      setCurrentQuestion(generatePattern(lvl));
      setSelectedAnswer(null);
    },
    [generatePattern],
  );

  useEffect(() => {
    if (engine.phase === "playing" && !currentQuestion) {
      playSound("slide");
      startLevel(engine.level);
    } else if (engine.phase === "welcome") {
      setCurrentQuestion(null);
      setSelectedAnswer(null);
    }
  }, [engine.phase, engine.level, startLevel, currentQuestion, playSound]);

  const handleAnswer = useCallback((val: number) => {
    if (engine.phase !== "playing" || !!feedbackState || !currentQuestion) return;
    setSelectedAnswer(val);

    const correct = val === currentQuestion.answer;
    showFeedback(correct);
    playSound(correct ? "correct" : "incorrect");

    safeTimeout(() => {
      dismissFeedback();
      if (correct) {
        engine.addScore(25 + engine.level * 5);
        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
          playSound("success");
        } else {
          engine.nextLevel();
          startLevel(engine.level + 1);
          playSound("slide");
        }
      } else {
        engine.loseLife();
        if (engine.lives > 1) {
          startLevel(engine.level);
        }
      }
    }, 1500);
  }, [engine, feedbackState, currentQuestion, showFeedback, playSound, safeTimeout, dismissFeedback, startLevel]);

  const gameConfig = {
    title: "Sayı Dizileri",
    description: "Sayılar arasındaki gizli kuralı keşfet, mantık zincirini tamamla!",
    tuzoCode: "TUZÖ 5.3.1 Sayısal Mantık & Örüntü Tanıma",
    icon: TrendingUp,
    accentColor: "cyber-blue",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      <>Verilen sayı dizisindeki <strong>mantıksal kuralı</strong> bul</>,
      <>Eksik olan sayıyı seçeneklerden seç</>,
      <>Seviye arttıkça kurallar <strong>karmaşıklaşacak</strong></>,
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        currentQuestion ? (
          <div className="w-full max-w-2xl space-y-12">
            <div className="flex flex-col items-center gap-8">
              <span className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-black/10 shadow-neo-sm rounded-xl text-sm font-nunito font-black uppercase text-black dark:text-white tracking-widest">
                Örüntüyü Tamamla
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
                {currentQuestion.sequence.map((n, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 sm:w-24 sm:h-24 bg-white dark:bg-slate-800 rounded-3xl border-2 border-black/10 flex items-center justify-center shadow-neo-sm group"
                  >
                    <span className="text-2xl sm:text-4xl font-nunito font-black text-black dark:text-white">
                      {n}
                    </span>
                  </div>
                ))}
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-cyber-pink rounded-3xl border-2 border-black/10 flex items-center justify-center shadow-neo-sm animate-[pulse_2s_infinite]">
                  <span className="text-3xl sm:text-5xl font-nunito font-black text-white">
                    ?
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-12 w-full max-w-3xl mx-auto">
              {currentQuestion.options.map((opt, i) => {
                const colors = [
                  "bg-cyber-yellow",
                  "bg-cyber-blue",
                  "bg-cyber-green",
                  "bg-cyber-purple",
                ];
                const baseColor = colors[i % colors.length];
                const isSelected = selectedAnswer === opt;
                const isCorrectAnswer = opt === currentQuestion.answer;

                let btnStyle = `${baseColor} text-black`;
                if (isSelected) {
                  btnStyle = isCorrectAnswer
                    ? "bg-cyber-green text-black"
                    : "bg-cyber-pink text-white";
                }

                return (
                  <motion.button
                    key={opt}
                    whileTap={!feedbackState ? { scale: 0.95 } : {}}
                    onClick={() => handleAnswer(opt)}
                    disabled={!!feedbackState}
                    className={`p-6 sm:p-8 rounded-[2rem] border-2 border-black/10 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-2 active:shadow-none transition-all ${btnStyle}`}
                  >
                    <span className="font-nunito font-black text-3xl sm:text-4xl">
                      {opt}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : <></>
      )}
    </BrainTrainerShell>
  );
};
export default NumberSequenceGame;
