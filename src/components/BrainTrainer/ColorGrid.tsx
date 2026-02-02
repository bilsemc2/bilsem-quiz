import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Grid3X3, Star, Trophy, RotateCcw, ChevronLeft, Play, Eye, Zap, Heart, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// High Contrast Candy Colors
const COLORS = [
  { id: 'red', name: 'Kırmızı', hex: '#FF6B6B' },
  { id: 'blue', name: 'Mavi', hex: '#4ECDC4' },
  { id: 'yellow', name: 'Sarı', hex: '#FFD93D' },
  { id: 'green', name: 'Yeşil', hex: '#6BCB77' },
  { id: 'purple', name: 'Mor', hex: '#9B59B6' },
];

const LEVEL_COLORS = {
  1: 2, 2: 3, 3: 4, 4: 5, 5: 6
};

// Child-friendly messages
const SUCCESS_MESSAGES = [
  "Harika Hafıza! 🧠",
  "Süper! ⭐",
  "Renk ustası! 🎨",
  "Muhteşem! 🌟",
  "Tam isabet! 🎯",
];

const FAILURE_MESSAGES = [
  "Tekrar dene! 💪",
  "Neredeyse! ✨",
  "Dikkatli bak! 👀",
];

interface GameState {
  level: number;
  sequence: Array<{ cellId: number, colorId: string }>;
  userSequence: Array<{ cellId: number, colorId: string }>;
  isShowingSequence: boolean;
  gameOver: boolean;
  gameStarted: boolean;
  isUserTurn: boolean;
}

const ColorGrid: React.FC = () => {
  const { playSound } = useSound();
  const { saveGamePlay } = useGamePersistence();
  const location = useLocation();
  const gameStartTimeRef = useRef<number>(0);

  const [cells, setCells] = useState(
    Array(9).fill(null).map((_, index) => ({ id: index, activeColor: null as string | null }))
  );

  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    sequence: [],
    userSequence: [],
    isShowingSequence: false,
    gameOver: false,
    gameStarted: false,
    isUserTurn: false
  });

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Back link
  const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/beyin-antrenoru-merkezi";
  const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

  const startGame = useCallback(() => {
    gameStartTimeRef.current = Date.now();
    setGameState({
      level: 1,
      sequence: [],
      userSequence: [],
      isShowingSequence: false,
      gameOver: false,
      gameStarted: true,
      isUserTurn: false
    });
    setCells(Array(9).fill(null).map((_, index) => ({ id: index, activeColor: null })));
    setScore(0);
    setLives(3);
    setShowLevelComplete(false);
    setFeedback(null);
    setTimeout(() => generateSequence(1), 1000);
  }, []);

  const generateSequence = useCallback((level: number) => {
    setShowLevelComplete(false);
    const numberOfColors = LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] || 2;
    const newSequence: Array<{ cellId: number, colorId: string }> = [];

    for (let i = 0; i < numberOfColors; i++) {
      const randomCellId = Math.floor(Math.random() * 9);
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      newSequence.push({ cellId: randomCellId, colorId: randomColor.id });
    }

    setGameState(prev => ({
      ...prev,
      level,
      sequence: newSequence,
      userSequence: [],
      isShowingSequence: true,
      isUserTurn: false
    }));

    showSequence(newSequence);
  }, []);

  const showSequence = async (sequence: Array<{ cellId: number, colorId: string }>) => {
    const colorDisplayTime = 1200;
    const delayBetweenColors = 400;

    await new Promise(resolve => setTimeout(resolve, 800));

    for (let i = 0; i < sequence.length; i++) {
      const { cellId, colorId } = sequence[i];

      setCells(prev => prev.map(c => c.id === cellId ? { ...c, activeColor: colorId } : c));
      playSound('pop');
      await new Promise(resolve => setTimeout(resolve, colorDisplayTime));
      setCells(prev => prev.map(c => c.id === cellId ? { ...c, activeColor: null } : c));

      if (i < sequence.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenColors));
      }
    }

    setGameState(prev => ({ ...prev, isShowingSequence: false, isUserTurn: true }));
  };

  const handleCellClick = (cellId: number) => {
    if (gameState.isShowingSequence || !gameState.isUserTurn || gameState.gameOver || showLevelComplete) return;

    const currentStep = gameState.userSequence.length;
    const expected = gameState.sequence[currentStep];

    if (cellId !== expected.cellId) {
      playSound('incorrect');
      setFeedback('wrong');
      setFeedbackMsg(FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)]);

      const newLives = lives - 1;
      setLives(newLives);

      setTimeout(() => {
        setFeedback(null);
        if (newLives <= 0) {
          setGameState(prev => ({ ...prev, gameOver: true, isUserTurn: false }));
        } else {
          // Retry current level
          generateSequence(gameState.level);
        }
      }, 1500);
      return;
    }

    setCells(prev => prev.map(c => c.id === cellId ? { ...c, activeColor: expected.colorId } : c));
    playSound('select');

    const newUserSequence = [...gameState.userSequence, expected];
    setGameState(prev => ({ ...prev, userSequence: newUserSequence }));

    setTimeout(() => {
      setCells(prev => prev.map(c => c.id === cellId ? { ...c, activeColor: null } : c));

      if (newUserSequence.length === gameState.sequence.length) {
        setScore(prev => prev + gameState.level * 10);
        setFeedback('correct');
        setFeedbackMsg(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);

        if (gameState.level === 5) {
          playSound('complete');
          setTimeout(() => {
            setFeedback(null);
            setGameState(prev => ({ ...prev, gameOver: true, isUserTurn: false }));
          }, 1500);
        } else {
          playSound('correct');
          setTimeout(() => {
            setFeedback(null);
            setShowLevelComplete(true);
          }, 1500);
        }
      }
    }, 400);
  };

  // Save game data on game over
  useEffect(() => {
    if (gameState.gameOver && gameStartTimeRef.current > 0) {
      const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
      saveGamePlay({
        game_id: 'renk-sekans',
        score_achieved: score,
        duration_seconds: durationSeconds,
        metadata: {
          level_reached: gameState.level,
          game_name: 'Renk Sekansı',
        }
      });
    }
  }, [gameState.gameOver, score, gameState.level, saveGamePlay]);

  // Auto start from HUB
  useEffect(() => {
    if (location.state?.autoStart && !gameState.gameStarted) {
      startGame();
    }
  }, [location.state, gameState.gameStarted, startGame]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 p-4 pt-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <Link
            to={backLink}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            <span>{backLabel}</span>
          </Link>

          {gameState.gameStarted && !gameState.gameOver && (
            <div className="flex items-center gap-4 flex-wrap">
              {/* Score */}
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
                  boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)'
                }}
              >
                <Star className="text-amber-400 fill-amber-400" size={18} />
                <span className="font-bold text-amber-400">{score}</span>
              </div>

              {/* Lives */}
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                  boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                {[...Array(3)].map((_, i) => (
                  <Heart
                    key={i}
                    size={18}
                    className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'}
                  />
                ))}
              </div>

              {/* Level */}
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                  boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                <Zap className="text-emerald-400" size={18} />
                <span className="font-bold text-emerald-400">Seviye {gameState.level}/5</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
        <AnimatePresence mode="wait">
          {/* Welcome Screen */}
          {!gameState.gameStarted && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center max-w-xl"
            >
              {/* 3D Gummy Icon */}
              <motion.div
                className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                style={{
                  background: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
                  boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Grid3X3 size={52} className="text-white drop-shadow-lg" />
              </motion.div>

              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                🎨 Renk Sekansı
              </h1>

              {/* Instructions */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
                  <Eye size={20} /> Nasıl Oynanır?
                </h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li className="flex items-center gap-2">
                    <Sparkles size={14} className="text-pink-400" />
                    <span>Renklerin yanış sırasını izle</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles size={14} className="text-pink-400" />
                    <span>Aynı hücrelere aynı sırayla tıkla</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles size={14} className="text-pink-400" />
                    <span>Her seviyede sekans uzar</span>
                  </li>
                </ul>
              </div>

              {/* TUZÖ Badge */}
              <div className="bg-purple-500/10 text-purple-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-purple-500/30">
                TUZÖ 5.4.2 Görsel Kısa Süreli Bellek
              </div>

              <motion.button
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="px-8 py-4 rounded-2xl font-bold text-lg"
                style={{
                  background: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
                  boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(155, 89, 182, 0.4)'
                }}
              >
                <div className="flex items-center gap-3">
                  <Play size={24} fill="currentColor" />
                  <span>Başla</span>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* Game Screen */}
          {gameState.gameStarted && !gameState.gameOver && !showLevelComplete && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md"
            >
              {/* Status */}
              <div className="text-center mb-6">
                <p className="text-lg font-bold text-purple-300">
                  {gameState.isShowingSequence ? '👀 Renkleri İzle...' : '🎯 Sıra Sende!'}
                </p>
              </div>

              {/* 3x3 Grid */}
              <div
                className="p-6 rounded-3xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                  boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <div className="grid grid-cols-3 gap-3">
                  {cells.map((cell) => {
                    const activeColorData = COLORS.find(c => c.id === cell.activeColor);
                    return (
                      <motion.button
                        key={cell.id}
                        whileHover={gameState.isUserTurn ? { scale: 0.95, y: -2 } : {}}
                        whileTap={gameState.isUserTurn ? { scale: 0.9 } : {}}
                        onClick={() => handleCellClick(cell.id)}
                        className="aspect-square rounded-[30%] transition-all"
                        style={{
                          background: cell.activeColor
                            ? activeColorData?.hex
                            : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                          boxShadow: cell.activeColor
                            ? `inset 0 -6px 12px rgba(0,0,0,0.3), inset 0 6px 12px rgba(255,255,255,0.3), 0 0 30px ${activeColorData?.hex}60`
                            : 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)',
                          border: cell.activeColor
                            ? `2px solid ${activeColorData?.hex}`
                            : '1px solid rgba(255,255,255,0.1)',
                          cursor: gameState.isUserTurn ? 'pointer' : 'default'
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Level Complete Screen */}
          {showLevelComplete && (
            <motion.div
              key="level-complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center max-w-md"
            >
              <motion.div
                className="w-24 h-24 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5 }}
              >
                <Star size={48} className="text-white fill-white" />
              </motion.div>

              <h2 className="text-3xl font-black text-emerald-300 mb-2">Harika! 🎉</h2>
              <p className="text-slate-400 mb-6">{gameState.level}. Seviye Tamamlandı!</p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => generateSequence(gameState.level + 1)}
                className="px-8 py-4 rounded-2xl font-bold text-lg"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(16, 185, 129, 0.4)'
                }}
              >
                <div className="flex items-center gap-3">
                  <Zap size={24} />
                  <span>Sonraki Seviye</span>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* Game Over Screen */}
          {gameState.gameOver && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center max-w-xl"
            >
              <motion.div
                className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                style={{
                  background: gameState.level === 5
                    ? 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)'
                    : 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
                  boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Trophy size={52} className="text-white drop-shadow-lg" />
              </motion.div>

              <h2 className="text-3xl font-black text-amber-300 mb-2">
                {gameState.level === 5 ? '🎉 Şampiyon!' : 'Görev Tamamlandı!'}
              </h2>
              <p className="text-slate-400 mb-6">
                {gameState.level === 5 ? 'Tüm seviyeleri tamamladın!' : 'Biraz daha pratik yap!'}
              </p>

              <div
                className="rounded-2xl p-6 mb-8"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                  boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">Skor</p>
                    <p className="text-3xl font-bold text-amber-400">{score}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">Seviye</p>
                    <p className="text-3xl font-bold text-emerald-400">{gameState.level}/5</p>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                style={{
                  background: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
                  boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(155, 89, 182, 0.4)'
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  <RotateCcw size={24} />
                  <span>Tekrar Oyna</span>
                </div>
              </motion.button>

              <Link
                to={backLink}
                className="block text-slate-500 hover:text-white transition-colors"
              >
                {location.state?.arcadeMode ? 'Arcade Hub\'a Dön' : 'Geri Dön'}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback Overlay */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            >
              <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className={`
                                    px-12 py-8 rounded-3xl text-center
                                    ${feedback === 'correct'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    : 'bg-gradient-to-br from-orange-500 to-amber-600'
                  }
                                `}
                style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: feedback === 'correct' ? [0, 10, -10, 0] : [0, -5, 5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {feedback === 'correct'
                    ? <CheckCircle2 size={64} className="mx-auto mb-4 text-white" />
                    : <XCircle size={64} className="mx-auto mb-4 text-white" />
                  }
                </motion.div>
                <p className="text-3xl font-black text-white">{feedbackMsg}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ColorGrid;