import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { Heart, RefreshCw, Trophy, Zap, AlertTriangle, Compass, Skull } from 'lucide-react';

enum GameState {
  START,
  PLAYING,
  GAME_OVER,
  LEVEL_COMPLETE
}

const MAX_LIVES = 3; // Wall hits allowed
const MAX_WRONG_TURNS = 3; // Wrong path turns allowed

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(MAX_LIVES);
  const [wrongTurnsLeft, setWrongTurnsLeft] = useState(MAX_WRONG_TURNS);
  const [shake, setShake] = useState(false);
  const [score, setScore] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);

  const startGame = () => {
    setLives(MAX_LIVES);
    setWrongTurnsLeft(MAX_WRONG_TURNS);
    setLevel(1);
    setScore(0);
    setGameState(GameState.PLAYING);
  };

  const loadNextLevel = () => {
     // Reset wrong turns for new level? Or keep persistent? 
     // Usually better to replenish slightly or full reset. Let's full reset for now.
     setWrongTurnsLeft(MAX_WRONG_TURNS);
     setGameState(GameState.PLAYING);
  };

  const triggerShake = () => {
    if (navigator.vibrate) navigator.vibrate(200);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleCrash = () => {
    triggerShake();
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setGameState(GameState.GAME_OVER);
        return 0;
      }
      return newLives;
    });
  };

  const handleWrongPath = () => {
      // Don't punish if already game over
      if (gameState !== GameState.PLAYING) return;

      triggerShake();
      setWarning("WRONG WAY!");
      setTimeout(() => setWarning(null), 1000);

      setWrongTurnsLeft(prev => {
          const newVal = prev - 1;
          if (newVal < 0) {
              setGameState(GameState.GAME_OVER);
              return 0;
          }
          return newVal;
      });
  };

  const handleWin = () => {
    setScore(prev => prev + (level * 100) + (lives * 50) + (wrongTurnsLeft * 30));
    setGameState(GameState.LEVEL_COMPLETE);
  };

  const nextLevel = () => {
    setLevel(prev => prev + 1);
    loadNextLevel();
  };

  const getLevelTitle = (lvl: number) => {
    if (lvl === 1) return "The Scribble";
    if (lvl < 5) return "Twisted Paths";
    if (lvl < 10) return "Chaos Theory";
    return "The Void";
  };

  return (
    <div className={`w-full h-screen bg-dark-bg text-white flex flex-col overflow-hidden font-sans ${shake ? 'animate-shake' : ''}`}>
      
      {/* Header / HUD */}
      <header className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-dark-card/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
           <Zap className="text-neon-blue w-6 h-6 fill-current" />
           <h1 className="text-lg font-bold tracking-wider text-neon-blue hidden sm:block">NEON SCRIBBLE</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase">Level</span>
            <span className="font-mono text-xl font-bold">{level}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase">Score</span>
            <span className="font-mono text-xl text-neon-purple">{score}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
            {/* Wrong Turn Counter */}
            <div className="flex items-center gap-1" title="Wrong turns allowed">
                <Compass className={`w-5 h-5 ${wrongTurnsLeft === 0 ? 'text-red-500 animate-pulse' : 'text-amber-400'}`} />
                <span className={`font-mono font-bold ${wrongTurnsLeft < 2 ? 'text-red-500' : 'text-slate-200'}`}>
                    {Math.max(0, wrongTurnsLeft)}
                </span>
            </div>

            {/* Lives */}
            <div className="flex items-center gap-1">
            {[...Array(MAX_LIVES)].map((_, i) => (
                <Heart 
                    key={i} 
                    className={`w-6 h-6 transition-all duration-300 ${i < lives ? 'fill-red-500 text-red-500' : 'text-slate-700 fill-slate-800'}`} 
                />
            ))}
            </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-4">
        
        {/* Flavor Text (Hint) */}
        {gameState === GameState.PLAYING && (
           <div className="absolute top-4 w-full text-center pointer-events-none z-20">
             <h2 className="text-neon-blue font-bold text-shadow-glow animate-pulse">{getLevelTitle(level)}</h2>
             <p className="text-slate-500 text-xs mt-1">White lines kill. Wrong turns cost sanity.</p>
           </div>
        )}

        {/* Warning Popup */}
        {warning && (
            <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 animate-bounce">
                <h3 className="text-4xl font-black text-red-500 stroke-black drop-shadow-md">{warning}</h3>
            </div>
        )}

        <div className="w-full max-w-md aspect-square relative select-none">
            <GameCanvas 
              level={level} 
              lives={lives} 
              onCrash={handleCrash} 
              onWrongPath={handleWrongPath}
              onWin={handleWin}
              isPlaying={gameState === GameState.PLAYING}
            />
        </div>

        {/* Start Screen Overlay */}
        {gameState === GameState.START && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
             <div className="text-center mb-8">
               <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple mb-4">
                 NEON<br/>SCRIBBLE
               </h1>
               <div className="flex flex-col gap-2 text-slate-300 text-sm">
                   <div className="flex items-center justify-center gap-2">
                       <Heart className="w-4 h-4 text-red-500" /> <span>3 Lives (Walls)</span>
                   </div>
                   <div className="flex items-center justify-center gap-2">
                       <Compass className="w-4 h-4 text-amber-400" /> <span>3 Rights (Wrong Path)</span>
                   </div>
               </div>
             </div>
             <button 
                onClick={startGame}
                className="group relative px-8 py-4 bg-neon-blue text-black font-bold text-lg rounded-full overflow-hidden hover:scale-105 transition-transform"
             >
                <span className="absolute inset-0 w-full h-full bg-white/30 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 origin-left"></span>
                START RUN
             </button>
          </div>
        )}

        {/* Level Complete Overlay */}
        {gameState === GameState.LEVEL_COMPLETE && (
           <div className="absolute inset-0 bg-neon-green/10 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in zoom-in duration-300">
             <Trophy className="w-20 h-20 text-neon-green mb-4 drop-shadow-[0_0_15px_rgba(0,255,159,0.5)]" />
             <h2 className="text-4xl font-bold text-white mb-2">CLEARED</h2>
             <p className="text-slate-300 mb-8">Score: {score}</p>
             <button 
                onClick={nextLevel}
                className="px-8 py-3 bg-neon-green text-black font-bold rounded-lg hover:bg-white transition-colors shadow-[0_0_20px_rgba(0,255,159,0.4)]"
             >
                NEXT LEVEL
             </button>
           </div>
        )}

        {/* Game Over Overlay */}
        {gameState === GameState.GAME_OVER && (
           <div className="absolute inset-0 bg-red-900/20 backdrop-blur-lg flex flex-col items-center justify-center z-50">
             <Skull className="w-20 h-20 text-red-500 mb-4 animate-bounce" />
             <h2 className="text-4xl font-bold text-red-500 mb-2 tracking-widest">GAME OVER</h2>
             <p className="text-slate-300 mb-8">Final Score: {score}</p>
             {wrongTurnsLeft < 0 && <p className="text-amber-500 text-sm mb-4">Lost in the maze...</p>}
             {lives <= 0 && <p className="text-red-400 text-sm mb-4">Hit too many walls...</p>}
             <button 
                onClick={startGame}
                className="flex items-center gap-2 px-8 py-3 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
             >
                <RefreshCw className="w-4 h-4" /> TRY AGAIN
             </button>
           </div>
        )}

      </main>

      {/* Footer / Controls Hint */}
      <footer className="h-12 border-t border-slate-800 bg-dark-card/30 flex items-center justify-center text-slate-500 text-xs text-center px-4">
        <span>Draw safely. Don't get lost.</span>
      </footer>
    </div>
  );
}