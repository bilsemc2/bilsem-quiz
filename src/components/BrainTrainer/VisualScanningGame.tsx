import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Timer, CheckCircle2, XCircle, ChevronLeft, Zap, Target, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// Sembol seti - hedef ve dikkat dağıtıcılar
const ALL_SYMBOLS = ['★', '●', '■', '▲', '◆', '♦', '♣', '♠', '♥', '○', '□', '△', '◇', '✕', '✓', '⬟'];

interface CellData {
    symbol: string;
    isTarget: boolean;
    isClicked: boolean;
    isMissed: boolean;
    isWrongClick: boolean;
}

const VisualScanningGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
    const [targetSymbol, setTargetSymbol] = useState<string>('★');
    const [grid, setGrid] = useState<CellData[]>([]);
    const [timeLeft, setTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [missedCount, setMissedCount] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [level, setLevel] = useState(1);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const gameDuration = 60;
    const gridSize = 64; // 8x8 grid

    // Seviyeye göre hedef sayısı ve dikkat dağıtıcı çeşitliliği
    const getLevelConfig = (lvl: number) => {
        const configs = [
            { targetCount: 8, distractorTypes: 3 },  // Level 1: 8 hedef, 3 farklı dikkat dağıtıcı
            { targetCount: 10, distractorTypes: 4 }, // Level 2: 10 hedef, 4 farklı
            { targetCount: 12, distractorTypes: 5 }, // Level 3: 12 hedef, 5 farklı
            { targetCount: 14, distractorTypes: 6 }, // Level 4: 14 hedef, 6 farklı
            { targetCount: 16, distractorTypes: 7 }, // Level 5: 16 hedef, 7 farklı
        ];
        return configs[Math.min(lvl - 1, configs.length - 1)];
    };

    // Grid oluştur
    const generateGrid = useCallback((target: string, lvl: number): CellData[] => {
        const config = getLevelConfig(lvl);
        const cells: CellData[] = [];

        // Hedef olmayan sembolleri seç
        const distractors = ALL_SYMBOLS
            .filter(s => s !== target)
            .sort(() => Math.random() - 0.5)
            .slice(0, config.distractorTypes);

        // Hedef pozisyonlarını rastgele seç
        const targetPositions = new Set<number>();
        while (targetPositions.size < config.targetCount) {
            targetPositions.add(Math.floor(Math.random() * gridSize));
        }

        // Grid'i doldur
        for (let i = 0; i < gridSize; i++) {
            if (targetPositions.has(i)) {
                cells.push({
                    symbol: target,
                    isTarget: true,
                    isClicked: false,
                    isMissed: false,
                    isWrongClick: false,
                });
            } else {
                cells.push({
                    symbol: distractors[Math.floor(Math.random() * distractors.length)],
                    isTarget: false,
                    isClicked: false,
                    isMissed: false,
                    isWrongClick: false,
                });
            }
        }

        return cells;
    }, []);

    // Yeni tur başlat
    const startNewRound = useCallback((currentLevel: number) => {
        // Yeni hedef sembol seç
        const newTarget = ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
        setTargetSymbol(newTarget);
        setGrid(generateGrid(newTarget, currentLevel));
    }, [generateGrid]);

    const startGame = useCallback(() => {
        setScore(0);
        setCorrectCount(0);
        setWrongCount(0);
        setMissedCount(0);
        setTimeLeft(gameDuration);
        setStreak(0);
        setBestStreak(0);
        setLevel(1);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
        setGameState('playing');
        startNewRound(1);
    }, [startNewRound]);

    // Zamanlayıcı
    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (gameState === 'playing' && timeLeft === 0) {
            // Süre dolunca kaçırılanları hesapla
            const missed = grid.filter(cell => cell.isTarget && !cell.isClicked).length;
            setMissedCount(prev => prev + missed);
            setGameState('finished');
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [gameState, timeLeft, grid]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (gameState === 'finished' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            const totalTargets = correctCount + missedCount;
            saveGamePlay({
                game_id: 'gorsel-tarama',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    correct_count: correctCount,
                    wrong_count: wrongCount,
                    missed_count: missedCount,
                    best_streak: bestStreak,
                    level_reached: level,
                    accuracy: totalTargets > 0 ? Math.round((correctCount / totalTargets) * 100) : 0,
                    game_name: 'Görsel Tarama',
                }
            });
        }
    }, [gameState]);

    // Tur tamamlandı mı kontrol et
    useEffect(() => {
        if (gameState !== 'playing') return;

        const remainingTargets = grid.filter(cell => cell.isTarget && !cell.isClicked).length;

        if (remainingTargets === 0 && grid.length > 0) {
            // Tüm hedefler bulundu!
            const bonusTime = 5; // 5 saniye bonus
            setTimeLeft(prev => Math.min(prev + bonusTime, gameDuration));

            // Seviye artır
            const newLevel = Math.min(level + 1, 5);
            setLevel(newLevel);

            // Yeni tur başlat
            setTimeout(() => {
                startNewRound(newLevel);
            }, 500);
        }
    }, [grid, gameState, level, startNewRound]);

    // Hücreye tıklama
    const handleCellClick = (index: number) => {
        if (gameState !== 'playing') return;

        const cell = grid[index];
        if (cell.isClicked || cell.isWrongClick) return; // Zaten tıklanmış

        const newGrid = [...grid];

        if (cell.isTarget) {
            // Doğru tıklama
            newGrid[index] = { ...cell, isClicked: true };
            setCorrectCount(prev => prev + 1);
            setStreak(prev => {
                const newStreak = prev + 1;
                if (newStreak > bestStreak) setBestStreak(newStreak);
                return newStreak;
            });
            const streakBonus = Math.min(streak * 2, 20);
            setScore(prev => prev + 25 + streakBonus);
        } else {
            // Yanlış tıklama
            newGrid[index] = { ...cell, isWrongClick: true };
            setWrongCount(prev => prev + 1);
            setStreak(0);
            setScore(prev => Math.max(0, prev - 10)); // Ceza
        }

        setGrid(newGrid);
    };

    const accuracy = correctCount + wrongCount > 0
        ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
        : 0;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const remainingTargets = grid.filter(cell => cell.isTarget && !cell.isClicked).length;
    const totalTargetsInRound = grid.filter(cell => cell.isTarget).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-6"
                >
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="inline-flex items-center gap-2 text-rose-400 font-bold hover:text-rose-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Bireysel Değerlendirme
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-2">
                        👁️ <span className="text-rose-400">Görsel</span> Tarama
                    </h1>
                    <p className="text-slate-400">Hedef sembolü bul ve tıkla!</p>
                </motion.div>

                {/* Stats */}
                <div className="flex justify-center gap-4 mb-6 flex-wrap">
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400" />
                        <span className="text-white font-bold">{score}</span>
                    </div>
                    {gameState === 'playing' && (
                        <>
                            <div className={`bg-slate-800/50 border rounded-xl px-5 py-2 flex items-center gap-2 ${timeLeft <= 10 ? 'border-red-500 animate-pulse' : 'border-white/10'}`}>
                                <Timer className={`w-5 h-5 ${timeLeft <= 10 ? 'text-red-400' : 'text-rose-400'}`} />
                                <span className={`font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>{formatTime(timeLeft)}</span>
                            </div>
                            <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                                <Target className="w-5 h-5 text-emerald-400" />
                                <span className="text-white font-bold">{totalTargetsInRound - remainingTargets}/{totalTargetsInRound}</span>
                            </div>
                            <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-400" />
                                <span className="text-white font-bold">x{streak}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Game Area */}
                <div className="flex flex-col items-center">
                    {/* Idle State */}
                    {gameState === 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-8 max-w-lg">
                                <div className="text-6xl mb-4">👁️</div>
                                <h2 className="text-2xl font-bold text-white mb-4">Görsel Tarama Testi</h2>

                                <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
                                    <p className="text-slate-300 text-sm mb-3">Nasıl Oynanır:</p>
                                    <div className="flex justify-center items-center gap-2 mb-3">
                                        <span className="text-slate-400">Hedef:</span>
                                        <span className="w-12 h-12 bg-rose-500/20 border-2 border-rose-500 rounded-xl flex items-center justify-center text-rose-400 font-bold text-2xl">
                                            ★
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm">
                                        Grid'deki tüm hedef sembolleri bul ve tıkla!
                                    </p>
                                </div>

                                <ul className="text-slate-400 text-sm space-y-2 text-left mb-6">
                                    <li className="flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-rose-400" />
                                        Hedef sembolü araştırarak bul
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Target className="w-4 h-4 text-emerald-400" />
                                        Tüm hedefleri bulunca <strong className="text-white">seviye atla</strong>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Timer className="w-4 h-4 text-amber-400" />
                                        {gameDuration} saniye içinde en çok puanı topla!
                                    </li>
                                </ul>

                                <button
                                    onClick={startGame}
                                    className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold rounded-xl hover:from-rose-400 hover:to-pink-400 transition-all flex items-center gap-3 mx-auto"
                                >
                                    <Play className="w-5 h-5" />
                                    Teste Başla
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Playing State */}
                    {gameState === 'playing' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full max-w-xl"
                        >
                            {/* Target Display */}
                            <div className="bg-slate-800/70 border border-white/20 rounded-2xl p-4 mb-4 flex items-center justify-center gap-4">
                                <span className="text-slate-400 text-sm uppercase tracking-wider">Hedef Sembol:</span>
                                <div className="w-14 h-14 bg-rose-500/20 border-2 border-rose-500 rounded-xl flex items-center justify-center">
                                    <span className="text-rose-400 text-3xl">{targetSymbol}</span>
                                </div>
                                <div className="text-slate-400 text-sm">
                                    Seviye <span className="text-rose-400 font-bold">{level}</span>
                                </div>
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-8 gap-1 bg-slate-800/50 border border-white/10 rounded-2xl p-3">
                                {grid.map((cell, index) => (
                                    <motion.button
                                        key={index}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.005 }}
                                        onClick={() => handleCellClick(index)}
                                        disabled={cell.isClicked || cell.isWrongClick}
                                        className={`aspect-square rounded-lg flex items-center justify-center text-xl lg:text-2xl font-bold transition-all
                                            ${cell.isClicked
                                                ? 'bg-emerald-500/30 border-2 border-emerald-500 text-emerald-400'
                                                : cell.isWrongClick
                                                    ? 'bg-red-500/30 border-2 border-red-500 text-red-400'
                                                    : cell.isMissed
                                                        ? 'bg-amber-500/30 border-2 border-amber-500 text-amber-400'
                                                        : 'bg-slate-700/50 border border-white/10 text-slate-300 hover:bg-slate-600/50 hover:border-rose-500/50 active:scale-95'
                                            }`}
                                    >
                                        {cell.symbol}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Round Info */}
                            <div className="flex justify-center items-center gap-4 mt-4 text-sm text-slate-400">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>{correctCount} Doğru</span>
                                </div>
                                <span className="text-slate-600">|</span>
                                <div className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    <span>{wrongCount} Yanlış</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Finished State */}
                    {gameState === 'finished' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6 w-full max-w-md"
                        >
                            <div className="bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30 rounded-3xl p-8">
                                <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                                <h2 className="text-3xl font-black text-white mb-2">Süre Doldu! ⏱️</h2>

                                <div className="grid grid-cols-2 gap-4 my-6">
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">Toplam Puan</p>
                                        <p className="text-2xl font-black text-amber-400">{score}</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">Doğruluk</p>
                                        <p className="text-2xl font-black text-emerald-400">%{accuracy}</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">Bulunan Hedef</p>
                                        <p className="text-2xl font-black text-rose-400">{correctCount}</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">En İyi Seri</p>
                                        <p className="text-2xl font-black text-purple-400">x{bestStreak}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-6">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>{correctCount} Doğru</span>
                                    <span className="text-slate-600">|</span>
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    <span>{wrongCount} Yanlış</span>
                                    <span className="text-slate-600">|</span>
                                    <span>Seviye {level}</span>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={startGame}
                                        className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold rounded-xl hover:from-rose-400 hover:to-pink-400 transition-all flex items-center gap-2"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Tekrar Oyna
                                    </button>
                                    <Link
                                        to="/atolyeler/bireysel-degerlendirme"
                                        className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-all"
                                    >
                                        Geri Dön
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VisualScanningGame;
