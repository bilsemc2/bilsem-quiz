import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Timer, CheckCircle2, XCircle, ChevronLeft, Zap, Target, Eye, Sparkles, Heart } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useSound } from '../../hooks/useSound';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// Sembol seti - hedef ve dikkat dağıtıcılar
const ALL_SYMBOLS = ['★', '●', '■', '▲', '◆', '♦', '♣', '♠', '♥', '○', '□', '△', '◇', '✕', '✓', '⬟'];

interface CellData {
    symbol: string;
    isTarget: boolean;
    isClicked: boolean;
    isMissed: boolean;
    isWrongClick: boolean;
}

// Child-friendly messages


interface VisualScanningGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

const VisualScanningGame: React.FC<VisualScanningGameProps> = ({ examMode: examModeProp = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const { playSound } = useSound();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback } = useGameFeedback();

    // examMode can come from props OR location.state (when navigating from ExamContinuePage)
    const examMode = examModeProp || location.state?.examMode === true;
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
    const [lives, setLives] = useState(3);    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const gameDuration = 60;
    const gridSize = 64; // 8x8 grid

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // Seviyeye göre hedef sayısı ve dikkat dağıtıcı çeşitliliği
    const getLevelConfig = (lvl: number) => {
        const configs = [
            { targetCount: 8, distractorTypes: 3 },
            { targetCount: 10, distractorTypes: 4 },
            { targetCount: 12, distractorTypes: 5 },
            { targetCount: 14, distractorTypes: 6 },
            { targetCount: 16, distractorTypes: 7 },
        ];
        return configs[Math.min(lvl - 1, configs.length - 1)];
    };

    // Grid oluştur
    const generateGrid = useCallback((target: string, lvl: number): CellData[] => {
        const config = getLevelConfig(lvl);
        const cells: CellData[] = [];

        const distractors = ALL_SYMBOLS
            .filter(s => s !== target)
            .sort(() => Math.random() - 0.5)
            .slice(0, config.distractorTypes);

        const targetPositions = new Set<number>();
        while (targetPositions.size < config.targetCount) {
            targetPositions.add(Math.floor(Math.random() * gridSize));
        }

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
        const newTarget = ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
        setTargetSymbol(newTarget);
        setGrid(generateGrid(newTarget, currentLevel));
    }, [generateGrid]);

    const startGame = useCallback(() => {
        window.scrollTo(0, 0);
        setScore(0);
        setCorrectCount(0);
        setWrongCount(0);
        setMissedCount(0);
        setTimeLeft(gameDuration);
        setStreak(0);
        setBestStreak(0);
        setLevel(1);
        setLives(3);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
        setGameState('playing');
        startNewRound(1);
    }, [startNewRound]);

    // Handle Auto Start from HUB or Exam Mode
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && gameState === 'idle') {
            startGame();
        }
    }, [location.state, gameState, startGame, examMode]);

    // Zamanlayıcı
    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (gameState === 'playing' && timeLeft === 0) {
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

            // Exam mode: submit result and navigate
            if (examMode) {
                const passed = correctCount > wrongCount && correctCount >= 5;
                await submitResult(passed, score, 1000, durationSeconds).then(() => {
                    navigate('/atolyeler/sinav-simulasyonu/devam');
                });
                return;
            }

            saveGamePlay({
                game_id: 'gorsel-tarama',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
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
    }, [gameState, score, lives, correctCount, wrongCount, missedCount, bestStreak, level, saveGamePlay, examMode, navigate, submitResult]);

    // Tur tamamlandı mı kontrol et
    useEffect(() => {
        if (gameState !== 'playing') return;

        const remainingTargets = grid.filter(cell => cell.isTarget && !cell.isClicked).length;

        if (remainingTargets === 0 && grid.length > 0) {
            const bonusTime = 5;
            setTimeLeft(prev => Math.min(prev + bonusTime, gameDuration));

            const newLevel = Math.min(level + 1, 5);
            setLevel(newLevel);

            showFeedback(true);
            playSound('correct');

            setTimeout(() => {
                startNewRound(newLevel);
            }, 1000);
        }
    }, [grid, gameState, level, startNewRound, playSound]);

    // Hücreye tıklama
    const handleCellClick = (index: number) => {
        if (gameState !== 'playing') return;

        const cell = grid[index];
        if (cell.isClicked || cell.isWrongClick) return;

        const newGrid = [...grid];

        if (cell.isTarget) {
            newGrid[index] = { ...cell, isClicked: true };
            setCorrectCount(prev => prev + 1);
            setStreak(prev => {
                const newStreak = prev + 1;
                if (newStreak > bestStreak) setBestStreak(newStreak);
                return newStreak;
            });
            const streakBonus = Math.min(streak * 2, 20);
            setScore(prev => prev + 25 + streakBonus);
            playSound('correct');
        } else {
            newGrid[index] = { ...cell, isWrongClick: true };
            setWrongCount(prev => prev + 1);
            setStreak(0);
            setScore(prev => Math.max(0, prev - 10));
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    setGameState('finished');
                }
                return newLives;
            });
            showFeedback(false);
            playSound('incorrect');
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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-rose-950 to-pink-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
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

                    {gameState === 'playing' && (
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
                                    background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(225, 29, 72, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(244, 63, 94, 0.3)'
                                }}
                            >
                                <Target className="text-rose-400" size={18} />
                                <span className="font-bold text-rose-400">Seviye {level}</span>
                            </div>

                            {/* Timer */}
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: timeLeft <= 10
                                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)'
                                        : 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(8, 145, 178, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: timeLeft <= 10
                                        ? '1px solid rgba(239, 68, 68, 0.5)'
                                        : '1px solid rgba(6, 182, 212, 0.3)'
                                }}
                            >
                                <Timer className={timeLeft <= 10 ? 'text-red-400' : 'text-cyan-400'} size={18} />
                                <span className={`font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-cyan-400'}`}>{formatTime(timeLeft)}</span>
                            </div>

                            {/* Streak */}
                            {streak > 0 && (
                                <div
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
                                        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(168, 85, 247, 0.3)'
                                    }}
                                >
                                    <Zap className="text-purple-400" size={18} />
                                    <span className="font-bold text-purple-400">x{streak}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {/* Welcome Screen */}
                    {gameState === 'idle' && (
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
                                    background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Eye size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
                                👁️ Görsel Tarama
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
                                    <div className="text-center">
                                        <span className="text-slate-400 text-xs">Hedef:</span>
                                        <div
                                            className="w-14 h-14 rounded-[25%] flex items-center justify-center mt-1"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.3) 0%, rgba(225, 29, 72, 0.2) 100%)',
                                                border: '2px solid rgba(244, 63, 94, 0.5)'
                                            }}
                                        >
                                            <span className="text-rose-400 text-2xl font-bold">★</span>
                                        </div>
                                    </div>
                                    <span className="text-2xl">→</span>
                                    <div className="grid grid-cols-4 gap-1">
                                        {['●', '★', '■', '▲', '◆', '★', '♦', '●'].map((s, i) => (
                                            <div
                                                key={i}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                                                style={{
                                                    background: s === '★' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(255,255,255,0.05)',
                                                    border: s === '★' ? '1px solid rgba(244, 63, 94, 0.5)' : '1px solid rgba(255,255,255,0.1)'
                                                }}
                                            >
                                                <span className={s === '★' ? 'text-rose-400' : 'text-slate-500'}>{s}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-slate-400 text-sm">Grid'deki tüm hedef sembolleri bul!</p>
                            </div>

                            {/* Instructions */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-rose-300 mb-3 flex items-center gap-2">
                                    <Eye size={20} /> Nasıl Oynanır?
                                </h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-rose-400" />
                                        <span>Grid'deki <strong>hedef sembolü</strong> bul</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-rose-400" />
                                        <span>Hepsini bulunca <strong>seviye atla</strong></span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-rose-400" />
                                        <span>Yanlış tıklamasan dikkat! 3 can!</span>
                                    </li>
                                </ul>
                            </div>

                            {/* TUZÖ Badge */}
                            <div className="bg-rose-500/10 text-rose-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-rose-500/30">
                                TUZÖ 5.2.1 Görsel Tarama & Seçici Dikkat
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="px-8 py-4 rounded-2xl font-bold text-lg"
                                style={{
                                    background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(244, 63, 94, 0.4)'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={24} fill="currentColor" />
                                    <span>Teste Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Playing State */}
                    {gameState === 'playing' && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-xl"
                        >
                            {/* Target Display */}
                            <div
                                className="rounded-2xl p-4 mb-4 flex items-center justify-center gap-4"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                    border: '2px solid rgba(244, 63, 94, 0.3)'
                                }}
                            >
                                <span className="text-slate-400 text-sm uppercase tracking-wider">Hedef:</span>
                                <div
                                    className="w-14 h-14 rounded-[25%] flex items-center justify-center"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.3) 0%, rgba(225, 29, 72, 0.2) 100%)',
                                        border: '2px solid rgba(244, 63, 94, 0.5)'
                                    }}
                                >
                                    <span className="text-rose-400 text-3xl">{targetSymbol}</span>
                                </div>
                                <div className="text-slate-400 text-sm">
                                    <span className="text-rose-400 font-bold">{totalTargetsInRound - remainingTargets}</span>/{totalTargetsInRound}
                                </div>
                            </div>

                            {/* Grid */}
                            <div
                                className="grid grid-cols-8 gap-1 p-3 rounded-2xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                {grid.map((cell, index) => (
                                    <motion.button
                                        key={index}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.005 }}
                                        onClick={() => handleCellClick(index)}
                                        disabled={cell.isClicked || cell.isWrongClick}
                                        className="aspect-square rounded-lg flex items-center justify-center text-xl lg:text-2xl font-bold transition-all"
                                        style={{
                                            background: cell.isClicked
                                                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                                : cell.isWrongClick
                                                    ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                                    : 'rgba(255,255,255,0.05)',
                                            border: cell.isClicked
                                                ? '2px solid #10B981'
                                                : cell.isWrongClick
                                                    ? '2px solid #EF4444'
                                                    : '1px solid rgba(255,255,255,0.1)',
                                            boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                            cursor: cell.isClicked || cell.isWrongClick ? 'default' : 'pointer'
                                        }}
                                    >
                                        <span className={
                                            cell.isClicked || cell.isWrongClick
                                                ? 'text-white'
                                                : 'text-slate-400'
                                        }>{cell.symbol}</span>
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
                            key="finished"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, #F43F5E 0%, #EF4444 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Trophy size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-rose-300 mb-2">
                                {level >= 4 ? '🎉 Harika!' : 'Test Tamamlandı!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {level >= 4 ? 'Keskin gözlü bir dedektifsin!' : 'Tekrar deneyelim!'}
                            </p>

                            <div
                                className="rounded-2xl p-6 mb-8"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-3xl font-bold text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Doğruluk</p>
                                        <p className="text-3xl font-bold text-emerald-400">%{accuracy}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-xs">Bulunan</p>
                                        <p className="text-xl font-bold text-rose-400">{correctCount}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-xs">Seviye</p>
                                        <p className="text-xl font-bold text-purple-400">{level}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-xs">En İyi Seri</p>
                                        <p className="text-xl font-bold text-cyan-400">x{bestStreak}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(244, 63, 94, 0.4)'
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

export default VisualScanningGame;
