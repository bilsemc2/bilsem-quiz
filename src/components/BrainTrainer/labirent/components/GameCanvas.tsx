import React, { useRef, useEffect, useState, useCallback } from 'react';
import { generateMaze, solveMaze, Cell } from '../utils/mazeGenerator';

interface GameCanvasProps {
  level: number;
  lives: number;
  onCrash: () => void;
  onWrongPath: () => void;
  onWin: () => void;
  isPlaying: boolean;
}

const PLAYER_RADIUS = 4;
const START_PADDING = 10;

// Helper for random wobble
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

export const GameCanvas: React.FC<GameCanvasProps> = ({ level, lives, onCrash, onWrongPath, onWin, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wallCanvasRef = useRef<HTMLCanvasElement | null>(null); // Offscreen canvas for collision
  const containerRef = useRef<HTMLDivElement>(null);

  const [maze, setMaze] = useState<Cell[][] | null>(null);
  const [solutionSet, setSolutionSet] = useState<Set<string>>(new Set());
  const [cellSize, setCellSize] = useState(0);
  const [path, setPath] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cols, setCols] = useState(5);
  const [rows, setRows] = useState(5);

  // Track logical position to prevent spamming wrong path triggers
  const [lastLogicalCell, setLastLogicalCell] = useState<string>("0,0");

  // Seeds for wall randomness so they don't jitter every frame
  const [wallSeeds, setWallSeeds] = useState<any[]>([]);

  // Initialize Maze
  useEffect(() => {
    // Difficulty scaling
    const baseSize = 4;
    const sizeMultiplier = Math.floor(level / 2);
    const newCols = baseSize + Math.min(level, 8) + sizeMultiplier;
    const newRows = baseSize + Math.min(level, 8) + Math.floor(level * 0.3);

    setCols(newCols);
    setRows(newRows);
    const newMaze = generateMaze(newCols, newRows);
    setMaze(newMaze);
    setSolutionSet(solveMaze(newMaze));

    // Generate static random values for the "Hand drawn" look
    const seeds: any[] = [];
    newMaze.forEach(row => {
      row.forEach(_cell => {
        seeds.push({
          top: {
            midOffset: rand(-5, 5),
            thick: rand(2, 2 + Math.min(level * 2.5, 25))
          },
          right: { midOffset: rand(-5, 5), thick: rand(2, 2 + Math.min(level * 2.5, 25)) },
          bottom: { midOffset: rand(-5, 5), thick: rand(2, 2 + Math.min(level * 2.5, 25)) },
          left: { midOffset: rand(-5, 5), thick: rand(2, 2 + Math.min(level * 2.5, 25)) },
        })
      });
    });
    setWallSeeds(seeds);

    setPath([]);
    setIsDrawing(false);
    setLastLogicalCell("0,0");

    // Reset offscreen canvas
    wallCanvasRef.current = null;
  }, [level]);

  // Draw a "hand drawn" line
  const drawWobblyLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, seed: any) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // Control point for curve
    const cx = midX + (y2 - y1) * 0.1 + seed.midOffset;
    const cy = midY + (x2 - x1) * 0.1 + seed.midOffset;

    ctx.quadraticCurveTo(cx, cy, x2, y2);

    // Randomize thickness for bottleneck effect
    ctx.lineWidth = seed.thick;
    ctx.stroke();
  };

  const drawMazeToContext = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, isCollisionCanvas: boolean) => {
    if (!maze || !wallSeeds.length) return;

    const cs = width / Math.max(cols, rows);

    // Background
    if (isCollisionCanvas) {
      ctx.fillStyle = '#000000'; // Empty space is black (safe)
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#FFFFFF'; // Walls are white (danger)
    } else {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = '#e2e8f0'; // Visible wall color (Slate-200)
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#ffffff';
    }

    maze.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = cell.x * cs;
        const y = cell.y * cs;
        const seedIndex = rowIndex * cols + colIndex;
        const seed = wallSeeds[seedIndex];

        if (!seed) return;

        // Draw Walls
        if (cell.walls.top) {
          drawWobblyLine(ctx, x - 2, y, x + cs + 2, y, seed.top);
        }
        if (cell.walls.right) {
          drawWobblyLine(ctx, x + cs, y - 2, x + cs, y + cs + 2, seed.right);
        }
        if (cell.walls.bottom) {
          drawWobblyLine(ctx, x + cs + 2, y + cs, x - 2, y + cs, seed.bottom);
        }
        if (cell.walls.left) {
          drawWobblyLine(ctx, x, y + cs + 2, x, y - 2, seed.left);
        }
      });
    });

    return cs;
  }, [maze, wallSeeds, cols, rows]);


  // Prepare Wall Canvas (Offscreen)
  const updateWallCanvas = useCallback(() => {
    if (!maze || !containerRef.current) return;

    const size = Math.min(containerRef.current.clientWidth, containerRef.current.clientHeight);

    if (!wallCanvasRef.current) {
      wallCanvasRef.current = document.createElement('canvas');
    }

    const wCanvas = wallCanvasRef.current;
    if (wCanvas.width !== size || wCanvas.height !== size) {
      wCanvas.width = size;
      wCanvas.height = size;
    }

    const wCtx = wCanvas.getContext('2d', { willReadFrequently: true });
    if (wCtx) {
      drawMazeToContext(wCtx, size, size, true);
    }

    return size;
  }, [drawMazeToContext, maze]);


  // Main Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !maze) return;

    // 1. Update/Create the hidden collision canvas first
    const size = updateWallCanvas();
    if (!size) return;

    // 2. Setup visible canvas
    canvas.width = size;
    canvas.height = size;
    const cs = size / Math.max(cols, rows);
    setCellSize(cs);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 3. Draw Maze Visuals
    drawMazeToContext(ctx, size, size, false);

    // 4. Draw Start/End Zones
    const drawBlob = (bx: number, by: number, color: string) => {
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(bx + cs / 2, by + cs / 2, cs * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    drawBlob(0, 0, '#00ff9f'); // Start Green
    drawBlob((cols - 1) * cs, (rows - 1) * cs, '#ff00ff'); // End Pink

    // 5. Draw Player Path
    if (path.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = lives > 1 ? '#00f3ff' : '#ef4444';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
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
            path[path.length - 1].y
          );
        } else {
          ctx.lineTo(path[1].x, path[1].y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Head
      const head = path[path.length - 1];
      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.arc(head.x, head.y, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

  }, [maze, wallSeeds, path, lives, updateWallCanvas, drawMazeToContext, cols, rows]);


  const checkPixelCollision = (x: number, y: number) => {
    if (!wallCanvasRef.current) return false;
    const ctx = wallCanvasRef.current.getContext('2d');
    if (!ctx) return false;

    const radius = PLAYER_RADIUS - 1;
    const points = [
      { x, y },
      { x: x + radius, y },
      { x: x - radius, y },
      { x, y: y + radius },
      { x, y: y - radius }
    ];

    for (const p of points) {
      try {
        if (p.x < 0 || p.y < 0 || p.x >= wallCanvasRef.current.width || p.y >= wallCanvasRef.current.height) {
          return true;
        }
        const pixel = ctx.getImageData(p.x, p.y, 1, 1).data;
        if (pixel[0] > 100) return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  const checkWrongPath = (x: number, y: number) => {
    if (cellSize === 0) return;
    const lx = Math.floor(x / cellSize);
    const ly = Math.floor(y / cellSize);
    const key = `${lx},${ly}`;

    // If we moved to a new cell
    if (key !== lastLogicalCell) {
      setLastLogicalCell(key);
      // If this new cell is NOT in the solution set, it's a wrong turn
      if (!solutionSet.has(key)) {
        onWrongPath();
      }
    }
  };

  const handleInputStart = (clientX: number, clientY: number) => {
    if (!isPlaying || !canvasRef.current || cellSize === 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (x < cellSize && y < cellSize) {
      setIsDrawing(true);
      setPath([{ x, y }]);
      setLastLogicalCell("0,0");
    }
  };

  const handleInputMove = (clientX: number, clientY: number) => {
    if (!isDrawing || !isPlaying || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Check Wall Collision
    if (checkPixelCollision(x, y)) {
      setIsDrawing(false);
      onCrash();
      setPath([]);
      return;
    }

    // Check Wrong Path Logic
    checkWrongPath(x, y);

    // Check Win
    const endXStart = (cols - 1) * cellSize;
    const endYStart = (rows - 1) * cellSize;

    if (x > endXStart + START_PADDING && y > endYStart + START_PADDING) {
      setIsDrawing(false);
      onWin();
      return;
    }

    setPath(prev => {
      const last = prev[prev.length - 1];
      const dist = Math.hypot(x - last.x, y - last.y);
      if (dist > 3) {
        return [...prev, { x, y }];
      }
      return prev;
    });
  };

  const handleInputEnd = () => {
    setIsDrawing(false);
    setPath([]);
  };

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center relative touch-none">
      {!isDrawing && path.length === 0 && isPlaying && (
        <div className="absolute top-4 left-4 pointer-events-none text-neon-green text-xs animate-pulse">
          Start
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="cursor-crosshair bg-dark-card rounded-lg shadow-2xl border border-slate-800"
        onMouseDown={(e) => handleInputStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleInputMove(e.clientX, e.clientY)}
        onMouseUp={handleInputEnd}
        onMouseLeave={handleInputEnd}
        onTouchStart={(e) => handleInputStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handleInputMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleInputEnd}
      />
    </div>
  );
};