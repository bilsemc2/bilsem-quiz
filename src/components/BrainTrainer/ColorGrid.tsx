import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Brain, Star, Trophy, Rocket, RotateCcw, ChevronLeft, Play, Eye } from 'lucide-react';
import { useSound } from '../../hooks/useSound';

// Renk seçenekleri ve modern tonları
const COLORS = [
  { id: 'red', name: 'Kırmızı', bg: 'bg-red-500', shadow: 'shadow-red-500/50', active: 'ring-red-400' },
  { id: 'blue', name: 'Mavi', bg: 'bg-blue-500', shadow: 'shadow-blue-500/50', active: 'ring-blue-400' },
  { id: 'yellow', name: 'Sarı', bg: 'bg-yellow-400', shadow: 'shadow-yellow-400/50', active: 'ring-yellow-300' },
  { id: 'green', name: 'Yeşil', bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/50', active: 'ring-emerald-400' }
];

const LEVEL_COLORS = {
  1: 2, 2: 3, 3: 4, 4: 5, 5: 6
};

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
  const [showLevelComplete, setShowLevelComplete] = useState(false);

  const startGame = useCallback(() => {
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
    setShowLevelComplete(false);
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
      setGameState(prev => ({ ...prev, gameOver: true, isUserTurn: false }));
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

        if (gameState.level === 5) {
          playSound('complete');
          setGameState(prev => ({ ...prev, gameOver: true, isUserTurn: false }));
        } else {
          playSound('correct');
          setShowLevelComplete(true);
        }
      }
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 select-none">
      {/* Üst Bilgi Paneli */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl border border-white mb-8 flex flex-wrap items-center justify-between gap-6"
      >
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-brand shadow-inner">
            <Brain size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Renk Sekansı</h1>
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
              <Eye size={14} /> Görsel Hafıza Antrenmanı
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-purple-50 px-6 py-3 rounded-2xl border border-purple-100 text-center">
            <span className="block text-xs font-black text-purple-400 uppercase">Seviye</span>
            <span className="text-2xl font-black text-purple-brand">{gameState.level}/5</span>
          </div>
          <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 text-center">
            <span className="block text-xs font-black text-emerald-400 uppercase">Skor</span>
            <span className="text-2xl font-black text-emerald-600">{score}</span>
          </div>
        </div>
      </motion.div>

      {/* Oyun Alanı */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Sol Kolon: Talimatlar */}
        <div className="space-y-6 order-2 lg:order-1">
          <div className="bg-white/60 backdrop-blur rounded-[2rem] p-8 shadow-lg border border-white">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Star className="text-yellow-500" fill="currentColor" />
              Nasıl Oynanır?
            </h3>
            <ul className="space-y-4">
              {[
                "Renklerin yanış sırasını dikkatle izle.",
                "Sıra sana geldiğinde aynı hücrelere tıkla.",
                "Her seviyede sekans daha da uzayacak.",
                "Tüm seviyeleri hatasız tamamla!"
              ].map((text, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-brand text-white text-xs font-black rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-gray-600 font-medium leading-tight">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            to="/beyin-antrenoru-merkezi"
            className="flex items-center justify-center gap-2 w-full py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase text-sm tracking-widest"
          >
            <ChevronLeft size={20} /> Antrenör Merkezine Dön
          </Link>
        </div>

        {/* Orta Kolon: 3x3 Grid */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <motion.div
            layout
            className="bg-white/80 backdrop-blur-2xl rounded-[3rem] p-8 lg:p-12 shadow-2xl border border-white relative overflow-hidden"
          >
            {/* Durum Göstergesi */}
            <div className="absolute top-0 left-0 right-0 py-4 px-8 bg-purple-brand/5 border-b border-purple-brand/10 text-center font-black text-purple-brand text-sm tracking-[0.2em] uppercase">
              {gameState.isShowingSequence ? 'Sekans İzleniyor...' :
                gameState.isUserTurn ? 'Sıra Sende!' :
                  gameState.gameOver ? 'Oyun Bitti' : 'Başlamaya Hazır'}
            </div>

            <div className="grid grid-cols-3 gap-4 lg:gap-6 mt-8">
              {cells.map((cell) => {
                const activeColorData = COLORS.find(c => c.id === cell.activeColor);
                return (
                  <motion.button
                    key={cell.id}
                    whileHover={gameState.isUserTurn && !showLevelComplete ? { scale: 0.98 } : {}}
                    whileTap={gameState.isUserTurn && !showLevelComplete ? { scale: 0.92 } : {}}
                    onClick={() => handleCellClick(cell.id)}
                    className={`
                      aspect-square rounded-[2rem] lg:rounded-[2.5rem] transition-all duration-300 relative overflow-hidden
                      ${cell.activeColor
                        ? `${activeColorData?.bg} ${activeColorData?.shadow} shadow-2xl scale-105 z-10`
                        : 'bg-gray-50 border-4 border-gray-100/50 hover:bg-gray-100'}
                      ${gameState.isUserTurn && !showLevelComplete ? 'cursor-pointer' : 'cursor-default text-transparent'}
                    `}
                  >
                    <AnimatePresence>
                      {cell.activeColor && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.5 }}
                          className="absolute inset-4 rounded-full bg-white/30 blur-xl"
                        />
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>

            {/* Başlatma / Hata / Galibiyet / Seviye Geçişi Overlay Ekranları */}
            <AnimatePresence mode="wait">
              {(!gameState.gameStarted || gameState.gameOver || showLevelComplete) && (
                <motion.div
                  key={showLevelComplete ? 'level-up' : gameState.gameOver ? 'game-over' : 'start'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/70 backdrop-blur-md z-30 flex items-center justify-center p-8"
                >
                  <motion.div
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-white rounded-[3rem] p-12 shadow-2xl border border-purple-100 text-center max-w-sm relative"
                  >
                    {/* Seviye Geçiş Ekranı */}
                    {showLevelComplete ? (
                      <>
                        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-lg">
                          <Star size={40} fill="currentColor" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Harika!</h2>
                        <p className="text-gray-500 font-bold mb-8">
                          {gameState.level}. Seviye Tamamlandı. Bir sonraki aşamaya hazır mısın?
                        </p>
                        <button
                          onClick={() => generateSequence(gameState.level + 1)}
                          className="w-full py-5 bg-emerald-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-200 hover:scale-105 transition-all text-xl"
                        >
                          Sonraki Seviye <Play size={24} fill="currentColor" />
                        </button>
                      </>
                    ) : (
                      /* Giriş / Oyun Bitti Ekranı */
                      <>
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg ${gameState.gameOver ? 'bg-red-100 text-red-500' : 'bg-purple-100 text-purple-brand'}`}>
                          {gameState.gameOver ? (gameState.level === 5 ? <Trophy size={40} className="text-yellow-500" /> : <Rocket size={40} />) : <Play size={40} fill="currentColor" />}
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">
                          {gameState.gameOver ? (gameState.level === 5 ? 'Şampiyon!' : 'Hata Yaptın!') : 'Hazır mısın?'}
                        </h2>
                        <p className="text-gray-500 font-bold mb-8 leading-relaxed">
                          {gameState.gameOver
                            ? (gameState.level === 5
                              ? `Final Skoru: ${score}. Tüm sekansları kusursuz hatırladın!`
                              : `Yanlış hücreye tıkladın. Final Skorun: ${score}`)
                            : 'Zihnini odakla ve renkleri takip et.'}
                        </p>
                        <button
                          onClick={startGame}
                          className={`w-full py-5 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all text-xl hover:scale-105 ${gameState.gameOver ? 'bg-gray-900 shadow-gray-200' : 'bg-purple-brand shadow-purple-200'}`}
                        >
                          {gameState.gameOver ? <RotateCcw size={24} /> : <Rocket size={24} />}
                          {gameState.gameOver ? 'Yeniden Dene' : 'Başlat!'}
                        </button>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ColorGrid;