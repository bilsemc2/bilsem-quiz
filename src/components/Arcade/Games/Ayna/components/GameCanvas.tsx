
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
      const width = Math.min(window.innerWidth / 2.3, 400);
      const height = Math.min(window.innerHeight * 0.5, 500);
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

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#1e293b'; // Subtle slate grid
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let i = 0; i <= canvasSize.w; i += gridSize) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvasSize.h); ctx.stroke();
    }
    for (let i = 0; i <= canvasSize.h; i += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvasSize.w, i); ctx.stroke();
    }
  };

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
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const startX = isMirrored ? canvasSize.w - pathPoints[0].x : pathPoints[0].x;
      ctx.moveTo(startX, pathPoints[0].y);
      
      pathPoints.forEach(p => {
        const x = isMirrored ? canvasSize.w - p.x : p.x;
        ctx.lineTo(x, p.y);
      });
      ctx.stroke();
    };

    // Current Drawing - Bright colors for dark mode
    drawPathSet(lCtx, currentPath, '#60a5fa', false); // Light Blue
    drawPathSet(rCtx, currentPath, '#fb7185', true);  // Light Rose

    // Old Paths - Dimmed colors
    paths.forEach(p => {
      drawPathSet(lCtx, p.points, '#334155', false);
      drawPathSet(rCtx, p.points, '#4c0519', true);
    });

    // Draw Targets on Right
    targets.forEach(target => {
      const scaleX = canvasSize.w / 400;
      const scaleY = canvasSize.h / 500;
      const tx = target.x * scaleX;
      const ty = target.y * scaleY;

      rCtx.beginPath();
      rCtx.arc(tx, ty, 18, 0, Math.PI * 2);
      rCtx.fillStyle = target.hit ? 'rgba(34, 197, 94, 0.2)' : 'rgba(244, 63, 94, 0.1)';
      rCtx.fill();
      
      if (!target.hit) {
        rCtx.beginPath();
        rCtx.arc(tx, ty, 10, 0, Math.PI * 2);
        rCtx.fillStyle = '#f43f5e'; // Bright Rose
        rCtx.shadowBlur = 15;
        rCtx.shadowColor = '#f43f5e';
        rCtx.fill();
        rCtx.shadowBlur = 0;
      } else {
        rCtx.fillStyle = "#22c55e"; // Bright Green
        rCtx.font = "bold 20px Fredoka";
        rCtx.textAlign = "center";
        rCtx.textBaseline = "middle";
        rCtx.fillText("✓", tx, ty);
      }
    });
  }, [paths, currentPath, targets, canvasSize]);

  useEffect(() => {
    drawAll();
  }, [drawAll]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pos = getPos(e);
    setCurrentPath([pos]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
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

  const handleEnd = () => {
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
    <div className="flex flex-row gap-2 md:gap-8 items-center justify-center p-2 select-none">
      <div className="flex flex-col items-center">
        <span className="text-xs md:text-sm font-bold text-blue-400 mb-2 bg-blue-950/50 px-3 py-1 rounded-full border border-blue-900">SİZİN ALANINIZ</span>
        <div className="relative border-4 border-blue-900 rounded-2xl overflow-hidden bg-[#020617] shadow-2xl shadow-blue-950/20">
          <canvas
            ref={leftCanvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
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

      <div className="w-1 h-32 md:h-64 bg-slate-800 rounded-full" />

      <div className="flex flex-col items-center">
        <span className="text-xs md:text-sm font-bold text-rose-400 mb-2 bg-rose-950/50 px-3 py-1 rounded-full border border-rose-900">AYNA DÜNYASI</span>
        <div className="relative border-4 border-rose-900 rounded-2xl overflow-hidden bg-[#020617] shadow-2xl shadow-rose-950/20">
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
