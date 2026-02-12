import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Star, Trophy, Timer, RotateCcw, ChevronLeft, Play, Target, Sparkles, Heart, Eye, Palette } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// Renk sabitleri
const COLORS: Record<string, string> = {
  kırmızı: '#FF5252',
  mavi: '#4285F4',
  sarı: '#FFC107',
  yeşil: '#0F9D58'
};

// Seviyeye göre yanıp sönme süreleri (saniye)
const LEVEL_DURATIONS: Record<number, number> = {
  1: 5,
  2: 4,
  3: 3,
  4: 2,
  5: 1
};

// Child-friendly messages


interface GameState {
  level: number;
  currentColors: string[];
  isUserTurn: boolean;
  userSelections: string[];
  gameOver: boolean;
  showingColors: boolean;
}

const ColorPerception: React.FC = () => {
  const { playSound } = useSound();
  const { saveGamePlay } = useGamePersistence();
    const { feedbackState, showFeedback } = useGameFeedback();
  const location = useLocation();
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    currentColors: [],
    isUserTurn: false,
    userSelections: [],
    gameOver: false,
    showingColors: false
  });

  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const gameStartTimeRef = useRef<number>(0);
  const hasSavedRef = useRef<boolean>(false);

  // Back link
  const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
  const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

  // Rastgele renkler oluştur
  const generateColors = useCallback((level: number) => {
    const colorNames = Object.keys(COLORS);
    const shuffled = [...colorNames].sort(() => 0.5 - Math.random());
    const selectedColors = shuffled.slice(0, 2);

    setGameState(prev => ({
      ...prev,
      level,
      currentColors: selectedColors,
      isUserTurn: false,
      userSelections: [],
      showingColors: true
    }));

    const duration = LEVEL_DURATIONS[level] * 1000;

    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        showingColors: false,
        isUserTurn: true
      }));
    }, duration);

  }, []);

  // Renk seçimini işle
  const handleColorSelect = (colorName: string) => {
    if (!gameState.isUserTurn || gameState.gameOver || feedbackState) return;

    setGameState(prev => {
      const newUserSelections = [...prev.userSelections, colorName];

      if (newUserSelections.length === 2) {
        const correctColors = new Set(prev.currentColors);
        const isCorrect = newUserSelections.every(color => correctColors.has(color));

        if (isCorrect) {
          playSound('correct');
          setScore(prevScore => prevScore + prev.level * 100);
          showFeedback(true);

          setTimeout(() => {
            if (prev.level === 5) {
              setGameState(s => ({ ...s, userSelections: newUserSelections, isUserTurn: false, gameOver: true }));
            } else {
              generateColors(prev.level + 1);
            }
          }, 1500);

          return { ...prev, userSelections: newUserSelections, isUserTurn: false };
        } else {
          playSound('incorrect');
          showFeedback(false);
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setTimeout(() => setGameState(s => ({ ...s, gameOver: true })), 1500);
            } else {
              setTimeout(() => {
                generateColors(prev.level);
              }, 1500);
            }
            return newLives;
          });
          return { ...prev, userSelections: [], isUserTurn: false };
        }
      }

      return { ...prev, userSelections: newUserSelections };
    });
  };

  const startGame = useCallback(() => {
      window.scrollTo(0, 0);
    setGameStarted(true);
    setScore(0);
    setLives(3);
    gameStartTimeRef.current = Date.now();
    hasSavedRef.current = false;
    setGameState({
      level: 1,
      currentColors: [],
      isUserTurn: false,
      userSelections: [],
      gameOver: false,
      showingColors: false
    });
    generateColors(1);
  }, [generateColors]);

  // Handle Auto Start from HUB
  useEffect(() => {
    if (location.state?.autoStart && !gameStarted) {
      startGame();
    }
  }, [location.state, gameStarted, startGame]);

  // Save game data on game over
  useEffect(() => {
    if (gameState.gameOver && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
      hasSavedRef.current = true;
      const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
      saveGamePlay({
        game_id: 'renk-algilama',
        score_achieved: score,
        duration_seconds: durationSeconds,
        lives_remaining: lives,
        metadata: {
          level_reached: gameState.level,
          game_name: 'Renk Algılama',
        }
      });
    }
  }, [gameState.gameOver, score, lives, gameState.level, saveGamePlay]);



  // Welcome Screen
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-fuchsia-950 to-purple-950 text-white">
        {/* Decorative Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-xl"
          >
            {/* 3D Gummy Icon */}
            <motion.div
              className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
              style={{
                background: 'linear-gradient(135deg, #E879F9 0%, #C026D3 100%)',
                boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
              }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Palette size={52} className="text-white drop-shadow-lg" />
            </motion.div>

            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
              🎨 Renk Algılama
            </h1>

            {/* Example */}
            <div
              className="rounded-2xl p-5 mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <p className="text-slate-400 text-sm mb-3">Örnek:</p>
              <div className="flex items-center justify-center gap-4 mb-3">
                <div className="flex gap-1">
                  <div className="w-10 h-16 rounded-lg" style={{ background: COLORS.kırmızı }} />
                  <div className="w-10 h-16 rounded-lg" style={{ background: COLORS.mavi }} />
                </div>
                <span className="text-2xl">→</span>
                <Eye size={24} className="text-fuchsia-400" />
                <span className="text-2xl">→</span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(COLORS).map(([name, code]) => (
                    <div
                      key={name}
                      className="w-8 h-8 rounded-lg"
                      style={{ background: code, opacity: name === 'kırmızı' || name === 'mavi' ? 1 : 0.3 }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-slate-400 text-sm">Renkleri ezberle ve doğru seç!</p>
            </div>

            {/* Instructions */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
              <h3 className="text-lg font-bold text-fuchsia-300 mb-3 flex items-center gap-2">
                <Eye size={20} /> Nasıl Oynanır?
              </h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="flex items-center gap-2">
                  <Sparkles size={14} className="text-fuchsia-400" />
                  <span>2 rengi <strong>birkaç saniye</strong> göreceksin</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles size={14} className="text-fuchsia-400" />
                  <span>Renkler gizlenince <strong>doğru seç</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles size={14} className="text-fuchsia-400" />
                  <span>Her seviyede süre kısalıyor! 3 can!</span>
                </li>
              </ul>
            </div>

            {/* TUZÖ Badge */}
            <div className="bg-fuchsia-500/10 text-fuchsia-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-fuchsia-500/30">
              TUZÖ 5.4.1 Görsel Kısa Süreli Bellek
            </div>

            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="px-8 py-4 rounded-2xl font-bold text-lg"
              style={{
                background: 'linear-gradient(135deg, #E879F9 0%, #C026D3 100%)',
                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(232, 121, 249, 0.4)'
              }}
            >
              <div className="flex items-center gap-3">
                <Play size={24} fill="currentColor" />
                <span>Hemen Başla</span>
              </div>
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-fuchsia-950 to-purple-950 text-white">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
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
                background: 'linear-gradient(135deg, rgba(232, 121, 249, 0.2) 0%, rgba(192, 38, 211, 0.1) 100%)',
                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                border: '1px solid rgba(232, 121, 249, 0.3)'
              }}
            >
              <Target className="text-fuchsia-400" size={18} />
              <span className="font-bold text-fuchsia-400">Seviye {gameState.level}/5</span>
            </div>

            {/* Timer */}
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(8, 145, 178, 0.1) 100%)',
                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }}
            >
              <Timer className="text-cyan-400" size={18} />
              <span className="font-bold text-cyan-400">{LEVEL_DURATIONS[gameState.level]}sn</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
        <AnimatePresence mode="wait">
          {!gameState.gameOver && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md"
            >
              {/* Color Display Area */}
              <div
                className="rounded-3xl overflow-hidden mb-8 aspect-square relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                  boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                  border: '4px solid rgba(255,255,255,0.1)'
                }}
              >
                <AnimatePresence>
                  {gameState.showingColors && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col"
                    >
                      <div className="h-1/2 w-full" style={{ backgroundColor: COLORS[gameState.currentColors[0]] }} />
                      <div className="h-1/2 w-full" style={{ backgroundColor: COLORS[gameState.currentColors[1]] }} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {!gameState.showingColors && !gameState.isUserTurn && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-center"
                    >
                      <Palette size={64} className="text-fuchsia-400/30 mb-4 mx-auto" />
                      <p className="text-fuchsia-300 font-bold">Hazırlanıyor...</p>
                    </motion.div>
                  </div>
                )}

                {gameState.isUserTurn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-16 h-16 rounded-[25%] flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #E879F9 0%, #C026D3 100%)',
                        boxShadow: '0 0 20px rgba(232, 121, 249, 0.4)'
                      }}
                    >
                      <Target size={32} className="text-white" />
                    </motion.div>
                    <h4 className="text-xl font-bold text-white">Gördüğün renkleri seç!</h4>
                    <div className="flex gap-4">
                      {[0, 1].map(i => (
                        <div
                          key={i}
                          className="w-14 h-14 rounded-xl transition-all"
                          style={{
                            background: gameState.userSelections[i] ? COLORS[gameState.userSelections[i]] : 'rgba(255,255,255,0.1)',
                            border: gameState.userSelections[i] ? '3px solid rgba(255,255,255,0.5)' : '3px dashed rgba(255,255,255,0.2)',
                            boxShadow: gameState.userSelections[i] ? '0 0 20px rgba(255,255,255,0.2)' : 'none'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Color Buttons */}
              <div
                className={`grid grid-cols-2 gap-4 transition-all duration-300 ${gameState.isUserTurn ? 'opacity-100' : 'opacity-30 pointer-events-none'
                  }`}
              >
                {Object.entries(COLORS).map(([name, code]) => (
                  <motion.button
                    key={name}
                    whileHover={gameState.isUserTurn ? { scale: 0.98, y: -2 } : {}}
                    whileTap={gameState.isUserTurn ? { scale: 0.95 } : {}}
                    onClick={() => handleColorSelect(name)}
                    disabled={!gameState.isUserTurn || gameState.gameOver || feedbackState !== null}
                    className="p-6 rounded-2xl font-bold text-lg text-white uppercase transition-all"
                    style={{
                      background: code,
                      boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
                      cursor: gameState.isUserTurn ? 'pointer' : 'default'
                    }}
                  >
                    {name}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Game Over */}
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
                    ? 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)'
                    : 'linear-gradient(135deg, #E879F9 0%, #EF4444 100%)',
                  boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Trophy size={52} className="text-white drop-shadow-lg" />
              </motion.div>

              <h2 className="text-3xl font-black text-fuchsia-300 mb-2">
                {gameState.level === 5 ? '🎉 Efsanesin!' : 'Oyun Bitti!'}
              </h2>
              <p className="text-slate-400 mb-6">
                {gameState.level === 5 ? 'Tüm seviyeleri tamamladın!' : 'Tekrar deneyelim!'}
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
                    <p className="text-3xl font-bold text-fuchsia-400">{gameState.level}</p>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                style={{
                  background: 'linear-gradient(135deg, #E879F9 0%, #C026D3 100%)',
                  boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(232, 121, 249, 0.4)'
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  <RotateCcw size={24} />
                  <span>Yeniden Başla</span>
                </div>
              </motion.button>

              <Link
                to={backLink}
                className="block text-slate-500 hover:text-white transition-colors"
              >
                {location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback Overlay */}
        <GameFeedbackBanner feedback={feedbackState} />
      </div>
    </div>
  );
};

export default ColorPerception;
