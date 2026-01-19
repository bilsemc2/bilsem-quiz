import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CardData, RuleType, Color, Shape, FeedbackType, GameState, GamePhase } from './types';
import { REFERENCE_CARDS, CONSECUTIVE_LIMIT } from './constants';
import Card from './components/Card';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, Heart, ChevronLeft, RefreshCw, Play, Search, GraduationCap } from 'lucide-react';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';

const KartDedektifi: React.FC = () => {
  const { saveGamePlay } = useGamePersistence();
  const location = useLocation();
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [gameState, setGameState] = useState<GameState>({
    currentRule: RuleType.Color,
    score: 0,
    totalAttempts: 0,
    consecutiveCorrect: 0,
    isGameOver: false,
    history: [],
  });

  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [helperMessage, setHelperMessage] = useState<string>("Selam Dedektif! Hazırsan başlayalım.");
  const gameStartTimeRef = useRef<number>(0);
  const hasSavedRef = useRef<boolean>(false);

  // Auto-start from Hub
  useEffect(() => {
    if (location.state?.autoStart && phase === 'idle') {
      startGame();
    }
  }, [location.state, phase]);

  const startGame = () => {
    setGameState({
      currentRule: RuleType.Color,
      score: 0,
      totalAttempts: 0,
      consecutiveCorrect: 0,
      isGameOver: false,
      history: [],
    });
    setLives(3);
    setLevel(1);
    setPhase('playing');
    gameStartTimeRef.current = Date.now();
    hasSavedRef.current = false;
    setCurrentCard(generateRandomCard());
  };
  // Effect to handle game over and persistence
  useEffect(() => {
    if (lives <= 0 && phase === 'playing') {
      if (!hasSavedRef.current) {
        hasSavedRef.current = true;
        setPhase('game_over');
        saveGamePlay({
          game_id: 'kart-dedektifi',
          score_achieved: gameState.score,
          duration_seconds: (Date.now() - gameStartTimeRef.current) / 1000,
          metadata: { level_reached: level }
        });
      }
    }
  }, [lives, phase, gameState.score, level, saveGamePlay]);

  // Audio simulation (Visual feedback focus)
  const triggerFeedback = (type: FeedbackType) => {
    setFeedback(type);
    setTimeout(() => setFeedback(null), 1000);
  };

  const generateRandomCard = useCallback(() => {
    const colors = Object.values(Color);
    const shapes = Object.values(Shape);
    const id = Math.random().toString(36).substring(7);

    return {
      id,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      number: Math.floor(Math.random() * 4) + 1,
    };
  }, []);


  useEffect(() => {
    if (!currentCard && !gameState.isGameOver) {
      setCurrentCard(generateRandomCard());
    }
  }, [currentCard, gameState.isGameOver, generateRandomCard]);

  const updateHelperMessage = (isCorrect: boolean, newRule: RuleType) => {
    const messages = isCorrect
      ? ["Harika!", "Doğru!", "Mükemmel!", "Bunu biliyordun!", "Dedektif iş başında!"]
      : ["Ups!", "Tekrar dene!", "Dikkat et!", "Bu sefer olmadı ama pes etme!", "İpucuna bak!"];

    let msg = messages[Math.floor(Math.random() * messages.length)];

    if (gameState.consecutiveCorrect >= CONSECUTIVE_LIMIT - 1 && isCorrect) {
      msg = "Kural değişiyor! Hazır mısın?";
    } else {
      if (newRule === RuleType.Color) msg += " Sıradaki ipucu: RENKLERE bak!";
      if (newRule === RuleType.Shape) msg += " Sıradaki ipucu: ŞEKİLLERE bak!";
      if (newRule === RuleType.Number) msg += " Sıradaki ipucu: SAYILARA bak!";
    }

    setHelperMessage(msg);
  };

  const checkMatch = (refCard: CardData) => {
    if (!currentCard || gameState.isGameOver) return;

    let isCorrect = false;
    const { currentRule } = gameState;

    if (currentRule === RuleType.Color) {
      isCorrect = currentCard.color === refCard.color;
    } else if (currentRule === RuleType.Shape) {
      isCorrect = currentCard.shape === refCard.shape;
    } else if (currentRule === RuleType.Number) {
      isCorrect = currentCard.number === refCard.number;
    }

    triggerFeedback(isCorrect ? 'correct' : 'incorrect');

    if (!isCorrect) {
      setLives(prev => Math.max(0, prev - 1));
    }

    setGameState(prev => {
      const nextConsecutive = isCorrect ? prev.consecutiveCorrect + 1 : 0;
      let nextRule = prev.currentRule;

      // Rule Shift Logic
      if (nextConsecutive >= CONSECUTIVE_LIMIT) {
        const rules = Object.values(RuleType);
        let availableRules = rules.filter(r => r !== prev.currentRule);
        nextRule = availableRules[Math.floor(Math.random() * availableRules.length)];
        setLevel(l => l + 1);
      }

      const newState = {
        ...prev,
        score: isCorrect ? prev.score + 1 : prev.score,
        totalAttempts: prev.totalAttempts + 1,
        consecutiveCorrect: nextConsecutive >= CONSECUTIVE_LIMIT ? 0 : nextConsecutive,
        currentRule: nextRule,
        history: [...prev.history, { isCorrect, ruleAtTime: prev.currentRule }],
      };

      updateHelperMessage(isCorrect, nextRule);
      return newState;
    });

    // Move to next card
    setTimeout(() => {
      setCurrentCard(generateRandomCard());
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-hidden relative font-sans">
      {/* Arcade HUD */}
      <div className="absolute top-8 left-4 right-4 z-30 flex justify-between items-center pointer-events-none">
        <div className="flex gap-4 pointer-events-auto">
          <Link to="/arcade" className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-white/20 hover:bg-white/20 transition-all">
            <ChevronLeft className="w-5 h-5 text-sky-400" />
            <span className="font-bold text-white/80">Arcade</span>
          </Link>
          <div className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-full shadow-lg flex items-center gap-2 border border-white/20">
            <Trophy className="text-yellow-500 w-6 h-6" />
            <span className="text-xl font-bold text-white leading-none">{gameState.score}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-full shadow-lg flex items-center gap-2 border border-white/20">
            <Target className="text-sky-400 w-6 h-6" />
            <span className="text-xl font-bold text-white leading-none">Lvl {level}</span>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-full shadow-lg flex items-center gap-2 border border-red-500/30">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-6 h-6 transition-all duration-300 ${i < lives ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-600 scale-75 opacity-30'}`}
            />
          ))}
        </div>
      </div>

      {/* Main Game Area */}
      <main className="w-full h-full flex flex-col items-center justify-center p-4 pt-32">
        <AnimatePresence mode="wait">
          {phase === 'playing' ? (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-4xl flex flex-col items-center"
            >
              {/* Current Card to Match */}
              <div className="mb-12 flex flex-col items-center">
                <p className="text-sky-400 font-black uppercase tracking-widest text-sm mb-4">Sıradaki Kartın</p>
                <div className="relative">
                  <AnimatePresence mode="wait">
                    {currentCard && (
                      <motion.div
                        key={currentCard.id}
                        initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
                        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                        exit={{ scale: 1.2, opacity: 0, rotateY: -90 }}
                        transition={{ type: "spring", damping: 15 }}
                      >
                        <Card card={currentCard} isReference disabled={true} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Feedback Overlay */}
                  <AnimatePresence>
                    {feedback && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        className={`absolute -top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none`}
                      >
                        {feedback === 'correct' ? (
                          <div className="bg-green-500 text-white px-6 py-2 rounded-full shadow-xl border-2 border-white flex items-center gap-2">
                            <Play className="w-5 h-5 fill-current" />
                            <span className="font-black text-lg">HARİKA!</span>
                          </div>
                        ) : (
                          <div className="bg-red-500 text-white px-6 py-2 rounded-full shadow-xl border-2 border-white flex items-center gap-2">
                            <RefreshCw className="w-5 h-5" />
                            <span className="font-black text-lg">HATA!</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Helper Message */}
              <div className="bg-white/5 backdrop-blur-2xl px-8 py-4 rounded-[2rem] border border-white/10 mb-12 max-w-md text-center">
                <p className="text-xl font-bold text-sky-200">{helperMessage}</p>
              </div>

              {/* Reference Cards - User Picks One */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
                {REFERENCE_CARDS.map(ref => (
                  <motion.div
                    key={ref.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <Card
                      card={ref}
                      onClick={() => checkMatch(ref)}
                      disabled={feedback !== null}
                    />
                    <div className="bg-white/10 px-4 py-1 rounded-full text-[10px] font-black uppercase text-white/40 border border-white/5">
                      {ref.color.toUpperCase()} • {ref.shape.toUpperCase()}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : phase === 'idle' ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#111] rounded-[3rem] p-10 max-w-lg w-full text-center shadow-2xl border-[4px] border-sky-500/50"
            >
              <div className="w-28 h-28 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-sky-500/30">
                <Search className="w-14 h-14 text-sky-400" />
              </div>
              <h1 className="text-5xl text-white mb-6 tracking-tighter font-black uppercase">Kart Dedektifi</h1>
              <div className="space-y-4 text-slate-400 mb-10 text-lg font-medium bg-white/5 p-6 rounded-2xl border border-white/5">
                <p>1. Ortadaki kartı <span className="text-sky-400 font-bold text-xl">renk, şekil</span> veya <span className="text-sky-400 font-bold text-xl">sayıya</span> göre eşleştir.</p>
                <p>2. Kural her 3 doğruda bir <span className="underline decoration-sky-500/50">rastgele değişir!</span></p>
                <p>3. Yanlış eşleşme can kaybettirir. <span className="text-red-400">Dedektif dikkatli ol!</span></p>
              </div>
              <button
                onClick={startGame}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white text-3xl py-5 rounded-[2rem] shadow-xl transform active:scale-95 transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest"
              >
                <Play fill="white" className="w-8 h-8" /> BAŞLA!
              </button>
              <Link to="/arcade" className="mt-8 text-slate-500 hover:text-white transition-colors block text-sm font-bold uppercase tracking-widest text-center">İptal</Link>
            </motion.div>
          ) : (
            <motion.div
              key="game_over"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111] rounded-[3rem] p-10 max-w-lg w-full text-center shadow-2xl border-[4px] border-red-500/50"
            >
              <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                <GraduationCap className="w-12 h-12 text-red-400" />
              </div>
              <h2 className="text-6xl text-red-500 mb-4 font-black tracking-tighter uppercase leading-tight">GÖREV BİTTİ</h2>
              <p className="text-2xl text-slate-400 mb-8 font-bold italic">İpuçları bitti dedektif!</p>

              <div className="bg-red-500/10 rounded-[2rem] p-8 mb-10 border border-red-500/20 shadow-inner">
                <p className="text-red-400/60 uppercase text-xs font-black tracking-[0.2em] mb-2">TOPLAM SKOR</p>
                <p className="text-8xl font-black text-white tabular-nums tracking-tighter">{gameState.score}</p>
                <div className="flex justify-center gap-4 mt-6">
                  <div className="bg-white/5 px-6 py-2 rounded-full border border-white/10 text-slate-300 font-bold">
                    Seviye {level}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Link to="/arcade" className="bg-slate-800 hover:bg-slate-700 text-white text-xl py-4 rounded-2xl shadow-lg font-bold flex items-center justify-center gap-2 transition-all">
                  Arcade
                </Link>
                <button
                  onClick={startGame}
                  className="bg-red-600 hover:bg-red-500 text-white text-xl py-4 rounded-2xl shadow-xl transform active:scale-95 transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest"
                >
                  <RefreshCw className="w-6 h-6" /> TEKRAR
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Background Decor */}
      <div className="fixed top-20 -left-10 w-40 h-40 bg-sky-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-20 -right-10 w-60 h-60 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
};

export default KartDedektifi;
