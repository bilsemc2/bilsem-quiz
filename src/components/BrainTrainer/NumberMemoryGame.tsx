import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Headphones, Volume2 } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { GAME_COLORS } from './shared/gameColors';
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const GAME_ID = "sayisal-hafiza";
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
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;



  const [localPhase, setLocalPhase] = useState<LocalPhase>("listening");
  const [numberSequence, setNumberSequence] = useState<number[]>([]);
  const [currentPlayIndex, setCurrentPlayIndex] = useState(-1);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sequenceRunningRef = useRef(false);
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const playSequence = useCallback(async (seq: number[], currentLevel: number) => {
    sequenceRunningRef.current = true;
    setLocalPhase("listening");
    for (let i = 0; i < seq.length; i++) {
      if (!sequenceRunningRef.current) return;
      await new Promise<void>((r) => safeTimeout(() => r(), 600));
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
      await new Promise<void>((r) => safeTimeout(() => r(), 400));
    }

    if (!sequenceRunningRef.current) return;
    setCurrentPlayIndex(-1);
    await new Promise<void>((r) => safeTimeout(() => r(), 500));
    if (!sequenceRunningRef.current) return;

    const type = currentLevel <= 3 ? ("number" as const) : pick(["number", "order", "sum", "max"] as const);

    let qText = "";
    let qAns: number = 0;
    let qOpts: number[] = [];

    if (type === "number") {
      qText = "Duyduğun rakamlardan hangisi dizide vardı?";
      qAns = seq[Math.floor(Math.random() * seq.length)];
      const inSequence = new Set(seq);
      const notInSequence = Array.from({ length: 10 }, (_, n) => n).filter((n) => !inSequence.has(n));
      qOpts = [qAns];

      while (qOpts.length < 4 && notInSequence.length > 0) {
        const idx = Math.floor(Math.random() * notInSequence.length);
        const candidate = notInSequence.splice(idx, 1)[0];
        qOpts.push(candidate);
      }

      // Güvenlik: teoride gerekmez (seq uzunluğu en fazla 7), ama her zaman 4 şık tamamlanır.
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
      let idx1 = Math.floor(Math.random() * seq.length);
      let idx2 = Math.floor(Math.random() * seq.length);
      while (idx1 === idx2) {
        idx2 = Math.floor(Math.random() * seq.length);
      }
      // Ensure smaller index comes first for readability
      if (idx1 > idx2) {
        [idx1, idx2] = [idx2, idx1];
      }
      qText = `Duyduğun ${idx1 + 1}. ve ${idx2 + 1}. sıradaki rakamların toplamı kaçtır?`;
      qAns = seq[idx1] + seq[idx2];
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
  }, [safeTimeout]);

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
    safeTimeout(() => {
      playSequence(seq, lvl);
    }, 100);
  }, [playSequence, playSound, safeTimeout]);

  const prevPhaseRef = useRef<string>("");
  useEffect(() => {
    if (engine.phase === "playing" && prevPhaseRef.current !== "playing") {
      startLevel(engine.level);
    } else if (engine.phase === "welcome") {
      sequenceRunningRef.current = false;
      if (audioRef.current) audioRef.current.pause();
      setNumberSequence([]);
      setCurrentPlayIndex(-1);
      setQuestion(null);
      setSelectedAnswer(null);
    }
    prevPhaseRef.current = engine.phase;
  }, [engine.phase, engine.level, startLevel]);

  // Clean up audio and timeouts on unmount
  useEffect(() => {
    return () => {
      sequenceRunningRef.current = false;
      if (audioRef.current) audioRef.current.pause();
      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
    };
  }, []);

  const handleAnswer = useCallback((val: number) => {
    if (localPhase !== "question" || engine.phase !== "playing" || !!feedbackState) return;

    setSelectedAnswer(val);
    const correct = val === question?.answer;

    if (correct) {
      playSound("correct");
      showFeedback(true);

      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = safeTimeout(() => {
        answerTimeoutRef.current = null;
        dismissFeedback();
        engine.addScore(30 + engine.level * 5);
        if (engine.level >= 20) {
          engine.setGamePhase("victory");
          playSound("success");
        } else {
          engine.nextLevel();
          startLevel(engine.level + 1);
        }
      }, 1500);
    } else {
      playSound("incorrect");
      showFeedback(false);

      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = safeTimeout(() => {
        answerTimeoutRef.current = null;
        dismissFeedback();
        engine.loseLife();
        if (engine.lives > 1) {
          startLevel(engine.level);
        }
      }, 1500);
    }
  }, [localPhase, engine, feedbackState, question, playSound, showFeedback, safeTimeout, dismissFeedback, startLevel]);

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
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1 w-full">
          {engine.phase === "playing" && localPhase === "listening" && (
            <motion.div
              key={`level-${engine.level}-listening`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6 w-full max-w-sm"
            >
              <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-6 sm:p-8 w-full flex flex-col items-center gap-4 shadow-neo-sm">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-24 h-24 bg-cyber-purple border-2 border-black/10 shadow-neo-sm rounded-full flex items-center justify-center"
                >
                  <Volume2 size={44} className="text-white" strokeWidth={3} />
                </motion.div>

                <h2 className="text-2xl sm:text-3xl font-black font-nunito text-black dark:text-white uppercase text-center mt-2 tracking-tight">
                  DİKKATLE DİNLE!
                </h2>

                <div className="flex gap-3 mt-3">
                  {numberSequence.map((_, i) => (
                    <motion.div
                      key={i}
                      animate={
                        i === currentPlayIndex
                          ? { scale: 1.4, backgroundColor: GAME_COLORS.blue }
                          : {}
                      }
                      className={`w-5 h-5 rounded-full border-2 border-black/10 transition-colors ${i < currentPlayIndex ? "bg-cyber-purple" : "bg-slate-200 dark:bg-slate-700"} shadow-neo-sm`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {engine.phase === "playing" && localPhase === "question" && question && (
            <motion.div
              key={`level-${engine.level}-question`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md flex flex-col items-center gap-4"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border-2 border-black/10 shadow-neo-sm text-center w-full">
                <span className="text-xs font-nunito font-black uppercase text-white bg-cyber-blue px-3 py-1.5 rounded-full border-2 border-black/10 tracking-widest shadow-neo-sm inline-block mb-4">
                  SORU
                </span>
                <h3 className="text-xl sm:text-2xl font-nunito font-black text-black dark:text-white leading-relaxed">
                  {question.text}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
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
                      whileTap={!selectedAnswer ? { scale: 0.95 } : {}}
                      onClick={() => handleAnswer(opt)}
                      disabled={selectedAnswer !== null}
                      className={`py-4 rounded-xl font-nunito font-black text-3xl sm:text-4xl transition-colors shadow-neo-sm border-2 border-black/10 active:translate-y-1 active:shadow-none ${btnClass}`}
                    >
                      {opt}
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

export default NumberMemoryGame;
