
import React, { useRef, useEffect, useState } from 'react';
import { Cell } from '../types';

interface MazeCanvasProps {
  grid: Cell[][];
  solution: [number, number][];
  userPath: [number, number][];
  playerPosition: [number, number] | null;
  cellSize?: number;
  onMoveRequest?: (dr: number, dc: number) => void;
}

const MazeCanvas: React.FC<MazeCanvasProps> = ({ 
  grid, 
  solution, 
  userPath,
  playerPosition, 
  cellSize = 20, 
  onMoveRequest 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getCellCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = (clientX - rect.left) * (canvas.width / rect.width / (window.devicePixelRatio || 1));
    const y = (clientY - rect.top) * (canvas.height / rect.height / (window.devicePixelRatio || 1));

    return {
      c: Math.floor(x / cellSize),
      r: Math.floor(y / cellSize),
      x,
      y
    };
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCellCoords(e);
    if (!coords || !playerPosition) return;

    const pr = playerPosition[0];
    const pc = playerPosition[1];
    
    // Start if touching exactly the player cell
    if (coords.r === pr && coords.c === pc) {
      setIsDrawing(true);
    }
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !playerPosition || !onMoveRequest) return;
    
    // Prevent scrolling on touch devices while drawing
    if ('touches' in e) {
      if (e.cancelable) e.preventDefault();
    }

    const coords = getCellCoords(e);
    if (!coords) return;

    const { r, c } = coords;
    const [pr, pc] = playerPosition;
    
    const dr = r - pr;
    const dc = c - pc;

    // Only move if moving to an adjacent cell
    if ((Math.abs(dr) === 1 && dc === 0) || (Math.abs(dc) === 1 && dr === 0)) {
      onMoveRequest(dr, dc);
    }
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rows = grid.length;
    const cols = grid[0].length;
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = cols * cellSize * dpr;
    canvas.height = rows * cellSize * dpr;
    canvas.style.width = `${cols * cellSize}px`;
    canvas.style.height = `${rows * cellSize}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / (2 * dpr), canvas.height / (2 * dpr));
    ctx.rotate(-Math.PI / 4);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    const fontSize = Math.min(canvas.width, canvas.height) / (5 * dpr);
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    ctx.fillText('bilsemc2', 0, 0);
    ctx.restore();

    grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell.visited) {
            ctx.fillStyle = 'rgba(30, 41, 59, 0.3)';
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      });
    });

    if (userPath.length > 0) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = cellSize / 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      userPath.forEach(([r, c], i) => {
        const x = c * cellSize + cellSize / 2;
        const y = r * cellSize + cellSize / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    if (solution.length > 0) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.lineWidth = cellSize / 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      solution.forEach(([r, c], i) => {
        const x = c * cellSize + cellSize / 2;
        const y = r * cellSize + cellSize / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        const x = c * cellSize;
        const y = r * cellSize;
        if (cell.walls.top) { ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); }
        if (cell.walls.right) { ctx.moveTo(x + cellSize, y); ctx.lineTo(x + cellSize, y + cellSize); }
        if (cell.walls.bottom) { ctx.moveTo(x, y + cellSize); ctx.lineTo(x + cellSize, y + cellSize); }
        if (cell.walls.left) { ctx.moveTo(x, y); ctx.lineTo(x, y + cellSize); }
      });
    });
    ctx.stroke();

    ctx.font = `${cellSize * 0.6}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏁', cellSize / 2, cellSize / 2);
    ctx.fillText('🎯', (cols - 1) * cellSize + cellSize / 2, (rows - 1) * cellSize + cellSize / 2);

    if (playerPosition) {
      const [pr, pc] = playerPosition;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#fbbf24';
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(pc * cellSize + cellSize / 2, pr * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

  }, [grid, solution, userPath, playerPosition, cellSize, isDrawing]);

  return (
    <div className="relative bg-slate-900 rounded-lg p-4 shadow-2xl overflow-auto custom-scrollbar flex items-center justify-center min-h-[400px] touch-none">
      <canvas 
        ref={canvasRef} 
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onMouseLeave={() => { setIsDrawing(false); }}
        className={`rounded border border-slate-700 shadow-inner select-none ${isDrawing ? 'cursor-none' : 'cursor-default'}`} 
      />
    </div>
  );
};

export default MazeCanvas;
