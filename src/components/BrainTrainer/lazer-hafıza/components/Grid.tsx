import React, { useMemo } from 'react';
import { Coordinate, GameState } from '../types';

interface GridProps {
  size: number;
  path: Coordinate[]; // The target path
  userPath: Coordinate[]; // The path user has drawn so far
  gameState: GameState;
  visiblePathIndex: number; // How many steps of the path to show during PREVIEW
  onCellClick: (row: number, col: number) => void;
}

export const Grid: React.FC<GridProps> = ({ 
  size, 
  path, 
  userPath, 
  gameState, 
  visiblePathIndex,
  onCellClick 
}) => {
  
  // Calculate visual state for each node
  const getNodeState = (r: number, c: number) => {
    // Is this node currently part of the visible preview path?
    const isPreview = gameState === GameState.PREVIEW && 
                      path.some((p, index) => index <= visiblePathIndex && p.row === r && p.col === c);
    
    // Is this node part of the user's drawn path?
    const isUserActive = (gameState === GameState.PLAYING || gameState === GameState.SUCCESS || gameState === GameState.GAME_OVER) &&
                         userPath.some(p => p.row === r && p.col === c);

    // Is this the very last active node (the "head" of the laser)?
    let isHead = false;
    if (gameState === GameState.PREVIEW) {
      const currentHead = path[visiblePathIndex];
      isHead = !!(currentHead && currentHead.row === r && currentHead.col === c);
    } else if (gameState === GameState.PLAYING) {
      const lastUserMove = userPath[userPath.length - 1];
      isHead = !!(lastUserMove && lastUserMove.row === r && lastUserMove.col === c);
    }

    return { active: isPreview || isUserActive, isHead };
  };
  
  const gridTemplate = `repeat(${size}, minmax(0, 1fr))`;

  // Helper to get center coordinates of a cell for SVG lines
  const getCellCenter = (row: number, col: number) => {
    const cellSize = 100 / size;
    return {
      x: col * cellSize + cellSize / 2,
      y: row * cellSize + cellSize / 2
    };
  };

  // Generate SVG path string for the preview laser
  const previewSvgPath = useMemo(() => {
    if (gameState !== GameState.PREVIEW || visiblePathIndex < 1) return '';
    return path.slice(0, visiblePathIndex + 1).map((coord, i) => {
      const { x, y } = getCellCenter(coord.row, coord.col);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [path, visiblePathIndex, gameState, size]);

  // Generate SVG path string for the user's input
  const userSvgPath = useMemo(() => {
    if (userPath.length < 2) return '';
    return userPath.map((coord, i) => {
      const { x, y } = getCellCenter(coord.row, coord.col);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [userPath, size]);

  return (
    <div className="relative aspect-square w-full max-w-md mx-auto p-8 rounded-xl bg-slate-900/30 border border-slate-800/50 shadow-2xl backdrop-blur-sm">
      
      {/* Background Grid Lines (Faint decoration) */}
      <div className="absolute inset-0 z-0 p-8 grid gap-0" style={{ gridTemplateColumns: gridTemplate, gridTemplateRows: gridTemplate }}>
          {Array.from({ length: size * size }).map((_, i) => (
             <div key={i} className="border border-slate-800/30 w-full h-full" />
          ))}
      </div>

      {/* SVG Overlay for Laser Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 p-8" viewBox="0 0 100 100" preserveAspectRatio="none">
        
        {/* Preview Laser */}
        {gameState === GameState.PREVIEW && (
          <path 
            d={previewSvgPath} 
            stroke="#39ff14" 
            strokeWidth="2" 
            fill="none" 
            className="laser-line-glow transition-all duration-100 ease-linear"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        
        {/* User Laser */}
        {(gameState === GameState.PLAYING || gameState === GameState.SUCCESS || gameState === GameState.GAME_OVER) && (
          <path 
            d={userSvgPath} 
            stroke={gameState === GameState.GAME_OVER ? "#ef4444" : "#39ff14"} 
            strokeWidth="2" 
            fill="none" 
            className="laser-line-glow transition-all duration-100 ease-out"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {/* Interactive Nodes Layer */}
      <div 
        className="grid w-full h-full relative z-20"
        style={{ gridTemplateColumns: gridTemplate, gridTemplateRows: gridTemplate }}
      >
        {Array.from({ length: size * size }).map((_, i) => {
          const r = Math.floor(i / size);
          const c = i % size;
          const { active, isHead } = getNodeState(r, c);
          
          let nodeClass = "bg-slate-700 scale-50 opacity-40"; // Default idle node

          if (active) {
            if (gameState === GameState.GAME_OVER) {
               nodeClass = "bg-red-500 scale-75 shadow-[0_0_10px_rgba(239,68,68,0.8)]";
            } else {
               nodeClass = "bg-neon-green scale-75 shadow-[0_0_10px_rgba(57,255,20,0.6)]";
            }
          }
          
          if (isHead) {
             if (gameState === GameState.GAME_OVER) {
               nodeClass = "bg-red-500 scale-100 ring-4 ring-red-900 shadow-[0_0_20px_rgba(239,68,68,1)] z-10";
             } else {
               nodeClass = "bg-white scale-100 ring-4 ring-neon-green/50 shadow-[0_0_20px_rgba(57,255,20,1)] z-10";
             }
          }

          return (
            <div
              key={`${r}-${c}`}
              onClick={() => onCellClick(r, c)}
              className="flex items-center justify-center cursor-pointer group"
            >
              {/* The clickable area is the whole cell, but visual is just the node */}
              <div 
                className={`
                  w-4 h-4 rounded-full transition-all duration-300
                  ${nodeClass}
                  ${!active && gameState === GameState.PLAYING ? 'group-hover:scale-75 group-hover:bg-slate-500' : ''}
                `} 
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};