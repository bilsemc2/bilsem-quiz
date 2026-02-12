import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Coordinate, LevelConfig } from './types';
import { generateGamePath } from './services/geminiService';
import { Grid } from './components/Grid';
import { GameControls } from './components/GameControls';
import { Terminal, Zap, Shield, Move } from 'lucide-react';

const INITIAL_LEVEL = 1;

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [level, setLevel] = useState(INITIAL_LEVEL);
  const [score, setScore] = useState(0);
  const [path, setPath] = useState<Coordinate[]>([]);
  const [userPath, setUserPath] = useState<Coordinate[]>([]);
  const [visiblePathIndex, setVisiblePathIndex] = useState(-1);
  const [currentTheme, setCurrentTheme] = useState("Beklemede");

  // Refs for timers to avoid closure stale state issues or cleanup issues
  const previewTimerRef = useRef<number | null>(null);

  // Config based on level
  const getLevelConfig = (lvl: number): LevelConfig => {
    // Level 1: 3x3 grid, 3 steps
    // Level 2: 3x3 grid, 4 steps
    // Level 3: 4x4 grid, 5 steps
    const gridSize = Math.min(6, 3 + Math.floor((lvl - 1) / 2)); 
    const pathLength = 3 + Math.floor((lvl - 1) * 0.8);
    
    // Enable diagonals starting from level 3
    const allowDiagonals = lvl >= 3;
    
    return { gridSize, pathLength, levelNumber: lvl, allowDiagonals };
  };

  const startLevel = useCallback(async () => {
    setGameState(GameState.LOADING);
    setUserPath([]);
    setVisiblePathIndex(-1);
    
    const config = getLevelConfig(level);
    
    // Fetch path from local generator
    const { path: newPath, theme } = await generateGamePath(config.gridSize, config.pathLength, config.allowDiagonals);
    
    setPath(newPath);
    setCurrentTheme(theme);
    setGameState(GameState.PREVIEW);
  }, [level]);

  // Handle Preview Animation
  useEffect(() => {
    if (gameState === GameState.PREVIEW && path.length > 0) {
      let step = 0;
      // Start slightly delayed
      setVisiblePathIndex(-1);
      
      const runPreview = () => {
         // Show one more step
         setVisiblePathIndex(step);
         step++;
         
         if (step < path.length) {
           previewTimerRef.current = window.setTimeout(runPreview, 700); // Speed of laser
         } else {
           // Finished showing
           previewTimerRef.current = window.setTimeout(() => {
             setGameState(GameState.PLAYING);
             setVisiblePathIndex(-1); // Hide preview logic used for 'preview' state
           }, 1000);
         }
      };
      
      previewTimerRef.current = window.setTimeout(runPreview, 500);
    }
    
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, [gameState, path]);

  const handleCellClick = (row: number, col: number) => {
    if (gameState !== GameState.PLAYING) return;

    // Check if clicked cell is correct (the next one in the sequence)
    const expectedIndex = userPath.length;
    const expectedCoord = path[expectedIndex];

    if (!expectedCoord) return; 

    const isCorrect = expectedCoord.row === row && expectedCoord.col === col;

    if (isCorrect) {
      const newUserPath = [...userPath, { row, col }];
      setUserPath(newUserPath);
      
      // Check if level complete
      if (newUserPath.length === path.length) {
        setScore(s => s + (level * 100) + (path.length * 10));
        setGameState(GameState.SUCCESS);
      }
    } else {
      // Wrong move
      setUserPath([...userPath, { row, col }]);
      setGameState(GameState.GAME_OVER);
    }
  };

  const handleRetry = () => {
    setLevel(INITIAL_LEVEL);
    setScore(0);
    startLevel(); // Start fresh
  };

  // Re-write startLevel to accept an argument to bypass state closure issues if needed,
  // or just rely on the effect below.
  const [autoStart, setAutoStart] = useState(false);
  
  useEffect(() => {
    if (autoStart) {
        startLevel();
        setAutoStart(false);
    }
  }, [level, autoStart, startLevel]);

  const handleBtnClick = () => {
      if (gameState === GameState.IDLE) {
          startLevel();
      } else if (gameState === GameState.SUCCESS) {
          setLevel(prev => prev + 1);
          setAutoStart(true);
      } else if (gameState === GameState.GAME_OVER) {
          setLevel(1);
          setScore(0);
          setAutoStart(true);
      }
  };

  const config = getLevelConfig(level);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 flex flex-col font-mono selection:bg-neon-green selection:text-black">
      {/* Header */}
      <header className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Terminal className="text-neon-green" />
            <h1 className="text-xl font-bold tracking-tighter text-white">
              <span className="text-neon-green">LAZER</span>_VEKTÖR
            </h1>
          </div>
          <div className="flex items-center gap-6 text-sm">
             <div className="flex flex-col items-end">
                <span className="text-xs text-slate-500 uppercase">Seviye</span>
                <span className="text-neon-green font-bold text-lg">{level}</span>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-xs text-slate-500 uppercase">Skor</span>
                <span className="text-white font-bold text-lg">{score}</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-10 left-10 w-64 h-64 bg-neon-green rounded-full blur-[128px]" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-900 rounded-full blur-[128px]" />
         </div>

         <div className="z-10 w-full max-w-md space-y-8">
            
            {/* Status Bar */}
            <div className="flex justify-between items-center text-xs uppercase tracking-widest text-slate-500 mb-2">
                <div className="flex items-center gap-1">
                    <Shield size={14} />
                    <span>Güvenlik: {gameState === GameState.GAME_OVER ? 'İHLAL EDİLDİ' : 'AKTİF'}</span>
                </div>
                 <div className="flex items-center gap-4">
                    {config.allowDiagonals && (
                      <div className="flex items-center gap-1 text-neon-green" title="Çapraz Geçişler Aktif">
                         <Move size={14} />
                         <span>ÇAPRAZ</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                       <Zap size={14} className={gameState === GameState.PREVIEW ? 'text-yellow-400' : ''} />
                       <span>Enerji: {config.gridSize}x{config.gridSize}</span>
                    </div>
                </div>
            </div>

            <Grid 
              size={config.gridSize} 
              path={path}
              userPath={userPath}
              gameState={gameState}
              visiblePathIndex={visiblePathIndex}
              onCellClick={handleCellClick}
            />

            <GameControls 
              gameState={gameState}
              onStart={handleBtnClick}
              onReset={() => {
                  setLevel(1);
                  setScore(0);
                  setGameState(GameState.IDLE);
              }}
              level={level}
              currentTheme={currentTheme}
            />

            {/* Instruction / Flavor Text */}
            <div className="text-center text-xs text-slate-600 mt-8 max-w-xs mx-auto">
               {gameState === GameState.IDLE && "Noktalar arasındaki lazer akışını izle ve hattı yeniden kur."}
               {gameState === GameState.GAME_OVER && (
                   <span className="text-red-500 animate-pulse">HAT KOPTU. VERİ KAYBI.</span>
               )}
               {gameState === GameState.SUCCESS && (
                   <span className="text-neon-green">BAĞLANTI KURULDU. VERİ AKIŞI STABİL.</span>
               )}
            </div>
         </div>
      </main>
      
      {/* Scanline Effect Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
    </div>
  );
}