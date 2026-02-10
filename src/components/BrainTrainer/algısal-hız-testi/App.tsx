import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, RotateCcw, CheckCircle, XCircle, Brain, Timer, Info, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Types ---
type GameState = 'menu' | 'playing' | 'gameover';

interface Challenge {
  id: number;
  left: string;
  right: string;
  isSame: boolean;
  type: 'same' | 'transposition' | 'similarity' | 'random';
}

interface Attempt {
  challengeId: number;
  timeTaken: number;
  correct: boolean;
  type: string;
}

// --- Constants ---
const GAME_DURATION = 60; // seconds
const DIGIT_LENGTH = 7; // Number of digits in the string

// Visual confusion map based on psychological testing standards (and user prompt 3-8)
const CONFUSION_PAIRS: Record<string, string[]> = {
  '3': ['8', '5'], 
  '8': ['3', '0'],
  '1': ['7'], 
  '7': ['1'],
  '6': ['9', '0'], 
  '9': ['6'],
  '5': ['2', '3'], 
  '2': ['5']
};

// --- Helper Functions ---

const generateRandomNumberString = (length: number): string => {
  let result = '';
  const characters = '0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const createChallenge = (id: number): Challenge => {
  const base = generateRandomNumberString(DIGIT_LENGTH);
  const isSame = Math.random() > 0.5; // 50% chance of being the same

  if (isSame) {
    return { id, left: base, right: base, isSame: true, type: 'same' };
  }

  // Generate a difference
  let modified = base.split('');
  const changeTypeRoll = Math.random();
  let type: Challenge['type'] = 'random';

  if (changeTypeRoll < 0.45) {
    // 45% chance: Transposition (swapping adjacent numbers)
    // Find a position to swap (avoid last index)
    const index = Math.floor(Math.random() * (base.length - 1));
    const temp = modified[index];
    modified[index] = modified[index + 1];
    modified[index + 1] = temp;
    type = 'transposition';
  } else if (changeTypeRoll < 0.90) {
    // 45% chance: Visual Similarity (3 vs 8, 1 vs 7 etc)
    // Find indices that have confusing counterparts
    const candidateIndices = base.split('').map((char, idx) => ({ char, idx })).filter(item => CONFUSION_PAIRS[item.char]);
    
    if (candidateIndices.length > 0) {
      const target = candidateIndices[Math.floor(Math.random() * candidateIndices.length)];
      const replacements = CONFUSION_PAIRS[target.char];
      modified[target.idx] = replacements[Math.floor(Math.random() * replacements.length)];
      type = 'similarity';
    } else {
      // Fallback if no confusing digits exist
      const index = Math.floor(Math.random() * base.length);
      modified[index] = ((parseInt(modified[index]) + 1) % 10).toString();
      type = 'random';
    }
  } else {
    // 10% chance: Random single digit change
    const index = Math.floor(Math.random() * base.length);
    let newDigit = Math.floor(Math.random() * 10).toString();
    while (newDigit === modified[index]) {
      newDigit = Math.floor(Math.random() * 10).toString();
    }
    modified[index] = newDigit;
  }

  // Ensure they aren't accidentally same (though logic prevents most cases)
  const right = modified.join('');
  if (base === right) {
    // Force a change if logic failed
    modified[0] = modified[0] === '1' ? '2' : '1';
  }

  return {
    id,
    left: base,
    right: modified.join(''),
    isSame: false,
    type
  };
};

// --- Main Component ---

export default function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [history, setHistory] = useState<Attempt[]>([]);
  const [lastAttemptResult, setLastAttemptResult] = useState<'correct' | 'wrong' | null>(null);
  
  // Stats for the current session
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setHistory([]);
    setLastAttemptResult(null);
    nextChallenge();
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('gameover');
  };

  const nextChallenge = () => {
    const newChallenge = createChallenge(Date.now());
    setCurrentChallenge(newChallenge);
    startTimeRef.current = performance.now();
  };

  const handleAnswer = (userSaysSame: boolean) => {
    if (!currentChallenge || gameState !== 'playing') return;

    const timeTaken = performance.now() - startTimeRef.current;
    const isCorrect = userSaysSame === currentChallenge.isSame;

    // Feedback
    setLastAttemptResult(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => setLastAttemptResult(null), 300); // clear flash after 300ms

    // Update Stats
    if (isCorrect) {
      setScore(s => s + 10);
    } else {
      setScore(s => Math.max(0, s - 5)); // Penalty
    }

    setHistory(prev => [
      ...prev,
      {
        challengeId: currentChallenge.id,
        timeTaken,
        correct: isCorrect,
        type: currentChallenge.type
      }
    ]);

    nextChallenge();
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') handleAnswer(true);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') handleAnswer(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentChallenge]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200 font-sans selection:bg-cyan-500/30">
      
      {/* --- Background Elements --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 flex flex-col h-screen">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 border-b border-slate-700/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">ALGISAL HIZ TESTİ</h1>
              <p className="text-xs text-cyan-400 font-mono tracking-wider">GÖREV 4: SAYI KARŞILAŞTIRMA</p>
            </div>
          </div>
          
          {gameState === 'playing' && (
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase">Skor</p>
                <p className="text-2xl font-mono font-bold text-white">{score}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase">Süre</p>
                <div className={`text-2xl font-mono font-bold flex items-center gap-2 ${timeLeft < 10 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
                  <Timer className="w-5 h-5" />
                  {timeLeft}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* --- Main Content Area --- */}
        <main className="flex-grow flex flex-col justify-center">
          
          {gameState === 'menu' && (
            <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
              <div className="bg-slate-800/50 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-lg w-full">
                <div className="mb-6 space-y-4 text-left">
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <Info className="w-5 h-5 text-cyan-400" />
                    Nasıl Oynanır?
                  </h2>
                  <p className="text-slate-300">
                    Ekranın ortasında iki sayı dizisi göreceksiniz. Amacınız bu dizilerin <strong className="text-cyan-400">birebir aynı</strong> olup olmadığını en hızlı şekilde belirlemektir.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-400 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span>Hatalar genellikle rakamların yer değiştirmesi (Örn: 12 vs 21)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span>Görsel benzerlikler (Örn: 3 ve 8, 1 ve 7) üzerine kurgulanmıştır.</span>
                    </li>
                  </ul>
                  <p className="text-xs text-slate-500 pt-2">
                    Klavye Kontrolü: <strong>SOL OK</strong> (Aynı) / <strong>SAĞ OK</strong> (Farklı)
                  </p>
                </div>

                <button 
                  onClick={startGame}
                  className="w-full group relative py-4 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]"
                >
                  <span className="flex items-center justify-center gap-3 text-lg">
                    <Play className="w-6 h-6 fill-current" />
                    BAŞLA
                  </span>
                </button>
              </div>
            </div>
          )}

          {gameState === 'playing' && currentChallenge && (
            <div className="flex flex-col items-center w-full max-w-2xl mx-auto animate-in fade-in zoom-in duration-300">
              
              {/* Game Board */}
              <div className={`relative w-full bg-slate-800/80 backdrop-blur-xl border-2 rounded-2xl p-10 shadow-2xl transition-colors duration-200 
                ${lastAttemptResult === 'correct' ? 'border-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.2)]' : 
                  lastAttemptResult === 'wrong' ? 'border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)]' : 
                  'border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.1)]'}`}>
                
                {/* Decorative Tech Lines */}
                <div className="absolute top-0 left-10 w-20 h-1 bg-cyan-500/20 rounded-b-lg"></div>
                <div className="absolute bottom-0 right-10 w-20 h-1 bg-cyan-500/20 rounded-t-lg"></div>
                <div className="absolute top-1/2 left-0 w-1 h-16 -translate-y-1/2 bg-cyan-500/20 rounded-r-lg"></div>
                <div className="absolute top-1/2 right-0 w-1 h-16 -translate-y-1/2 bg-cyan-500/20 rounded-l-lg"></div>

                <div className="flex flex-col items-center gap-8 py-4">
                  
                  {/* Row 1 */}
                  <div className="flex items-center gap-4 md:gap-8">
                    <span className="text-slate-500 font-mono text-xl select-none">1.</span>
                    <div className="font-mono text-4xl md:text-5xl lg:text-6xl tracking-widest font-bold text-white drop-shadow-md tabular-nums select-none">
                      {currentChallenge.left}
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-700/50"></div>

                  {/* Row 2 */}
                  <div className="flex items-center gap-4 md:gap-8">
                    <span className="text-slate-500 font-mono text-xl select-none">2.</span>
                    <div className="font-mono text-4xl md:text-5xl lg:text-6xl tracking-widest font-bold text-white drop-shadow-md tabular-nums select-none">
                      {currentChallenge.right}
                    </div>
                  </div>

                </div>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-2 gap-6 w-full mt-8">
                <button
                  onClick={() => handleAnswer(true)}
                  className="flex flex-col items-center justify-center p-6 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-cyan-400 rounded-xl transition-all active:scale-95 group"
                >
                  <span className="text-green-400 mb-2 group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-8 h-8" />
                  </span>
                  <span className="text-xl font-bold text-slate-200">AYNI</span>
                  <span className="text-xs text-slate-500 mt-1">[Sol Ok]</span>
                </button>

                <button
                  onClick={() => handleAnswer(false)}
                  className="flex flex-col items-center justify-center p-6 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-cyan-400 rounded-xl transition-all active:scale-95 group"
                >
                  <span className="text-red-400 mb-2 group-hover:scale-110 transition-transform">
                    <XCircle className="w-8 h-8" />
                  </span>
                  <span className="text-xl font-bold text-slate-200">FARKLI</span>
                  <span className="text-xs text-slate-500 mt-1">[Sağ Ok]</span>
                </button>
              </div>

            </div>
          )}

          {gameState === 'gameover' && (
            <div className="w-full max-w-3xl mx-auto animate-fade-in">
              <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-8 border border-slate-700 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="inline-flex p-3 bg-cyan-500/20 rounded-full mb-4">
                    <Award className="w-10 h-10 text-cyan-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Test Tamamlandı</h2>
                  <p className="text-slate-400">Algısal işlemleme performansı sonuçlarınız aşağıdadır.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 text-center">
                    <p className="text-slate-400 text-sm mb-1">Toplam Skor</p>
                    <p className="text-3xl font-bold text-cyan-400">{score}</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 text-center">
                    <p className="text-slate-400 text-sm mb-1">Doğruluk Oranı</p>
                    <p className="text-3xl font-bold text-green-400">
                      {history.length > 0 ? Math.round((history.filter(h => h.correct).length / history.length) * 100) : 0}%
                    </p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 text-center">
                    <p className="text-slate-400 text-sm mb-1">Ort. Tepki Süresi</p>
                    <p className="text-3xl font-bold text-purple-400">
                       {history.length > 0 ? (history.reduce((a, b) => a + b.timeTaken, 0) / history.length / 1000).toFixed(2) : 0}s
                    </p>
                  </div>
                </div>
                
                {/* Chart Section */}
                <div className="h-64 w-full mb-8 bg-slate-900/30 p-4 rounded-xl border border-slate-700/30">
                  <h3 className="text-sm text-slate-400 mb-4 pl-2 border-l-2 border-cyan-500">Tepki Hızı Grafiği (ms)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history.map((h, i) => ({ index: i + 1, time: Math.round(h.timeTaken), correct: h.correct }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="index" stroke="#94a3b8" tick={{fontSize: 12}} />
                      <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                        itemStyle={{ color: '#22d3ee' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="time" 
                        stroke="#06b6d4" 
                        strokeWidth={2} 
                        dot={(props: any) => {
                            const { cx, cy, payload } = props;
                            return (
                                <circle 
                                    key={payload.index} 
                                    cx={cx} 
                                    cy={cy} 
                                    r={4} 
                                    fill={payload.correct ? "#22c55e" : "#ef4444"} 
                                    stroke="none"
                                />
                            );
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex justify-center">
                  <button 
                    onClick={startGame}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Tekrar Dene
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* Footer Info */}
        <footer className="mt-8">
           <div className="bg-slate-900/80 backdrop-blur border-l-4 border-blue-500 p-4 rounded-r-lg shadow-lg max-w-2xl">
             <h3 className="text-blue-400 font-bold text-sm mb-1">Bilsemc2 Uzman Notu</h3>
             <p className="text-xs text-slate-400 leading-relaxed">
               <span className="text-slate-200 font-semibold">Ne Ölçüyor?</span> Algısal işlemleme hızı. <br/>
               <span className="text-slate-200 font-semibold">Dikkat:</span> Hatalar genellikle rakamların yer değiştirmesi (transpozisyon) veya görsel benzerlik (3 ve 8) üzerine kurgulanır. Bu test dikkati sürdürme ve görsel tarama hızını analiz eder.
             </p>
           </div>
        </footer>

      </div>
    </div>
  );
}