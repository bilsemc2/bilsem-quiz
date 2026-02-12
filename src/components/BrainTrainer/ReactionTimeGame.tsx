import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Star, Timer, CheckCircle2, XCircle, ChevronLeft,
    Zap, Target, AlertCircle, Heart, Eye
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useSound } from '../../hooks/useSound';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

type GameMode = 'simple' | 'selective';
type RoundState = 'waiting' | 'ready' | 'go' | 'early' | 'result';

// Child-friendly messages


interface ReactionTimeGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

const ReactionTimeGame: React.FC<ReactionTimeGameProps> = ({ examMode: examModeProp = false }) => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback } = useGameFeedback();

    // examMode can come from props OR location.state (when navigating from ExamContinuePage)
    const examMode = examModeProp || location.state?.examMode === true;
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
    const [gameMode, setGameMode] = useState<GameMode>('simple');
    const [roundState, setRoundState] = useState<RoundState>('waiting');
    const [currentRound, setCurrentRound] = useState(0);
    const [reactionTimes, setReactionTimes] = useState<number[]>([]);
    const [currentReactionTime, setCurrentReactionTime] = useState<number | null>(null);
    const [lives, setLives] = useState(3);
    const [streak, setStreak] = useState(0);
    const [targetColor, setTargetColor] = useState<string>('green');
    const [currentColor, setCurrentColor] = useState<string>('red');
    const [score, setScore] = useState(0);    const gameStartTimeRef = useRef<number>(0);
    const roundStartTimeRef = useRef<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasSavedRef = useRef<boolean>(false);

    const totalRounds = 10;

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // Renk seçenekleri (seçmeli mod için)
    const COLORS = [
        { name: 'Yeşil', value: 'green', hex: '#10b981' },
        { name: 'Kırmızı', value: 'red', hex: '#ef4444' },
        { name: 'Mavi', value: 'blue', hex: '#3b82f6' },
        { name: 'Sarı', value: 'yellow', hex: '#eab308' },
    ];

    // Temizlik
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Yeni tur başlat
    const startRound = useCallback(() => {
        setRoundState('waiting');
        setCurrentReactionTime(null);

        const waitTime = 1500 + Math.random() * 2500;

        timeoutRef.current = setTimeout(() => {
            setRoundState('ready');

            if (gameMode === 'selective') {
                const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
                setCurrentColor(randomColor.value);
            }

            timeoutRef.current = setTimeout(() => {
                setRoundState('go');
                roundStartTimeRef.current = performance.now();
            }, 200 + Math.random() * 300);
        }, waitTime);
    }, [gameMode]);

    // Oyunu başlat
    const startGame = useCallback((mode: GameMode) => {
        window.scrollTo(0, 0);
        setGameMode(mode);
        setGameState('playing');
        setCurrentRound(1);
        setReactionTimes([]);
        setLives(3);
        setStreak(0);
        setScore(0);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;

        if (mode === 'selective') {
            setTargetColor('green');
        }

        setTimeout(() => startRound(), 500);
    }, [startRound]);

    // Handle Auto Start from HUB or Exam Mode
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && gameState === 'idle') {
            startGame('simple');
        }
    }, [location.state, gameState, startGame, examMode]);

    // Tıklama işlemi
    const handleClick = useCallback(() => {
        if (gameState !== 'playing') return;

        if (roundState === 'waiting' || roundState === 'ready') {
            // Erken tıklama!
            setRoundState('early');
            playSound('incorrect');
            showFeedback(false);
            setStreak(0);
            setLives(l => {
                if (l <= 1) {
                    setTimeout(() => setGameState('finished'), 1500);
                    return 0;
                }
                return l - 1;
            });

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                if (lives > 1 && currentRound < totalRounds) {
                    setCurrentRound(prev => prev + 1);
                    startRound();
                } else if (lives > 1) {
                    setGameState('finished');
                }
            }, 1500);
        } else if (roundState === 'go') {
            const reactionTime = performance.now() - roundStartTimeRef.current;
            setCurrentReactionTime(Math.round(reactionTime));

            if (gameMode === 'selective' && currentColor !== targetColor) {
                // Yanlış renge tıkladı!
                setRoundState('result');
                playSound('incorrect');
                showFeedback(false);
                setStreak(0);
                setLives(l => {
                    if (l <= 1) {
                        setTimeout(() => setGameState('finished'), 1500);
                        return 0;
                    }
                    return l - 1;
                });
            } else {
                // Doğru tepki!
                setRoundState('result');
                playSound('correct');
                showFeedback(true);
                setStreak(prev => prev + 1);
                setReactionTimes(prev => [...prev, Math.round(reactionTime)]);

                const timeScore = Math.max(0, 500 - Math.round(reactionTime));
                const roundScore = Math.round(timeScore / 2) + 50 + (streak * 10);
                setScore(prev => prev + roundScore);
            }

            timeoutRef.current = setTimeout(() => {
                if (lives > 0 && currentRound < totalRounds) {
                    setCurrentRound(prev => prev + 1);
                    startRound();
                } else {
                    setGameState('finished');
                }
            }, 1500);
        }
    }, [gameState, roundState, currentRound, gameMode, currentColor, targetColor, startRound, lives, streak, playSound]);

    // Seçmeli modda bekleme (tıklamama)
    const handleWait = useCallback(() => {
        if (gameState !== 'playing' || gameMode !== 'selective') return;
        if (roundState !== 'go') return;

        if (currentColor !== targetColor) {
            // Doğru bekleme!
            setRoundState('result');
            setCurrentReactionTime(null);
            playSound('correct');
            showFeedback(true);
            setStreak(prev => prev + 1);
            setScore(prev => prev + 75 + (streak * 5));

            timeoutRef.current = setTimeout(() => {
                if (currentRound < totalRounds) {
                    setCurrentRound(prev => prev + 1);
                    startRound();
                } else {
                    setGameState('finished');
                }
            }, 1500);
        }
    }, [gameState, gameMode, roundState, currentColor, targetColor, currentRound, startRound, streak, playSound]);

    // Seçmeli modda otomatik timeout
    useEffect(() => {
        if (gameMode === 'selective' && roundState === 'go') {
            const timeout = setTimeout(() => {
                if (roundState === 'go') {
                    handleWait();
                }
            }, 1500);

            return () => clearTimeout(timeout);
        }
    }, [gameMode, roundState, handleWait]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (gameState === 'finished' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            const avgReaction = reactionTimes.length > 0
                ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
                : 0;
            const bestReaction = reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0;

            // Exam mode: submit result and navigate
            if (examMode) {
                const passed = reactionTimes.length >= 5 && avgReaction < 400;
                submitResult(passed, score, 1000, durationSeconds).then(() => {
                    navigate('/atolyeler/sinav-simulasyonu/devam');
                });
                return;
            }

            saveGamePlay({
                game_id: 'tepki-suresi',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
                metadata: {
                    game_mode: gameMode,
                    average_reaction_ms: avgReaction,
                    best_reaction_ms: bestReaction,
                    successful_reactions: reactionTimes.length,
                    total_rounds: totalRounds,
                    streak: streak,
                    game_name: 'Tepki Süresi',
                }
            });
        }
    }, [gameState, score, lives, streak, reactionTimes, gameMode, saveGamePlay, examMode, navigate, submitResult]);

    const averageReaction = reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;

    const bestReaction = reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0;

    const getColorHex = (color: string) => {
        switch (color) {
            case 'green': return '#10b981';
            case 'red': return '#ef4444';
            case 'blue': return '#3b82f6';
            case 'yellow': return '#eab308';
            default: return '#10b981';
        }
    };

    // Welcome Screen
    if (gameState === 'idle') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950 to-orange-950 text-white">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
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
                                background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                                boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                            }}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Zap size={52} className="text-white drop-shadow-lg" />
                        </motion.div>

                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                            ⚡ Tepki Süresi
                        </h1>

                        {/* Instructions */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                            <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
                                <Eye size={20} /> Mod Seç
                            </h3>
                        </div>

                        {/* Mode Selection */}
                        <div className="space-y-4 mb-6">
                            {/* Basit Mod */}
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => startGame('simple')}
                                className="w-full p-5 rounded-2xl text-left"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2)',
                                    border: '2px solid rgba(16, 185, 129, 0.5)'
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                                        style={{
                                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                            boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2)'
                                        }}
                                    >
                                        <Zap size={28} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-emerald-300">Basit Tepki</h3>
                                        <p className="text-slate-400 text-sm">Yeşil görünce hemen tıkla!</p>
                                    </div>
                                </div>
                            </motion.button>

                            {/* Seçmeli Mod */}
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => startGame('selective')}
                                className="w-full p-5 rounded-2xl text-left"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2)',
                                    border: '2px solid rgba(251, 191, 36, 0.5)'
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                                        style={{
                                            background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                                            boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2)'
                                        }}
                                    >
                                        <Target size={28} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-amber-300">Seçmeli Tepki</h3>
                                        <p className="text-slate-400 text-sm">Sadece yeşile tıkla, diğerlerinde bekle!</p>
                                    </div>
                                </div>
                            </motion.button>
                        </div>

                        {/* TUZÖ Badge */}
                        <div className="bg-amber-500/10 text-amber-300 text-xs px-4 py-2 rounded-full inline-block border border-amber-500/30">
                            TUZÖ 8.1.1 Tepki Hızı
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950 to-orange-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
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

                        {/* Round */}
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                border: '1px solid rgba(251, 191, 36, 0.3)'
                            }}
                        >
                            <Target className="text-amber-400" size={18} />
                            <span className="font-bold text-amber-400">{currentRound}/{totalRounds}</span>
                        </div>

                        {/* Avg Reaction Time */}
                        {averageReaction > 0 && (
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(2, 132, 199, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(14, 165, 233, 0.3)'
                                }}
                            >
                                <Timer className="text-sky-400" size={18} />
                                <span className="font-bold text-sky-400 font-mono">{averageReaction}ms</span>
                            </div>
                        )}

                        {/* Streak */}
                        {streak > 0 && (
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.2) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(251, 191, 36, 0.5)'
                                }}
                            >
                                <Zap className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400">x{streak}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {/* Playing State */}
                    {gameState === 'playing' && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-xl"
                        >
                            {/* Seçmeli mod bilgisi */}
                            {gameMode === 'selective' && (
                                <div
                                    className="rounded-2xl p-4 mb-4 flex items-center justify-center gap-3"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)'
                                    }}
                                >
                                    <span className="text-slate-400">Hedef:</span>
                                    <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: '#10b981' }} />
                                    <span className="text-emerald-400 font-bold">YEŞİL</span>
                                </div>
                            )}

                            {/* Reaction Area */}
                            <motion.button
                                onClick={handleClick}
                                className="w-full aspect-video rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all"
                                style={{
                                    background: roundState === 'waiting'
                                        ? 'linear-gradient(135deg, #374151 0%, #1F2937 100%)'
                                        : roundState === 'ready'
                                            ? 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)'
                                            : roundState === 'go'
                                                ? `linear-gradient(135deg, ${getColorHex(gameMode === 'selective' ? currentColor : 'green')} 0%, ${getColorHex(gameMode === 'selective' ? currentColor : 'green')}CC 100%)`
                                                : roundState === 'early'
                                                    ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                                    : 'linear-gradient(135deg, #374151 0%, #1F2937 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                whileHover={{ scale: roundState === 'go' ? 1.02 : 1 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {roundState === 'waiting' && (
                                    <div className="text-center">
                                        <Timer className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                        <p className="text-2xl font-bold text-slate-300">Bekle...</p>
                                        <p className="text-slate-500">Yeşil görünce tıkla</p>
                                    </div>
                                )}

                                {roundState === 'ready' && (
                                    <div className="text-center">
                                        <AlertCircle className="w-16 h-16 text-amber-900 mx-auto mb-4 animate-pulse" />
                                        <p className="text-2xl font-bold text-amber-900">Hazırlan!</p>
                                    </div>
                                )}

                                {roundState === 'go' && (
                                    <div className="text-center">
                                        <Zap className="w-20 h-20 text-white mx-auto mb-4" />
                                        <p className="text-4xl font-black text-white">
                                            {gameMode === 'selective' && currentColor !== targetColor ? 'BEKLEME!' : 'TIKLA!'}
                                        </p>
                                    </div>
                                )}

                                {roundState === 'early' && (
                                    <div className="text-center">
                                        <XCircle className="w-16 h-16 text-white mx-auto mb-4" />
                                        <p className="text-2xl font-bold text-white">Çok Erken!</p>
                                    </div>
                                )}

                                {roundState === 'result' && (
                                    <div className="text-center">
                                        {currentReactionTime !== null ? (
                                            <>
                                                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                                                <p className="text-4xl font-black text-emerald-400">{currentReactionTime} ms</p>
                                                <p className="text-slate-400 mt-2">
                                                    {currentReactionTime < 200 ? '⚡ Şimşek hızı!' :
                                                        currentReactionTime < 300 ? '🚀 Harika!' :
                                                            currentReactionTime < 400 ? '👍 İyi!' : '💪 Hızlanabilirsin'}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                                                <p className="text-2xl font-bold text-emerald-400">Doğru Bekleme!</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </motion.button>

                            {/* Stats */}
                            <div className="flex justify-center items-center gap-6 mt-6 text-sm text-slate-400">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>{reactionTimes.length} Başarılı</span>
                                </div>
                                {bestReaction > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-amber-400" />
                                        <span>En iyi: {bestReaction}ms</span>
                                    </div>
                                )}
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
                                    background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Trophy size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-amber-300 mb-2">
                                ⚡ Test Tamamlandı!
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {averageReaction < 250 ? 'Şimşek gibi refleksler!' :
                                    averageReaction < 350 ? 'Harika tepki süresi!' :
                                        averageReaction < 450 ? 'İyi performans!' :
                                            'Pratik yaparak gelişebilirsin!'}
                            </p>

                            <div
                                className="rounded-2xl p-6 mb-8"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-2xl font-bold text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Ortalama</p>
                                        <p className="text-2xl font-bold text-sky-400 font-mono">{averageReaction}ms</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">En İyi</p>
                                        <p className="text-2xl font-bold text-emerald-400 font-mono">{bestReaction}ms</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Başarılı</p>
                                        <p className="text-2xl font-bold text-purple-400">{reactionTimes.length}/{totalRounds}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setGameState('idle')}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(251, 191, 36, 0.4)'
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

export default ReactionTimeGame;
