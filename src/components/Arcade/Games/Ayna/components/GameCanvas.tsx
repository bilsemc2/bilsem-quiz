
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point, Target, DrawingPath } from '../types';

interface GameCanvasProps {
  targets: Target[];
  onTargetHit: (targetId: string) => void;
  onDrawComplete: () => void;
  resetTrigger: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ targets, onTargetHit, onDrawComplete, resetTrigger }) => {
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [canvasSize, setCanvasSize] = useState({ w: 300, h: 400 });

  useEffect(() => {
    const updateSize = () => {
      const isMobile = window.innerWidth < 768;
      const width = isMobile
        ? Math.min(window.innerWidth - 64, 340)
        : Math.min(window.innerWidth / 2.3, 400);
      const height = isMobile
        ? Math.min(window.innerHeight * 0.28, 280)
        : Math.min(window.innerHeight * 0.5, 500);
      setCanvasSize({ w: width, h: height });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    setPaths([]);
    setCurrentPath([]);
  }, [resetTrigger]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#cbd5e1'; // slate-300 grid
    ctx.lineWidth = 2;
    const gridSize = 40;
    for (let i = 0; i <= canvasSize.w; i += gridSize) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvasSize.h); ctx.stroke();
    }
    for (let i = 0; i <= canvasSize.h; i += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvasSize.w, i); ctx.stroke();
    }
  }, [canvasSize.h, canvasSize.w]);

  const drawAll = useCallback(() => {
    const lCtx = leftCanvasRef.current?.getContext('2d');
    const rCtx = rightCanvasRef.current?.getContext('2d');
    if (!lCtx || !rCtx) return;

    lCtx.clearRect(0, 0, canvasSize.w, canvasSize.h);
    rCtx.clearRect(0, 0, canvasSize.w, canvasSize.h);

    drawGrid(lCtx);
    drawGrid(rCtx);

    const drawPathSet = (ctx: CanvasRenderingContext2D, pathPoints: Point[], color: string, isMirrored: boolean) => {
      if (pathPoints.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const startX = isMirrored ? canvasSize.w - pathPoints[0].x : pathPoints[0].x;
      ctx.moveTo(startX, pathPoints[0].y);

      pathPoints.forEach(p => {
        const x = isMirrored ? canvasSize.w - p.x : p.x;
        ctx.lineTo(x, p.y);
      });
      ctx.stroke();

      // Draw a black outline for tactile look
      ctx.beginPath();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 14;
      ctx.globalCompositeOperation = 'destination-over';
      const startXOutline = isMirrored ? canvasSize.w - pathPoints[0].x : pathPoints[0].x;
      ctx.moveTo(startXOutline, pathPoints[0].y);
      pathPoints.forEach(p => {
        const x = isMirrored ? canvasSize.w - p.x : p.x;
        ctx.lineTo(x, p.y);
      });
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    };

    // Current Drawing - Solid solid colors
    drawPathSet(lCtx, currentPath, '#38bdf8', false); // sky-400
    drawPathSet(rCtx, currentPath, '#fb7185', true);  // rose-400

    // Old Paths - Dimmed solid colors
    paths.forEach(p => {
      drawPathSet(lCtx, p.points, '#e2e8f0', false); // slate-200
      drawPathSet(rCtx, p.points, '#e2e8f0', true);
    });

    // Draw Targets on Right
    targets.forEach(target => {
      const scaleX = canvasSize.w / 400;
      const scaleY = canvasSize.h / 500;
      const tx = target.x * scaleX;
      const ty = target.y * scaleY;

      rCtx.beginPath();
      rCtx.arc(tx, ty, 20, 0, Math.PI * 2);
      rCtx.fillStyle = target.hit ? '#bbf7d0' : '#fecdd3'; // green-200 / rose-200 target background
      rCtx.fill();
      rCtx.lineWidth = 4;
      rCtx.strokeStyle = '#000000';
      rCtx.stroke();

      if (!target.hit) {
        rCtx.beginPath();
        rCtx.arc(tx, ty, 10, 0, Math.PI * 2);
        rCtx.fillStyle = '#f43f5e'; // Bright Rose
        rCtx.fill();
        rCtx.stroke(); // black stroke for inner circle
      } else {
        rCtx.fillStyle = "#22c55e"; // Bright Green
        rCtx.font = "900 24px 'Nunito', sans-serif";
        rCtx.textAlign = "center";
        rCtx.textBaseline = "middle";
        // black border around text
        rCtx.strokeStyle = "#000000";
        rCtx.lineWidth = 4;
        rCtx.strokeText("✓", tx, ty + 2);
        rCtx.fillText("✓", tx, ty + 2);
      }
    });
  }, [canvasSize, currentPath, drawGrid, paths, targets]);

  useEffect(() => {
    drawAll();
  }, [drawAll]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    setCurrentPath([pos]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    if (!isDrawing) return;
    const pos = getPos(e);
    setCurrentPath(prev => [...prev, pos]);

    const mirroredX = canvasSize.w - pos.x;
    targets.forEach(target => {
      if (!target.hit) {
        const scaleX = canvasSize.w / 400;
        const scaleY = canvasSize.h / 500;
        const tx = target.x * scaleX;
        const ty = target.y * scaleY;

        const dist = Math.sqrt(Math.pow(mirroredX - tx, 2) + Math.pow(pos.y - ty, 2));
        if (dist < 25) {
          onTargetHit(target.id);
        }
      }
    });
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    if (isDrawing) {
      setPaths(prev => [...prev, { points: currentPath, color: '#60a5fa' }]);
      setCurrentPath([]);
      setIsDrawing(false);
      onDrawComplete();
    }
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const rect = leftCanvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-4 sm:p-8 select-none bg-sky-100 rounded-[2rem] border-2 border-black/10 shadow-neo-sm transform -rotate-1">
      <div className="flex flex-col items-center transform rotate-1">
        <span className="text-sm sm:text-base font-black text-black mb-3 bg-sky-300 px-5 py-2 rounded-xl border-2 border-black/10 uppercase tracking-widest shadow-neo-sm">SİZİN ALANINIZ</span>
        <div className="relative border-2 border-black/10 rounded-[2rem] overflow-hidden bg-white shadow-neo-sm">
          <canvas
            ref={leftCanvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            className="touch-none cursor-crosshair"

            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
        </div>
      </div>

      <div className="w-16 h-2 md:w-2 md:h-64 bg-black rounded-full shadow-[2px_2px_0_#fff]" />

      <div className="flex flex-col items-center transform rotate-1">
        <span className="text-sm sm:text-base font-black text-black mb-3 bg-rose-300 px-5 py-2 rounded-xl border-2 border-black/10 uppercase tracking-widest shadow-neo-sm">AYNA DÜNYASI</span>
        <div className="relative border-2 border-black/10 rounded-[2rem] overflow-hidden bg-white shadow-neo-sm">
          <canvas
            ref={rightCanvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            className="pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;
