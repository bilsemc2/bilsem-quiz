import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Eye } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
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

const DigitSequence: React.FC<{ value: string }> = ({ value }) => (
  <div className="w-full max-w-3xl px-1 sm:px-2">
    <div
      className="grid items-center justify-items-center gap-1 sm:gap-2"
      style={{ gridTemplateColumns: `repeat(${value.length}, minmax(0, 1fr))` }}
    >
      {value.split("").map((digit, idx) => (
        <span
          key={`${value}-${idx}`}
          className="font-mono font-bold text-[clamp(1.6rem,6.8vw,3.8rem)] md:text-[clamp(2rem,5.4vw,5rem)] leading-none text-black dark:text-white drop-shadow-neo-sm sm:drop-shadow-neo-sm tabular-nums select-none"
        >
          {digit}
        </span>
      ))}
    </div>
  </div>
);

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
  const safeTimeout = useSafeTimeout();

  const engine = useGameEngine({
    gameId: GAME_ID,
    timeLimit: TIME_LIMIT,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
  });

  const feedback = useGameFeedback({ duration: 800 });
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const challengeStartRef = useRef(0);
  const [correctInLevel, setCorrectInLevel] = useState(0);
  const prevPhaseRef = useRef(engine.phase);

  const setupChallenge = useCallback((lvl: number) => {
    const len = Math.min(BASE_DIGIT_LENGTH + Math.floor((lvl - 1) / 4), 9);
    setChallenge(createChallenge(len));
    challengeStartRef.current = performance.now();
  }, []);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;

    if (
      engine.phase === "playing" &&
      (prevPhase === "welcome" || prevPhase === "game_over" || prevPhase === "victory")
    ) {
      setCorrectInLevel(0);
      setupChallenge(engine.level);
    } else if (engine.phase === "welcome" || engine.phase === "game_over" || engine.phase === "victory") {
      setChallenge(null);
      setCorrectInLevel(0);
    }

    prevPhaseRef.current = engine.phase;
  }, [engine.phase, engine.level, setupChallenge]);

  const handleAnswer = useCallback((val: boolean) => {
    if (!challenge || engine.phase !== "playing" || feedback.feedbackState) return;

    const correct = val === challenge.isSame;
    feedback.showFeedback(correct);
    playSound(correct ? "correct" : "wrong");

    safeTimeout(() => {
      feedback.dismissFeedback();
      if (correct) {
        engine.addScore(10 * engine.level);
        const newCorrect = correctInLevel + 1;
        setCorrectInLevel(newCorrect);
        if (newCorrect >= 3) {
          setCorrectInLevel(0);
          if (engine.level >= MAX_LEVEL) {
            engine.setGamePhase("victory");
            playSound("success");
          } else {
            engine.nextLevel();
            setupChallenge(engine.level + 1);
          }
        } else {
          setupChallenge(engine.level);
        }
      } else {
        const willGameOver = engine.lives <= 1;
        engine.loseLife();
        if (willGameOver) {
          playSound("wrong");
        } else {
          setupChallenge(engine.level);
        }
      }
    }, 800);
  }, [challenge, engine, feedback, playSound, setupChallenge, correctInLevel]);

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
        tuzoCode: "TUZÖ 5.6.1 İşleme Hızı",
        accentColor: "cyber-blue",
        icon: Eye,
        howToPlay: [
          <span key="1"><span className="w-8 h-8 shrink-0 bg-cyber-yellow border-2 border-black/10 rounded-xl flex items-center justify-center font-nunito font-black text-black text-sm -rotate-3 inline-flex mr-2">1</span> Ekrandaki iki sayıyı <strong>hızlıca tara</strong></span>,
          <span key="2"><span className="w-8 h-8 shrink-0 bg-cyber-green border-2 border-black/10 rounded-xl flex items-center justify-center font-nunito font-black text-black text-sm rotate-3 inline-flex mr-2">2</span> Aynıysa <strong>AYNI</strong>, farklıysa <strong>FARKLI</strong>'ya bas</span>,
          <span key="3"><span className="w-8 h-8 shrink-0 bg-cyber-pink border-2 border-black/10 rounded-xl flex items-center justify-center font-nunito font-black text-black text-sm -rotate-6 inline-flex mr-2">3</span> Karıştırılan rakamlara (3-8, 1-7) <strong>dikkat et</strong></span>
        ]
      }}
    >
      {({ phase, feedbackState }) => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1">
          {phase === "playing" && challenge && (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-3xl mx-auto"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-6 border-2 border-black/10 shadow-neo-sm mb-4 text-center relative overflow-hidden">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-nunito font-black uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                  <Eye size={16} className="text-cyber-blue" strokeWidth={2.5} /> Sayı Dizilerini Karşılaştır
                </p>
                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-nunito font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      BİRİNCİ DİZİ
                    </span>
                    <DigitSequence value={challenge.left} />
                  </div>
                  <div className="w-24 h-1 bg-black border-none mx-auto rounded-full opacity-20 dark:opacity-50" />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-nunito font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      İKİNCİ DİZİ
                    </span>
                    <DigitSequence value={challenge.right} />
                  </div>
                </div>
                <div className="mt-4 text-center flex justify-center">
                  <span className="px-4 py-1.5 rounded-lg text-[10px] font-nunito font-black uppercase tracking-widest bg-cyber-pink border-2 border-black/10 shadow-neo-sm text-black">
                    {correctInLevel}/3 TAMAMLANDI
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto w-full">
                <motion.button
                  whileTap={!feedbackState ? { scale: 0.95 } : {}}
                  onClick={() => handleAnswer(true)}
                  disabled={!!feedbackState}
                  className="flex flex-col items-center justify-center min-h-[90px] bg-cyber-green border-2 border-black/10 rounded-xl shadow-neo-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-1 active:shadow-none"
                >
                  <CheckCircle2 className="text-black mb-1" size={28} strokeWidth={2.5} />
                  <span className="text-xl font-nunito font-black text-black uppercase tracking-widest">
                    AYNI
                  </span>
                  <span className="text-[9px] font-bold font-nunito text-black/60 mt-1 uppercase bg-black/5 px-2 py-0.5 rounded-full border border-black/10">
                    Klavye: Sol Ok
                  </span>
                </motion.button>
                <motion.button
                  whileTap={!feedbackState ? { scale: 0.95 } : {}}
                  onClick={() => handleAnswer(false)}
                  disabled={!!feedbackState}
                  className="flex flex-col items-center justify-center min-h-[90px] bg-cyber-pink border-2 border-black/10 rounded-xl shadow-neo-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-1 active:shadow-none"
                >
                  <XCircle className="text-black mb-1" size={28} strokeWidth={2.5} />
                  <span className="text-xl font-nunito font-black text-black uppercase tracking-widest">
                    FARKLI
                  </span>
                  <span className="text-[9px] font-bold font-nunito text-black/60 mt-1 uppercase bg-black/5 px-2 py-0.5 rounded-full border border-black/10">
                    Klavye: Sağ Ok
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};
export default PerceptualSpeedGame;
