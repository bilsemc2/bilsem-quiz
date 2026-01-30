import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Brain, Star, Trophy, Timer, RotateCcw, ChevronLeft, Play, Target } from 'lucide-react';

// Renk sabitleri
const COLORS = {
  kırmızı: '#FF5252',
  mavi: '#4285F4',
  sarı: '#FFC107',
  yeşil: '#0F9D58'
};

// Seviyeye göre yanıp sönme süreleri (saniye)
const LEVEL_DURATIONS = {
  1: 5,
  2: 4,
  3: 3,
  4: 2,
  5: 1
};

interface GameState {
  level: number;
  currentColors: string[];
  isUserTurn: boolean;
  userSelections: string[];
  gameOver: boolean;
  showingColors: boolean;
}

const ColorPerception: React.FC = () => {
  // Oyun durumu
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    currentColors: [],
    isUserTurn: false,
    userSelections: [],
    gameOver: false,
    showingColors: false
  });

  // Skor
  const [score, setScore] = useState<number>(0);
  const [showLevelComplete, setShowLevelComplete] = useState<boolean>(false);

  // Oyun başladı mı?
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Rastgele renkler oluştur
  const generateColors = useCallback((level: number) => {
    setShowLevelComplete(false);
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

    const duration = LEVEL_DURATIONS[level as keyof typeof LEVEL_DURATIONS] * 1000;

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
    if (!gameState.isUserTurn || gameState.gameOver || showLevelComplete) return;

    setGameState(prev => {
      const newUserSelections = [...prev.userSelections, colorName];

      if (newUserSelections.length === 2) {
        const correctColors = new Set(prev.currentColors);
        const isCorrect = newUserSelections.every(color => correctColors.has(color));

        if (isCorrect) {
          setScore(prevScore => prevScore + prev.level * 10);

          if (prev.level === 5) {
            return { ...prev, userSelections: newUserSelections, isUserTurn: false, gameOver: true };
          } else {
            setTimeout(() => setShowLevelComplete(true), 500);
            return { ...prev, userSelections: newUserSelections, isUserTurn: false };
          }
        } else {
          setScore(prevScore => Math.max(0, prevScore - 5));
          setTimeout(() => generateColors(prev.level), 1500);
          return { ...prev, userSelections: [], isUserTurn: false };
        }
      }

      return { ...prev, userSelections: newUserSelections };
    });
  };

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setShowLevelComplete(false);
    generateColors(1);
  };

  const restartGame = () => {
    setGameStarted(false);
    setScore(0);
    setShowLevelComplete(false);
    setGameState({
      level: 1,
      currentColors: [],
      isUserTurn: false,
      userSelections: [],
      gameOver: false,
      showingColors: false
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 select-none">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/60 backdrop-blur-lg p-8 rounded-[3rem] border border-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-2xl text-purple-brand">
            <Brain size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Renk Algılama</h1>
            <p className="text-gray-500 font-medium tracking-tight">Görsel hafızanı ve tepki hızını test et!</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-6 py-3 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <span className="text-lg font-black text-gray-800">{score}</span>
          </div>
          <div className="px-6 py-3 bg-purple-brand text-white rounded-2xl shadow-lg shadow-purple-100 flex items-center gap-2">
            <Star size={20} />
            <span className="text-lg font-black uppercase tracking-wider">{gameState.level}/5. Seviye</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!gameStarted ? (
          <motion.div
            key="start"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white/80 backdrop-blur-lg p-12 rounded-[4rem] shadow-2xl border border-white text-center space-y-10"
          >
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-gray-900">Meydan Okumaya Hazır Mısın?</h2>
              <p className="text-lg text-gray-600 max-w-xl mx-auto font-medium leading-relaxed">
                Bu oyunda, sadece birkaç saniyeliğine gösterilen renkleri doğru bir şekilde belirlemen gerekiyor. Zorluk her seviyede katlanarak artacak!
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(lvl => (
                <div key={lvl} className={`p-4 rounded-3xl border-2 transition-all ${lvl === 1 ? 'border-purple-brand bg-purple-50 text-purple-brand' : 'border-gray-100 text-gray-400'}`}>
                  <Timer className="mx-auto mb-2 opacity-60" size={20} />
                  <span className="block font-black text-xs uppercase">S-{lvl}</span>
                  <span className="block font-black text-xl">{LEVEL_DURATIONS[lvl as keyof typeof LEVEL_DURATIONS]}sn</span>
                </div>
              ))}
            </div>

            <button
              onClick={startGame}
              className="px-12 py-5 bg-purple-brand text-white font-black text-2xl rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-3 mx-auto group"
            >
              Hemen Başla <Play className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            {/* Game Main Area */}
            <div className="bg-white/80 backdrop-blur-lg p-12 rounded-[4rem] shadow-2xl border border-white flex flex-col items-center">
              <div className="relative w-full max-w-md aspect-square bg-gray-50 rounded-[3rem] overflow-hidden border-8 border-gray-100 shadow-inner group">
                <AnimatePresence>
                  {gameState.showingColors && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col"
                    >
                      <div className="h-1/2 w-full transition-transform duration-500" style={{ backgroundColor: COLORS[gameState.currentColors[0] as keyof typeof COLORS] }} />
                      <div className="h-1/2 w-full transition-transform duration-500" style={{ backgroundColor: COLORS[gameState.currentColors[1] as keyof typeof COLORS] }} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {!gameState.showingColors && !gameState.isUserTurn && !gameState.gameOver && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center animate-bounce">
                      <Brain size={64} className="text-purple-brand opacity-20 mb-4 mx-auto" />
                      <p className="text-purple-brand font-black uppercase tracking-widest text-xl">Hazırlanıyor...</p>
                    </div>
                  </div>
                )}

                {gameState.isUserTurn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-purple-brand text-white rounded-2xl flex items-center justify-center animate-pulse">
                      <Target size={32} />
                    </div>
                    <h4 className="text-2xl font-black text-gray-900 leading-tight">Gördüğün renkleri aşağıdan seç!</h4>
                    <div className="flex gap-3">
                      {[0, 1].map(i => (
                        <div key={i} className={`w-12 h-12 rounded-xl border-4 border-dashed transition-all ${gameState.userSelections[i] ? 'border-solid border-purple-brand scale-110' : 'border-gray-200'}`} style={{ backgroundColor: gameState.userSelections[i] ? COLORS[gameState.userSelections[i] as keyof typeof COLORS] : 'transparent' }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Area */}
              <div className="mt-10 min-h-[80px] flex items-center justify-center w-full">
                {gameState.gameOver ? (
                  <button onClick={restartGame} className="flex items-center gap-3 px-10 py-4 bg-gray-900 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-purple-brand transition-all">
                    <RotateCcw /> Yeniden Dene
                  </button>
                ) : !gameState.isUserTurn && !gameState.showingColors && gameState.userSelections.length === 2 && (
                  <button onClick={() => generateColors(gameState.level + 1)} className="flex items-center gap-3 px-12 py-5 bg-purple-brand text-white font-black text-2xl rounded-full shadow-2xl animate-bounce">
                    Sonraki Seviye <Play />
                  </button>
                )}
              </div>
            </div>

            {/* Controls Area */}
            <div className={`bg-white/60 backdrop-blur-lg p-10 rounded-[4rem] border border-white shadow-xl overflow-hidden relative ${showLevelComplete ? 'pointer-events-none opacity-20' : ''}`}>
              <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 transition-all duration-500 ${gameState.isUserTurn ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-10 filter blur-sm pointer-events-none'}`}>
                {Object.entries(COLORS).map(([name, code]) => (
                  <button
                    key={name}
                    onClick={() => handleColorSelect(name)}
                    disabled={!gameState.isUserTurn || gameState.gameOver || showLevelComplete}
                    className="group relative overflow-hidden p-8 rounded-3xl transition-all active:scale-95 shadow-lg border-b-4 border-black/10"
                    style={{ backgroundColor: code }}
                  >
                    <span className="relative z-10 text-white font-black text-xl uppercase tracking-tighter drop-shadow-md">{name}</span>
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

            {/* Modern Overlay Screens */}
            <AnimatePresence>
              {(gameState.gameOver || showLevelComplete) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/40 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white rounded-[4rem] p-12 shadow-2xl border border-purple-100 text-center max-w-md w-full relative overflow-hidden"
                  >
                    {showLevelComplete ? (
                      <>
                        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg animate-bounce">
                          <Star size={48} fill="currentColor" />
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 mb-4">Harika İş!</h2>
                        <p className="text-lg text-gray-500 font-bold mb-10">
                          {gameState.level}. seviyeyi başarıyla geçtin. <br />Daha hızlı olmaya hazır mısın?
                        </p>
                        <button
                          onClick={() => generateColors(gameState.level + 1)}
                          className="w-full py-6 bg-emerald-500 text-white font-black rounded-3xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-200 hover:scale-105 transition-all text-2xl group"
                        >
                          Sonraki Seviye <Play className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg ${gameState.level === 5 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-500'}`}>
                          {gameState.level === 5 ? <Trophy size={48} fill="currentColor" /> : <Target size={48} />}
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 mb-4">
                          {gameState.level === 5 ? 'Efsanesin!' : 'Tekrar Deneyelim! 💪'}
                        </h2>
                        <p className="text-lg text-gray-500 font-bold mb-10 leading-relaxed">
                          {gameState.level === 5
                            ? `Tebrikler! Tüm seviyeleri tamamlayarak skorunu ${score}'a çıkardın!`
                            : `Hata yaptın ama moralini bozma. <br/>Final Skorun: ${score}`}
                        </p>
                        <button
                          onClick={restartGame}
                          className="w-full py-6 bg-gray-900 text-white font-black rounded-3xl flex items-center justify-center gap-3 shadow-xl hover:bg-purple-brand transition-all text-2xl"
                        >
                          <RotateCcw /> Yeniden Başla
                        </button>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center pt-8">
        <Link to="/beyin-antrenoru-merkezi" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-brand font-black transition-colors">
          <ChevronLeft size={20} /> Antrenör Merkezine Dön
        </Link>
      </div>
    </div>
  );
};


export default ColorPerception;
