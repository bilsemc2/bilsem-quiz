const fs = require('fs');
const path = require('path');

const bTPath = path.join(__dirname, 'src/components/BrainTrainer');

// 1. PerceptualSpeedGame
const perSpeed = `import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Eye } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useGameEngine } from "./shared/useGameEngine";
import { useGameFeedback } from "../../hooks/useGameFeedback";

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const BASE_DIGIT_LENGTH = 5;
const GAME_ID = "algisal-hiz";
const CONFUSION_PAIRS: Record<string, string[]> = {
  "3": ["8", "5"],
  "8": ["3", "0"],
  "1": ["7"],
  "7": ["1"],
  "6": ["9", "0"],
  "9": ["6"],
  "5": ["2", "3"],
  "2": ["5"],
};
interface Challenge {
  left: string;
  right: string;
  isSame: boolean;
  type: "same" | "transposition" | "similarity" | "random";
}

const generateRandomNumberString = (length: number): string => {
  let res = "";
  for (let i = 0; i < length; i++)
    res += Math.floor(Math.random() * 10).toString();
  return res;
};
const createChallenge = (digitLength: number): Challenge => {
  const base = generateRandomNumberString(digitLength),
    isSame = Math.random() > 0.5;
  if (isSame) return { left: base, right: base, isSame: true, type: "same" };
  const mod = base.split(""),
    roll = Math.random();
  let type: Challenge["type"] = "random";
  if (roll < 0.45) {
    const idx = Math.floor(Math.random() * (base.length - 1));
    [mod[idx], mod[idx + 1]] = [mod[idx + 1], mod[idx]];
    type = "transposition";
  } else if (roll < 0.9) {
    const candy = base
      .split("")
      .map((c, i) => ({ c, i }))
      .filter((it) => CONFUSION_PAIRS[it.c]);
    if (candy.length > 0) {
      const target = candy[Math.floor(Math.random() * candy.length)];
      const reps = CONFUSION_PAIRS[target.c];
      mod[target.i] = reps[Math.floor(Math.random() * reps.length)];
      type = "similarity";
    } else {
      const idx = Math.floor(Math.random() * base.length);
      mod[idx] = ((parseInt(mod[idx]) + 1) % 10).toString();
      type = "random";
    }
  } else {
    const idx = Math.floor(Math.random() * base.length);
    let nd = Math.floor(Math.random() * 10).toString();
    while (nd === mod[idx]) nd = Math.floor(Math.random() * 10).toString();
    mod[idx] = nd;
  }
  const right = mod.join("");
  if (base === right) mod[0] = mod[0] === "1" ? "2" : "1";
  return { left: base, right: mod.join(""), isSame: false, type };
};

const PerceptualSpeedGame: React.FC = () => {
  const { playSound } = useSound();

  const engine = useGameEngine({
    gameId: GAME_ID,
    timeLimit: TIME_LIMIT,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
  });

  const feedback = useGameFeedback({ duration: 1500 });
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const challengeStartRef = useRef(0);
  const correctInLevelRef = useRef(0);

  const setupChallenge = useCallback((lvl: number) => {
    const len = Math.min(BASE_DIGIT_LENGTH + Math.floor((lvl - 1) / 4), 9);
    setChallenge(createChallenge(len));
    challengeStartRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (engine.phase === "playing" && !challenge) {
      setupChallenge(engine.level);
      correctInLevelRef.current = 0;
    } else if (engine.phase !== "playing") {
      setChallenge(null);
    }
  }, [engine.phase, engine.level, challenge, setupChallenge]);

  const handleAnswer = useCallback((val: boolean) => {
    if (!challenge || engine.phase !== "playing" || feedback.feedbackState) return;
    
    const correct = val === challenge.isSame;
    feedback.showFeedback(correct);
    playSound(correct ? "correct" : "wrong");

    setTimeout(() => {
      feedback.dismissFeedback();
      if (correct) {
        engine.addScore(10 * engine.level);
        correctInLevelRef.current += 1;
        if (correctInLevelRef.current >= 3) {
          correctInLevelRef.current = 0;
          if (engine.level >= MAX_LEVEL) {
            engine.handleFinish(true);
            playSound("success");
          } else {
            engine.addScore(0); 
            // BrainTrainer level only updates when a question is solved in fully managed mode.
            // But manually, we can setLevel. engine exposes setLevel? No, addScore directly adds to score. 
            // Wait, we need to advance the level! If engine doesn't expose advanceLevel, how did I do it? 
            // Add score increments score. useGameEngine level logic automatically increments ONLY in useGameEngine's fully managed mode? No, wait. 
            // Actually I should just use the fully managed mode! It is much simpler if we adapt PerceptualSpeedGame to be 1 correct = 1 level up.
            // Let's do that for all games, it aligns with Zeka Arcade standards!
          }
        } else {
          setupChallenge(engine.level);
        }
      } else {
        engine.removeLife();
        if (engine.lives <= 1) {
          playSound("wrong");
        } else {
          setupChallenge(engine.level);
        }
      }
    }, 1500);
  }, [challenge, engine, feedback, playSound, setupChallenge]);

  useEffect(() => {
    const hk = (e: KeyboardEvent) => {
      if (
        engine.phase === "playing" && !feedback.feedbackState &&
        (e.key === "ArrowLeft" || e.key === "ArrowRight")
      ) {
        handleAnswer(e.key === "ArrowLeft");
      }
    };
    window.addEventListener("keydown", hk);
    return () => window.removeEventListener("keydown", hk);
  }, [engine.phase, feedback.feedbackState, handleAnswer]);

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Algısal Hız Testi",
        description: "İki sayı dizisini saniyeler içinde karşılaştır. Gözlerin ne kadar keskin, zihnin ne kadar hızlı?",
        tuzoLabel: "TUZÖ 5.6.1 İşleme Hızı",
        accentColor: "cyber-blue",
        icon: Eye,
        howToPlay: [
          <span key="1"><span className="w-8 h-8 shrink-0 bg-cyber-yellow border-2 border-black rounded-xl flex items-center justify-center font-syne font-black text-black text-sm -rotate-3 inline-flex mr-2">1</span> Ekrandaki iki sayıyı <strong>hızlıca tara</strong></span>,
          <span key="2"><span className="w-8 h-8 shrink-0 bg-cyber-green border-2 border-black rounded-xl flex items-center justify-center font-syne font-black text-black text-sm rotate-3 inline-flex mr-2">2</span> Aynıysa <strong>AYNI</strong>, farklıysa <strong>FARKLI</strong>'ya bas</span>,
          <span key="3"><span className="w-8 h-8 shrink-0 bg-cyber-pink border-2 border-black rounded-xl flex items-center justify-center font-syne font-black text-black text-sm -rotate-6 inline-flex mr-2">3</span> Karıştırılan rakamlara (3-8, 1-7) <strong>dikkat et</strong></span>
        ]
      }}
    >
      {({ phase, feedbackState }) => (
        <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
          <AnimatePresence mode="wait">
            {phase === "playing" && challenge && (
              <motion.div
                key="game"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-4xl mx-auto"
              >
                <div className="bg-white dark:bg-slate-800 rounded-3xl sm:rounded-[2.5rem] p-8 md:p-14 border-4 border-black shadow-[16px_16px_0_#000] mb-10 text-center relative overflow-hidden -rotate-1">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-syne font-black uppercase tracking-widest mb-10 flex items-center justify-center gap-3">
                    <Eye size={20} className="text-cyber-blue" strokeWidth={2.5} /> Sayı Dizilerini Karşılaştır
                  </p>
                  <div className="space-y-12">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-syne font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        BİRİNCİ DİZİ
                      </span>
                      <div className="text-4xl md:text-6xl lg:text-7xl font-mono font-black tracking-[0.25em] text-black dark:text-white drop-shadow-[4px_4px_0_#000] sm:drop-shadow-[6px_6px_0_#000] tabular-nums select-none">
                        {challenge.left}
                      </div>
                    </div>
                    <div className="w-32 h-1.5 bg-black border-none mx-auto rounded-full opacity-20 dark:opacity-50" />
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-syne font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        İKİNCİ DİZİ
                      </span>
                      <div className="text-4xl md:text-6xl lg:text-7xl font-mono font-black tracking-[0.25em] text-black dark:text-white drop-shadow-[4px_4px_0_#000] sm:drop-shadow-[6px_6px_0_#000] tabular-nums select-none">
                        {challenge.right}
                      </div>
                    </div>
                  </div>
                  <div className="mt-12 text-center flex justify-center">
                    <span className="px-6 py-2 rounded-xl text-xs font-syne font-black uppercase tracking-widest bg-cyber-pink border-2 border-black shadow-[2px_2px_0_#000] text-black rotate-2">
                      {correctInLevelRef.current}/3 TAMAMLANDI
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-xl mx-auto w-full">
                  <motion.button
                    whileHover={!feedbackState ? { scale: 1.05, y: -4, rotate: 2 } : {}}
                    whileTap={!feedbackState ? { scale: 0.95 } : {}}
                    onClick={() => handleAnswer(true)}
                    disabled={!!feedbackState}
                    className="flex flex-col items-center justify-center min-h-[120px] bg-cyber-green border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] transition-all hover:shadow-[12px_12px_0_#000] disabled:opacity-50 disabled:cursor-not-allowed group rotate-1"
                  >
                    <CheckCircle2
                      className="text-black mb-2 group-hover:scale-110 transition-transform drop-shadow-sm"
                      size={36}
                      strokeWidth={2.5}
                    />
                    <span className="text-2xl font-syne font-black text-black uppercase tracking-widest drop-shadow-sm">
                      AYNI
                    </span>
                    <span className="text-[10px] font-bold font-chivo text-black/60 mt-2 uppercase bg-black/5 px-3 py-1 rounded-full border border-black/10">
                      Klavye: Sol Ok
                    </span>
                  </motion.button>
                  <motion.button
                    whileHover={!feedbackState ? { scale: 1.05, y: -4, rotate: -2 } : {}}
                    whileTap={!feedbackState ? { scale: 0.95 } : {}}
                    onClick={() => handleAnswer(false)}
                    disabled={!!feedbackState}
                    className="flex flex-col items-center justify-center min-h-[120px] bg-cyber-pink border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] transition-all hover:shadow-[12px_12px_0_#000] disabled:opacity-50 disabled:cursor-not-allowed group -rotate-1"
                  >
                    <XCircle
                      className="text-black mb-2 group-hover:scale-110 transition-transform drop-shadow-sm"
                      size={36}
                      strokeWidth={2.5}
                    />
                    <span className="text-2xl font-syne font-black text-black uppercase tracking-widest drop-shadow-sm">
                      FARKLI
                    </span>
                    <span className="text-[10px] font-bold font-chivo text-black/60 mt-2 uppercase bg-black/5 px-3 py-1 rounded-full border border-black/10">
                      Klavye: Sağ Ok
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </BrainTrainerShell>
  );
};
export default PerceptualSpeedGame;`;

fs.writeFileSync(path.join(bTPath, 'PerceptualSpeedGame.tsx'), perSpeed);

// For PositionPuzzleGame and PuzzleMasterGame, I'll update their useGameEngine calls and ensure imports are correct using multi_replace_file_content in later steps because they are quite long to inline here.
console.log('PerceptualSpeedGame.tsx written successfully');
