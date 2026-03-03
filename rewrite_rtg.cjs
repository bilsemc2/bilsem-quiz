const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/BrainTrainer/ReactionTimeGame.tsx');

const content = `import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Zap,
  Target,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSound } from "../../hooks/useSound";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useGameEngine } from "./shared/useGameEngine";
import { useGameFeedback } from "../../hooks/useGameFeedback";

type GameMode = "simple" | "selective";
type RoundState = "waiting" | "ready" | "go" | "early" | "result";

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = "tepki-suresi";

const COLORS = [
  { name: "Yeşil", value: "green", hex: "#10b981", class: "bg-cyber-green" },
  { name: "Kırmızı", value: "red", hex: "#ef4444", class: "bg-cyber-pink" },
  { name: "Mavi", value: "blue", hex: "#3b82f6", class: "bg-cyber-blue" },
  { name: "Sarı", value: "yellow", hex: "#eab308", class: "bg-cyber-yellow" },
];

const ReactionTimeGame: React.FC = () => {
  const { playSound } = useSound();
  const location = useLocation();

  const engine = useGameEngine({
    gameId: GAME_ID,
    timeLimit: TIME_LIMIT,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
  });

  const feedback = useGameFeedback({ duration: 1000 });

  const [gameMode, setGameMode] = useState<GameMode>("simple");
  const [roundState, setRoundState] = useState<RoundState>("waiting");

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const [targetColor] = useState<string>("green");
  const [currentColor, setCurrentColor] = useState<string>("red");
  const [currentReactionTime, setCurrentReactionTime] = useState<number | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTimeRef = useRef<number>(0);
  const reactionTimesRef = useRef<number[]>([]);

  // Internal restart logic wrapping engine.handleStart
  const startCustomGame = useCallback(
    (mode: GameMode = "simple") => {
      window.scrollTo(0, 0);
      setGameMode(mode);
      setRoundState("waiting");
      setCorrectCount(0);
      setWrongCount(0);
      reactionTimesRef.current = [];
      setStreak(0);
      setBestStreak(0);
      
      engine.handleStart();
    },
    [engine]
  );

  const startRound = useCallback(() => {
    setRoundState("waiting");
    setCurrentReactionTime(null);
    const waitTime = 1500 + Math.random() * 2500;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (engine.phase !== "playing") return;
      setRoundState("ready");
      if (gameMode === "selective") {
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        setCurrentColor(randomColor.value);
      } else {
        setCurrentColor("green");
      }

      timeoutRef.current = setTimeout(
        () => {
          if (engine.phase !== "playing") return;
          setRoundState("go");
          roundStartTimeRef.current = performance.now();
        },
        300 + Math.random() * 500,
      );
    }, waitTime);
  }, [gameMode, engine.phase]);

  // Start round immediately when game starts playing and is waiting
  useEffect(() => {
    if (engine.phase === "playing" && roundState === "waiting" && engine.score === 0 && correctCount === 0 && wrongCount === 0) {
        startRound();
    }
  }, [engine.phase, roundState, engine.score, correctCount, wrongCount, startRound]);

  useEffect(() => {
    if ((location.state?.autoStart || engine.examMode) && engine.phase === "welcome") {
      startCustomGame("simple");
    }
  }, [location.state, engine.phase, startCustomGame, engine.examMode]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (engine.phase !== "playing" || feedback.feedbackState) return;

    if (roundState === "waiting" || roundState === "ready") {
      setRoundState("early");
      playSound("wrong");
      feedback.showFeedback(false);
      setWrongCount((prev) => prev + 1);
      setStreak(0);
      engine.loseLife();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setTimeout(() => {
        feedback.dismissFeedback();
        if (engine.lives > 1) { // Note since loseLife isn't instantaneous in state we use our logic
            if (engine.level < MAX_LEVEL) {
              engine.nextLevel();
              startRound();
            } else {
              engine.setGamePhase("victory");
            }
        } else {
            engine.setGamePhase("game_over");
        }
      }, 1200);
    } else if (roundState === "go") {
      const reactionTime = performance.now() - roundStartTimeRef.current;
      setCurrentReactionTime(Math.round(reactionTime));

      if (gameMode === "selective" && currentColor !== targetColor) {
        setRoundState("result");
        playSound("wrong");
        feedback.showFeedback(false);
        setWrongCount((prev) => prev + 1);
        setStreak(0);
        engine.loseLife();

        setTimeout(() => {
          feedback.dismissFeedback();
          if (engine.lives > 1) {
            if (engine.level < MAX_LEVEL) {
              engine.nextLevel();
              startRound();
            } else {
              engine.setGamePhase("victory");
            }
          } else {
            engine.setGamePhase("game_over");
          }
        }, 1200);
      } else {
        setRoundState("result");
        playSound("correct");
        feedback.showFeedback(true);
        setCorrectCount((prev) => prev + 1);
        setStreak((prev) => {
          const newStreak = prev + 1;
          if (newStreak > bestStreak) setBestStreak(newStreak);
          return newStreak;
        });
        reactionTimesRef.current.push(Math.round(reactionTime));
        const timeScore = Math.max(0, 500 - Math.round(reactionTime));
        engine.addScore(Math.round(timeScore / 2) + 50 + streak * 10);

        setTimeout(() => {
          feedback.dismissFeedback();
          if (engine.level >= MAX_LEVEL) {
            engine.setGamePhase("victory");
          } else {
            engine.nextLevel();
            startRound();
          }
        }, 1200);
      }
    }
  }, [
    engine,
    roundState,
    gameMode,
    currentColor,
    targetColor,
    startRound,
    streak,
    bestStreak,
    playSound,
    feedback,
  ]);

  const handleWait = useCallback(() => {
    if (
      engine.phase !== "playing" ||
      gameMode !== "selective" ||
      roundState !== "go" ||
      feedback.feedbackState
    )
      return;

    if (currentColor !== targetColor) {
      setRoundState("result");
      setCurrentReactionTime(null);
      playSound("correct");
      feedback.showFeedback(true);
      setCorrectCount((prev) => prev + 1);
      setStreak((prev) => {
        const newStreak = prev + 1;
        if (newStreak > bestStreak) setBestStreak(newStreak);
        return newStreak;
      });
      engine.addScore(75 + streak * 5);

      setTimeout(() => {
        feedback.dismissFeedback();
        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
        } else {
          engine.nextLevel();
          startRound();
        }
      }, 1200);
    }
  }, [
    engine,
    gameMode,
    roundState,
    currentColor,
    targetColor,
    startRound,
    streak,
    bestStreak,
    playSound,
    feedback,
  ]);

  useEffect(() => {
    if (gameMode === "selective" && roundState === "go") {
      const waitTime = Math.max(1000, 2000 - engine.level * 50); // Gets slightly faster
      const timeout = setTimeout(() => {
        if (roundState === "go") handleWait();
      }, waitTime);
      return () => clearTimeout(timeout);
    }
  }, [gameMode, roundState, handleWait, engine.level]);

  const averageReaction =
    reactionTimesRef.current.length > 0
      ? Math.round(
          reactionTimesRef.current.reduce((a, b) => a + b, 0) /
            reactionTimesRef.current.length,
        )
      : 0;

  const bestReaction =
    reactionTimesRef.current.length > 0
      ? Math.min(...reactionTimesRef.current)
      : 0;

  const getButtonClass = () => {
    if (roundState === "waiting") return "bg-slate-200 dark:bg-slate-700";
    if (roundState === "ready") return "bg-cyber-yellow";
    if (roundState === "go") {
      const col = COLORS.find((c) => c.value === currentColor);
      return col ? col.class : "bg-cyber-green";
    }
    if (roundState === "early") return "bg-cyber-pink";
    if (roundState === "result") {
      if (currentReactionTime === null) return "bg-cyber-green"; // Wait correctly
      if (gameMode === "selective" && currentColor !== targetColor)
        return "bg-cyber-pink"; // Clicked wrong color
      return "bg-cyber-green"; // Clicked green correctly
    }
    return "bg-slate-200 dark:bg-slate-700";
  };

  const backLink = engine.examMode
    ? "/atolyeler/sinav-simulasyonu/devam"
    : location.state?.arcadeMode
      ? "/bilsem-zeka"
      : "/individual-assessment/attention-memory";
  const backLabel = engine.examMode
    ? "Sınavı Bitir"
    : location.state?.arcadeMode
      ? "Arcade"
      : "Geri Dön";

  const WelcomeScreen = (
    <div className="min-h-[100dvh] bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative">
      <div className="relative z-10 w-full max-w-xl">
        <div className="w-full flex items-center justify-start mb-6 -ml-2">
          <Link
            to={backLink}
            className="flex items-center gap-2 text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 border-4 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none font-syne font-bold"
          >
            <ChevronLeft size={20} className="stroke-[3]" />
            <span>{backLabel}</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[3rem] border-4 border-black shadow-[12px_12px_0_#000] -rotate-1"
        >
          <motion.div
            className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 bg-cyber-yellow border-8 border-black shadow-[8px_8px_0_#000] rounded-[2.5rem] flex items-center justify-center rotate-3"
            animate={{ y: [0, -8, 0], rotate: [3, 8, 3] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Zap size={56} className="text-black fill-black" strokeWidth={2.5} />
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-syne font-black mb-4 uppercase text-black dark:text-white tracking-tight drop-shadow-sm">
            Tepki Süresi
          </h1>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-5 mb-8 border-4 border-black shadow-[8px_8px_0_#000] text-left rotate-1">
            <h3 className="text-xl font-syne font-black text-cyber-blue mb-4 flex items-center gap-2 uppercase">
              <Sparkles size={24} className="stroke-[3]" /> Mod Seçimi
            </h3>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startCustomGame("simple")}
                className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border-4 border-black shadow-[4px_4px_0_#000] flex items-center gap-4 group transition-colors hover:bg-slate-50"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyber-green border-2 border-black group-hover:-rotate-6 transition-transform">
                  <Zap size={24} className="text-black fill-black/50" />
                </div>
                <div className="text-left font-chivo">
                  <h3 className="text-lg font-bold text-black dark:text-white group-hover:text-cyber-green transition-colors">
                    Basit Tepki
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Yeşil görünce hemen tıkla!
                  </p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startCustomGame("selective")}
                className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border-4 border-black shadow-[4px_4px_0_#000] flex items-center gap-4 group transition-colors hover:bg-slate-50"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyber-pink border-2 border-black group-hover:rotate-6 transition-transform">
                  <Target size={24} className="text-black" strokeWidth={2.5} />
                </div>
                <div className="text-left font-chivo">
                  <h3 className="text-lg font-bold text-black dark:text-white group-hover:text-cyber-pink transition-colors">
                    Seçmeli Tepki
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Sadece yeşile tıkla, diğerlerinde bekle!
                  </p>
                </div>
              </motion.button>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyber-yellow border-2 border-black text-black rounded-xl shadow-[4px_4px_0_#000] rotate-2">
            <span className="text-xs font-syne font-black uppercase tracking-widest text-black">
              TUZÖ 8.1.1 Tepki Hızı
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Tepki Süresi",
        description: "",
        howToPlay: [],
        icon: Zap,
        customWelcome: WelcomeScreen,
        extraHudItems: streak > 1 ? (
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-purple border-4 border-black rounded-xl shadow-[4px_4px_0_#000] animate-pulse">
            <Zap className="text-white fill-white/50" size={18} />
            <span className="font-syne font-black text-white">x{streak}</span>
          </div>
        ) : null,
        extraGameOverActions: (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-4">
            <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
              <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-xs sm:text-sm mb-2">
                Ortalama
              </p>
              <p className="text-3xl sm:text-4xl font-black text-cyber-purple drop-shadow-sm">
                {averageReaction}
                <span className="text-sm ml-1">ms</span>
              </p>
            </div>
            <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
              <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-xs sm:text-sm mb-2">
                En İyi
              </p>
              <p className="text-3xl sm:text-4xl font-black text-cyber-green drop-shadow-sm">
                {bestReaction > 0 ? bestReaction : "-"}
                <span className="text-sm ml-1">ms</span>
              </p>
            </div>
            <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
              <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-xs sm:text-sm mb-2">
                Doğru / Yanlış
              </p>
              <p className="text-2xl sm:text-3xl font-black text-black dark:text-white drop-shadow-sm">
                <span className="text-cyber-green">{correctCount}</span>
                <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                <span className="text-cyber-pink">{wrongCount}</span>
              </p>
            </div>
          </div>
        ),
      }}
    >
      {({ phase, feedbackState }) => (
        <div className="relative z-10 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-160px)] flex-1 w-full">
          <AnimatePresence mode="wait">
            {phase === "playing" && !feedbackState && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full max-w-2xl px-2"
              >
                {gameMode === "selective" && (
                  <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-4 mb-6 border-4 border-black shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#0f172a] rotate-1 text-center inline-flex items-center gap-4 relative justify-center mx-auto flex max-w-[240px]">
                    <span className="text-slate-500 font-syne font-bold uppercase tracking-widest text-sm">
                      Hedef:
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-cyber-green border-2 border-black shadow-[2px_2px_0_#000]" />
                    <span className="font-syne font-black text-black dark:text-white uppercase tracking-wider text-xl">
                      YEŞİL
                    </span>
                  </div>
                )}

                <motion.button
                  onClick={handleClick}
                  className={\`w-full aspect-[4/3] sm:aspect-video rounded-[3rem] border-8 border-black shadow-[16px_16px_0_#000] transition-colors duration-100 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden \${getButtonClass()}\`}
                  whileHover={{ scale: roundState === "go" ? 1.02 : 1 }}
                  whileTap={{ scale: 0.98, shadow: "none", y: 4, x: 4 }}
                >
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                      backgroundImage:
                        "radial-gradient(#000 10%, transparent 10%)",
                      backgroundSize: "20px 20px",
                    }}
                  />

                  {roundState === "waiting" && (
                    <div className="relative z-10">
                      <Timer className="w-20 h-20 text-slate-400 mx-auto mb-6 drop-shadow-sm" />
                      <p className="text-3xl font-syne font-black text-slate-500 uppercase tracking-widest">
                        Bekle...
                      </p>
                    </div>
                  )}
                  {roundState === "ready" && (
                    <div className="relative z-10">
                      <AlertCircle
                        className="w-20 h-20 text-black mx-auto mb-6 animate-pulse drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]"
                        strokeWidth={2.5}
                      />
                      <p className="text-3xl sm:text-5xl font-syne font-black text-black uppercase tracking-widest text-center px-4">
                        Hazırlan!
                      </p>
                    </div>
                  )}
                  {roundState === "go" && (
                    <div className="relative z-10">
                      <Zap
                        className={\`w-24 h-24 \${currentColor === "yellow" ? "text-black" : "text-white"} mx-auto mb-6 drop-shadow-[0_4px_0_rgba(0,0,0,0.3)]\`}
                        strokeWidth={2.5}
                      />
                      <p
                        className={\`text-4xl sm:text-6xl font-syne font-black \${currentColor === "yellow" ? "text-black" : "text-white"} uppercase tracking-widest text-center px-4 drop-shadow-sm\`}
                      >
                        {gameMode === "selective" && currentColor !== targetColor
                          ? "BEKLEME!"
                          : "TIKLA!"}
                      </p>
                    </div>
                  )}
                  {roundState === "early" && (
                    <div className="relative z-10">
                      <XCircle
                        className="w-20 h-20 text-black mx-auto mb-6 drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]"
                        strokeWidth={2.5}
                      />
                      <p className="text-3xl sm:text-5xl font-syne font-black text-black uppercase tracking-widest text-center px-4">
                        Çok Erken!
                      </p>
                    </div>
                  )}
                  {roundState === "result" && (
                    <div className="text-center relative z-10">
                      {currentReactionTime !== null ? (
                        <>
                          <CheckCircle2
                            className="w-20 h-20 text-black mx-auto mb-6 drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]"
                            strokeWidth={2.5}
                          />
                          <p className="text-4xl sm:text-6xl font-syne font-black text-black uppercase tracking-widest mb-2 px-2">
                            {currentReactionTime}
                          </p>
                          <p className="text-sm font-syne font-bold text-black uppercase tracking-widest">
                            Milisaniye
                          </p>
                        </>
                      ) : (
                        <>
                          <CheckCircle2
                            className="w-20 h-20 text-black mx-auto mb-6 drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]"
                            strokeWidth={2.5}
                          />
                          <p className="text-3xl sm:text-5xl font-syne font-black text-black uppercase tracking-widest text-center px-4">
                            Doğru Bekleme!
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default ReactionTimeGame;
`;
fs.writeFileSync(filePath, content);
console.log('ReactionTimeGame rewritten');
