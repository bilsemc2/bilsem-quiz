import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Box, Square, Circle, Triangle, Star, Heart, Diamond } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { GAME_COLORS } from './shared/gameColors';

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
type FaceName = "FRONT" | "BACK" | "LEFT" | "RIGHT" | "TOP" | "BOTTOM";
interface FaceContent {
  color: string;
  icon: React.ElementType;
  name: string;
}
interface CubeNet {
  name: string;
  grid: (FaceName | null)[][];
}
interface GameOption {
  rotation: { x: number; y: number };
  isCorrect: boolean;
  id: string;
}
const COLORS = [
  { name: "Red", hex: GAME_COLORS.pink },
  { name: "Teal", hex: GAME_COLORS.emerald },
  { name: "Yellow", hex: GAME_COLORS.yellow },
  { name: "Orange", hex: GAME_COLORS.orange },
  { name: "Purple", hex: GAME_COLORS.purple },
  { name: "Pink", hex: GAME_COLORS.pink },
];
const ICONS = [
  { icon: Square, name: "Kare" },
  { icon: Circle, name: "Daire" },
  { icon: Triangle, name: "Üçgen" },
  { icon: Star, name: "Yıldız" },
  { icon: Heart, name: "Kalp" },
  { icon: Diamond, name: "Baklava" },
];
const NET_LAYOUTS: CubeNet[] = [
  {
    name: "1-4-1 (T)",
    grid: [
      [null, "TOP", null, null],
      ["LEFT", "FRONT", "RIGHT", "BACK"],
      [null, "BOTTOM", null, null],
    ],
  },
  {
    name: "1-4-1 (L)",
    grid: [
      ["TOP", null, null, null],
      ["BACK", "RIGHT", "FRONT", "LEFT"],
      [null, null, null, "BOTTOM"],
    ],
  },
  {
    name: "1-4-1 (Z)",
    grid: [
      [null, "TOP", null, null],
      ["BACK", "RIGHT", "FRONT", null],
      [null, null, "LEFT", "BOTTOM"],
    ],
  },
  {
    name: "2-3-1 (A)",
    grid: [
      ["TOP", "BACK", null, null],
      [null, "RIGHT", "FRONT", "LEFT"],
      [null, null, null, "BOTTOM"],
    ],
  },
  {
    name: "2-2-2 (Basamak)",
    grid: [
      ["TOP", "BACK", null],
      [null, "RIGHT", "FRONT"],
      [null, null, "LEFT"],
      [null, null, "BOTTOM"],
    ],
  },
  {
    name: "3-3 (Merdiven)",
    grid: [
      ["TOP", "BACK", "RIGHT", null, null],
      [null, null, "FRONT", "LEFT", "BOTTOM"],
    ],
  },
];
const GAME_ID = "sihirli-kupler";
const GAME_TITLE = "Sihirli Küpler";
const GAME_DESCRIPTION = "Küp açınımını zihninde katla ve oluşacak doğru küpü bul! Üç boyutlu düşünme becerini test et.";
const TUZO_TEXT = "TUZÖ 4.2.1 3B Uzayda Görselleştirme";

const MagicCubeGame: React.FC = () => {
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

  const [isFolding, setIsFolding] = useState(false);
  const [currentNet, setCurrentNet] = useState<CubeNet>(NET_LAYOUTS[0]);
  const [facesData, setFacesData] = useState<Record<FaceName, FaceContent>>(
    {} as Record<FaceName, FaceContent>
  );
  const [options, setOptions] = useState<GameOption[]>([]);

  const generateLevel = useCallback(() => {
    setIsFolding(false);
    const net = NET_LAYOUTS[Math.floor(Math.random() * NET_LAYOUTS.length)];
    setCurrentNet(net);
    const newFacesData: Partial<Record<FaceName, FaceContent>> = {};
    const sc = [...COLORS].sort(() => Math.random() - 0.5);
    const si = [...ICONS].sort(() => Math.random() - 0.5);
    ["FRONT", "BACK", "LEFT", "RIGHT", "TOP", "BOTTOM"].forEach((n, i) => {
      newFacesData[n as FaceName] = {
        color: sc[i % sc.length].hex,
        icon: si[i % si.length].icon,
        name: si[i % si.length].name,
      };
    });
    setFacesData(newFacesData as Record<FaceName, FaceContent>);
    const cor: GameOption = {
      rotation: { x: -20, y: 35 },
      isCorrect: true,
      id: "correct",
    };
    const w1: GameOption = {
      rotation: { x: 160, y: 45 },
      isCorrect: false,
      id: "w1",
    };
    const w2: GameOption = {
      rotation: { x: 45, y: -160 },
      isCorrect: false,
      id: "w2",
    };
    setOptions([cor, w1, w2].sort(() => Math.random() - 0.5));
  }, []);

  useEffect(() => {
    if (phase === "playing" && options.length === 0) {
      generateLevel();
      playSound("slide");
    } else if (phase === "welcome") {
      setOptions([]);
    }
  }, [phase, options.length, generateLevel, playSound]);

  const handleSelect = (opt: GameOption) => {
    if (phase !== "playing" || feedbackState) return;
    const ok = opt.isCorrect;
    showFeedback(ok);
    playSound(ok ? "correct" : "incorrect");

    if (ok) {
      addScore(20 * level);
      safeTimeout(() => {
        dismissFeedback();
        nextLevel();
        if (level < MAX_LEVEL) {
          setOptions([]); // triggers generateLevel
        }
      }, 1500);
    } else {
      loseLife();
      safeTimeout(() => {
        dismissFeedback();
        if (engine.lives > 1) {
          setIsFolding(true);
          safeTimeout(() => {
            setOptions([]); // triggers generateLevel
          }, 1500);
        }
      }, 1500);
    }
  };

  const Cube3D = ({
    rotation,
    size = 100,
    data,
  }: {
    rotation: { x: number; y: number };
    size?: number;
    data: Record<FaceName, FaceContent>;
  }) => {
    const h = size / 2;
    if (!data.FRONT) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const face = (t: string, c: string, _icon: React.ElementType) => ({
      position: "absolute" as const,
      width: size,
      height: size,
      transform: t,
      backgroundColor: c,
      border: "2px solid rgba(255,255,255,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backfaceVisibility: "hidden" as const,
      borderRadius: "12px",
      boxShadow:
        "inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2)",
    });
    return (
      <div style={{ perspective: "800px", width: size, height: size }}>
        <motion.div
          animate={{ rotateX: rotation.x, rotateY: rotation.y }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
          }}
        >
          <div style={face(`translateZ(${h}px)`, data.FRONT.color, data.FRONT.icon)}>
            <data.FRONT.icon size={size * 0.5} color="white" />
          </div>
          <div style={face(`translateZ(-${h}px) rotateY(180deg)`, data.BACK.color, data.BACK.icon)}>
            <data.BACK.icon size={size * 0.5} color="white" />
          </div>
          <div style={face(`translateX(-${h}px) rotateY(-90deg)`, data.LEFT.color, data.LEFT.icon)}>
            <data.LEFT.icon size={size * 0.5} color="white" />
          </div>
          <div style={face(`translateX(${h}px) rotateY(90deg)`, data.RIGHT.color, data.RIGHT.icon)}>
            <data.RIGHT.icon size={size * 0.5} color="white" />
          </div>
          <div style={face(`translateY(-${h}px) rotateX(90deg)`, data.TOP.color, data.TOP.icon)}>
            <data.TOP.icon size={size * 0.5} color="white" />
          </div>
          <div style={face(`translateY(${h}px) rotateX(-90deg)`, data.BOTTOM.color, data.BOTTOM.icon)}>
            <data.BOTTOM.icon size={size * 0.5} color="white" />
          </div>
        </motion.div>
      </div>
    );
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Box,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    backLink: "/atolyeler/tablet-degerlendirme",
    backLabel: "Tablet Değerlendirme",
    wideLayout: true,
    howToPlay: [
      "Küp açınımını dikkatle incele.",
      "Harita üzerindeki sembolleri zihninde eşleştir.",
      "Katlandığında hangi küpün oluşacağını işaretle."
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full max-w-5xl mx-auto">
          {phase === "playing" && facesData.FRONT && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border-2 border-black/10 shadow-neo-sm flex flex-col items-center gap-4">
                  <div className="relative w-[260px] h-[260px] flex items-center justify-center" style={{ perspective: "1200px" }}>
                    <motion.div
                      animate={isFolding ? { rotateX: -20, rotateY: 35 } : { rotateX: 0, rotateY: 0 }}
                      transition={{ duration: 2 }}
                      style={{
                        position: "relative",
                        width: "60px",
                        height: "60px",
                        transformStyle: "preserve-3d",
                      }}
                    >
                      {currentNet.grid.map((row, rIdx) =>
                        row.map((f, cIdx) => {
                          if (!f || !facesData[f]) return null;
                          let fR = 0, fC = 0;
                          currentNet.grid.forEach((r, ri) => r.forEach((x, ci) => {
                            if (x === "FRONT") { fR = ri; fC = ci; }
                          }));
                          const relR = rIdx - fR, relC = cIdx - fC;
                          const s = 60;
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const T: Record<FaceName, any> = {
                            FRONT: { rx: 0, ry: 0, rz: 0, tx: 0, ty: 0, tz: s / 2 },
                            BACK: { rx: 0, ry: 180, rz: 0, tx: 0, ty: 0, tz: -s / 2 },
                            LEFT: { rx: 0, ry: -90, rz: 0, tx: -s / 2, ty: 0, tz: 0 },
                            RIGHT: { rx: 0, ry: 90, rz: 0, tx: s / 2, ty: 0, tz: 0 },
                            TOP: { rx: 90, ry: 0, rz: 0, tx: 0, ty: -s / 2, tz: 0 },
                            BOTTOM: { rx: -90, ry: 0, rz: 0, tx: 0, ty: s / 2, tz: 0 },
                          };
                          const t = T[f];
                          return (
                            <motion.div
                              key={f}
                              animate={isFolding ? { x: t.tx, y: t.ty, z: t.tz, rotateX: t.rx, rotateY: t.ry, rotateZ: t.rz } : { x: relC * s, y: relR * s, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0 }}
                              transition={{ duration: 1.5 }}
                              className="absolute inset-0 border-2 border-black/10 flex items-center justify-center shadow-neo-sm"
                              style={{ backgroundColor: facesData[f].color, backfaceVisibility: "hidden", transformStyle: "preserve-3d" }}
                            >
                              {React.createElement(facesData[f].icon, {
                                size: 30, color: "white", strokeWidth: 3, className: "filter drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]",
                              })}
                            </motion.div>
                          );
                        })
                      )}
                    </motion.div>
                  </div>
                  <button
                    onClick={() => setIsFolding(!isFolding)}
                    className="px-6 py-3 bg-cyber-pink text-black font-nunito font-black rounded-xl text-sm active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 border-2 border-black/10 shadow-neo-sm uppercase tracking-widest"
                  >
                    {isFolding ? "AÇINIMI GÖSTER" : "KATLI HALİNİ GÖR"}
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border-2 border-black/10 shadow-neo-sm text-center">
                  <h2 className="text-xl font-black mb-4 uppercase tracking-widest text-cyber-blue font-nunito flex items-center justify-center gap-2">
                    <Box size={22} className="stroke-[3]" />
                    DOĞRU KÜPÜ SEÇ
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {options.map((opt) => (
                      <motion.button
                        key={opt.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelect(opt)}
                        className="p-4 rounded-xl transition-all duration-300 border-2 border-black/10 bg-slate-50 dark:bg-slate-700 shadow-neo-sm active:translate-y-1 active:shadow-none flex items-center justify-center"
                      >
                        <Cube3D rotation={opt.rotation} size={65} data={facesData} />
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      )}
    </BrainTrainerShell>
  );
};

export default MagicCubeGame;
