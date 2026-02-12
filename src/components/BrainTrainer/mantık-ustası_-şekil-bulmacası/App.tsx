import React, { useState, useEffect, useCallback } from 'react';
import { LevelData, GameState, GameVariable } from './types';
import { generateLevel, checkAnswer } from './utils/gameLogic';
import { ShapeIcon } from './components/ShapeIcon';
import { EquationRow } from './components/EquationRow';
import { VisualExpression } from './components/VisualExpression';
import { Keypad } from './components/Keypad';
import { Equal, Brain, Trophy, RotateCcw, Play } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isWrong, setIsWrong] = useState(false);
  
  // Initialize Level
  const startLevel = useCallback((lvl: number) => {
    const data = generateLevel(lvl);
    setLevelData(data);
    setUserAnswer('');
    setIsWrong(false);
    setGameState(GameState.PLAYING);
  }, []);

  const handleStartGame = () => {
    setLevel(1);
    setScore(0);
    startLevel(1);
  };

  const handleKeyPress = (key: string) => {
    if (userAnswer.length < 3) {
      setUserAnswer(prev => prev + key);
    }
  };

  const handleDelete = () => {
    setUserAnswer(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (!levelData || !userAnswer) return;

    const numAnswer = parseInt(userAnswer, 10);
    
    if (checkAnswer(levelData, numAnswer)) {
      // Correct!
      setScore(prev => prev + (level * 100));
      setGameState(GameState.SUCCESS);
    } else {
      // Wrong
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 500);
    }
  };

  const handleNextLevel = () => {
    setLevel(prev => {
      const next = prev + 1;
      startLevel(next);
      return next;
    });
  };

  // Rendering
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-100">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Brain className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold font-display text-slate-800">Mantık Ustası</h1>
          </div>
          <div className="flex gap-4 text-sm font-semibold text-slate-600">
            {gameState !== GameState.MENU && (
              <>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Seviye</span>
                  <span className="text-indigo-600 text-lg leading-none">{level}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Puan</span>
                  <span className="text-emerald-600 text-lg leading-none">{score}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-start p-4 w-full max-w-md mx-auto">
        
        {/* Menu Screen */}
        {gameState === GameState.MENU && (
          <div className="flex flex-col items-center justify-center flex-grow w-full space-y-8 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-indigo-200 rounded-full blur-xl opacity-50"></div>
                <ShapeIcon shape="star" color="yellow" size={120} className="relative z-10" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 font-display">Hazır mısın?</h2>
              <p className="text-slate-500 max-w-xs mx-auto">
                Görsel denklemleri çöz, zihnini çalıştır. Kolaydan zora doğru ilerle.
              </p>
            </div>
            <button
              onClick={handleStartGame}
              className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all w-full justify-center"
            >
              <Play fill="currentColor" /> Oyuna Başla
            </button>
          </div>
        )}

        {/* Game Screen */}
        {gameState === GameState.PLAYING && levelData && (
          <div className="w-full flex flex-col gap-4">
            
            {/* Equation List */}
            <div className="space-y-3 w-full">
              {levelData.equations.map((eq, idx) => (
                <EquationRow 
                  key={eq.id} 
                  equation={eq} 
                  variables={levelData.variables}
                  index={idx}
                />
              ))}
            </div>

            {/* Answer Area */}
            <div className="mt-4 bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 shadow-inner">
              <span className="text-slate-500 font-medium uppercase tracking-wide text-xs">{levelData.question.text}</span>
              
              <div className="flex items-center gap-4">
                <VisualExpression 
                  items={levelData.question.items} 
                  variables={levelData.variables} 
                  iconSize={56}
                  animate={true}
                />
                
                <Equal className="text-indigo-300 w-8 h-8" />
                <div 
                  className={`bg-white h-16 w-24 rounded-xl border-2 flex items-center justify-center text-4xl font-bold text-indigo-700 shadow-sm transition-all ${isWrong ? 'border-red-400 bg-red-50 animate-shake text-red-600' : 'border-indigo-200'}`}
                >
                  {userAnswer || '?'}
                </div>
              </div>
            </div>

            {/* Keypad */}
            <Keypad 
              onKeyPress={handleKeyPress} 
              onDelete={handleDelete} 
              onSubmit={handleSubmit} 
            />
          </div>
        )}

        {/* Success Screen */}
        {gameState === GameState.SUCCESS && (
          <div className="flex flex-col items-center justify-center flex-grow w-full text-center space-y-6 animate-scale-in">
            <Trophy className="w-24 h-24 text-yellow-500 drop-shadow-lg" />
            <h2 className="text-3xl font-bold text-slate-800 font-display">Tebrikler!</h2>
            <p className="text-slate-500">Doğru cevap. Harika gidiyorsun.</p>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 w-full max-w-xs">
              <div className="text-xs text-slate-400 uppercase">Toplam Puan</div>
              <div className="text-3xl font-bold text-emerald-600">{score}</div>
            </div>

            <button
              onClick={handleNextLevel}
              className="w-full bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              Sonraki Seviye <Play size={20} fill="currentColor" />
            </button>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;