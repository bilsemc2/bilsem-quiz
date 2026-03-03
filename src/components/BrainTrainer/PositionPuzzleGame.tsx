import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useGameEngine } from "./shared/useGameEngine";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { GAME_COLORS } from './shared/gameColors';

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = "konum-bulmaca";

type ShapeType = "circle" | "rect" | "triangle";

interface Point {
  x: number;
  y: number;
}

interface BaseShape {
  id: string;
  type: ShapeType;
  color: string;
  rotation: number;
}

interface CircleShape extends BaseShape {
  type: "circle";
  cx: number;
  cy: number;
  r: number;
}

interface RectShape extends BaseShape {
  type: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TriangleShape extends BaseShape {
  type: "triangle";
  p1: Point;
  p2: Point;
  p3: Point;
}

type Shape = CircleShape | RectShape | TriangleShape;

interface PuzzleOption {
  id: number;
  rotation: number;
  point: Point;
}

interface PuzzleState {
  shapes: Shape[];
  targetPoint: Point;
  options: PuzzleOption[];
  correctOptionId: number;
}

const SHAPE_COLORS_CYBERPOP = [
  GAME_COLORS.pink,
  "#00BFFF",
  "#00FF7F",
  GAME_COLORS.yellow,
  GAME_COLORS.purple,
];

const degreesToRadians = (deg: number) => deg * (Math.PI / 180);
const rotatePoint = (p: Point, center: Point, angleDeg: number): Point => {
  const rad = degreesToRadians(angleDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
};

const isPointInShape = (p: Point, s: Shape): boolean => {
  if (s.type === "circle")
    return Math.pow(p.x - s.cx, 2) + Math.pow(p.y - s.cy, 2) <= s.r * s.r;
  if (s.type === "rect") {
    const c = { x: s.x + s.w / 2, y: s.y + s.h / 2 };
    const u = rotatePoint(p, c, -s.rotation);
    return u.x >= s.x && u.x <= s.x + s.w && u.y >= s.y && u.y <= s.y + s.h;
  }
  const { p1, p2, p3 } = s;
  const d = (p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y);
  const a = ((p2.y - p3.y) * (p.x - p3.x) + (p3.x - p2.x) * (p.y - p3.y)) / d;
  const b = ((p3.y - p1.y) * (p.x - p3.x) + (p1.x - p3.x) * (p.y - p3.y)) / d;
  const c = 1 - a - b;
  return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
};

const INTERNAL_SIZE = 300;

const generatePuzzle = (lvl: number): PuzzleState | null => {
  const shapeCount = lvl <= 8 ? 2 : 3;
  for (let attempts = 0; attempts < 30; attempts++) {
    const shapes: Shape[] = [];
    const padding = 60;
    const minSize = 80;
    const maxSize = 140;

    const colors = [...SHAPE_COLORS_CYBERPOP].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shapeCount; i++) {
      const t = Math.floor(Math.random() * 3);
      const color = colors[i % colors.length];
      const rot = Math.floor(Math.random() * 360);
      const cx =
        Math.floor(Math.random() * (INTERNAL_SIZE - 2 * padding)) + padding;
      const cy =
        Math.floor(Math.random() * (INTERNAL_SIZE - 2 * padding)) + padding;

      if (t === 0)
        shapes.push({
          id: `s-${i}`,
          type: "circle",
          color,
          rotation: 0,
          cx,
          cy,
          r:
            Math.floor(Math.random() * (maxSize / 2 - minSize / 2)) +
            minSize / 2,
        });
      else if (t === 1) {
        const w = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
        const h = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
        shapes.push({
          id: `s-${i}`,
          type: "rect",
          color,
          rotation: rot,
          x: cx - w / 2,
          y: cy - h / 2,
          w,
          h,
        });
      } else {
        const s = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
        const h = (Math.sqrt(3) / 2) * s;
        const p1 = { x: cx, y: cy - (2 / 3) * h };
        const p2 = { x: cx - s / 2, y: cy + (1 / 3) * h };
        const p3 = { x: cx + s / 2, y: cy + (1 / 3) * h };
        shapes.push({
          id: `s-${i}`,
          type: "triangle",
          color,
          rotation: rot,
          p1: rotatePoint(p1, { x: cx, y: cy }, rot),
          p2: rotatePoint(p2, { x: cx, y: cy }, rot),
          p3: rotatePoint(p3, { x: cx, y: cy }, rot),
        });
      }
    }

    const regionMap = new Map<string, Point[]>();
    for (let i = 0; i < 600; i++) {
      const p = {
        x: Math.floor(Math.random() * INTERNAL_SIZE),
        y: Math.floor(Math.random() * INTERNAL_SIZE),
      };
      const sig = shapes
        .map((s) => (isPointInShape(p, s) ? "1" : "0"))
        .join("");
      if (!sig.includes("1")) continue;
      if (!regionMap.has(sig)) regionMap.set(sig, []);
      regionMap.get(sig)?.push(p);
    }

    const validRegions = Array.from(regionMap.entries()).filter(
      ([, p]) => p.length > 10,
    );
    if (validRegions.length < 2) continue;

    const intersect = validRegions.filter(
      ([s]) => s.split("1").length - 1 >= 2,
    );
    const [targetSig, targetPoints] =
      intersect.length > 0
        ? intersect[Math.floor(Math.random() * intersect.length)]
        : validRegions[Math.floor(Math.random() * validRegions.length)];

    const targetPoint =
      targetPoints[Math.floor(Math.random() * targetPoints.length)];
    const correctPoint =
      targetPoints[Math.floor(Math.random() * targetPoints.length)];
    const distractors = validRegions.filter(([s]) => s !== targetSig);

    if (distractors.length === 0) continue;

    const correctId = Math.floor(Math.random() * 4);
    const options: PuzzleOption[] = [];

    for (let i = 0; i < 4; i++) {
      const rot = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
      if (i === correctId) {
        options.push({ id: i, rotation: rot, point: correctPoint });
      } else {
        const [, dP] =
          distractors[Math.floor(Math.random() * distractors.length)];
        options.push({
          id: i,
          rotation: rot,
          point: dP[Math.floor(Math.random() * dP.length)],
        });
      }
    }

    return { shapes, targetPoint, options, correctOptionId: correctId };
  }
  return null;
};

const ShapeRenderer: React.FC<{
  shapes: Shape[];
  dot?: Point;
  rotation?: number;
  size?: number;
  showDot?: boolean;
}> = ({ shapes, dot, rotation = 0, size = 300, showDot = true }) => (
  <div className="relative" style={{ width: size, height: size }}>
    <svg
      viewBox={`0 0 ${INTERNAL_SIZE} ${INTERNAL_SIZE}`}
      width="100%"
      height="100%"
      className="transition-transform duration-500 ease-in-out"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <filter id="shadow">
        <feDropShadow
          dx="2"
          dy="2"
          stdDeviation="0"
          floodColor="#000"
          floodOpacity="1"
        />
      </filter>
      {shapes.map((s) => {
        const baseProps = {
          fill: s.color,
          fillOpacity: 0.8,
          stroke: "#000",
          strokeWidth: 4,
          filter: "url(#shadow)",
        };

        if (s.type === "circle")
          return <circle key={s.id} {...baseProps} cx={s.cx} cy={s.cy} r={s.r} />;
        if (s.type === "rect")
          return (
            <rect
              key={s.id}
              {...baseProps}
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              transform={`rotate(${s.rotation}, ${s.x + s.w / 2}, ${s.y + s.h / 2})`}
            />
          );
        return (
          <polygon
            key={s.id}
            {...baseProps}
            points={`${s.p1.x},${s.p1.y} ${s.p2.x},${s.p2.y} ${s.p3.x},${s.p3.y}`}
          />
        );
      })}
      {showDot && dot && (
        <circle
          cx={dot.x}
          cy={dot.y}
          r={8}
          fill="black"
          stroke="white"
          strokeWidth={4}
          filter="url(#shadow)"
        />
      )}
    </svg>
  </div>
);

const PositionPuzzleGame: React.FC = () => {
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const [canvasSize, setCanvasSize] = useState(300);

  const engine = useGameEngine({
    gameId: GAME_ID,
    timeLimit: TIME_LIMIT,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
  });

  const feedback = useGameFeedback({ duration: 1500 });
  const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const initLevel = useCallback((lvl: number) => {
    let p = generatePuzzle(lvl);
    let r = 0;
    while (!p && r < 5) {
      p = generatePuzzle(lvl);
      r++;
    }
    if (p) setPuzzle(p);
    setSelectedId(null);
  }, []);

  useEffect(() => {
    if (engine.phase === "playing" && !puzzle) {
      initLevel(engine.level);
    } else if (engine.phase !== "playing") {
      setPuzzle(null);
    }
  }, [engine.phase, engine.level, puzzle, initLevel]);

  useEffect(() => {
    const updateSize = () =>
      setCanvasSize(Math.min(window.innerWidth - 32, 480));
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleAnswer = (id: number) => {
    if (!puzzle || engine.phase !== "playing" || feedback.feedbackState) return;

    setSelectedId(id);
    const correct = id === puzzle.correctOptionId;
    feedback.showFeedback(correct);
    playSound(correct ? "correct" : "wrong");

    safeTimeout(() => {
      feedback.dismissFeedback();
      if (correct) {
        engine.addScore(20 * engine.level);
        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
          playSound("success");
        } else {
          initLevel(engine.level + 1);
        }
      } else {
        const willGameOver = engine.lives <= 1;
        engine.loseLife();
        if (willGameOver) {
          playSound("wrong");
        } else {
          initLevel(engine.level); // regenerate if wrong or keep the same? let's regenerate
        }
      }
    }, 1500);
  };

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Konum Bulmaca",
        description: "Şekillerin kesişim bölgelerini analiz et ve noktanın doğru konumunu belirle. Uzamsal ilişkileri çöz!",
        tuzoCode: "TUZÖ 5.5.3 Uzamsal İlişki",
        accentColor: "cyber-purple",
        icon: MapPin,
        wideLayout: true,
        howToPlay: [
          <span key="1"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-pink text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm rotate-2 mr-2">1</span> Üstteki şekil grubunda <strong>noktanın yerini</strong> incele</span>,
          <span key="2"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-yellow text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm -rotate-3 mr-2">2</span> Aynı <strong>mantıksal bölgedeki</strong> seçeneği bul</span>,
          <span key="3"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-blue text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm rotate-1 mr-2">3</span> Seçenekler <strong>döndürülmüş olabilir</strong>, dikkatli ol!</span>
        ]
      }}
    >
      {({ phase, feedbackState }) => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1">
          {phase === "playing" && puzzle && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 w-full max-w-5xl mx-auto"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-black/10 shadow-neo-sm text-center relative w-full flex items-center justify-center flex-col">
                <span className="text-xs font-nunito font-black uppercase tracking-widest mb-3 flex items-center justify-center gap-2 bg-cyber-yellow text-black px-3 py-1.5 rounded-full border-2 border-black/10 shadow-neo-sm">
                  Analiz Edilecek Konum
                </span>

                <div className="bg-[#FAF9F6] dark:bg-slate-700/50 rounded-xl p-2 border-2 border-black/10 shadow-inner inline-block aspect-square flex items-center justify-center w-full max-w-[280px]">
                  <ShapeRenderer
                    shapes={puzzle.shapes}
                    dot={puzzle.targetPoint}
                    size={Math.min(canvasSize * 0.55, 220)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                {puzzle.options.map((opt, index) => {
                  const buttonColors = [
                    "bg-cyber-pink",
                    "bg-cyber-blue",
                    "bg-cyber-green",
                    "bg-cyber-purple",
                  ];

                  const isSel = selectedId === opt.id;
                  const isCorrectOption = opt.id === puzzle.correctOptionId;
                  const hasSelected = selectedId !== null;

                  let btnBorder = "border-black/10";
                  let btnBg = "bg-white dark:bg-slate-800";
                  let btnExtra = "";

                  if (hasSelected) {
                    if (isSel && isCorrectOption) {
                      btnBorder = "border-cyber-green";
                      btnBg = "bg-cyber-green/15";
                      btnExtra = "ring-2 ring-cyber-green shadow-none translate-y-1";
                    } else if (isSel && !isCorrectOption) {
                      btnBorder = "border-cyber-pink";
                      btnBg = "bg-cyber-pink/15";
                      btnExtra = "ring-2 ring-cyber-pink shadow-none translate-y-1";
                    } else if (!isSel && isCorrectOption) {
                      btnBorder = "border-cyber-green";
                      btnBg = "bg-cyber-green/10";
                      btnExtra = "ring-2 ring-cyber-green";
                    } else {
                      btnExtra = "opacity-40";
                    }
                  }

                  return (
                    <motion.button
                      key={opt.id}
                      whileTap={!feedbackState ? { scale: 0.95 } : {}}
                      onClick={() => handleAnswer(opt.id)}
                      disabled={!!feedbackState}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 ${btnBorder} transition-all p-2 lg:p-3 ${btnBg} shadow-neo-sm disabled:cursor-not-allowed flex items-center justify-center active:translate-y-1 active:shadow-none ${btnExtra}`}
                    >
                      <ShapeRenderer
                        shapes={puzzle.shapes}
                        dot={opt.point}
                        rotation={opt.rotation}
                        size={Math.min(canvasSize * 0.45, 180)}
                      />

                      <div
                        className={`absolute top-1.5 left-1.5 w-7 h-7 ${buttonColors[index % buttonColors.length]} border-2 border-black/10 rounded-md flex items-center justify-center text-xs font-nunito font-black text-black shadow-neo-sm`}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>
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

export default PositionPuzzleGame;
