import React from 'react';
import { GameState } from '../types';
import { Play, RotateCcw, ShieldAlert, Cpu } from 'lucide-react';

interface GameControlsProps {
  gameState: GameState;
  onStart: () => void;
  onReset: () => void;
  level: number;
  currentTheme: string;
}

export const GameControls: React.FC<GameControlsProps> = ({ 
  gameState, 
  onStart, 
  onReset,
  level,
  currentTheme
}) => {
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto mt-6">
      
      <div className="w-full flex justify-between items-center bg-slate-900/80 p-3 rounded-lg border border-slate-800">
         <div className="flex items-center gap-2 text-slate-400">
           <Cpu size={16} />
           <span className="text-xs uppercase tracking-widest">Sistem Protokolü:</span>
         </div>
         <span className="text-neon-green font-mono text-sm font-bold truncate max-w-[150px]">
            {gameState === GameState.LOADING ? "ANALYZING..." : currentTheme}
         </span>
      </div>

      {gameState === GameState.IDLE && (
        <button
          onClick={onStart}
          className="group relative px-8 py-3 bg-slate-900 border border-neon-green text-neon-green font-mono font-bold tracking-wider uppercase hover:bg-neon-green hover:text-black transition-all duration-300 w-full"
        >
          <div className="flex items-center justify-center gap-2">
            <Play size={20} className="group-hover:fill-current" />
            <span>Simülasyonu Başlat</span>
          </div>
          {/* Glitch effect overlay */}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity" />
        </button>
      )}

      {(gameState === GameState.GAME_OVER || gameState === GameState.SUCCESS) && (
        <button
          onClick={onStart} // Starts next level or restarts
          className={`
            px-8 py-3 w-full font-mono font-bold tracking-wider uppercase border transition-all duration-300
            flex items-center justify-center gap-2
            ${gameState === GameState.SUCCESS 
              ? 'bg-neon-green text-black border-neon-green hover:bg-white' 
              : 'bg-red-600 text-white border-red-600 hover:bg-red-500'}
          `}
        >
          {gameState === GameState.SUCCESS ? (
             <>
               <Play size={20} fill="currentColor" />
               <span>Sonraki Seviye</span>
             </>
          ) : (
            <>
              <RotateCcw size={20} />
              <span>Sistemi Yeniden Başlat</span>
            </>
          )}
        </button>
      )}

      {gameState === GameState.LOADING && (
         <div className="text-neon-green font-mono animate-pulse flex items-center gap-2">
            <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce" />
            <span>YENİ ROTA HESAPLANIYOR...</span>
         </div>
      )}
      
      {gameState === GameState.PREVIEW && (
        <div className="text-yellow-400 font-mono text-sm tracking-widest flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>GÖZLEM MODU: ROTAYI İZLE</span>
        </div>
      )}

       {gameState === GameState.PLAYING && (
        <div className="text-neon-green font-mono text-sm tracking-widest animate-pulse">
          >> GİRİŞ BEKLENİYOR...
        </div>
      )}

    </div>
  );
};
