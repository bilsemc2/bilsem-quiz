import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useGameFeedback } from "../../hooks/useGameFeedback";

import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { GAME_COLORS } from './shared/gameColors';

const MAX_LEVEL = 20;
const GAME_ID = "farki-bul";
const TIME_LIMIT = 180;

type DiffType = "lightness" | "hue" | "radius" | "scale" | "rotation" | "shape";

interface ShapeData {
  id: string;
  path: string;
}
interface TileStyle {
  hue: number;
  sat: number;
  light: number;
  radius: number;
  rotate: number;
  scale: number;
}
interface TileDecor {
  d1x: number;
  d1y: number;
  d1s: number;
  d2x: number;
  d2y: number;
  d2s: number;
}
interface TileData {
  index: number;
  style: TileStyle;
  shape: ShapeData;
  decor: TileDecor;
}
interface RoundData {
  size: number;
  total: number;
  oddIndex: number;
  diffType: DiffType;
  baseShape: ShapeData;
  oddShape: ShapeData;
  base: TileStyle;
  odd: TileStyle;
  perRoundTime: number;
}
const DIFF_LABELS: Record<DiffType, string> = {
  lightness: "Açıklık",
  hue: "Renk Tonu",
  radius: "Köşe",
  scale: "Boyut",
  rotation: "Açı",
  shape: "Şekil",
};
const SHAPES: ShapeData[] = [
  { id: "triangle", path: "M50 8 L92 88 L8 88 Z" },
  {
    id: "star",
    path: "M50 6 L62 34 L92 38 L68 56 L76 88 L50 70 L24 88 L32 56 L8 38 L38 34 Z",
  },
  { id: "hex", path: "M26 8 L74 8 L94 50 L74 92 L26 92 L6 50 Z" },
  { id: "kite", path: "M50 6 L88 40 L64 94 L36 94 L12 40 Z" },
  {
    id: "drop",
    path: "M50 6 C70 20 84 40 84 60 C84 80 68 94 50 94 C32 94 16 80 16 60 C16 40 30 20 50 6 Z",
  },
  {
    id: "blob",
    path: "M58 8 C74 10 90 24 92 42 C94 60 86 80 68 88 C50 96 30 92 18 78 C6 64 4 44 16 28 C28 12 42 6 58 8 Z",
  },
  { id: "diamond", path: "M50 4 L94 50 L50 96 L6 50 Z" },
  {
    id: "octagon",
    path: "M30 6 L70 6 L94 30 L94 70 L70 94 L30 94 L6 70 L6 30 Z",
  },
  { id: "hourglass", path: "M18 10 L82 10 L60 50 L82 90 L18 90 L40 50 Z" },
  {
    id: "chevron",
    path: "M8 32 L50 8 L92 32 L70 54 L92 76 L50 92 L8 76 L30 54 Z",
  },
  {
    id: "leaf",
    path: "M14 68 C24 38 48 16 72 14 C90 12 94 28 88 46 C80 74 52 92 28 88 C16 86 10 80 14 68 Z",
  },
  {
    id: "wave",
    path: "M8 60 C22 40 40 40 52 54 C64 68 82 68 92 50 C86 78 66 92 44 90 C24 88 10 78 8 60 Z",
  },
];
const GHOST_PATH =
  "M60 12 C78 14 92 30 90 48 C88 66 72 82 54 88 C36 94 16 88 10 70 C4 52 10 30 26 20 C40 10 46 10 60 12 Z";
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const createDecor = (): TileDecor => ({
  d1x: randInt(8, 58),
  d1y: randInt(6, 56),
  d1s: randInt(18, 32),
  d2x: randInt(32, 72),
  d2y: randInt(30, 70),
  d2s: randInt(12, 24),
});
const getLevelConfig = (lvl: number) => {
  const gridMin = Math.min(3 + Math.floor(lvl / 5), 5);
  const gridMax = Math.min(gridMin + 1, 6);
  const perRoundTime = Math.max(5, 15 - Math.floor(lvl / 3));
  const diffFactor = Math.max(0.3, 1 - (lvl - 1) * 0.035);
  const all: DiffType[] = [
    "lightness",
    "hue",
    "radius",
    "scale",
    "rotation",
    "shape",
  ];
  const types = all.slice(0, Math.min(all.length, 3 + Math.floor(lvl / 4)));
  return {
    gridMin,
    gridMax,
    perRoundTime,
    types,
    deltas: {
      lightness: Math.round(24 * diffFactor),
      hue: Math.round(22 * diffFactor),
      radius: Math.round(28 * diffFactor),
      scale: +(0.16 * diffFactor).toFixed(3),
      rotation: Math.round(14 * diffFactor),
    },
  };
};
const createRound = (lvl: number): RoundData => {
  const cfg = getLevelConfig(lvl);
  const size = randInt(cfg.gridMin, cfg.gridMax);
  const total = size * size;
  const oddIdx = randInt(0, total - 1);
  const diffType = pick(cfg.types);
  const baseShape = pick(SHAPES);
  const base: TileStyle = {
    hue: randInt(0, 360),
    sat: randInt(62, 88),
    light: randInt(50, 72),
    radius: randInt(10, 48),
    rotate: randInt(-10, 10),
    scale: 1,
  };
  const odd: TileStyle = { ...base };
  let oddShape = baseShape;
  const sign = Math.random() > 0.5 ? 1 : -1;
  if (diffType === "shape")
    oddShape = pick(SHAPES.filter((s) => s.id !== baseShape.id));
  else if (diffType === "lightness")
    odd.light = clamp(base.light + sign * cfg.deltas.lightness, 18, 82);
  else if (diffType === "hue")
    odd.hue = (base.hue + sign * cfg.deltas.hue + 360) % 360;
  else if (diffType === "radius")
    odd.radius = clamp(base.radius + sign * cfg.deltas.radius, 4, 70);
  else if (diffType === "scale")
    odd.scale = clamp(base.scale + sign * cfg.deltas.scale, 0.74, 1.22);
  else if (diffType === "rotation")
    odd.rotate = base.rotate + sign * cfg.deltas.rotation;
  return {
    size,
    total,
    oddIndex: oddIdx,
    diffType,
    baseShape,
    oddShape,
    base,
    odd,
    perRoundTime: cfg.perRoundTime,
  };
};

const Tile: React.FC<{
  tile: TileData;
  isOdd: boolean;
  isSelected: boolean;
  isRevealed: boolean;
  onClick: () => void;
  disabled: boolean;
}> = ({ tile, isOdd, isSelected, isRevealed, onClick, disabled }) => {
  const s = tile.style;
  const d = tile.decor;
  const isBrightTile = s.light >= 60;
  const innerHue = (s.hue + (isBrightTile ? 190 : 170) + 360) % 360;
  const innerSat = clamp(s.sat + 10, 45, 98);
  const innerLight = isBrightTile ? 22 : 88;
  const innerStroke = isBrightTile ? "rgba(0,0,0,0.78)" : "rgba(255,255,255,0.9)";
  const ghostLight = clamp(s.light + 22, 20, 94);
  const bgHighlightLight = clamp(s.light + 14, 12, 92);
  const bgBaseLight = clamp(s.light, 8, 86);

  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.95 }}
      animate={
        isRevealed && isOdd
          ? {
            scale: [1, 1.08, 1],
            boxShadow: [
              "0 0 0 4px rgba(52,211,153,0.3)",
              "0 0 0 8px rgba(52,211,153,0.5)",
              "0 0 0 4px rgba(52,211,153,0.3)",
            ],
          }
          : {}
      }
      transition={isRevealed && isOdd ? { duration: 1, repeat: Infinity } : {}}
      onClick={onClick}
      disabled={disabled}
      className="aspect-square relative overflow-hidden grid place-items-center rounded-2xl"
      style={{
        background: `radial-gradient(circle at 25% 20%, hsl(${s.hue} ${s.sat}% ${bgHighlightLight}%), hsl(${s.hue} ${s.sat}% ${bgBaseLight}%))`,
        borderRadius: `${s.radius}%`,
        transform: `rotate(${s.rotate}deg) scale(${s.scale})`,
        border:
          isRevealed && isOdd
            ? "4px solid #14f195"
            : isSelected
              ? "4px solid #ff2745"
              : "4px solid #000",
        boxShadow:
          isRevealed && isOdd
            ? "0 0 0 4px rgba(20,241,149,0.3), inset 0 -6px 12px rgba(0,0,0,0.15)"
            : isSelected
              ? "0 0 0 4px rgba(255,39,69,0.3), inset 0 -6px 12px rgba(0,0,0,0.15)"
              : "4px 4px 0 #000, inset 0 -4px 8px rgba(255,255,255,0.2)",
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <span
        className="absolute rounded-full pointer-events-none"
        style={{
          width: `${d.d1s}%`,
          height: `${d.d1s}%`,
          top: `${d.d1y}%`,
          left: `${d.d1x}%`,
          opacity: 0.45,
          background: `radial-gradient(circle at 30% 30%, hsla(${s.hue + 28}, ${s.sat}%, ${s.light + 26}%, 0.7), transparent 70%)`,
          filter: "blur(0.4px)",
        }}
      />
      <span
        className="absolute rounded-full pointer-events-none"
        style={{
          width: `${d.d2s}%`,
          height: `${d.d2s}%`,
          top: `${d.d2y}%`,
          left: `${d.d2x}%`,
          opacity: 0.35,
          background: `radial-gradient(circle at 70% 30%, hsla(${s.hue - 22}, ${s.sat}%, ${s.light + 22}%, 0.6), transparent 70%)`,
          filter: "blur(0.4px)",
        }}
      />
      <svg
        className="absolute pointer-events-none"
        style={{
          inset: "8%",
          fill: `hsl(${(s.hue + 36 + 360) % 360} ${s.sat}% ${ghostLight}%)`,
          opacity: 0.18,
        }}
        viewBox="0 0 100 100"
      >
        <path d={GHOST_PATH} />
      </svg>
      <svg
        className="absolute pointer-events-none"
        style={{
          inset: "18%",
          filter: isBrightTile
            ? "drop-shadow(0 2px 2px rgba(255,255,255,0.25))"
            : "drop-shadow(0 2px 2px rgba(0,0,0,0.35))",
          opacity: 0.98,
        }}
        viewBox="0 0 100 100"
      >
        <path
          d={tile.shape.path}
          fill={`hsl(${innerHue} ${innerSat}% ${innerLight}%)`}
          stroke={innerStroke}
          strokeWidth={4.5}
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
  );
};

const SpotDifferenceGame: React.FC = () => {
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
  });

  const feedback = useGameFeedback({
    duration: 1500,
  });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [roundTimeLeft, setRoundTimeLeft] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const startNewRound = useCallback((lvl: number) => {
    const data = createRound(lvl);
    setRoundData(data);
    setRoundTimeLeft(data.perRoundTime);
    setSelectedIndex(null);
  }, []);

  useEffect(() => {
    if (engine.phase === "playing" && !roundData) {
      startNewRound(1);
    }
  }, [engine.phase, roundData, startNewRound]);

  const handlePick = useCallback(
    (idx: number) => {
      if (!roundData || selectedIndex !== null || engine.phase !== "playing") return;
      const correct = idx === roundData.oddIndex;
      setSelectedIndex(idx);
      showFeedback(correct);
      playSound(correct ? "correct" : "incorrect");
      safeTimeout(() => {
        dismissFeedback();
        if (correct) {
          engine.addScore(10 * engine.level + Math.round(roundTimeLeft * 5));
          if (engine.level >= MAX_LEVEL) engine.setGamePhase("victory");
          else {
            engine.nextLevel();
            startNewRound(engine.level + 1);
          }
        } else {
          engine.loseLife();
          startNewRound(engine.level);
        }
      }, 1500);
    },
    [roundData, selectedIndex, engine, roundTimeLeft, startNewRound, playSound, showFeedback, dismissFeedback],
  );

  useEffect(() => {
    if (engine.phase !== "playing" || !roundData || selectedIndex !== null) return;
    const start = performance.now();
    let rId: number;
    const tick = (now: number) => {
      const el = (now - start) / 1000;
      const rem = Math.max(0, roundData.perRoundTime - el);
      setRoundTimeLeft(rem);
      if (rem <= 0) {
        handlePick(-1);
        return;
      }
      rId = requestAnimationFrame(tick);
    };
    rId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rId);
  }, [engine.phase, roundData, selectedIndex, handlePick]);

  const tiles = useMemo(() => {
    if (!roundData) return [];
    return Array.from({ length: roundData.total }, (_, idx) => ({
      index: idx,
      style: idx === roundData.oddIndex ? roundData.odd : roundData.base,
      shape: idx === roundData.oddIndex ? roundData.oddShape : roundData.baseShape,
      decor: createDecor(),
    }));
  }, [roundData]);

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Farkı Bul",
        icon: Eye,
        description: "Bir kare diğerlerinden farklı! Renk, şekil, boyut ve açı ipuçlarını gözlemle, farklı olanı bul.",
        howToPlay: [
          "Ekrana gelen grid içindeki farklı kareyi bul.",
          "Her round için üstteki süre barı dolmadan tıkla.",
        ],
        tuzoCode: "5.7.1 Seçici Dikkat",
        accentColor: "cyber-yellow",
        maxLevel: MAX_LEVEL,
      }}
    >
      {() => (
        <div className="w-full h-full flex flex-col items-center justify-center">
          {engine.phase === "playing" && roundData && (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-lg"
            >
              <div className="mb-6 h-4 bg-white dark:bg-slate-800 rounded-full overflow-hidden border-2 border-black/10 p-0.5 shadow-neo-sm -rotate-1">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${(roundTimeLeft / roundData.perRoundTime) * 100}%`,
                    background:
                      roundTimeLeft < 3
                        ? GAME_COLORS.pink // cyber-pink
                        : GAME_COLORS.blue, // cyber-blue
                    transition: "background 0.3s",
                  }}
                />
              </div>
              <div className="mb-6 text-center">
                <span className="px-5 py-2 bg-cyber-yellow rounded-xl border-2 border-black/10 text-sm font-nunito font-black text-black tracking-wider uppercase shadow-neo-sm rotate-2 inline-block">
                  Fark Tipi: {DIFF_LABELS[roundData.diffType]}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-black/10 shadow-neo-sm rotate-1">
                <div
                  className="grid gap-3 sm:gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${roundData.size}, minmax(0, 1fr))`,
                  }}
                >
                  {tiles.map((tile) => (
                    <Tile
                      key={tile.index}
                      tile={tile}
                      isOdd={tile.index === roundData.oddIndex}
                      isSelected={tile.index === selectedIndex}
                      isRevealed={!!feedbackState}
                      onClick={() => handlePick(tile.index)}
                      disabled={engine.phase !== "playing" || !!feedbackState}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </div>
      )}
    </BrainTrainerShell>
  );
};

export default SpotDifferenceGame;
