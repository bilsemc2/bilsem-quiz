import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import GameNumpad from "./shared/GameNumpad";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const GAME_ID = "akiskan-toplam";
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

const StreamSumGame: React.FC = () => {
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
    initialLives: INITIAL_LIVES,
  });

  const feedback = useGameFeedback({ duration: 800 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [current, setCurrent] = useState<number | null>(null);
  const [previous, setPrevious] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [streak, setStreak] = useState(0);
  const [waitingForInput, setWaitingForInput] = useState(false);

  const prevPhaseRef = useRef(engine.phase);
  const deadlineRef = useRef<NodeJS.Timeout | null>(null);

  // Answer time: decreases with level (6s → 3s)
  const answerTime = useMemo(() => Math.max(3000, 6000 - engine.level * 150), [engine.level]);

  const generateNumber = useCallback(() => Math.floor(Math.random() * 9) + 1, []);

  const clearDeadline = useCallback(() => {
    if (deadlineRef.current) {
      clearTimeout(deadlineRef.current);
      deadlineRef.current = null;
    }
  }, []);

  // Start a fresh round: show new memorize number, then after pause show second number
  const startNewRound = useCallback(() => {
    clearDeadline();
    setWaitingForInput(false);
    setInput("");

    // Show first number to memorize
    const firstNum = generateNumber();
    setPrevious(null);
    setCurrent(firstNum);

    // After pause, show second number and enable input
    safeTimeout(() => {
      const secondNum = generateNumber();
      setPrevious(firstNum);
      setCurrent(secondNum);
      setInput("");
      setWaitingForInput(true);
      playSound("pop");
    }, 1500);
  }, [generateNumber, playSound, safeTimeout, clearDeadline]);

  // ═══ Phase transitions ═══
  useEffect(() => {
    const prevPhase = prevPhaseRef.current;

    if (
      engine.phase === "playing" &&
      (prevPhase === "welcome" || prevPhase === "game_over" || prevPhase === "victory")
    ) {
      setStreak(0);
      startNewRound();
    } else if (engine.phase === "welcome" || engine.phase === "game_over" || engine.phase === "victory") {
      clearDeadline();
      setCurrent(null);
      setPrevious(null);
      setInput("");
      setStreak(0);
      setWaitingForInput(false);
    }

    prevPhaseRef.current = engine.phase;
  }, [engine.phase, clearDeadline, generateNumber, playSound, safeTimeout]);

  // ═══ Auto-timeout: start deadline when waiting for input ═══
  useEffect(() => {
    if (!waitingForInput || engine.phase !== "playing" || feedbackState) {
      clearDeadline();
      return;
    }

    deadlineRef.current = setTimeout(() => {
      // Time's up — wrong answer
      showFeedback(false);
      playSound("wrong");
      setStreak(0);
      const willGameOver = engine.lives <= 1;
      engine.loseLife();
      setWaitingForInput(false);

      safeTimeout(() => {
        dismissFeedback();
        if (willGameOver) return;
        startNewRound();
      }, 800);
    }, answerTime);

    return () => clearDeadline();
  }, [waitingForInput, engine.phase, feedbackState, answerTime, clearDeadline, showFeedback, playSound, engine, safeTimeout, dismissFeedback, startNewRound]);

  // ═══ Handle digit input ═══
  const handleInput = (digit: string) => {
    if (engine.phase !== "playing" || feedbackState || !waitingForInput || previous === null || current === null) return;

    const expected = previous + current;
    const nextInput = input + digit;
    setInput(nextInput);

    if (Number(nextInput) === expected) {
      // Correct!
      clearDeadline();
      setWaitingForInput(false);
      showFeedback(true);
      playSound("correct");
      engine.addScore(engine.level * 50 + streak * 10);
      const newStreak = streak + 1;
      setStreak(newStreak);

      if (newStreak % 5 === 0 && engine.level < MAX_LEVEL) {
        engine.nextLevel();
      }

      safeTimeout(() => {
        dismissFeedback();
        if (engine.level >= MAX_LEVEL && newStreak >= 100) {
          engine.setGamePhase("victory");
          return;
        }
        startNewRound();
      }, 600);
      return;
    }

    if (nextInput.length >= expected.toString().length) {
      // Wrong — all digits entered but doesn't match
      clearDeadline();
      setWaitingForInput(false);
      showFeedback(false);
      playSound("wrong");
      setStreak(0);
      const willGameOver = engine.lives <= 1;
      engine.loseLife();

      safeTimeout(() => {
        dismissFeedback();
        if (willGameOver) return;
        startNewRound();
      }, 800);
    } else {
      playSound("click");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => clearDeadline();
  }, [clearDeadline]);

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Akışkan Toplam",
        icon: Plus,
        description: "Sayılar akarken her sayıyı bir öncekiyle topla! İşlemsel hızını ve dikkati birleştirerek rekor kır.",
        howToPlay: [
          "Ekrana gelen sayıyı aklında tut.",
          "Yeni sayı gelince, onu bir öncekiyle topla.",
          "Toplamı ekran klavyesinden hızlıca gir.",
        ],
        tuzoCode: "5.3.1 Zihinden İşlem Hızı",
        accentColor: "cyber-blue",
        maxLevel: MAX_LEVEL,
        wideLayout: true,
      }}
    >
      {() => (
        <div className="w-full h-full flex flex-col items-center justify-center p-2">
          {engine.phase === "playing" && current !== null && (
            <motion.div
              key="play-area"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md relative"
            >
              {/* Visualizer Area */}
              <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-4 shadow-neo-sm mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-100 to-transparent dark:from-slate-700/50 opacity-50" />

                <div className="relative flex flex-col items-center justify-center min-h-[120px]">
                  {previous !== null ? (
                    <div className="flex items-center justify-center gap-3 sm:gap-4 w-full relative z-10">
                      {/* Hidden memorize number — player must recall */}
                      <motion.div
                        key={`prev-hidden`}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="w-16 h-20 sm:w-20 sm:h-24 bg-slate-200 dark:bg-slate-700 border-2 border-black/10 rounded-xl flex items-center justify-center"
                      >
                        <span className="text-3xl sm:text-4xl font-nunito font-black text-slate-400 dark:text-slate-500">?</span>
                      </motion.div>

                      <Plus size={24} className="text-black dark:text-white" strokeWidth={3} />

                      <motion.div
                        key={`curr-${current}`}
                        initial={{ scale: 0.5, opacity: 0, x: 20 }}
                        animate={{ scale: 1, opacity: 1, x: 0 }}
                        className="w-20 h-24 sm:w-24 sm:h-28 bg-cyber-pink border-2 border-black/10 shadow-neo-sm rounded-xl flex items-center justify-center z-20"
                      >
                        <span className="text-5xl sm:text-6xl font-nunito font-black text-black">{current}</span>
                      </motion.div>
                    </div>
                  ) : (
                    <motion.div
                      key={`init-${current}`}
                      initial={{ scale: 0.5, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      className="w-24 h-28 bg-cyber-blue border-2 border-black/10 shadow-neo-sm rounded-xl flex items-center justify-center"
                    >
                      <span className="text-6xl font-nunito font-black text-white">{current}</span>
                    </motion.div>
                  )}
                </div>

                {previous === null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-3 left-0 right-0 text-center"
                  >
                    <span className="bg-white dark:bg-slate-700 border-2 border-black/10 px-2 py-0.5 rounded-full text-[10px] font-nunito font-bold text-slate-500 shadow-sm uppercase tracking-wider">Aklında Tut</span>
                  </motion.div>
                )}
              </div>

              {/* Input Feedback Area */}
              {previous !== null && (
                <div className={`h-16 sm:h-20 mb-4 border-2 rounded-xl flex items-center justify-center transition-colors relative overflow-hidden shadow-neo-sm ${feedbackState
                  ? feedbackState.correct
                    ? 'bg-cyber-green/15 border-cyber-green ring-2 ring-cyber-green'
                    : 'bg-cyber-pink/15 border-cyber-pink ring-2 ring-cyber-pink'
                  : 'bg-white dark:bg-slate-800 border-black/10'
                  }`}>
                  {feedbackState ? (
                    <span className={`text-3xl sm:text-4xl font-nunito font-black uppercase tracking-widest ${feedbackState.correct ? 'text-cyber-green' : 'text-cyber-pink'}`}>
                      {feedbackState.correct ? 'Harika!' : `${previous + current}`}
                    </span>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      {input ? (
                        <span className="text-4xl sm:text-5xl font-nunito font-black text-black dark:text-white tracking-widest">{input}</span>
                      ) : (
                        <span className="text-3xl font-nunito font-black text-slate-300 dark:text-slate-600 animate-pulse">?</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Number Pad */}
              <GameNumpad
                value={input}
                onDigit={handleInput}
                onDelete={() => setInput(prev => prev.slice(0, -1))}
                disabled={!!feedbackState || !waitingForInput}
                hideDisplay
                maxLength={3}
              />
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default StreamSumGame;
