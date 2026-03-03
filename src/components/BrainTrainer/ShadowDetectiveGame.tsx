import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Eye,
  Circle,
  Square,
  Triangle,
  Star,
  Diamond,
  Cross,
  Moon,
  Heart,
  Octagon,
} from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import BrainTrainerShell, { GameShellConfig } from "./shared/BrainTrainerShell";
import { useGameEngine } from "./shared/useGameEngine";
import { GAME_COLORS } from './shared/gameColors';
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const SHAPE_ICONS = [
  Circle,
  Square,
  Triangle,
  Diamond,
  Star,
  Octagon,
  Cross,
  Moon,
  Heart,
];

// Tactile cyber-pop colors
const COLORS = [
  GAME_COLORS.pink, // cyber-pink
  GAME_COLORS.blue, // cyber-blue
  GAME_COLORS.yellow, // cyber-yellow
  "#00FF66", // cyber-green
  "#9D4EDD", // cyber-purple
  "#FF9900", // cyber-orange
  "#FFFFFF", // white
  "#FF69B4", // hot pink
];

interface PatternItem {
  id: string;
  iconIdx: number;
  color: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

const gameConfig: GameShellConfig = {
  title: "Gölge Dedektifi",
  icon: Search,
  description: "Şekilleri incele, zihninde kopyala ve benzerleri arasından gerçeği bul. Görsel analiz yeteneğini zirveye taşı!",
  howToPlay: [
    "Ekrana gelen deseni 3 saniye boyunca dikkatle incele",
    "Aşağıdaki 4 seçenek arasından tıpatıp aynısını bul",
    "Renk, dönüş ve konum farklarını bir dedektif gibi yakala"
  ],
  tuzoCode: "TUZÖ 5.3.2 Görsel Analiz",
  maxLevel: 20,
  accentColor: "cyber-purple",
  wideLayout: true,
};

const ShadowDetectiveGame: React.FC = () => {
  const engine = useGameEngine({
    timeLimit: 180,
    initialLives: 5,
    maxLevel: 20,
    gameId: "golge-dedektifi",
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback();
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const {
    phase,
    level,
    lives,
    addScore,
    loseLife,
    nextLevel,
  } = engine;

  const [localStatus, setLocalStatus] = useState<"preview" | "deciding">("preview");
  const [previewTimer, setPreviewTimer] = useState(3);
  const [correctPattern, setCorrectPattern] = useState<PatternItem[]>([]);
  const [options, setOptions] = useState<PatternItem[][]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const isGameEndingRef = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  // Sync ref with phase to prevent leaks
  useEffect(() => {
    if (phase === "playing") {
      isGameEndingRef.current = false;
    }
  }, [phase]);

  const getSig = (p: PatternItem[]) =>
    p
      .map(
        (i) =>
          `${i.iconIdx}-${i.color}-${Math.round(i.x)}-${Math.round(i.y)}-${i.rotation}-${i.scale.toFixed(2)}`,
      )
      .sort()
      .join("|");

  const genPattern = useCallback((count: number) => {
    const p: PatternItem[] = [];
    for (let i = 0; i < count; i++) {
      let x: number,
        y: number,
        tooClose: boolean,
        att = 0;
      do {
        x = Math.random() * 70 + 15;
        y = Math.random() * 70 + 15;
        tooClose = p.some(
          (curr) =>
            Math.sqrt(Math.pow(curr.x - x, 2) + Math.pow(curr.y - y, 2)) < 25,
        );
        att++;
      } while (tooClose && att < 50);

      p.push({
        id: Math.random().toString(36).substr(2, 9),
        iconIdx: Math.floor(Math.random() * SHAPE_ICONS.length),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        x,
        y,
        rotation: Math.floor(Math.random() * 8) * 45,
        scale: 0.9 + Math.random() * 0.5,
      });
    }
    return p;
  }, []);

  const SYMMETRIC_ICONS = new Set([0, 1, 4, 5, 6]);

  const genDist = useCallback(
    (base: PatternItem[]) => {
      const d: PatternItem[] = JSON.parse(JSON.stringify(base));
      const baseColors = new Set(base.map(i => i.color));
      // Colors NOT used in the correct pattern — prefer these for distractors
      const contrastColors = COLORS.filter(c => !baseColors.has(c));

      // Always change at least one shape's color to a contrasting one
      const colorIdx = Math.floor(Math.random() * d.length);
      if (contrastColors.length > 0) {
        d[colorIdx].color = contrastColors[Math.floor(Math.random() * contrastColors.length)];
      } else {
        // All colors used — just pick a different color for this shape
        const available = COLORS.filter(c => c !== d[colorIdx].color);
        d[colorIdx].color = available[Math.floor(Math.random() * available.length)];
      }

      // Optionally apply a second mutation (shape, rotation, or position)
      if (Math.random() > 0.4) {
        let idx2: number;
        do {
          idx2 = Math.floor(Math.random() * d.length);
        } while (idx2 === colorIdx && d.length > 1);

        const types = [1, 2, 3]; // rotation, shape, position (no color — already done)
        if (SYMMETRIC_ICONS.has(d[idx2].iconIdx)) {
          types.splice(types.indexOf(1), 1);
        }
        const type = types[Math.floor(Math.random() * types.length)];

        if (type === 1) {
          d[idx2].rotation = (d[idx2].rotation + (Math.random() > 0.5 ? 90 : 180)) % 360;
        } else if (type === 2) {
          const jump = 3 + Math.floor(Math.random() * 3);
          d[idx2].iconIdx = (d[idx2].iconIdx + jump) % SHAPE_ICONS.length;
        } else {
          const shift = 20 + Math.floor(Math.random() * 15);
          d[idx2].x = Math.max(15, Math.min(85, d[idx2].x + (d[idx2].x > 50 ? -shift : shift)));
          d[idx2].y = Math.max(15, Math.min(85, d[idx2].y + (d[idx2].y > 50 ? -shift : shift)));
        }
      }
      return d;
    },
    []
  );

  const startLevel = useCallback(() => {
    const count = Math.min(6, 2 + Math.floor(level / 4));
    const corr = genPattern(count);
    const corrSig = getSig(corr);
    const opts = [corr];
    const sigs = new Set([corrSig]);
    let attempts = 0;

    while (opts.length < 4 && attempts < 100) {
      const d = genDist(corr);
      const s = getSig(d);
      if (!sigs.has(s) && s !== corrSig) {
        opts.push(d);
        sigs.add(s);
      }
      attempts++;
    }

    setCorrectPattern(corr);
    setOptions(opts.sort(() => Math.random() - 0.5));
    setSelectedIndex(null);
    setPreviewTimer(3);
    setLocalStatus("preview");
    playSound("pop");
  }, [level, genPattern, playSound, genDist]);

  // Initial trigger when phase becomes playing (and level increases)
  useEffect(() => {
    if (phase === "playing" && !isGameEndingRef.current && correctPattern.length === 0) {
      startLevel();
    }
  }, [phase, level, startLevel, correctPattern.length]);

  useEffect(() => {
    if (phase !== "playing" || isGameEndingRef.current) return;

    if (localStatus === "preview" && previewTimer > 0) {
      const itv = safeTimeout(() => {
        setPreviewTimer((p) => {
          if (p <= 1) playSound("pop");
          return p - 1;
        });
      }, 1000);
      return () => clearTimeout(itv);
    } else if (localStatus === "preview" && previewTimer === 0) {
      setLocalStatus("deciding");
      playSound("slide");
    }
  }, [phase, localStatus, previewTimer, playSound]);

  const handleSelect = (idx: number) => {
    if (localStatus !== "deciding" || selectedIndex !== null || feedbackState || isGameEndingRef.current || phase !== "playing")
      return;

    setSelectedIndex(idx);
    const isCorrect = getSig(options[idx]) === getSig(correctPattern);

    if (isCorrect) {
      playSound("correct");
      addScore(level * 10);
      showFeedback(true);

      const tId = safeTimeout(() => {
        if (isGameEndingRef.current) return;
        dismissFeedback();
        setSelectedIndex(null);
        setCorrectPattern([]); // clear so next effect triggers
        nextLevel();
      }, 1500);
      timeoutsRef.current.push(tId);
    } else {
      playSound("incorrect");
      showFeedback(false);
      loseLife();

      if (lives - 1 > 0) {
        const tId = safeTimeout(() => {
          if (isGameEndingRef.current) return;
          dismissFeedback();
          startLevel(); // retry same level with new pattern
        }, 1500);
        timeoutsRef.current.push(tId);
      } else {
        isGameEndingRef.current = true;
        timeoutsRef.current.forEach(clearTimeout);
      }
    }
  };

  const renderPattern = (items: PatternItem[]) => (
    <div
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border-2 border-black/10"
      style={{ width: "100%", paddingBottom: "100%" }}
    >
      <div className="absolute inset-0 pattern-grid opacity-10 dark:opacity-5 pointer-events-none" />
      {items.map((it) => {
        const Icon = SHAPE_ICONS[it.iconIdx];
        return (
          <div
            key={it.id}
            className="absolute"
            style={{
              left: `${it.x}%`,
              top: `${it.y}%`,
              color: it.color,
              transform: `translate(-50%, -50%) rotate(${it.rotation}deg) scale(${it.scale})`,
              width: '18%',
              height: '18%',
            }}
          >
            <Icon className="w-full h-full" strokeWidth={3} />
          </div>
        );
      })}
    </div>
  );

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <>
          <style>{`
            .pattern-grid {
              background-image: 
                linear-gradient(to right, #000 1px, transparent 1px),
                linear-gradient(to bottom, #000 1px, transparent 1px);
              background-size: 20px 20px;
            }
            .dark .pattern-grid {
              background-image: 
                linear-gradient(to right, #fff 1px, transparent 1px),
                linear-gradient(to bottom, #fff 1px, transparent 1px);
            }
          `}</style>
          {localStatus === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md flex flex-col items-center gap-8"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-10 border-2 border-black/10 shadow-neo-sm w-full text-center relative rotate-1">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyber-purple text-black dark:text-white px-6 py-2 rounded-full font-nunito font-black uppercase tracking-widest border-2 border-black/10 shadow-neo-sm flex items-center gap-2">
                  <Eye size={18} className="stroke-[3]" /> Ezberle:{" "}
                  {previewTimer}s
                </div>

                <div className="mt-4 mb-8">
                  <div className="w-full max-w-[320px] mx-auto">
                    {renderPattern(correctPattern)}
                  </div>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-6 rounded-full border-2 border-black/10 overflow-hidden relative">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-cyber-pink"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 3, ease: "linear" }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {localStatus === "deciding" && (
            <motion.div
              key="deciding"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-5xl space-y-8"
            >
              <h2 className="text-2xl sm:text-3xl font-nunito font-black text-center text-black dark:text-white uppercase tracking-tight mb-2 flex items-center justify-center gap-4">
                Hangi Desen Doğru?{" "}
                <Search size={32} className="text-cyber-blue" strokeWidth={3} />
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {options.map((item, idx) => {
                  let buttonClass =
                    "bg-white dark:bg-slate-800 border-2 border-black/10 shadow-neo-sm hover:translate-y-1 hover:translate-x-1 hover:shadow-neo-sm";
                  let badgeClass =
                    "bg-cyber-yellow text-black border-2 border-black/10";

                  if (feedbackState) {
                    const isCorrect =
                      getSig(options[idx]) === getSig(correctPattern);

                    if (selectedIndex === idx) {
                      if (isCorrect) {
                        buttonClass =
                          "bg-cyber-green border-2 border-black/10 shadow-neo-sm translate-y-1 translate-x-1 scale-105 z-10";
                        badgeClass =
                          "bg-white text-black border-2 border-black/10";
                      } else {
                        buttonClass =
                          "bg-cyber-pink border-2 border-black/10 shadow-neo-sm translate-y-1 translate-x-1";
                        badgeClass =
                          "bg-white text-black border-2 border-black/10";
                      }
                    } else if (isCorrect) {
                      buttonClass =
                        "bg-cyber-green border-2 border-black/10 shadow-neo-sm animate-pulse";
                      badgeClass = "bg-white text-black border-2 border-black/10";
                    } else {
                      const wrongColors = [
                        "bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300/50",
                        "bg-slate-200 dark:bg-slate-700 border-2 border-slate-300/50",
                        "bg-violet-100 dark:bg-violet-900/30 border-2 border-violet-300/50",
                        "bg-sky-100 dark:bg-sky-900/30 border-2 border-sky-300/50",
                      ];
                      buttonClass =
                        `${wrongColors[idx % wrongColors.length]} shadow-neo-sm opacity-60`;
                      badgeClass =
                        "bg-white/80 dark:bg-slate-600 text-black border-2 border-black/10";
                    }
                  }

                  // Alternating slight rotations for options
                  const rotClass = idx % 2 === 0 ? "rotate-1" : "-rotate-1";

                  return (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      whileTap={!feedbackState ? { scale: 0.95 } : {}}
                      onClick={() => handleSelect(idx)}
                      disabled={!!feedbackState}
                      className={`p-4 sm:p-6 rounded-2xl transition-all flex flex-col items-center gap-4 ${buttonClass} ${!feedbackState ? rotClass : ""}`}
                    >
                      <div className="w-full">{renderPattern(item)}</div>
                      <div
                        className={`px-6 py-2 rounded-xl text-sm font-nunito font-black uppercase tracking-widest shadow-neo-sm ${badgeClass}`}
                      >
                        Seçenek {idx + 1}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </>
      )}
    </BrainTrainerShell>
  );
};

export default ShadowDetectiveGame;
