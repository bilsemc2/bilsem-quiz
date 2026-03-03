import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Puzzle, Eye, RefreshCw } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { GAME_COLORS } from './shared/gameColors';

interface PatternProps {
  points?: number;
  sides?: number;
  lines?: number;
  pathData?: string;
}

interface Pattern {
  defs: string;
  type: string;
  backgroundColor: string;
  foregroundColor: string;
  size: number;
  rotation: number;
  opacity: number;
  id: string;
  props?: PatternProps;
}

interface GameOption {
  pattern: Pattern[];
  isCorrect: boolean;
}

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = "parca-butun";
const COLORS = [
  ...GAME_COLORS.shapes,
];

const PATTERN_TYPES = [
  "dots",
  "stripes",
  "zigzag",
  "waves",
  "checkerboard",
  "crosshatch",
  "star",
  "polygon",
  "scribble",
  "burst",
];

const PartWholeGame: React.FC = () => {
  const svgSize = 300;
  const pieceSize = 100;

  const getPatternDefs = useCallback((pattern: Pattern): string => {
    const { size, backgroundColor, foregroundColor, type, id, props } = pattern;
    const sw = size / 6;
    const br = `<rect width="${size}" height="${size}" fill="${backgroundColor}"/>`;

    switch (type) {
      case "dots":
        return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="${foregroundColor}"/></pattern>`;
      case "stripes":
        return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<rect width="${size}" height="${size / 3}" fill="${foregroundColor}"/></pattern>`;
      case "zigzag":
        return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<path d="M0 0 L${size / 2} ${size} L${size} 0" stroke="${foregroundColor}" fill="none" stroke-width="${sw}"/></pattern>`;
      case "waves":
        return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<path d="M0 ${size / 2} Q${size / 4} 0 ${size / 2} ${size / 2} T${size} ${size / 2}" stroke="${foregroundColor}" fill="none" stroke-width="${sw}"/></pattern>`;
      case "checkerboard":
        return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<rect width="${size / 2}" height="${size / 2}" fill="${foregroundColor}"/><rect x="${size / 2}" y="${size / 2}" width="${size / 2}" height="${size / 2}" fill="${foregroundColor}"/></pattern>`;
      case "crosshatch":
        return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<path d="M0 0 L${size} ${size} M0 ${size} L${size} 0" stroke="${foregroundColor}" stroke-width="${sw}"/></pattern>`;
      case "star": {
        const p = props?.points || 5;
        let d = "";
        for (let i = 0; i < p * 2; i++) {
          const r = i % 2 === 0 ? size / 2.5 : size / 4;
          const x = size / 2 + Math.cos((i * Math.PI) / p) * r;
          const y = size / 2 + Math.sin((i * Math.PI) / p) * r;
          d += (i === 0 ? "M" : "L") + `${x},${y}`;
        }
        return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<path d="${d}Z" fill="${foregroundColor}"/></pattern>`;
      }
      case "polygon": {
        const s = props?.sides || 6;
        let d = "";
        for (let i = 0; i < s; i++) {
          const x = size / 2 + Math.cos((i * 2 * Math.PI) / s) * (size / 2.5);
          const y = size / 2 + Math.sin((i * 2 * Math.PI) / s) * (size / 2.5);
          d += (i === 0 ? "M" : "L") + `${x},${y}`;
        }
        return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<path d="${d}Z" fill="${foregroundColor}"/></pattern>`;
      }
      case "scribble":
        return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<path d="${props?.pathData}" stroke="${foregroundColor}" fill="none" stroke-width="${sw}" stroke-linecap="round"/></pattern>`;
      case "burst": {
        const l = props?.lines || 8;
        let d = "";
        for (let i = 0; i < l; i++) {
          const x2 = size / 2 + Math.cos((i * 2 * Math.PI) / l) * (size / 2);
          const y2 = size / 2 + Math.sin((i * 2 * Math.PI) / l) * (size / 2);
          d += `M${size / 2},${size / 2} L${x2},${y2} `;
        }
        return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<path d="${d}" stroke="${foregroundColor}" stroke-width="${sw}"/></pattern>`;
      }
      default:
        return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}</pattern>`;
    }
  }, []);

  const generatePattern = useCallback((): Pattern => {
    const type =
      PATTERN_TYPES[Math.floor(Math.random() * PATTERN_TYPES.length)];
    const bc = COLORS[Math.floor(Math.random() * COLORS.length)];
    const fc = COLORS.filter((c) => c !== bc)[
      Math.floor(Math.random() * (COLORS.length - 1))
    ];
    const sz = 30 + Math.random() * 40;
    const props: PatternProps = {};

    if (type === "star") props.points = 4 + Math.floor(Math.random() * 5);
    if (type === "polygon") props.sides = 3 + Math.floor(Math.random() * 6);
    if (type === "burst") props.lines = 6 + Math.floor(Math.random() * 10);
    if (type === "scribble") {
      const pts = Array.from({ length: 4 }, () => ({
        x: Math.random() * sz,
        y: Math.random() * sz,
      }));
      props.pathData = `M${pts[0].x},${pts[0].y} Q${pts[1].x},${pts[1].y} ${pts[2].x},${pts[2].y} T${pts[3].x},${pts[3].y}`;
    }

    const b: Pattern = {
      defs: "",
      type,
      backgroundColor: bc,
      foregroundColor: fc,
      size: sz,
      rotation: Math.random() * 360,
      opacity: 0.85 + Math.random() * 0.15,
      id: `p-${Math.random().toString(36).slice(2, 9)}`,
      props,
    };
    return { ...b, defs: getPatternDefs(b) };
  }, [getPatternDefs]);

  const distortColor = (hex: string, intensity: number = 15): string => {
    const r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);
    const adj = (c: number) =>
      Math.max(
        0,
        Math.min(255, c + Math.round((Math.random() - 0.5) * intensity)),
      )
        .toString(16)
        .padStart(2, "0");
    return `#${adj(r)}${adj(g)}${adj(b)}`;
  };


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
  const { phase, level, addScore, loseLife, nextLevel } = engine;

  const [gamePattern, setGamePattern] = useState<Pattern[]>([]);
  const [options, setOptions] = useState<GameOption[]>([]);
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const setupRound = useCallback(() => {
    const count = Math.min(Math.floor(level / 3) + 2, 8);
    const p = Array.from({ length: count }, () => generatePattern());
    setGamePattern(p);

    const tx = Math.floor(Math.random() * (svgSize - pieceSize));
    const ty = Math.floor(Math.random() * (svgSize - pieceSize));
    setTargetPos({ x: tx, y: ty });

    const correct: GameOption = { pattern: p, isCorrect: true };
    const distractors: GameOption[] = Array.from({ length: 3 }, () => {
      const wp = p.map((pi) => {
        const up = {
          ...pi,
          id: `p-${Math.random().toString(36).slice(2, 9)}`,
          rotation: pi.rotation + (Math.random() - 0.5) * (level + 5),
          size: pi.size * (0.9 + Math.random() * 0.2),
          backgroundColor: distortColor(pi.backgroundColor),
          foregroundColor: distortColor(pi.foregroundColor),
        };
        return { ...up, defs: getPatternDefs(up) };
      });
      return { pattern: wp, isCorrect: false };
    });

    setOptions([...distractors, correct].sort(() => Math.random() - 0.5));
    setSelectedAnswer(null);
  }, [level, generatePattern, getPatternDefs]);

  useEffect(() => {
    if (phase === "playing" && options.length === 0) {
      setupRound();
      playSound("slide");
    } else if (phase === "welcome") {
      setOptions([]);
      setGamePattern([]);
      setSelectedAnswer(null);
    }
  }, [phase, options.length, setupRound, playSound]);

  const handleAnswer = (option: GameOption, idx: number) => {
    if (phase !== "playing" || options.length === 0 || selectedAnswer !== null || !!feedbackState)
      return;

    setSelectedAnswer(idx);
    const correct = option.isCorrect;
    showFeedback(correct);
    playSound(correct ? "correct" : "wrong");

    safeTimeout(() => {
      dismissFeedback();
      if (correct) {
        addScore(100 + level * 20);
        nextLevel();
        if (level < MAX_LEVEL) {
          setupRound();
        }
      } else {
        loseLife();
        if (engine.lives > 1) {
          setupRound();
        }
      }
    }, 1500);
  };

  const skipQuestion = useCallback(() => {
    if (phase !== "playing" || selectedAnswer !== null || !!feedbackState) return;
    addScore(-50); // Engine addScore handles negative
    playSound("click");
    setupRound();
  }, [phase, setupRound, selectedAnswer, playSound, addScore, feedbackState]);

  const PatternSVG = ({
    pattern,
    size,
    viewBox,
    isMain = false,
  }: {
    pattern: Pattern[];
    size: number;
    viewBox?: string;
    isMain?: boolean;
  }) => (
    <svg
      width={size}
      height={size}
      viewBox={viewBox || `0 0 ${svgSize} ${svgSize}`}
      className="rounded-3xl overflow-hidden border-2 border-black/10"
    >
      {pattern.map((p, i) => (
        <React.Fragment key={`${p.id}-${i}`}>
          <defs dangerouslySetInnerHTML={{ __html: p.defs }} />
          <rect
            x="0"
            y="0"
            width={svgSize}
            height={svgSize}
            fill={`url(#${p.id})`}
            opacity={p.opacity}
            transform={`rotate(${p.rotation} ${svgSize / 2} ${svgSize / 2})`}
          />
        </React.Fragment>
      ))}
      {isMain && (
        <rect
          x={targetPos.x}
          y={targetPos.y}
          width={pieceSize}
          height={pieceSize}
          fill="white"
          stroke="black"
          strokeWidth="6"
          rx="16"
        />
      )}
    </svg>
  );

  const extraHudItems = (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={skipQuestion}
      disabled={phase !== "playing" || !!feedbackState}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border-2 border-black/10 transition-all shadow-neo-sm font-nunito font-bold text-sm text-black dark:text-white ${phase !== "playing" || !!feedbackState ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50"}`}
    >
      <RefreshCw
        size={16}
        className="stroke-[3] text-black dark:text-white"
      />
      <span>Atla</span>
    </motion.button>
  );

  const gameConfig = {
    title: "Parça Bütün",
    description: "Büyük desendeki eksik parçayı bul ve görsel algını test et. Renklerin ve desenlerin uyumuna dikkat et!",
    tuzoCode: "TUZÖ 4.2.1 Parça-Bütün İlişkileri",
    icon: Puzzle,
    accentColor: "cyber-green",
    maxLevel: MAX_LEVEL,
    backLink: "/atolyeler/tablet-degerlendirme",
    backLabel: "Tablet Değerlendirme",
    wideLayout: true,
    howToPlay: [
      <>Desendeki <strong>beyaz boşluğa</strong> odaklan</>,
      <>Aşağıdaki parçalardan <strong>uygun olanı</strong> seç</>,
      <>Hızlı ol, seviye ilerledikçe <strong>desenler karmaşıklaşır</strong>!</>,
    ],
    extraHudItems: phase === "playing" || phase === "feedback" ? extraHudItems : undefined,
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 sm:p-8 md:p-10 border-2 border-black/10 shadow-neo-sm dark:shadow-[16px_16px_0_#0f172a] text-center rotate-1 flex flex-col items-center">
            <span className="text-sm font-nunito font-black uppercase tracking-widest mb-6 flex items-center justify-center gap-2 bg-cyber-pink text-black px-4 py-2 rounded-full border-2 border-black/10 shadow-neo-sm">
              <Eye size={18} className="stroke-[3]" /> Deseni İncele
            </span>
            <div className="inline-block p-4 bg-slate-50 dark:bg-slate-700/50 rounded-[2rem] border-2 border-black/10 shadow-neo-sm">
              <PatternSVG
                pattern={gamePattern}
                size={svgSize}
                isMain={true}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 sm:p-8 md:p-10 border-2 border-black/10 shadow-neo-sm dark:shadow-[16px_16px_0_#0f172a] -rotate-1">
            <h2 className="text-3xl font-nunito font-black text-center mb-8 flex items-center justify-center gap-3 uppercase text-black dark:text-white">
              Eksik Parçayı Bul!
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {options.map((opt, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = isSelected && opt.isCorrect;
                const isWrong = isSelected && !opt.isCorrect;

                let btnClass = "bg-white dark:bg-slate-700 text-black";
                if (isCorrect) btnClass = "bg-cyber-green text-black";
                if (isWrong) btnClass = "bg-cyber-pink text-black";
                else if (selectedAnswer !== null && opt.isCorrect)
                  btnClass = "bg-cyber-green text-black";

                return (
                  <motion.button
                    key={idx}
                    whileTap={!selectedAnswer && !feedbackState ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(opt, idx)}
                    disabled={selectedAnswer !== null || !!feedbackState}
                    className={`p-4 rounded-3xl border-2 border-black/10 shadow-neo-sm hover:shadow-neo-sm flex items-center justify-center transition-colors ${btnClass}`}
                  >
                    <PatternSVG
                      pattern={opt.pattern}
                      size={120}
                      viewBox={`${targetPos.x} ${targetPos.y} ${pieceSize} ${pieceSize}`}
                    />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default PartWholeGame;
