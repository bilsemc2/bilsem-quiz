
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

    // Allow starting from the start position cell
    if (pos && pos.row === startPos.row && pos.col === startPos.col) {
      setIsDrawing(true);
      setCurrentPath([pos]);
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
    if (lastPos && lastPos.row === goalPos.row && lastPos.col === goalPos.col) {
      onFinish(currentPath);
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
    const handleGlobalUp = () => setIsDrawing(false);
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
      className={`game-grid relative aspect-square w-full max-w-md mx-auto select-none touch-none
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
            {/* Draw line connecting path points */}
            {currentPath.length > 1 && (
              <polyline
                points={currentPath.map(p => `${(p.col + 0.5) * (100 / GRID_SIZE)},${(p.row + 0.5) * (100 / GRID_SIZE)}`).join(' ')}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
              />
            )}
            {/* Draw circles at each path point for visibility */}
            {currentPath.map((p, i) => (
              <circle
                key={i}
                cx={(p.col + 0.5) * (100 / GRID_SIZE)}
                cy={(p.row + 0.5) * (100 / GRID_SIZE)}
                r="2.5"
                fill="#f97316"
                stroke="white"
                strokeWidth="0.5"
              />
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
            className={`absolute flex items-center justify-center text-2xl font-black rounded-2xl border-4 shadow-md pointer-events-none transition-transform
              ${colorHex ? '' : 'bg-white border-blue-100 text-blue-900'}`}
            style={{
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / GRID_SIZE}%`,
              top: `${pos.row * (100 / GRID_SIZE)}%`,
              left: `${pos.col * (100 / GRID_SIZE)}%`,
              backgroundColor: colorHex || 'white',
              color: colorHex ? 'white' : undefined,
              borderColor: colorHex ? 'rgba(255,255,255,0.4)' : undefined,
            }}
          >
            {colorHex ? '' : val}
          </div>
        );
      })}

      {/* Start Point - More visible with green background */}
      <div
        className={`absolute flex items-center justify-center z-30 pointer-events-none rounded-xl
          ${!isDrawing && currentPath.length === 0 ? 'animate-pulse' : ''}`}
        style={{
          width: `${100 / GRID_SIZE}%`,
          height: `${100 / GRID_SIZE}%`,
          top: `${startPos.row * (100 / GRID_SIZE)}%`,
          left: `${startPos.col * (100 / GRID_SIZE)}%`,
          backgroundColor: 'rgba(34, 197, 94, 0.9)',
          boxShadow: '0 0 20px rgba(34, 197, 94, 0.6)',
          border: '3px solid rgba(255, 255, 255, 0.5)',
        }}
      >
        <span className="text-white text-xs font-black uppercase drop-shadow-lg">🏁 BAŞLA</span>
      </div>

      {/* End Point - More visible with red background */}
      <div
        className="absolute flex items-center justify-center z-30 pointer-events-none rounded-xl"
        style={{
          width: `${100 / GRID_SIZE}%`,
          height: `${100 / GRID_SIZE}%`,
          top: `${goalPos.row * (100 / GRID_SIZE)}%`,
          left: `${goalPos.col * (100 / GRID_SIZE)}%`,
          backgroundColor: 'rgba(239, 68, 68, 0.9)',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
          border: '3px solid rgba(255, 255, 255, 0.5)',
        }}
      >
        <span className="text-white text-xs font-black uppercase drop-shadow-lg">🎯 BİTİŞ</span>
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
