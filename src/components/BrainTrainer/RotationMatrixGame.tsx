import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RotateCw, Eye } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useGameEngine } from "./shared/useGameEngine";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { GAME_COLORS } from './shared/gameColors';

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = "rotasyon-matrisi";

type Stick = {
  color: string;
  isVertical: boolean;
  x: number;
  y: number;
  length: number;
};

type Shape = { id: string; type: "sticks"; rotation: number; sticks: Stick[] };

interface GameOption {
  shape: Shape;
  isCorrect: boolean;
}

const COLORS = [
  GAME_COLORS.pink,
  GAME_COLORS.emerald,
  GAME_COLORS.yellow,
  GAME_COLORS.orange,
  GAME_COLORS.purple,
  "#55E6C1",
  GAME_COLORS.pink,
  "#FAB1A0",
  "#00D2D3",
  "#54A0FF",
];

const ShapeSVG = ({ shape, size }: { shape: Shape; size: number }) => {
  const c = size / 2,
    w = 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <motion.g
        animate={{ rotate: shape.rotation }}
        style={{ originX: "50%", originY: "50%" }}
      >
        {shape.sticks.map((s, i) => (
          <rect
            key={i}
            x={c + s.x - (s.isVertical ? w / 2 : s.length / 2)}
            y={c + s.y - (s.isVertical ? s.length / 2 : w / 2)}
            width={s.isVertical ? w : s.length}
            height={s.isVertical ? s.length : w}
            fill={s.color}
            rx={w / 2}
            stroke="black"
            strokeWidth="2"
          />
        ))}
        <circle cx={c} cy={c} r="4" fill="black" />
      </motion.g>
    </svg>
  );
};

const RotationMatrixGame: React.FC = () => {
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();

  const engine = useGameEngine({
    gameId: GAME_ID,
    timeLimit: TIME_LIMIT,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
  });

  const feedback = useGameFeedback({ duration: 1500 });

  const [sequence, setSequence] = useState<Shape[]>([]);
  const [targetIndex, setTargetIndex] = useState<number>(-1);
  const [options, setOptions] = useState<GameOption[]>([]);

  const generateShape = useCallback((): Shape => {
    const num = 3 + Math.floor(Math.random() * 4),
      sticks: Stick[] = [];
    const ox = (Math.random() - 0.5) * 10,
      oy = (Math.random() - 0.5) * 10;
    for (let i = 0; i < num; i++) {
      const v = Math.random() > 0.5,
        c = COLORS[Math.floor(Math.random() * COLORS.length)];
      sticks.push({
        color: c,
        isVertical: v,
        x: ox + (v ? (Math.random() - 0.5) * 44 : (Math.random() - 0.5) * 12),
        y: oy + (v ? (Math.random() - 0.5) * 12 : (Math.random() - 0.5) * 44),
        length: 45 + Math.random() * 45,
      });
    }
    sticks.push({
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      isVertical: Math.random() > 0.5,
      x: 22 + Math.random() * 8,
      y: -22 - Math.random() * 8,
      length: 35,
    });
    return {
      id: `inf-${Math.random().toString(36).slice(2, 11)}`,
      type: "sticks",
      rotation: 0,
      sticks,
    };
  }, []);

  const setupLevel = useCallback(() => {
    const steps = [45, 90, 135],
      step = steps[Math.floor(Math.random() * steps.length)];
    const base = generateShape(),
      newSeq: Shape[] = [];
    for (let i = 0; i < 9; i++)
      newSeq.push({
        ...base,
        rotation: (i * step) % 360,
        id: `step-${i}-${Math.random()}`,
      });
    const target = Math.floor(Math.random() * 9);
    setSequence(newSeq);
    setTargetIndex(target);
    const correct = newSeq[target],
      corrRot = Math.round(correct.rotation % 360);
    const distractors: GameOption[] = [],
      used = [corrRot],
      rots = [0, 45, 90, 135, 180, 225, 270, 315];

    while (distractors.length < 3) {
      const r = rots[Math.floor(Math.random() * rots.length)];
      if (!used.includes(r)) {
        distractors.push({
          shape: {
            ...base,
            rotation: r,
            id: `w-${distractors.length}-${Math.random()}`,
          },
          isCorrect: false,
        });
        used.push(r);
      }
    }
    setOptions(
      [...distractors, { shape: correct, isCorrect: true }].sort(
        () => Math.random() - 0.5,
      ),
    );
  }, [generateShape]);

  useEffect(() => {
    if (engine.phase === "playing" && sequence.length === 0) {
      setupLevel();
      playSound("slide");
    } else if (engine.phase !== "playing" && sequence.length > 0) {
      setSequence([]);
    }
  }, [engine.phase, sequence.length, setupLevel, playSound]);

  const handleSelect = (opt: GameOption) => {
    if (engine.phase !== "playing" || feedback.feedbackState) return;
    const correct = opt.isCorrect;
    feedback.showFeedback(correct);
    playSound(correct ? "correct" : "wrong");

    safeTimeout(() => {
      feedback.dismissFeedback();
      if (correct) {
        engine.addScore(10 * engine.level);
        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
          playSound("success");
        } else {
          engine.nextLevel();
          setupLevel();
        }
      } else {
        const willGameOver = engine.lives <= 1;
        engine.loseLife();
        if (willGameOver) {
          playSound("wrong");
        } else {
          setupLevel();
        }
      }
    }, 1500);
  };

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Rotasyon Matrisi",
        description: "Şekillerin dönüş kuralını keşfet ve eksik parçayı bul. Uzamsal zekanı galaksiler arası bir teste sok!",
        tuzoCode: "TUZÖ 4.1.1 Uzamsal Akıl Yürütme",
        accentColor: "cyber-purple",
        icon: RotateCw,
        backLink: "/atolyeler/tablet-degerlendirme",
        backLabel: "Tablet Değerlendirme",
        wideLayout: true,
        howToPlay: [
          <span key="1"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-pink text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm rotate-2 mr-2">1</span> 3x3 Izgaradaki şekillerin <strong>nasıl döndüğünü</strong> anla</span>,
          <span key="2"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-yellow text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm -rotate-3 mr-2">2</span> Soru işaretli yere gelmesi gereken <strong>doğru şekli</strong> bul</span>,
          <span key="3"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-blue text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm rotate-1 mr-2">3</span> 45°, 90° ve 135°'lik dönüş kurallarına <strong>odaklan</strong></span>
        ]
      }}
    >
      {({ phase, feedbackState }) => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1 w-full">
          {phase === "playing" && sequence.length > 0 && (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-center"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border-2 border-black/10 shadow-neo-sm text-center">
                <span className="text-xs font-nunito font-black uppercase tracking-widest mb-4 flex items-center justify-center gap-2 bg-cyber-yellow text-black px-3 py-1.5 rounded-full border-2 border-black/10 shadow-neo-sm inline-flex">
                  <Eye size={14} className="stroke-[3]" /> Matrisi Analiz Et
                </span>

                <div className="grid grid-cols-3 gap-2 w-full max-w-[300px] mx-auto p-3 bg-[#FAF9F6] dark:bg-slate-700/50 rounded-xl border-2 border-black/10 shadow-inner">
                  {sequence.map((s, i) => (
                    <div
                      key={s.id}
                      className={`aspect-square rounded-xl flex items-center justify-center relative transition-colors border-2 border-black/10 shadow-neo-sm ${i === targetIndex ? "bg-cyber-purple/20" : "bg-white dark:bg-slate-800"}`}
                    >
                      <span className="absolute top-0.5 left-1.5 text-[9px] font-nunito font-bold text-slate-400 select-none">
                        {i + 1}
                      </span>
                      {i === targetIndex ? (
                        <div className="text-black dark:text-white font-nunito font-black text-3xl animate-pulse">
                          ?
                        </div>
                      ) : (
                        <ShapeSVG shape={s} size={55} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border-2 border-black/10 shadow-neo-sm">
                <h2 className="text-xl font-nunito font-black text-center mb-4 flex items-center justify-center gap-2 text-black dark:text-white uppercase tracking-tight">
                  Doğru Seçeneği Bul
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  {options.map((opt, index) => {
                    const buttonColors = [
                      "bg-cyber-pink",
                      "bg-cyber-blue",
                      "bg-cyber-green",
                      "bg-cyber-yellow",
                    ];

                    return (
                      <motion.button
                        key={opt.shape.id}
                        whileTap={!feedbackState ? { scale: 0.95 } : {}}
                        onClick={() => handleSelect(opt)}
                        disabled={!!feedbackState}
                        className="relative aspect-square rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 border-2 border-black/10 transition-all shadow-neo-sm active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        <div className={`absolute top-1.5 left-1.5 w-6 h-6 ${buttonColors[index % buttonColors.length]} border-2 border-black/10 rounded-md flex items-center justify-center text-xs font-nunito font-black text-black shadow-neo-sm`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <ShapeSVG shape={opt.shape} size={70} />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default RotationMatrixGame;
