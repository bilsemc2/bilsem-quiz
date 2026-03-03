import React, { useState, useReducer, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { GAME_COLORS } from './shared/gameColors';
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

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

interface WallSeedSide { midOffset: number; thick: number; }
interface WallSeed { top: WallSeedSide; right: WallSeedSide; bottom: WallSeedSide; left: WallSeedSide; }

// --- Pure utility functions ---

const generateMaze = (cols: number, rows: number): MazeCell[][] => {
  const grid: MazeCell[][] = [];
  for (let y = 0; y < rows; y++) {
    const row: MazeCell[] = [];
    for (let x = 0; x < cols; x++) {
      row.push({ x, y, walls: { top: true, right: true, bottom: true, left: true }, visited: false });
    }
    grid.push(row);
  }
  const stack: MazeCell[] = [];
  grid[0][0].visited = true;
  stack.push(grid[0][0]);
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
      if (dx === 1) { current.walls.left = false; next.walls.right = false; }
      else if (dx === -1) { current.walls.right = false; next.walls.left = false; }
      if (dy === 1) { current.walls.top = false; next.walls.bottom = false; }
      else if (dy === -1) { current.walls.bottom = false; next.walls.top = false; }
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
  const queue: { cell: MazeCell; path: string[] }[] = [{ cell: maze[0][0], path: ["0,0"] }];
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

const drawWobblyLine = (
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  seed: WallSeedSide,
) => {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  const mx = (x1 + x2) / 2 + (y2 - y1) * 0.1 + seed.midOffset;
  const my = (y1 + y2) / 2 + (x2 - x1) * 0.1 + seed.midOffset;
  ctx.quadraticCurveTo(mx, my, x2, y2);
  ctx.lineWidth = seed.thick;
  ctx.stroke();
};

// --- Reducer: consolidates maze config state (was 8 separate useStates) ---

interface MazeState {
  maze: MazeCell[][] | null;
  solutionSet: Set<string>;
  cols: number;
  rows: number;
  cellSize: number;
  wallSeeds: WallSeed[];
  warning: string | null;
  shake: boolean;
}

type MazeAction =
  | { type: "INIT_LEVEL"; level: number }
  | { type: "SET_CELL_SIZE"; size: number }
  | { type: "CLEAR" }
  | { type: "SET_WARNING"; msg: string | null }
  | { type: "SET_SHAKE"; val: boolean };

const initialMazeState: MazeState = {
  maze: null, solutionSet: new Set(), cols: 5, rows: 5,
  cellSize: 0, wallSeeds: [], warning: null, shake: false,
};

function mazeReducer(state: MazeState, action: MazeAction): MazeState {
  switch (action.type) {
    case "INIT_LEVEL": {
      const lvl = action.level;
      const base = 4;
      const newCols = base + Math.min(lvl, 8) + Math.floor(lvl / 2);
      const newRows = base + Math.min(lvl, 8) + Math.floor(lvl * 0.3);
      const newMaze = generateMaze(newCols, newRows);
      const seeds: WallSeed[] = [];
      const maxThick = 2 + Math.min(lvl * 2.5, 25);
      newMaze.forEach((row) => row.forEach(() => {
        seeds.push({
          top: { midOffset: rand(-5, 5), thick: rand(2, maxThick) },
          right: { midOffset: rand(-5, 5), thick: rand(2, maxThick) },
          bottom: { midOffset: rand(-5, 5), thick: rand(2, maxThick) },
          left: { midOffset: rand(-5, 5), thick: rand(2, maxThick) },
        });
      }));
      return { ...state, maze: newMaze, solutionSet: solveMaze(newMaze), cols: newCols, rows: newRows, wallSeeds: seeds };
    }
    case "SET_CELL_SIZE":
      return { ...state, cellSize: action.size };
    case "CLEAR":
      return { ...initialMazeState };
    case "SET_WARNING":
      return { ...state, warning: action.msg };
    case "SET_SHAKE":
      return { ...state, shake: action.val };
    default:
      return state;
  }
}

// --- Component ---

const MazeRunnerGame: React.FC = () => {
  const engine = useGameEngine({ gameId: GAME_ID, maxLevel: 20, initialLives: 5, timeLimit: 180 });
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;
  const { phase, level, lives, addScore, loseLife, nextLevel } = engine;

  // Consolidated maze state (was 8 useStates → now 1 useReducer)
  const [ms, dispatch] = useReducer(mazeReducer, initialMazeState);

  // Rapid-fire drawing state — kept as useState for performance (updated every mouse/touch move)
  const [canvasSize, setCanvasSize] = useState(0);
  const [path, setPath] = useState<{ x: number; y: number }[]>([]);
  const [lastLogicalCell, setLastLogicalCell] = useState("0,0");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wallCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    const t = timeoutsRef.current;
    return () => t.forEach(clearTimeout);
  }, []);

  // safeTimeout from useSafeTimeout hook handles cleanup automatically

  // Responsive canvas sizing
  useEffect(() => {
    const update = () => {
      const maxW = Math.min(window.innerWidth - 32, 480);
      const maxH = window.innerHeight - 240;
      setCanvasSize(Math.max(200, Math.min(maxW, maxH)));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Init level — always re-generate maze when phase becomes "playing"
  const prevPhaseRef = useRef<string>("");
  useEffect(() => {
    if (phase === "playing" && prevPhaseRef.current !== "playing") {
      dispatch({ type: "INIT_LEVEL", level });
      setPath([]);
      setLastLogicalCell("0,0");
    } else if (phase === "welcome" || phase === "game_over" || phase === "victory") {
      // Don't clear immediately on game_over/victory — keep maze visible in background
      if (phase === "welcome") {
        dispatch({ type: "CLEAR" });
      }
    }
    prevPhaseRef.current = phase;
  }, [phase, level]);

  const triggerShake = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(200);
    dispatch({ type: "SET_SHAKE", val: true });
    safeTimeout(() => dispatch({ type: "SET_SHAKE", val: false }), 500);
  }, [safeTimeout]);

  const resetDrawing = useCallback(() => {
    setPath([]);
    setLastLogicalCell("0,0");
  }, []);

  const handleCrash = useCallback(() => {
    if (phase !== "playing") return;
    triggerShake();
    playSound("incorrect");
    loseLife();
    resetDrawing();
    showFeedback(false);
    safeTimeout(() => dismissFeedback(), 1000);
  }, [phase, triggerShake, playSound, loseLife, resetDrawing, showFeedback, dismissFeedback, safeTimeout]);

  const handleLevelComplete = useCallback(() => {
    playSound("correct");
    showFeedback(true);
    addScore(10 * level);
    safeTimeout(() => {
      dismissFeedback();
      nextLevel();
      if (level < 20) {
        dispatch({ type: "INIT_LEVEL", level: level + 1 });
        resetDrawing();
      }
    }, 1500);
  }, [playSound, showFeedback, addScore, level, dismissFeedback, nextLevel, resetDrawing, safeTimeout]);

  // --- Canvas rendering ---

  const drawMazeToContext = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, isCollision: boolean) => {
      if (!ms.maze || !ms.wallSeeds.length) return;
      const cs = w / Math.max(ms.cols, ms.rows);
      if (isCollision) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "#FFFFFF";
      } else {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = GAME_COLORS.purple;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowBlur = 5;
        ctx.shadowColor = GAME_COLORS.purple;
      }
      ms.maze.forEach((row, ri) => {
        row.forEach((cell, ci) => {
          const x = cell.x * cs;
          const y = cell.y * cs;
          const seed = ms.wallSeeds[ri * ms.cols + ci];
          if (!seed) return;
          if (cell.walls.top) drawWobblyLine(ctx, x - 2, y, x + cs + 2, y, seed.top);
          if (cell.walls.right) drawWobblyLine(ctx, x + cs, y - 2, x + cs, y + cs + 2, seed.right);
          if (cell.walls.bottom) drawWobblyLine(ctx, x + cs + 2, y + cs, x - 2, y + cs, seed.bottom);
          if (cell.walls.left) drawWobblyLine(ctx, x, y + cs + 2, x, y - 2, seed.left);
        });
      });
      return cs;
    },
    [ms.maze, ms.wallSeeds, ms.cols, ms.rows],
  );

  const updateWallCanvas = useCallback(() => {
    if (!ms.maze || canvasSize === 0) return;
    if (!wallCanvasRef.current) wallCanvasRef.current = document.createElement("canvas");
    const c = wallCanvasRef.current;
    if (c.width !== canvasSize || c.height !== canvasSize) { c.width = canvasSize; c.height = canvasSize; }
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (ctx) drawMazeToContext(ctx, canvasSize, canvasSize, true);
    return canvasSize;
  }, [drawMazeToContext, ms.maze, canvasSize]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ms.maze || canvasSize === 0) return;
    const size = updateWallCanvas();
    if (!size) return;

    canvas.width = size;
    canvas.height = size;
    const cs = size / Math.max(ms.cols, ms.rows);
    dispatch({ type: "SET_CELL_SIZE", size: cs });
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
    drawBlob(0, 0, GAME_COLORS.emerald);
    drawBlob((ms.cols - 1) * cs, (ms.rows - 1) * cs, GAME_COLORS.pink);

    // Player path
    if (path.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = lives > 1 ? GAME_COLORS.purple : GAME_COLORS.incorrect;
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
          ctx.quadraticCurveTo(path[path.length - 2].x, path[path.length - 2].y, path[path.length - 1].x, path[path.length - 1].y);
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
  }, [ms.maze, ms.wallSeeds, path, updateWallCanvas, drawMazeToContext, ms.cols, ms.rows, canvasSize, lives]);

  // --- Input handlers ---

  const checkPixelCollision = (x: number, y: number) => {
    if (!wallCanvasRef.current) return false;
    const ctx = wallCanvasRef.current.getContext("2d");
    if (!ctx) return false;
    const r = PLAYER_RADIUS - 1;
    const pts = [{ x, y }, { x: x + r, y }, { x: x - r, y }, { x, y: y + r }, { x, y: y - r }];
    for (const p of pts) {
      try {
        if (p.x < 0 || p.y < 0 || p.x >= wallCanvasRef.current.width || p.y >= wallCanvasRef.current.height) return true;
        const px = ctx.getImageData(p.x, p.y, 1, 1).data;
        if (px[0] > 100) return true;
      } catch { return false; }
    }
    return false;
  };

  const handleInputStart = (clientX: number, clientY: number) => {
    if (phase !== "playing" || !canvasRef.current || ms.cellSize === 0 || feedbackState) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < ms.cellSize && y < ms.cellSize) {
      isDrawingRef.current = true;
      setPath([{ x, y }]);
      setLastLogicalCell("0,0");
    }
  };

  const handleInputMove = (clientX: number, clientY: number) => {
    if (!isDrawingRef.current || phase !== "playing" || !canvasRef.current || feedbackState) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (checkPixelCollision(x, y)) {
      isDrawingRef.current = false;
      handleCrash();
      return;
    }

    // Check wrong path
    if (ms.cellSize > 0) {
      const lx = Math.floor(x / ms.cellSize);
      const ly = Math.floor(y / ms.cellSize);
      const key = `${lx},${ly}`;
      if (key !== lastLogicalCell) {
        setLastLogicalCell(key);
        if (!ms.solutionSet.has(key) && phase === "playing") {
          triggerShake();
          dispatch({ type: "SET_WARNING", msg: "YANLIŞ YOL!" });
          safeTimeout(() => dispatch({ type: "SET_WARNING", msg: null }), 1000);
          loseLife();
        }
      }
    }

    // Check level complete
    const endX = (ms.cols - 1) * ms.cellSize;
    const endY = (ms.rows - 1) * ms.cellSize;
    if (x > endX + START_PADDING && y > endY + START_PADDING) {
      isDrawingRef.current = false;
      handleLevelComplete();
      return;
    }

    setPath((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (Math.hypot(x - last.x, y - last.y) > 3) return [...prev, { x, y }];
      return prev;
    });
  };

  const handleInputEnd = () => {
    isDrawingRef.current = false;
    setPath([]);
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Compass,
    accentColor: "cyber-blue",
    maxLevel: 20,
    howToPlay: ["Yeşil noktadan başla", "Duvarlara dokunmadan çiz", "Pembe noktaya ulaş"]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div
          className={`relative z-10 flex flex-col items-center justify-center w-full max-w-lg flex-1 mt-2 mx-auto ${ms.shake ? "animate-[shake_0.5s_cubic-bezier(.36,.07,.19,.97)_both]" : ""}`}
          style={{ touchAction: "none", overscrollBehavior: "none" }}
        >
          {ms.maze && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex flex-col items-center w-full relative ${feedbackState ? "pointer-events-none" : ""}`}
            >
              {ms.warning && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-12 z-40 pointer-events-none"
                >
                  <span className="text-xl sm:text-2xl font-nunito font-black text-white px-6 py-3 bg-cyber-pink border-2 border-black/10 rounded-2xl shadow-neo-sm uppercase tracking-widest whitespace-nowrap">
                    {ms.warning}
                  </span>
                </motion.div>
              )}

              <div
                ref={containerRef}
                className="relative touch-none bg-white dark:bg-slate-800 p-2 rounded-2xl border-3 border-black/10 shadow-neo-sm dark:shadow-[4px_4px_0_#0f172a]"
                style={{ width: canvasSize + 16, height: canvasSize + 16 }}
              >
                <canvas
                  ref={canvasRef}
                  className="cursor-crosshair rounded-xl"
                  onClick={() => { }}
                  style={{ background: "transparent" }}
                  onMouseDown={(e) => handleInputStart(e.clientX, e.clientY)}
                  onMouseMove={(e) => handleInputMove(e.clientX, e.clientY)}
                  onMouseUp={handleInputEnd}
                  onMouseLeave={handleInputEnd}
                  onTouchStart={(e) => { e.preventDefault(); handleInputStart(e.touches[0].clientX, e.touches[0].clientY); }}
                  onTouchMove={(e) => { e.preventDefault(); handleInputMove(e.touches[0].clientX, e.touches[0].clientY); }}
                  onTouchEnd={handleInputEnd}
                />
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default MazeRunnerGame;
