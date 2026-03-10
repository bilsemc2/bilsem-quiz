
import React, { useState, useRef, useEffect } from 'react';
import { GridPos, Point } from '../types';
import { GRID_SIZE, COLORS } from '../constants';

interface DrawingCanvasProps {
  startPos: GridPos;
  goalPos: GridPos;
  correctAnswer: string | number;
  options: (string | number)[];
  optionPositions: GridPos[];
  onFinish: (path: GridPos[]) => void;
  isAnimating: boolean;
  carPos?: Point;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  startPos,
  goalPos,
  // correctAnswer is passed but not used directly - options contain all values
  options,
  optionPositions,
  onFinish,
  isAnimating,
  carPos
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<GridPos[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const getGridPos = (clientX: number, clientY: number): GridPos | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const cellSize = rect.width / GRID_SIZE;
    const col = Math.floor((clientX - rect.left) / cellSize);
    const row = Math.floor((clientY - rect.top) / cellSize);

    if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE) {
      return { row, col };
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isAnimating) return;
    e.preventDefault(); // Prevent scrolling on touch devices

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const pos = getGridPos(clientX, clientY);

    // BAŞLA butonu 2 hücre geniş: startPos.col ile startPos.col±1 arasına dokunmaya izin ver
    if (pos && pos.row === startPos.row &&
      Math.abs(pos.col - startPos.col) <= 1) {
      // Normalize: path her zaman startPos'tan başlar
      setIsDrawing(true);
      setCurrentPath([startPos]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isAnimating) return;
    e.preventDefault(); // Prevent scrolling on touch devices

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const pos = getGridPos(clientX, clientY);

    if (pos) {
      const lastPos = currentPath[currentPath.length - 1];
      if (lastPos && (lastPos.row !== pos.row || lastPos.col !== pos.col)) {
        // Only allow movement to adjacent cells (including diagonals)
        const rowDiff = Math.abs(lastPos.row - pos.row);
        const colDiff = Math.abs(lastPos.col - pos.col);

        if (rowDiff <= 1 && colDiff <= 1) {
          // Check if we're not going back to a cell we already visited
          const alreadyVisited = currentPath.some(p => p.row === pos.row && p.col === pos.col);
          if (!alreadyVisited) {
            setCurrentPath(prev => [...prev, pos]);
          }
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const lastPos = currentPath[currentPath.length - 1];
    // BİTİŞ butonu 2 hücre geniş: goalPos ±1 col toleransıyla kabul et
    const reachedGoal = lastPos &&
      lastPos.row === goalPos.row &&
      Math.abs(lastPos.col - goalPos.col) <= 1;
    if (reachedGoal) {
      // Path'i goalPos'a normalize et (checkResult doğru cell'i bulsun)
      const normalizedPath = [...currentPath.slice(0, -1), goalPos];
      onFinish(normalizedPath);
    } else {
      setCurrentPath([]);
    }
  };

  const getColorHex = (val: string | number) => {
    const c = COLORS.find(col => col.name === val);
    return c ? c.hex : null;
  };

  // Ensure global event listeners for cleanup
  useEffect(() => {
    const handleGlobalUp = () => {
      setIsDrawing(false);
      setCurrentPath([]); // Global mouseup da path'i temizle
    };
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`game-grid relative aspect-square w-full max-w-md mx-auto select-none touch-none bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-slate-700 rounded-3xl shadow-neo-sm dark:shadow-[12px_12px_0_#0f172a] overflow-hidden rotate-1 transition-colors duration-300
        ${isDrawing ? 'cursor-crosshair' : 'cursor-default'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Grid lines are now handled by CSS ::before pseudo-element in .game-grid */}

      {/* Path - viewBox="0 0 100 100" allows unitless coordinates that map to percentages */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        {currentPath.length >= 1 && (
          <>
            {/* Draw outline for line to simulate border */}
            {currentPath.length > 1 && (
              <polyline
                points={currentPath.map(p => `${(p.col + 0.5) * (100 / GRID_SIZE)},${(p.row + 0.5) * (100 / GRID_SIZE)}`).join(' ')}
                fill="none"
                stroke="#000"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {/* Draw line connecting path points */}
            {currentPath.length > 1 && (
              <polyline
                points={currentPath.map(p => `${(p.col + 0.5) * (100 / GRID_SIZE)},${(p.row + 0.5) * (100 / GRID_SIZE)}`).join(' ')}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {/* Draw circles at each path point for visibility */}
            {currentPath.map((p, i) => (
              <g key={i}>
                <circle
                  cx={(p.col + 0.5) * (100 / GRID_SIZE)}
                  cy={(p.row + 0.5) * (100 / GRID_SIZE)}
                  r="3.5"
                  fill="#000"
                />
                <circle
                  cx={(p.col + 0.5) * (100 / GRID_SIZE)}
                  cy={(p.row + 0.5) * (100 / GRID_SIZE)}
                  r="2.5"
                  fill="#f97316"
                />
              </g>
            ))}
          </>
        )}
      </svg>

      {/* Entities - Now with pointer-events-none to not block drawing */}
      {optionPositions.map((pos, i) => {
        const val = options[i];
        const colorHex = getColorHex(val);
        return (
          <div
            key={i}
            className={`absolute flex items-center justify-center z-40 text-3xl font-black rounded-xl border-4 shadow-neo-sm dark:shadow-[4px_4px_0_#0f172a] pointer-events-none transition-transform
              ${colorHex ? '' : 'bg-slate-200 dark:bg-slate-700 border-black/10 dark:border-slate-800 text-black dark:text-white'}`}
            style={{
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / GRID_SIZE}%`,
              top: `${pos.row * (100 / GRID_SIZE)}%`,
              left: `${pos.col * (100 / GRID_SIZE)}%`,
              backgroundColor: colorHex || undefined,
              color: colorHex ? 'white' : undefined,
              borderColor: colorHex ? 'black' : undefined,
              transform: `scale(0.8) rotate(${i % 2 === 0 ? '3deg' : '-3deg'})`,
              textShadow: colorHex ? '2px 2px 0 #000' : 'none'
            }}
          >
            {colorHex ? '' : val}
          </div>
        );
      })}

      {/* Start Point */}
      <div
        className={`absolute flex items-center justify-center z-30 pointer-events-none rounded-2xl bg-emerald-400 border-2 border-black/10 dark:border-slate-800 shadow-neo-sm dark:shadow-neo-sm -rotate-3 transition-colors duration-300
          ${!isDrawing && currentPath.length === 0 ? 'animate-pulse' : ''}`}
        style={{
          width: `${(100 / GRID_SIZE) * 2}%`,
          height: `${100 / GRID_SIZE}%`,
          top: `${startPos.row * (100 / GRID_SIZE)}%`,
          left: `${Math.max(0, startPos.col - 0.5) * (100 / GRID_SIZE)}%`,
        }}
      >
        <span className="text-black text-[10px] sm:text-xs font-black uppercase">🏁 BAŞLA</span>
      </div>

      {/* End Point */}
      <div
        className="absolute flex items-center justify-center z-30 pointer-events-none rounded-2xl bg-rose-400 border-2 border-black/10 dark:border-slate-800 shadow-neo-sm dark:shadow-[4px_4px_0_#0f172a] rotate-3 transition-colors duration-300"
        style={{
          width: `${(100 / GRID_SIZE) * 2}%`,
          height: `${100 / GRID_SIZE}%`,
          top: `${goalPos.row * (100 / GRID_SIZE)}%`,
          left: `${Math.min(GRID_SIZE - 2, goalPos.col - 0.5) * (100 / GRID_SIZE)}%`,
        }}
      >
        <span className="text-black text-[10px] sm:text-xs font-black uppercase">🎯 BİTİŞ</span>
      </div>

      {/* Animated Brain Character */}
      {isAnimating && carPos && (
        <div
          className="absolute transition-all duration-150 pointer-events-none z-50 flex items-center justify-center"
          style={{
            width: `${100 / GRID_SIZE}%`,
            height: `${100 / GRID_SIZE}%`,
            left: `${carPos.x}%`,
            top: `${carPos.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <img
            src="/images/beyninikullan.webp"
            alt="Beyni"
            className="w-12 h-12 object-contain animate-bounce"
            style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))' }}
          />
        </div>
      )}
    </div>
  );
};
