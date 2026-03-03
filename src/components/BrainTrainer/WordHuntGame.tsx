import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle2, AlertCircle } from "lucide-react";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { GAME_COLORS } from './shared/gameColors';

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = "kelime-avi";

type InternalPhase =
  | "exposure"
  | "playing";

const ALPHABET = [..."ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ"];
const VOWELS = [..."AEIİOÖUÜ"];
const CONSONANTS = [..."BCÇDFGĞHJKLMNPRSŞTVYZ"];

/** Seviyeye göre n uzunluklu rastgele hece üretir (ör. 2→"AR", 3→"KAL", 4→"ANLI") */
const makeNGram = (len: number): string => {
  let s = "";
  let useVowel = Math.random() > 0.5;
  for (let i = 0; i < len; i++) {
    s += useVowel ? pick(VOWELS) : pick(CONSONANTS);
    useVowel = !useVowel;
  }
  return s;
};

const CARD_COLORS = [
  GAME_COLORS.emerald, // cyber-green
  GAME_COLORS.pink, // cyber-pink
  GAME_COLORS.blue, // cyber-blue
  GAME_COLORS.yellow, // cyber-yellow
  GAME_COLORS.orange, // cyber-orange
  GAME_COLORS.purple, // cyber-magenta
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const getLevelCfg = (lvl: number) => {
  if (lvl <= 5)
    return {
      wordLen: 5,
      items: 8,
      roundDur: 4.5 - (lvl - 1) * 0.1,
      flash: 0.6,
      targetLen: 1, // tek harf
    };
  if (lvl <= 10)
    return {
      wordLen: 6,
      items: 9,
      roundDur: 3.8 - (lvl - 6) * 0.1,
      flash: 0.55,
      targetLen: lvl >= 8 ? 2 : 1, // 2-gram
    };
  if (lvl <= 15)
    return {
      wordLen: 7,
      items: 10,
      roundDur: 3.2 - (lvl - 11) * 0.1,
      flash: 0.5,
      targetLen: Math.min(3, 2 + Math.floor((lvl - 11) / 3)), // 2-3 gram
    };
  return {
    wordLen: 8,
    items: 12,
    roundDur: 2.6 - (lvl - 16) * 0.05,
    flash: 0.4,
    targetLen: Math.min(4, 3 + Math.floor((lvl - 16) / 3)), // 3-4 gram
  };
};

const makeWord = (len: number) => {
  let w = "";
  let v = Math.random() > 0.45;
  for (let i = 0; i < len; i++) {
    w += v ? pick(VOWELS) : pick(CONSONANTS);
    v = !v;
    if (Math.random() < 0.18) v = !v;
  }
  return w;
};

const insertT = (w: string, t: string) => {
  if (w.length < t.length) return t;
  const s = Math.floor(Math.random() * (w.length - t.length + 1));
  return w.slice(0, s) + t + w.slice(s + t.length);
};

const genItems = (t: string, len: number, count: number) => {
  const tc = Math.min(
    count - 2,
    Math.max(2, Math.round(count * 0.5) + (Math.floor(Math.random() * 3) - 1)),
  );
  const items = [];
  for (let i = 0; i < count; i++) {
    const has = i < tc;
    let text = "";
    if (has) {
      text = insertT(makeWord(len), t);
    } else {
      text = makeWord(len);
      while (text.includes(t)) {
        text = makeWord(len);
      }
    }
    items.push({ id: `${i}-${text}-${Math.random()}`, text, hasTarget: has });
  }
  return items.sort(() => Math.random() - 0.5);
};

const WordHuntGame: React.FC = () => {
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
    initialLives: INITIAL_LIVES,
  });

  const feedback = useGameFeedback({
    duration: 1500,
  });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [internalPhase, setInternalPhase] = useState<InternalPhase>("exposure");
  const [target, setTarget] = useState("—");
  const [items, setItems] = useState<{ id: string; text: string; hasTarget: boolean }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [roundTime, setRoundTime] = useState(0);

  const roundRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  const startLevel = useCallback(
    (lvl: number) => {
      const cfg = getLevelCfg(lvl);
      const t = cfg.targetLen <= 1 ? pick(ALPHABET) : makeNGram(cfg.targetLen);
      setTarget(t);
      setItems(genItems(t, cfg.wordLen, cfg.items));
      setSelected(new Set());
      setRoundTime(cfg.roundDur);
      setInternalPhase("exposure");
      playSound("slide");

      safeTimeout(() => {
        setInternalPhase("playing");
        playSound("pop");
      }, cfg.flash * 1000);
    },
    [playSound, safeTimeout],
  );

  const prevPhaseRef = useRef<string>("");
  useEffect(() => {
    if (engine.phase === "playing" && prevPhaseRef.current !== "playing") {
      startLevel(engine.level);
    } else if (engine.phase === "welcome") {
      setItems([]);
      setSelected(new Set());
      setInternalPhase("exposure");
    }
    prevPhaseRef.current = engine.phase;
  }, [engine.phase, engine.level, startLevel]);

  const finishRound = useCallback(() => {
    cancelAnimationFrame(roundRef.current);
    if (!items || items.length === 0 || engine.phase !== "playing") return;

    const total = items.filter((i) => i.hasTarget).length;
    const correct = items.filter(
      (i) => i.hasTarget && selected.has(i.id),
    ).length;

    // Penalize for wrong selections too
    const incorrect = selected.size - correct;

    // Must find ALL targets with at most 1 wrong pick
    const isGood = total > 0 ? correct === total && incorrect <= 1 : false;

    playSound(isGood ? "correct" : "incorrect");
    showFeedback(isGood);

    if (isGood) {
      engine.addScore(engine.level * 10 + correct * 5 - incorrect * 5);
    } else {
      engine.loseLife();
    }

    safeTimeout(() => {
      dismissFeedback();
      if (isGood) {
        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
          playSound("success");
        } else {
          engine.nextLevel();
          startLevel(engine.level + 1);
        }
      } else if (engine.lives > 1) {
        startLevel(engine.level);
      }
    }, 1500);
  }, [
    items,
    selected,
    engine,
    startLevel,
    showFeedback,
    dismissFeedback,
    playSound,
    safeTimeout,
  ]);

  useEffect(() => {
    if (engine.phase !== "playing" || internalPhase !== "playing" || !!feedbackState) {
      startTimeRef.current = null;
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }

    const start = startTimeRef.current;
    const dur = getLevelCfg(engine.level).roundDur;

    const tick = (now: number) => {
      const el = (now - start) / 1000;
      const rem = Math.max(0, dur - el);
      setRoundTime(rem);

      if (rem <= 0) finishRound();
      else roundRef.current = requestAnimationFrame(tick);
    };

    roundRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(roundRef.current);
  }, [engine.phase, internalPhase, engine.level, items, finishRound, feedbackState]);

  const toggle = (id: string) => {
    if (engine.phase !== "playing" || internalPhase !== "playing" || !!feedbackState) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        playSound("pop");
      } else if (next.size < items.filter((i) => i.hasTarget).length + 2) {
        next.add(id);
        playSound("pop");
      }
      return next;
    });
  };

  const cfg = getLevelCfg(engine.level);
  const prog = Math.max(0, Math.min(100, (roundTime / cfg.roundDur) * 100));

  const gridCss = useMemo(() => `.pattern-grid {
    background-image: 
      linear-gradient(to right, #000 1px, transparent 1px),
      linear-gradient(to bottom, #000 1px, transparent 1px);
    background-size: 20px 20px;
  }
  .dark .pattern-grid {
    background-image: 
      linear-gradient(to right, #fff 1px, transparent 1px),
      linear-gradient(to bottom, #fff 1px, transparent 1px);
  }`, []);

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Kelime Avı",
        icon: Search,
        description:
          "Hızlı akan harfler arasında gizli hedefleri yakala, algısal işlem hızınla fark yarat!",
        howToPlay: [
          "Ortada beliren hedef harfi hızla öğren",
          "Ekranda kelimeler belirdiğinde hedefi içerenleri hemen seç",
          "Süre bitmeden hızlı kararlar ver!",
        ],
        tuzoCode: "5.6.1 Algısal İşlem Hızı",
        accentColor: "cyber-pink",
        maxLevel: MAX_LEVEL,
      }}
    >
      {() => (
        <div className="w-full flex-1 flex justify-center items-center p-2 sm:p-4">
          {engine.phase === "playing" && (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-4xl flex flex-col items-center"
            >
              {/* Target & Timer Header */}
              <div className="flex items-center gap-3 sm:gap-6 mb-4 sm:mb-6 w-full">
                <div className="bg-white dark:bg-slate-800 border-2 border-black/10 px-5 sm:px-8 py-3 sm:py-5 rounded-2xl shadow-neo-sm flex flex-col items-center shrink-0">
                  <span className="text-[10px] sm:text-xs font-nunito font-black text-black/50 dark:text-white/50 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                    <Search size={12} /> HEDEF
                  </span>
                  <span className="text-4xl sm:text-5xl font-black font-nunito text-cyber-blue tracking-widest">
                    {target}
                  </span>
                </div>

                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl p-2.5 sm:p-3 border-2 border-black/10 shadow-neo-sm">
                  <div className="w-full h-3 sm:h-5 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden relative">
                    <motion.div
                      className={`h-full ${prog < 30 ? "bg-cyber-pink" : "bg-cyber-green"} transition-colors`}
                      style={{ width: `${prog}%`, transformOrigin: "left" }}
                      transition={{ duration: 0.1, ease: "linear" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                    </motion.div>
                  </div>
                  <div className="flex justify-between items-center px-1 mt-1">
                    <span className="text-[10px] sm:text-xs font-nunito font-black text-slate-400 uppercase tracking-widest">
                      Zaman
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-nunito font-black ${prog < 30 ? "text-cyber-pink animate-pulse" : "text-black dark:text-white"}`}
                    >
                      {roundTime.toFixed(1)}s
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="w-full bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-black/10 shadow-neo-sm relative overflow-hidden">
                <div className="absolute inset-0 pattern-grid opacity-10 dark:opacity-5 pointer-events-none" />

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 relative z-10">
                  {items.map((item, id) => {
                    const sel = selected.has(item.id);
                    return (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: id * 0.03,
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                        }}
                        whileTap={
                          internalPhase === "playing" && !feedbackState ? { scale: 0.95 } : {}
                        }
                        onClick={() => toggle(item.id)}
                        disabled={internalPhase === "exposure" || !!feedbackState}
                        className={`relative py-3.5 sm:py-5 px-3 rounded-xl sm:rounded-2xl font-nunito font-black text-lg sm:text-xl tracking-[0.08em] sm:tracking-[0.12em] transition-all duration-200 border-2 border-black/10 flex items-center justify-center overflow-hidden break-all
                        ${internalPhase === "exposure"
                            ? `text-black`
                            : sel
                              ? "bg-cyber-green text-black shadow-neo-sm"
                              : "bg-[#FAF9F6] dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 shadow-neo-sm"
                          }
                        `}
                        style={
                          internalPhase === "exposure"
                            ? {
                              backgroundColor:
                                CARD_COLORS[id % CARD_COLORS.length],
                            }
                            : {}
                        }
                      >
                        <span className="relative z-10">
                          {item.text}
                        </span>

                        {sel && internalPhase === "playing" && (
                          <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="absolute -top-1 -right-1 w-7 h-7 bg-black rounded-bl-xl rounded-tr-xl flex items-center justify-center pointer-events-none z-20"
                          >
                            <CheckCircle2
                              size={16}
                              strokeWidth={3}
                              className="text-cyber-green"
                            />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Hint Bar */}
              <div className="mt-3 sm:mt-4 flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-cyber-pink border-2 border-black/10 rounded-2xl shadow-neo-sm">
                <AlertCircle size={18} className="text-black fill-white shrink-0" />
                <p className="text-xs sm:text-sm font-nunito font-black text-black uppercase tracking-widest">
                  {internalPhase === "exposure"
                    ? "DİKKATLE İNCELE!"
                    : `İÇİNDE "${target}" OLANLARI SEÇ!`}
                </p>
              </div>
            </motion.div>
          )}
          <style>{gridCss}</style>
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default WordHuntGame;
