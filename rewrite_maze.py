import re

content = """import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "labirent";
const GAME_TITLE = "Labirent Koşusu";
const GAME_DESCRIPTION = "Parmağınla yolu çiz, duvarlara dokunmadan çıkışa ulaş! Uzamsal ilişki çözümleme ve görsel-motor koordinasyon.";
const TUZO_TEXT = "TUZÖ 5.3.3 Uzamsal İlişki Çözümleme";

const PLAYER_RADIUS = 4;
const START_PADDING = 10;

interface MazeCell {
  x: number;
  y: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
}

interface WallSeedSide {
  midOffset: number;
  thick: number;
}

interface WallSeed {
  top: WallSeedSide;
  right: WallSeedSide;
  bottom: WallSeedSide;
  left: WallSeedSide;
}

const generateMaze = (cols: number, rows: number): MazeCell[][] => {
  const grid: MazeCell[][] = [];
  for (let y = 0; y < rows; y++) {
    const row: MazeCell[] = [];
    for (let x = 0; x < cols; x++) {
      row.push({
        x,
        y,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      });
    }
    grid.push(row);
  }
  const stack: MazeCell[] = [];
  const startCell = grid[0][0];
  startCell.visited = true;
  stack.push(startCell);
  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const { x, y } = current;
    const neighbors: MazeCell[] = [];
    if (y > 0 && !grid[y - 1][x].visited) neighbors.push(grid[y - 1][x]);
    if (x < cols - 1 && !grid[y][x + 1].visited) neighbors.push(grid[y][x + 1]);
    if (y < rows - 1 && !grid[y + 1][x].visited) neighbors.push(grid[y + 1][x]);
    if (x > 0 && !grid[y][x - 1].visited) neighbors.push(grid[y][x - 1]);
    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      const dx = current.x - next.x;
      const dy = current.y - next.y;
      if (dx === 1) {
        current.walls.left = false;
        next.walls.right = false;
      } else if (dx === -1) {
        current.walls.right = false;
        next.walls.left = false;
      }
      if (dy === 1) {
        current.walls.top = false;
        next.walls.bottom = false;
      } else if (dy === -1) {
        current.walls.bottom = false;
        next.walls.top = false;
      }
      next.visited = true;
      stack.push(next);
    } else {
      stack.pop();
    }
  }
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) grid[y][x].visited = false;
  return grid;
};

const solveMaze = (maze: MazeCell[][]): Set<string> => {
  const rows = maze.length;
  const cols = maze[0].length;
  const end = maze[rows - 1][cols - 1];
  const queue: { cell: MazeCell; path: string[] }[] = [
    { cell: maze[0][0], path: ["0,0"] },
  ];
  const visited = new Set<string>(["0,0"]);
  while (queue.length > 0) {
    const { cell, path } = queue.shift()!;
    if (cell.x === end.x && cell.y === end.y) return new Set(path);
    const { x, y, walls } = cell;
    const adj: MazeCell[] = [];
    if (!walls.top && y > 0) adj.push(maze[y - 1][x]);
    if (!walls.right && x < cols - 1) adj.push(maze[y][x + 1]);
    if (!walls.bottom && y < rows - 1) adj.push(maze[y + 1][x]);
    if (!walls.left && x > 0) adj.push(maze[y][x - 1]);
    for (const n of adj) {
      const key = `${n.x},${n.y}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ cell: n, path: [...path, key] });
      }
    }
  }
  return new Set();
};

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const MazeRunnerGame: React.FC = () => {
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
    lives,
    addScore,
    loseLife,
    nextLevel,
  } = engine;

  // Local game state for maze logic
  const [canvasSize, setCanvasSize] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wallCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [maze, setMaze] = useState<MazeCell[][] | null>(null);
  const [solutionSet, setSolutionSet] = useState<Set<string>>(new Set());
  const [cellSize, setCellSize] = useState(0);
  const [path, setPath] = useState<{ x: number; y: number }[]>([]);
  const isDrawingRef = useRef(false);
  const [cols, setCols] = useState(5);
  const [rows, setRows] = useState(5);
  const [lastLogicalCell, setLastLogicalCell] = useState("0,0");
  const [wallSeeds, setWallSeeds] = useState<WallSeed[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 32, 480);
      setCanvasSize(maxWidth);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const initLevel = useCallback((lvl: number) => {
    const baseSize = 4;
    const sizeMultiplier = Math.floor(lvl / 2);
    const newCols = baseSize + Math.min(lvl, 8) + sizeMultiplier;
    const newRows = baseSize + Math.min(lvl, 8) + Math.floor(lvl * 0.3);
    setCols(newCols);
    setRows(newRows);
    
    const newMaze = generateMaze(newCols, newRows);
    setMaze(newMaze);
    setSolutionSet(solveMaze(newMaze));
    
    const seeds: WallSeed[] = [];
    newMaze.forEach((row) => {
      row.forEach(() => {
        seeds.push({
          top: { midOffset: rand(-5, 5), thick: rand(2, 2 + Math.min(lvl * 2.5, 25)) },
          right: { midOffset: rand(-5, 5), thick: rand(2, 2 + Math.min(lvl * 2.5, 25)) },
          bottom: { midOffset: rand(-5, 5), thick: rand(2, 2 + Math.min(lvl * 2.5, 25)) },
          left: { midOffset: rand(-5, 5), thick: rand(2, 2 + Math.min(lvl * 2.5, 25)) },
        });
      });
    });
    setWallSeeds(seeds);
    
    setPath([]);
    setLastLogicalCell("0,0");
    wallCanvasRef.current = null;
  }, []);

  useEffect(() => {
    if (phase === "playing" && !maze) {
      initLevel(level);
    } else if (phase === "welcome") {
      setMaze(null);
    }
  }, [phase, level, initLevel, maze]);

  const triggerShake = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(200);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  const handleCrash = useCallback(() => {
    if (phase !== "playing") return;
    triggerShake();
    playSound("incorrect");
    loseLife();
    
    // Original game resets position on crash
    setPath([]);
    setLastLogicalCell("0,0");
    
    showFeedback(false);
    const t = setTimeout(() => {
      dismissFeedback();
    }, 1000);
    timeoutsRef.current.push(t);
  }, [phase, triggerShake, playSound, loseLife, showFeedback, dismissFeedback]);

  const handleLevelComplete = useCallback(() => {
    playSound("correct");
    showFeedback(true);
    addScore(10 * level);
    
    const t = setTimeout(() => {
      dismissFeedback();
      nextLevel();
      initLevel(level + 1);
    }, 1500);
    timeoutsRef.current.push(t);
  }, [playSound, showFeedback, addScore, level, dismissFeedback, nextLevel, initLevel]);

  const checkWrongPath = (x: number, y: number) => {
    if (cellSize === 0) return;
    const lx = Math.floor(x / cellSize);
    const ly = Math.floor(y / cellSize);
    const key = `${lx},${ly}`;
    if (key !== lastLogicalCell) {
      setLastLogicalCell(key);
      if (!solutionSet.has(key)) {
        if (phase !== "playing") return;
        triggerShake();
        setWarning("YANLIŞ YOL!");
        setTimeout(() => setWarning(null), 1000);
        // Original game limited wrong paths to 3, then it was game over.
        // We will adapt this slightly in the new engine to just lose a life
        // to fit the centralized life system better, but warning is kept.
        loseLife();
      }
    }
  };

  const drawWobblyLine = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    seed: WallSeedSide,
  ) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const cx = midX + (y2 - y1) * 0.1 + seed.midOffset;
    const cy = midY + (x2 - x1) * 0.1 + seed.midOffset;
    ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.lineWidth = seed.thick;
    ctx.stroke();
  };

  const drawMazeToContext = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      isCollisionCanvas: boolean,
    ) => {
      if (!maze || !wallSeeds.length) return;
      const cs = width / Math.max(cols, rows);
      if (isCollisionCanvas) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "#FFFFFF";
      } else {
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = "#a78bfa";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowBlur = 5;
        ctx.shadowColor = "#c084fc";
      }
      maze.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const x = cell.x * cs;
          const y = cell.y * cs;
          const seedIndex = rowIndex * cols + colIndex;
          const seed = wallSeeds[seedIndex];
          if (!seed) return;
          if (cell.walls.top)
            drawWobblyLine(ctx, x - 2, y, x + cs + 2, y, seed.top);
          if (cell.walls.right)
            drawWobblyLine(ctx, x + cs, y - 2, x + cs, y + cs + 2, seed.right);
          if (cell.walls.bottom)
            drawWobblyLine(ctx, x + cs + 2, y + cs, x - 2, y + cs, seed.bottom);
          if (cell.walls.left)
            drawWobblyLine(ctx, x, y + cs + 2, x, y - 2, seed.left);
        });
      });
      return cs;
    },
    [maze, wallSeeds, cols, rows],
  );

  const updateWallCanvas = useCallback(() => {
    if (!maze || canvasSize === 0) return;
    if (!wallCanvasRef.current)
      wallCanvasRef.current = document.createElement("canvas");
    const wCanvas = wallCanvasRef.current;
    if (wCanvas.width !== canvasSize || wCanvas.height !== canvasSize) {
      wCanvas.width = canvasSize;
      wCanvas.height = canvasSize;
    }
    const wCtx = wCanvas.getContext("2d", { willReadFrequently: true });
    if (wCtx) drawMazeToContext(wCtx, canvasSize, canvasSize, true);
    return canvasSize;
  }, [drawMazeToContext, maze, canvasSize]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !maze || canvasSize === 0) return;
    const size = updateWallCanvas();
    if (!size) return;
    
    canvas.width = size;
    canvas.height = size;
    const cs = size / Math.max(cols, rows);
    setCellSize(cs);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    drawMazeToContext(ctx, size, size, false);
    
    // Start/End blobs
    const drawBlob = (bx: number, by: number, color: string) => {
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(bx + cs / 2, by + cs / 2, cs * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };
    
    drawBlob(0, 0, "#34d399"); // Start
    drawBlob((cols - 1) * cs, (rows - 1) * cs, "#f472b6"); // End
    
    // Player path
    if (path.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = lives > 1 ? "#818CF8" : "#ef4444";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 10;
      if (path.length > 1) {
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length - 2; i++) {
          const xc = (path[i].x + path[i + 1].x) / 2;
          const yc = (path[i].y + path[i + 1].y) / 2;
          ctx.quadraticCurveTo(path[i].x, path[i].y, xc, yc);
        }
        if (path.length > 2) {
          ctx.quadraticCurveTo(
            path[path.length - 2].x,
            path[path.length - 2].y,
            path[path.length - 1].x,
            path[path.length - 1].y,
          );
        } else {
          ctx.lineTo(path[1].x, path[1].y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      const head = path[path.length - 1];
      ctx.beginPath();
      ctx.fillStyle = "#ffffff";
      ctx.arc(head.x, head.y, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [
    maze,
    wallSeeds,
    path,
    updateWallCanvas,
    drawMazeToContext,
    cols,
    rows,
    canvasSize,
    lives,
  ]);

  const checkPixelCollision = (x: number, y: number) => {
    if (!wallCanvasRef.current) return false;
    const ctx = wallCanvasRef.current.getContext("2d");
    if (!ctx) return false;
    const r = PLAYER_RADIUS - 1;
    const points = [
      { x, y },
      { x: x + r, y },
      { x: x - r, y },
      { x, y: y + r },
      { x, y: y - r },
    ];
    for (const p of points) {
      try {
        if (
          p.x < 0 ||
          p.y < 0 ||
          p.x >= wallCanvasRef.current.width ||
          p.y >= wallCanvasRef.current.height
        )
          return true;
        const pixel = ctx.getImageData(p.x, p.y, 1, 1).data;
        if (pixel[0] > 100) return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const handleInputStart = (clientX: number, clientY: number) => {
    if (phase !== "playing" || !canvasRef.current || cellSize === 0 || feedbackState) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < cellSize && y < cellSize) { // Allowed start area
      isDrawingRef.current = true;
      setPath([{ x, y }]);
      setLastLogicalCell("0,0");
    }
  };

  const handleInputMove = (clientX: number, clientY: number) => {
    if (!isDrawingRef.current || phase !== "playing" || !canvasRef.current || feedbackState)
      return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    if (checkPixelCollision(x, y)) {
      isDrawingRef.current = false;
      handleCrash();
      return;
    }
    checkWrongPath(x, y);
    
    const endXStart = (cols - 1) * cellSize;
    const endYStart = (rows - 1) * cellSize;
    
    if (x > endXStart + START_PADDING && y > endYStart + START_PADDING) {
      isDrawingRef.current = false;
      handleLevelComplete();
      return;
    }
    
    setPath((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const dist = Math.hypot(x - last.x, y - last.y);
      if (dist > 3) return [...prev, { x, y }];
      return prev;
    });
  };

  const handleInputEnd = () => {
    isDrawingRef.current = false;
    // Don't clear path on lift so user can resume? Original code cleared.
    // Looking at original: `onMouseUp={handleInputEnd}` where `handleInputEnd = () => { isDrawingRef.current = false; setPath([]); }`
    // Sticking to original: must do it in one continuous stroke
    setPath([]);
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Compass,
    accentColor: "cyber-blue",
    maxLevel: 20,
    howToPlay: [
      "Yeşil noktadan başla",
      "Duvarlara dokunmadan çiz",
      "Pembe noktaya ulaş"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div 
          className={`relative z-10 flex flex-col items-center justify-center w-full max-w-lg flex-1 mt-2 mx-auto ${shake ? "animate-[shake_0.5s_cubic-bezier(.36,.07,.19,.97)_both]" : ""}`}
          style={{ touchAction: "none", overscrollBehavior: "none" }}
        >
          <AnimatePresence mode="wait">
            {!feedbackState && maze && (
               <motion.div
                key="playing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center w-full relative"
              >
                {/* Warning popup */}
                {warning && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, rotate: -2 }}
                    animate={{ opacity: 1, y: 0, rotate: 2 }}
                    className="absolute -top-12 z-40 pointer-events-none"
                  >
                    <span className="text-xl sm:text-2xl font-syne font-black text-white px-6 py-3 bg-cyber-pink border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] uppercase tracking-widest whitespace-nowrap">
                      {warning}
                    </span>
                  </motion.div>
                )}

                <div
                  ref={containerRef}
                  className="relative touch-none mt-4 bg-white dark:bg-slate-800 p-2 sm:p-4 rounded-[2rem] border-4 border-black shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#0f172a]"
                  style={{ width: canvasSize + 32, height: canvasSize + 32 }}
                >
                  <canvas
                    ref={canvasRef}
                    className="cursor-crosshair rounded-xl"
                    onClick={() => {}} // prevents default click behaviors causing issues
                    style={{ background: "transparent" }}
                    onMouseDown={(e) => handleInputStart(e.clientX, e.clientY)}
                    onMouseMove={(e) => handleInputMove(e.clientX, e.clientY)}
                    onMouseUp={handleInputEnd}
                    onMouseLeave={handleInputEnd}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleInputStart(
                        e.touches[0].clientX,
                        e.touches[0].clientY,
                      );
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      handleInputMove(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    onTouchEnd={handleInputEnd}
                  />
                </div>
              </motion.div>
            )}
            
            {/* The shell handles "game_over" and "victory" UI, as well as general feedback popups. */}
            
          </AnimatePresence>
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default MazeRunnerGame;
"""

with open("/Users/yetenekvezeka/bilsemc2/bilsem-quiz/src/components/BrainTrainer/MazeRunnerGame.tsx", "w") as f:
    f.write(content)
