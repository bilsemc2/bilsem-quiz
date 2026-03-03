import re

content = """import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, Sparkles, Volume2 } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "sayi-hafiza";
const GAME_TITLE = "Sayı Hafızası";
const GAME_DESCRIPTION = "Sesli olarak okunan rakamları dikkatle dinle, zihninde tut ve soruları yanıtlayarak hafızanı test et!";
const TUZO_TEXT = "TUZÖ 5.4.1 İşitsel Sayı Dizisi";

const NUMBER_SOUNDS: Record<number, string> = {
  0: "/mp3/rakamlar/0-sifir.mp3",
  1: "/mp3/rakamlar/1-bir.mp3",
  2: "/mp3/rakamlar/2-iki.mp3",
  3: "/mp3/rakamlar/3-uc.mp3",
  4: "/mp3/rakamlar/4-dort.mp3",
  5: "/mp3/rakamlar/5-bes.mp3",
  6: "/mp3/rakamlar/6-alti.mp3",
  7: "/mp3/rakamlar/7-yedi.mp3",
  8: "/mp3/rakamlar/8-sekiz.mp3",
  9: "/mp3/rakamlar/9-dokuz.mp3",
};

interface Question {
  text: string;
  answer: number;
  options: number[];
  type: "number" | "order" | "sum" | "max";
}

type LocalPhase = "listening" | "question";

const NumberMemoryGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const { phase, level, addScore, loseLife, nextLevel } = engine;

  const [localPhase, setLocalPhase] = useState<LocalPhase>("listening");
  const [numberSequence, setNumberSequence] = useState<number[]>([]);
  const [currentPlayIndex, setCurrentPlayIndex] = useState(-1);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sequenceRunningRef = useRef(false);

  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const playSequence = useCallback(async (seq: number[], currentLevel: number) => {
    sequenceRunningRef.current = true;
    setLocalPhase("listening");
    for (let i = 0; i < seq.length; i++) {
      if (!sequenceRunningRef.current) return;
      await new Promise((r) => setTimeout(r, 600));
      if (!sequenceRunningRef.current) return;
      setCurrentPlayIndex(i);
      
      await new Promise((resolve) => {
        if (!sequenceRunningRef.current) return resolve(null);
        if (audioRef.current) audioRef.current.pause();
        const a = new Audio(NUMBER_SOUNDS[seq[i]]);
        audioRef.current = a;
        a.onended = () => resolve(null);
        a.onerror = () => resolve(null);
        a.play().catch(() => resolve(null));
      });
      await new Promise((r) => setTimeout(r, 400));
    }
    
    if (!sequenceRunningRef.current) return;
    setCurrentPlayIndex(-1);
    await new Promise((r) => setTimeout(r, 500));
    if (!sequenceRunningRef.current) return;

    const type = currentLevel <= 3 ? ("number" as const) : pick(["number", "order", "sum", "max"] as const);

    let qText = "";
    let qAns: number = 0;
    let qOpts: number[] = [];

    if (type === "number") {
      qText = "Duyduğun rakamlardan hangisi dizide vardı?";
      qAns = seq[Math.floor(Math.random() * seq.length)];
      qOpts = [qAns];
      while (qOpts.length < 4) {
        const r = Math.floor(Math.random() * 10);
        if (!qOpts.includes(r)) qOpts.push(r);
      }
    } else if (type === "order") {
      const idx = Math.floor(Math.random() * seq.length);
      qText = `${idx + 1}. sırada hangi rakamı duydun?`;
      qAns = seq[idx];
      qOpts = [qAns];
      while (qOpts.length < 4) {
        const r = Math.floor(Math.random() * 10);
        if (!qOpts.includes(r)) qOpts.push(r);
      }
    } else if (type === "sum") {
      qText = "Duyduğun ilk ve son rakamın toplamı kaçtır?";
      qAns = seq[0] + seq[seq.length - 1];
      qOpts = [qAns];
      while (qOpts.length < 4) {
        const r = Math.floor(Math.random() * 20);
        if (!qOpts.includes(r)) qOpts.push(r);
      }
    } else if (type === "max") {
      qText = "Duyduğunuz en büyük rakam hangisiydi?";
      qAns = Math.max(...seq);
      qOpts = [qAns];
      while (qOpts.length < 4) {
        const r = Math.floor(Math.random() * 10);
        if (!qOpts.includes(r)) qOpts.push(r);
      }
    }

    setQuestion({
      text: qText,
      answer: qAns,
      options: qOpts.sort(() => Math.random() - 0.5),
      type,
    });

    setLocalPhase("question");
  }, []);

  const startLevel = useCallback((lvl: number) => {
    sequenceRunningRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const len = Math.min(3 + Math.floor(lvl / 4), 7);
    const seq = Array.from({ length: len }, () => Math.floor(Math.random() * 10));
    setNumberSequence(seq);
    setSelectedAnswer(null);
    playSound("slide");
    
    // Slight delay to ensure phase changes propagate before playing audio
    setTimeout(() => {
        playSequence(seq, lvl);
    }, 100);
  }, [playSequence, playSound]);

  useEffect(() => {
    if (phase === "playing" && numberSequence.length === 0) {
      startLevel(level);
    } else if (phase === "welcome") {
      sequenceRunningRef.current = false;
      if (audioRef.current) audioRef.current.pause();
      setNumberSequence([]);
      setCurrentPlayIndex(-1);
      setQuestion(null);
      setSelectedAnswer(null);
    }
  }, [phase, level, numberSequence.length, startLevel]);

  // Clean up audio on unmount or phase change
  useEffect(() => {
    return () => {
      sequenceRunningRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleAnswer = (val: number) => {
    if (localPhase !== "question" || phase !== "playing" || !!feedbackState) return;

    setSelectedAnswer(val);
    const correct = val === question?.answer;

    if (correct) {
      playSound("correct");
      showFeedback(true);

      setTimeout(() => {
        dismissFeedback();
        addScore(30 + level * 5);
        nextLevel();
        startLevel(level + 1);
      }, 1500);
    } else {
      playSound("wrong");
      showFeedback(false);

      setTimeout(() => {
        dismissFeedback();
        loseLife();
        if (engine.lives > 1) {
          startLevel(level); // restart same level if still alive
        }
      }, 1500);
    }
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Headphones,
    accentColor: "cyber-blue",
    maxLevel: 20,
    howToPlay: [
      "Rakamların sesli okunuşunu pür dikkat dinle",
      "Dinleme bittikten sonra sorulan mantıksal soruyu yanıtla",
      "Dizideki rakamları, sıralarını ve büyüklüklerini aklında tutmaya çalış"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-160px)] flex-1 w-full">
          <AnimatePresence mode="wait">
            {phase === "playing" && localPhase === "listening" && (
              <motion.div
                key={`level-${level}-listening`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center gap-8 w-full max-w-xl"
              >
                <div className="bg-white dark:bg-slate-800 border-4 border-black rounded-[3rem] p-10 w-full flex flex-col items-center gap-6 shadow-[16px_16px_0_#000] rotate-1">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-32 h-32 bg-cyber-purple border-8 border-black shadow-[8px_8px_0_#000] rounded-full flex items-center justify-center -rotate-2"
                  >
                    <Volume2 size={56} className="text-white drop-shadow-sm" strokeWidth={3} />
                  </motion.div>

                  <h2 className="text-3xl sm:text-4xl font-black font-syne text-black dark:text-white uppercase text-center mt-4 tracking-tight">
                    DİKKATLE DİNLE!
                  </h2>

                  <div className="flex gap-4 mt-6">
                    {numberSequence.map((_, i) => (
                      <motion.div
                        key={i}
                        animate={
                          i === currentPlayIndex
                            ? { scale: 1.4, backgroundColor: "#3b82f6" }
                            : {}
                        }
                        className={`w-6 h-6 rounded-full border-4 border-black transition-colors ${i < currentPlayIndex ? "bg-cyber-purple" : "bg-slate-200 dark:bg-slate-700"} shadow-[2px_2px_0_#000]`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {phase === "playing" && localPhase === "question" && !feedbackState && question && (
              <motion.div
                key={`level-${level}-question`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl flex flex-col items-center gap-8"
              >
                <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-8 sm:p-10 border-4 border-black shadow-[16px_16px_0_#000] dark:shadow-[16px_16px_0_#0f172a] text-center w-full rotate-1">
                  <span className="text-xs sm:text-sm font-syne font-black uppercase text-white bg-cyber-blue px-4 py-2 rounded-full border-2 border-black tracking-widest shadow-[4px_4px_0_#000] -rotate-2 inline-block mb-6">
                    SORU
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-chivo font-black text-black dark:text-white leading-relaxed">
                    {question.text}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full mt-4">
                  {question.options.map((opt, i) => {
                    const isSelected = selectedAnswer === opt;
                    const isCorrect = isSelected && opt === question.answer;
                    const isWrong = isSelected && opt !== question.answer;

                    let btnClass = "bg-white dark:bg-slate-700 text-black dark:text-white";
                    if (isCorrect) btnClass = "bg-cyber-green text-black";
                    if (isWrong) btnClass = "bg-cyber-pink text-black";
                    else if (selectedAnswer !== null && opt === question.answer) btnClass = "bg-cyber-green text-black";

                    return (
                      <motion.button
                        key={i}
                        whileHover={!selectedAnswer ? { scale: 1.05, y: -4, rotate: (Math.random() - 0.5) * 4 } : {}}
                        whileTap={!selectedAnswer ? { scale: 0.95 } : {}}
                        onClick={() => handleAnswer(opt)}
                        disabled={selectedAnswer !== null}
                        className={`py-8 rounded-[2.5rem] font-syne font-black text-4xl sm:text-5xl transition-colors shadow-[8px_8px_0_#000] border-4 border-black hover:shadow-[12px_12px_0_#000] ${btnClass}`}
                      >
                        {opt}
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

export default NumberMemoryGame;
"""

with open("/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/BrainTrainer/NumberMemoryGame.tsx", "w") as f:
    f.write(content)
