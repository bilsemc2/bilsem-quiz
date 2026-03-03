import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
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
import { GAME_COLORS } from './shared/gameColors';
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

type GameMode = "simple" | "selective";
type RoundState = "waiting" | "ready" | "go" | "early" | "result";

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = "tepki-suresi";

const COLORS = [
  { name: "Yeşil", value: "green", hex: GAME_COLORS.emerald, class: "bg-cyber-green" },
  { name: "Kırmızı", value: "red", hex: GAME_COLORS.incorrect, class: "bg-cyber-pink" },
  { name: "Mavi", value: "blue", hex: GAME_COLORS.blue, class: "bg-cyber-blue" },
  { name: "Sarı", value: "yellow", hex: GAME_COLORS.yellow, class: "bg-cyber-yellow" },
];

const ReactionTimeGame: React.FC = () => {
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const location = useLocation();

  const engine = useGameEngine({
    gameId: GAME_ID,
    timeLimit: TIME_LIMIT,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    disableAutoStart: true, // This game has custom welcome with mode selection
  });
  const { phase, level, lives, score, addScore, loseLife, nextLevel, setGamePhase, handleStart, examMode } = engine;

  const feedback = useGameFeedback({ duration: 1000 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [gameMode, setGameMode] = useState<GameMode>("simple");
  const [roundState, setRoundState] = useState<RoundState>("waiting");
  const [currentColor, setCurrentColor] = useState<string>("red");
  const [currentReactionTime, setCurrentReactionTime] = useState<number | null>(null);

  // Consolidated stats — useRef to avoid unnecessary re-renders
  const statsRef = useRef({ correct: 0, wrong: 0, streak: 0, bestStreak: 0 });
  const [statsVersion, setStatsVersion] = useState(0); // trigger re-render when stats change
  const targetColor = "green";

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTimeRef = useRef<number>(0);
  const reactionTimesRef = useRef<number[]>([]);

  // Internal restart logic wrapping engine.handleStart
  const clearTransitionTimeout = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

  const startCustomGame = useCallback(
    (mode: GameMode = "simple") => {
      window.scrollTo(0, 0);
      setGameMode(mode);
      setRoundState("waiting");
      statsRef.current = { correct: 0, wrong: 0, streak: 0, bestStreak: 0 };
      reactionTimesRef.current = [];
      setStatsVersion(0);
      handleStart();
    },
    [handleStart]
  );

  // Use a ref for phase inside timeout callbacks to avoid stale closures
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const startRound = useCallback(() => {
    setRoundState("waiting");
    setCurrentReactionTime(null);
    const waitTime = 1500 + Math.random() * 2500;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = safeTimeout(() => {
      if (phaseRef.current !== "playing") return;
      setRoundState("ready");
      if (gameMode === "selective") {
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        setCurrentColor(randomColor.value);
      } else {
        setCurrentColor("green");
      }

      timeoutRef.current = safeTimeout(
        () => {
          if (phaseRef.current !== "playing") return;
          setRoundState("go");
          roundStartTimeRef.current = performance.now();
        },
        300 + Math.random() * 500,
      );
    }, waitTime);
  }, [gameMode, safeTimeout]);

  // Start round immediately when game starts playing and is waiting
  useEffect(() => {
    if (phase === "playing" && roundState === "waiting" && score === 0 && statsRef.current.correct === 0 && statsRef.current.wrong === 0) {
      startRound();
    }
  }, [phase, roundState, score, startRound]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  // Dismiss feedback and clear timeouts when game ends
  useEffect(() => {
    if (phase === "game_over" || phase === "victory") {
      dismissFeedback();
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
      if (transitionTimeoutRef.current) { clearTimeout(transitionTimeoutRef.current); transitionTimeoutRef.current = null; }
    }
  }, [phase, dismissFeedback]);

  const handleClick = useCallback(() => {
    if (phase !== "playing" || feedbackState) return;

    if (roundState === "waiting" || roundState === "ready") {
      // Early click — lose life but do NOT advance level
      setRoundState("early");
      playSound("wrong");
      showFeedback(false);
      statsRef.current.wrong++;
      statsRef.current.streak = 0;
      setStatsVersion(v => v + 1);
      loseLife();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      clearTransitionTimeout();

      transitionTimeoutRef.current = safeTimeout(() => {
        dismissFeedback();
        if (lives > 1) {
          startRound(); // retry same level, no nextLevel()
        }
      }, 1200);
    } else if (roundState === "go") {
      const reactionTime = performance.now() - roundStartTimeRef.current;
      setCurrentReactionTime(Math.round(reactionTime));

      if (gameMode === "selective" && currentColor !== targetColor) {
        // Clicked wrong color — lose life, no level advance
        setRoundState("result");
        playSound("wrong");
        showFeedback(false);
        statsRef.current.wrong++;
        statsRef.current.streak = 0;
        setStatsVersion(v => v + 1);
        loseLife();
        clearTransitionTimeout();

        transitionTimeoutRef.current = safeTimeout(() => {
          dismissFeedback();
          if (lives > 1) {
            startRound(); // retry same level
          }
        }, 1200);
      } else {
        // Correct reaction
        setRoundState("result");
        playSound("correct");
        showFeedback(true);
        statsRef.current.correct++;
        statsRef.current.streak++;
        if (statsRef.current.streak > statsRef.current.bestStreak) statsRef.current.bestStreak = statsRef.current.streak;
        setStatsVersion(v => v + 1);
        reactionTimesRef.current.push(Math.round(reactionTime));
        const timeScore = Math.max(0, 500 - Math.round(reactionTime));
        addScore(Math.round(timeScore / 2) + 50 + statsRef.current.streak * 10);
        clearTransitionTimeout();

        transitionTimeoutRef.current = safeTimeout(() => {
          dismissFeedback();
          if (level >= MAX_LEVEL) {
            setGamePhase("victory");
          } else {
            nextLevel();
            startRound();
          }
        }, 1200);
      }
    }
  }, [
    phase,
    feedbackState,
    roundState,
    gameMode,
    currentColor,
    targetColor,
    level,
    lives,
    startRound,
    clearTransitionTimeout,
    playSound,
    showFeedback,
    dismissFeedback,
    loseLife,
    addScore,
    nextLevel,
    setGamePhase,
    safeTimeout,
  ]);

  const handleWait = useCallback(() => {
    if (
      phase !== "playing" ||
      gameMode !== "selective" ||
      roundState !== "go" ||
      feedbackState
    )
      return;

    if (currentColor !== targetColor) {
      setRoundState("result");
      setCurrentReactionTime(null);
      playSound("correct");
      showFeedback(true);
      statsRef.current.correct++;
      statsRef.current.streak++;
      if (statsRef.current.streak > statsRef.current.bestStreak) statsRef.current.bestStreak = statsRef.current.streak;
      setStatsVersion(v => v + 1);
      addScore(75 + statsRef.current.streak * 5);

      clearTransitionTimeout();
      transitionTimeoutRef.current = safeTimeout(() => {
        dismissFeedback();
        if (level >= MAX_LEVEL) {
          setGamePhase("victory");
        } else {
          nextLevel();
          startRound();
        }
      }, 1200);
    }
  }, [
    phase,
    feedbackState,
    gameMode,
    roundState,
    currentColor,
    targetColor,
    level,
    startRound,
    clearTransitionTimeout,
    playSound,
    showFeedback,
    dismissFeedback,
    addScore,
    nextLevel,
    setGamePhase,
    safeTimeout,
  ]);

  useEffect(() => {
    if (gameMode === "selective" && roundState === "go") {
      const waitTime = Math.max(1000, 2000 - level * 50); // Gets slightly faster
      const timeout = safeTimeout(() => {
        if (roundState === "go") handleWait();
      }, waitTime);
      return () => clearTimeout(timeout);
    }
  }, [gameMode, roundState, handleWait, level, safeTimeout]);

  const averageReaction = useMemo(() =>
    reactionTimesRef.current.length > 0
      ? Math.round(reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length)
      : 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statsVersion]);

  const bestReaction = useMemo(() =>
    reactionTimesRef.current.length > 0
      ? Math.min(...reactionTimesRef.current)
      : 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statsVersion]);

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

  const backLink = examMode
    ? "/atolyeler/sinav-simulasyonu/devam"
    : location.state?.arcadeMode
      ? "/bilsem-zeka"
      : "/individual-assessment/attention-memory";
  const backLabel = examMode
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
            className="flex items-center gap-2 text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 border-2 border-black/10 px-4 py-2 rounded-xl shadow-neo-sm active:translate-y-[2px] active:translate-x-[2px] active:shadow-none font-nunito font-bold"
          >
            <ChevronLeft size={20} className="stroke-[3]" />
            <span>{backLabel}</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border-2 border-black/10 shadow-neo-sm"
        >
          <motion.div
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 bg-cyber-yellow border-2 border-black/10 shadow-neo-sm rounded-2xl flex items-center justify-center"
            animate={{ y: [0, -8, 0], rotate: [3, 8, 3] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Zap size={56} className="text-black fill-black" strokeWidth={2.5} />
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-nunito font-black mb-4 uppercase text-black dark:text-white tracking-tight drop-shadow-sm">
            Tepki Süresi
          </h1>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 border-2 border-black/10 shadow-neo-sm text-left">
            <h3 className="text-xl font-nunito font-black text-cyber-blue mb-4 flex items-center gap-2 uppercase">
              <Sparkles size={24} className="stroke-[3]" /> Mod Seçimi
            </h3>

            <div className="space-y-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => startCustomGame("simple")}
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-black/10 shadow-neo-sm flex items-center gap-3 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-cyber-green border-2 border-black/10">
                  <Zap size={24} className="text-black fill-black/50" />
                </div>
                <div className="text-left font-nunito">
                  <h3 className="text-lg font-bold text-black dark:text-white group-hover:text-cyber-green transition-colors">
                    Basit Tepki
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Yeşil görünce hemen tıkla!
                  </p>
                </div>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => startCustomGame("selective")}
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-black/10 shadow-neo-sm flex items-center gap-3 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-cyber-pink border-2 border-black/10">
                  <Target size={24} className="text-black" strokeWidth={2.5} />
                </div>
                <div className="text-left font-nunito">
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

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyber-yellow border-2 border-black/10 text-black rounded-lg shadow-neo-sm">
            <span className="text-xs font-nunito font-black uppercase tracking-widest text-black">
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
        tuzoCode: "TUZÖ 8.1.1 Tepki Hızı",
        customWelcome: WelcomeScreen,
        onRestart: () => {
          // Reset game-specific state and go back to mode selection
          setRoundState("waiting");
          setCurrentReactionTime(null);
          statsRef.current = { correct: 0, wrong: 0, streak: 0, bestStreak: 0 };
          reactionTimesRef.current = [];
          setStatsVersion(0);
          if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
          clearTransitionTimeout();
          setGamePhase("welcome");
        },
        extraHudItems: statsRef.current.streak > 1 ? (
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-purple border-2 border-black/10 rounded-xl shadow-neo-sm animate-pulse">
            <Zap className="text-white fill-white/50" size={18} />
            <span className="font-nunito font-black text-white">x{statsRef.current.streak}</span>
          </div>
        ) : null,
        extraGameOverActions: (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-2 rounded-xl border-2 border-slate-200 dark:border-slate-600 overflow-hidden">
              <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold uppercase tracking-wider text-[9px] sm:text-[10px] mb-0.5">
                Ortalama
              </p>
              <p className="text-base sm:text-lg font-black text-cyber-purple truncate">
                {averageReaction}<span className="text-[9px] ml-0.5">ms</span>
              </p>
            </div>
            <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-2 rounded-xl border-2 border-slate-200 dark:border-slate-600 overflow-hidden">
              <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold uppercase tracking-wider text-[9px] sm:text-[10px] mb-0.5">
                En İyi
              </p>
              <p className="text-base sm:text-lg font-black text-cyber-green truncate">
                {bestReaction > 0 ? bestReaction : "-"}<span className="text-[9px] ml-0.5">ms</span>
              </p>
            </div>
            <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-2 rounded-xl border-2 border-slate-200 dark:border-slate-600 overflow-hidden">
              <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold uppercase tracking-wider text-[9px] sm:text-[10px] mb-0.5">
                Doğru/Yanlış
              </p>
              <p className="text-base sm:text-lg font-black text-black dark:text-white truncate">
                <span className="text-cyber-green">{statsRef.current.correct}</span>
                <span className="text-slate-300 dark:text-slate-600 mx-0.5">/</span>
                <span className="text-cyber-pink">{statsRef.current.wrong}</span>
              </p>
            </div>
          </div>
        ),
      }}
    >
      {({ phase }) => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1 w-full">
          {phase === "playing" && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl px-2"
            >
              {gameMode === "selective" && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 mb-4 border-2 border-black/10 shadow-neo-sm text-center inline-flex items-center gap-3 relative justify-center mx-auto flex max-w-[220px]">
                  <span className="text-slate-500 font-nunito font-bold uppercase tracking-widest text-sm">
                    Hedef:
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-cyber-green border-2 border-black/10 shadow-neo-sm" />
                  <span className="font-nunito font-black text-black dark:text-white uppercase tracking-wider text-lg">
                    YEŞİL
                  </span>
                </div>
              )}

              <motion.button
                onClick={handleClick}
                className={`w-full aspect-[4/3] sm:aspect-video rounded-2xl border-2 border-black/10 shadow-neo-sm transition-colors duration-100 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${getButtonClass()}`}
                whileTap={{ scale: 0.98, y: 4 }}
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
                    <Timer className="w-16 h-16 text-slate-400 mx-auto mb-4 drop-shadow-sm" />
                    <p className="text-2xl font-nunito font-black text-slate-500 uppercase tracking-widest">
                      Bekle...
                    </p>
                  </div>
                )}
                {roundState === "ready" && (
                  <div className="relative z-10">
                    <AlertCircle
                      className="w-16 h-16 text-black mx-auto mb-4 animate-pulse"
                      strokeWidth={2.5}
                    />
                    <p className="text-2xl sm:text-4xl font-nunito font-black text-black uppercase tracking-widest text-center px-4">
                      Hazırlan!
                    </p>
                  </div>
                )}
                {roundState === "go" && (
                  <div className="relative z-10">
                    <Zap
                      className={`w-20 h-20 ${currentColor === "yellow" ? "text-black" : "text-white"} mx-auto mb-4`}
                      strokeWidth={2.5}
                    />
                    <p
                      className={`text-3xl sm:text-5xl font-nunito font-black ${currentColor === "yellow" ? "text-black" : "text-white"} uppercase tracking-widest text-center px-4`}
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
                      className="w-16 h-16 text-black mx-auto mb-4"
                      strokeWidth={2.5}
                    />
                    <p className="text-2xl sm:text-4xl font-nunito font-black text-black uppercase tracking-widest text-center px-4">
                      Çok Erken!
                    </p>
                  </div>
                )}
                {roundState === "result" && (
                  <div className="text-center relative z-10">
                    {currentReactionTime !== null ? (
                      <>
                        <CheckCircle2
                          className="w-16 h-16 text-black mx-auto mb-4"
                          strokeWidth={2.5}
                        />
                        <p className="text-4xl sm:text-5xl font-nunito font-black text-black uppercase tracking-widest mb-1 px-2">
                          {currentReactionTime}
                        </p>
                        <p className="text-xs font-nunito font-bold text-black uppercase tracking-widest">
                          Milisaniye
                        </p>
                      </>
                    ) : (
                      <>
                        <CheckCircle2
                          className="w-16 h-16 text-black mx-auto mb-4"
                          strokeWidth={2.5}
                        />
                        <p className="text-2xl sm:text-4xl font-nunito font-black text-black uppercase tracking-widest text-center px-4">
                          Doğru Bekleme!
                        </p>
                      </>
                    )}
                  </div>
                )}
              </motion.button>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell >
  );
};

export default ReactionTimeGame;
