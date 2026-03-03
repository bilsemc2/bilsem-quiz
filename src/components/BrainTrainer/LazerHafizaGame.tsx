import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Eye, Brain, Star, Zap } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { GAME_COLORS } from './shared/gameColors';

const GAME_ID = "lazer-hafiza";
const GAME_TITLE = "Lazer Hafıza";
const GAME_DESCRIPTION = "Noktalar arasındaki lazer yolunu izle ve hafızandan aynı yolu yeniden çiz!";
const TUZO_TEXT = "TUZÖ 5.4.2 Görsel Kısa Süreli Bellek";

interface Coordinate {
  row: number;
  col: number;
}

type LocalPhase = "preview" | "playing";

const generateRandomPath = (size: number, length: number, allowDiagonals: boolean): Coordinate[] => {
  let targetLength = length;
  const minLength = 2;

  while (targetLength >= minLength) {
    for (let attempts = 0; attempts < 200; attempts++) {
      const path: Coordinate[] = [];
      let currentRow = Math.floor(Math.random() * size);
      let currentCol = Math.floor(Math.random() * size);
      path.push({ row: currentRow, col: currentCol });

      let stuck = false;
      for (let i = 1; i < targetLength; i++) {
        const moves = [
          { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 },
        ];
        if (allowDiagonals) {
          moves.push({ r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 });
        }
        const validMoves = moves.filter((move) => {
          const newR = currentRow + move.r;
          const newC = currentCol + move.c;
          if (newR < 0 || newR >= size || newC < 0 || newC >= size) return false;
          if (path.some((p) => p.row === newR && p.col === newC)) return false;
          return true;
        });

        if (validMoves.length > 0) {
          const move = validMoves[Math.floor(Math.random() * validMoves.length)];
          currentRow += move.r;
          currentCol += move.c;
          path.push({ row: currentRow, col: currentCol });
        } else {
          stuck = true;
          break;
        }
      }
      if (!stuck && path.length === targetLength) return path;
    }
    targetLength--;
  }
  return [{ row: 0, col: 0 }, { row: 0, col: 1 }];
};

const getLevelConfig = (lvl: number) => {
  const gridSize = Math.min(6, 3 + Math.floor((lvl - 1) / 2));
  const pathLength = Math.min(gridSize * gridSize - 1, 3 + Math.floor((lvl - 1) * 0.8));
  const allowDiagonals = lvl >= 3;
  return { gridSize, pathLength, allowDiagonals };
};

const LazerHafizaGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const {
    phase,
    level,
    addScore,
    loseLife,
    nextLevel,
  } = engine;

  const [localPhase, setLocalPhase] = useState<LocalPhase>("preview");
  const [path, setPath] = useState<Coordinate[]>([]);
  const [userPath, setUserPath] = useState<Coordinate[]>([]);
  const [visiblePathIndex, setVisiblePathIndex] = useState(-1);
  const [canvasSize, setCanvasSize] = useState(0);

  const previewTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const updateSize = () => {
      setCanvasSize(Math.min(window.innerWidth - 32, 480));
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const config = getLevelConfig(level);

  const initLevel = useCallback((lvl: number) => {
    const cfg = getLevelConfig(lvl);
    const newPath = generateRandomPath(cfg.gridSize, cfg.pathLength, cfg.allowDiagonals);
    setPath(newPath);
    setUserPath([]);
    setVisiblePathIndex(-1);
    setLocalPhase("preview");
  }, []);

  useEffect(() => {
    if (phase === "playing" && path.length === 0) {
      initLevel(level);
    } else if (phase === "welcome") {
      setPath([]);
      setUserPath([]);
      setVisiblePathIndex(-1);
      setLocalPhase("preview");
    }
  }, [phase, level, path.length, initLevel]);

  useEffect(() => {
    if (phase === "playing" && localPhase === "preview" && path.length > 0) {
      let step = 0;
      setVisiblePathIndex(-1);

      const previewSpeed = Math.max(350, 700 - level * 20);

      const runPreview = () => {
        setVisiblePathIndex(step);
        step++;
        playSound("pop");
        if (step < path.length) {
          previewTimerRef.current = window.setTimeout(runPreview, previewSpeed);
        } else {
          previewTimerRef.current = window.setTimeout(() => {
            setVisiblePathIndex(-1);
            setLocalPhase("playing");
          }, 1000);
        }
      };
      previewTimerRef.current = window.setTimeout(runPreview, 400);
    }
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, [phase, localPhase, path, level, playSound]);

  const handleCellClick = (row: number, col: number) => {
    if (phase !== "playing" || localPhase !== "playing" || feedbackState) return;

    const expectedIndex = userPath.length;
    const expectedCoord = path[expectedIndex];
    if (!expectedCoord) return;

    const isCorrect = expectedCoord.row === row && expectedCoord.col === col;
    const newUserPath = [...userPath, { row, col }];
    setUserPath(newUserPath);
    playSound(isCorrect ? "pop" : "incorrect");

    if (isCorrect) {
      if (newUserPath.length === path.length) {
        const earnedPoints = level * 100 + path.length * 10;
        showFeedback(true);
        playSound("correct");

        previewTimerRef.current = window.setTimeout(() => {
          dismissFeedback();
          addScore(earnedPoints);
          nextLevel();
          if (level < 20) {
            initLevel(level + 1);
          }
        }, 1500);
      }
    } else {
      showFeedback(false);

      previewTimerRef.current = window.setTimeout(() => {
        dismissFeedback();
        loseLife();
        if (engine.lives > 1) {
          initLevel(level);
        }
      }, 1500);
    }
  };

  const getNodeState = (r: number, c: number) => {
    const isPreview = localPhase === "preview" && path.some((p, index) => index <= visiblePathIndex && p.row === r && p.col === c);
    const isUserActive = (localPhase === "playing" || feedbackState) && userPath.some((p) => p.row === r && p.col === c);

    let isHead = false;
    if (localPhase === "preview") {
      const currentHead = path[visiblePathIndex];
      isHead = !!(currentHead && currentHead.row === r && currentHead.col === c);
    } else if (localPhase === "playing" || feedbackState) {
      const lastUserMove = userPath[userPath.length - 1];
      isHead = !!(lastUserMove && lastUserMove.row === r && lastUserMove.col === c);
    }

    return { active: isPreview || isUserActive, isHead };
  };

  const previewSvgPath = useMemo(() => {
    if (localPhase !== "preview" || visiblePathIndex < 1) return "";
    const cellSize = 100 / config.gridSize;
    return path.slice(0, visiblePathIndex + 1).map((coord, i) => {
      const x = coord.col * cellSize + cellSize / 2;
      const y = coord.row * cellSize + cellSize / 2;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  }, [path, visiblePathIndex, localPhase, config.gridSize]);

  const userSvgPath = useMemo(() => {
    if (userPath.length < 2) return "";
    const cellSize = 100 / config.gridSize;
    return userPath.map((coord, i) => {
      const x = coord.col * cellSize + cellSize / 2;
      const y = coord.row * cellSize + cellSize / 2;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  }, [userPath, config.gridSize]);

  const gridTemplate = `repeat(${config.gridSize}, minmax(0, 1fr))`;
  const isWrongFeedback = feedbackState && !feedbackState.correct;

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Crosshair,
    accentColor: "cyber-green",
    maxLevel: 20,
    howToPlay: [
      "Lazer ışını noktalar arasında bir yol çizer — dikkatle izle",
      "Işın kaybolunca noktaları sırasıyla tıklayarak yolu yeniden oluştur",
      "Seviye ilerledikçe grid büyür, yol uzar, çapraz geçişler eklenir!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-4 mb-8 w-full">
          <AnimatePresence mode="wait">
            {phase === "playing" && path.length > 0 && (
              <motion.div
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={`mb-6 flex items-center gap-3 px-6 py-3 rounded-2xl font-nunito font-black uppercase tracking-widest text-sm border-2 border-black/10 shadow-neo-sm rotate-1 ${localPhase === "preview"
                    ? "bg-cyber-yellow text-black"
                    : feedbackState
                      ? feedbackState?.correct
                        ? "bg-cyber-green text-black"
                        : "bg-cyber-pink text-black"
                      : "bg-white dark:bg-slate-800 text-black dark:text-white"
                    }`}
                >
                  {localPhase === "preview" ? (
                    <>
                      <Eye size={22} className="text-black" /> Lazer Yolunu İzle!
                    </>
                  ) : feedbackState ? (
                    feedbackState?.correct ? (
                      <>
                        <Star size={22} className="text-black fill-black" /> Tam İsabet!
                      </>
                    ) : (
                      <>
                        <Brain size={22} className="text-black" /> Yanlış Sıra!
                      </>
                    )
                  ) : (
                    <>
                      <Brain size={22} className="text-black dark:text-white" /> Yolu Yeniden Çiz!
                    </>
                  )}
                </motion.div>

                <div
                  className="relative bg-[#FAF9F6] dark:bg-slate-800 rounded-3xl border-2 border-black/10 shadow-neo-sm dark:shadow-[8px_8px_0_#0f172a] p-4 sm:p-6"
                  style={{ width: canvasSize, height: canvasSize }}
                >
                  <svg
                    className="absolute inset-4 sm:inset-6 pointer-events-none z-10"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      <filter id="laserGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {localPhase === "preview" && previewSvgPath && (
                      <path d={previewSvgPath} stroke={GAME_COLORS.emerald} strokeWidth="3" fill="none" filter="url(#laserGlow)" strokeLinecap="round" strokeLinejoin="round" />
                    )}

                    {(localPhase === "playing" || feedbackState) && userSvgPath && (
                      <path d={userSvgPath} stroke={isWrongFeedback ? GAME_COLORS.incorrect : GAME_COLORS.emerald} strokeWidth="3" fill="none" filter="url(#laserGlow)" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </svg>

                  <div
                    className="grid w-full h-full relative z-20"
                    style={{ gridTemplateColumns: gridTemplate, gridTemplateRows: gridTemplate }}
                  >
                    {Array.from({ length: config.gridSize * config.gridSize }).map((_, i) => {
                      const r = Math.floor(i / config.gridSize);
                      const c = i % config.gridSize;
                      const { active, isHead } = getNodeState(r, c);

                      const dotSize = config.gridSize <= 4 ? "w-5 h-5" : "w-4 h-4";

                      let nodeStyle: React.CSSProperties = { background: "#cbd5e1", border: "4px solid #000", boxShadow: "4px 4px 0 #000" };
                      if (active) {
                        if (isWrongFeedback) {
                          nodeStyle = { background: GAME_COLORS.pink, border: "4px solid #000", boxShadow: "6px 6px 0 #000" };
                        } else {
                          nodeStyle = { background: GAME_COLORS.emerald, border: "4px solid #000", boxShadow: "6px 6px 0 #000" };
                        }
                      }
                      if (isHead) {
                        nodeStyle = { ...nodeStyle, background: isWrongFeedback ? GAME_COLORS.pink : "#fff", boxShadow: "8px 8px 0 #000", transform: "scale(1.3)" };
                      }

                      return (
                        <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} className="flex items-center justify-center cursor-pointer group min-w-[40px] min-h-[40px]">
                          <motion.div
                            className={`${dotSize} rounded-full transition-all duration-300`}
                            style={nodeStyle}
                            whileTap={localPhase === "playing" ? { scale: 0.9 } : {}}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {config.allowDiagonals && (
                  <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-bold tracking-wider">
                    <Zap size={14} /> ÇAPRAZ GEÇİŞLER AKTİF
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default LazerHafizaGame;
