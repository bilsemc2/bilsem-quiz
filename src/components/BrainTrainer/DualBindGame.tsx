import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RotateCcw, Trophy, Play, Star, Target, CheckCircle2, XCircle,
    Heart, Zap, Eye, Link2, ArrowRight, Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useSound } from '../../hooks/useSound';
import { useExam } from '../../contexts/ExamContext';

interface SymbolColor {
    symbol: string;
    color: string;
    colorName: string;
}

interface Question {
    type: 'color-to-symbol' | 'symbol-to-color';
    query: string;
    hint: string;
    correctAnswer: string;
    options: string[];
}

// Child-friendly messages


const SYMBOLS = ['⭐', '▲', '●', '◆', '⬟', '⬢', '♠', '♥'];

const COLORS = [
    { hex: '#ef4444', name: 'Kırmızı' },
    { hex: '#3b82f6', name: 'Mavi' },
    { hex: '#22c55e', name: 'Yeşil' },
    { hex: '#f59e0b', name: 'Sarı' },
    { hex: '#a855f7', name: 'Mor' },
    { hex: '#ec4899', name: 'Pembe' },
    { hex: '#06b6d4', name: 'Cyan' },
    { hex: '#f97316', name: 'Turuncu' },
];

const DualBindGame = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback: triggerFeedback } = useGameFeedback();

    // Exam Mode Props
    const examMode = location.state?.examMode || false;
    const [gameState, setGameState] = useState<'idle' | 'memorize' | 'question' | 'finished'>('idle');
    const [symbolColors, setSymbolColors] = useState<SymbolColor[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [level, setLevel] = useState(1);
    const [round, setRound] = useState(1);
    const [memorizeTime, setMemorizeTime] = useState(6);
    const [countdown, setCountdown] = useState(6);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [streak, setStreak] = useState(0);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    const totalRounds = 5;
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // Zorluk seviyesine göre çift sayısı
    const getPairCount = () => {
        if (level <= 2) return 3;
        if (level <= 4) return 4;
        if (level <= 6) return 5;
        return 6;
    };

    // Zorluk seviyesine göre ezberleme süresi
    const getMemorizeTime = () => {
        if (level <= 2) return 6;
        if (level <= 4) return 5;
        if (level <= 6) return 4;
        return 3;
    };

    // Şekil-renk eşleşmelerini oluştur
    const generateSymbolColors = useCallback(() => {
        const count = getPairCount();
        const shuffledSymbols = [...SYMBOLS].sort(() => Math.random() - 0.5).slice(0, count);
        const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5).slice(0, count);

        return shuffledSymbols.map((symbol, i) => ({
            symbol,
            color: shuffledColors[i].hex,
            colorName: shuffledColors[i].name,
        }));
    }, [level]);

    // Çift yönlü soru oluştur
    const generateDualQuestions = useCallback((pairs: SymbolColor[]): Question[] => {
        const targetPair = pairs[Math.floor(Math.random() * pairs.length)];
        const otherPairs = pairs.filter(p => p !== targetPair);

        const wrongSymbols = otherPairs.map(p => p.symbol).slice(0, 3);
        const symbolOptions = [targetPair.symbol, ...wrongSymbols].sort(() => Math.random() - 0.5);

        const q1: Question = {
            type: 'color-to-symbol',
            query: 'Bu renkteki şekil hangisiydi?',
            hint: targetPair.color,
            correctAnswer: targetPair.symbol,
            options: symbolOptions,
        };

        const wrongColors = otherPairs.map(p => p.colorName).slice(0, 3);
        const colorOptions = [targetPair.colorName, ...wrongColors].sort(() => Math.random() - 0.5);

        const q2: Question = {
            type: 'symbol-to-color',
            query: 'Bu şekil hangi renkteydi?',
            hint: targetPair.symbol,
            correctAnswer: targetPair.colorName,
            options: colorOptions,
        };

        return [q1, q2];
    }, []);

    // Yeni tur başlat
    const startRound = useCallback(() => {
        const pairs = generateSymbolColors();
        setSymbolColors(pairs);
        const dualQuestions = generateDualQuestions(pairs);
        setQuestions(dualQuestions);
        setCurrentQuestionIndex(0);
        const time = getMemorizeTime();
        setMemorizeTime(time);
        setCountdown(time);
        setGameState('memorize');
        setSelectedAnswer(null);
    }, [generateSymbolColors, generateDualQuestions, level]);

    // Oyunu başlat
    const startGame = useCallback(() => {
        setScore(0);
        setLives(3);
        setStreak(0);
        setRound(1);
        setLevel(1);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
        startRound();
    }, [startRound]);

    // Handle Auto Start from HUB or Exam Mode
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && gameState === 'idle') {
            startGame();
        }
    }, [location.state, gameState, startGame, examMode]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (gameState === 'finished' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);

            // Exam mode: submit result and navigate
            if (examMode) {
                const passed = round >= 3;
                submitResult(passed, score, 1000, durationSeconds).then(() => {
                    navigate("/atolyeler/sinav-simulasyonu/devam");
                });
                return;
            }

            saveGamePlay({
                game_id: 'cift-mod-hafiza',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
                metadata: {
                    level_reached: level,
                    streak: streak,
                    total_rounds: totalRounds,
                    game_name: 'Çift Mod Hafıza',
                }
            });
        }
    }, [gameState, score, level, lives, streak, saveGamePlay, totalRounds, round, examMode, submitResult, navigate]);

    // Ezberleme geri sayımı
    useEffect(() => {
        if (gameState === 'memorize' && countdown > 0) {
            timerRef.current = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (gameState === 'memorize' && countdown === 0) {
            setGameState('question');
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [gameState, countdown]);

    // Cevap kontrolü
    const handleAnswer = (answer: string) => {
        if (feedbackState || questions.length === 0) return;

        const currentQ = questions[currentQuestionIndex];
        setSelectedAnswer(answer);
        const isCorrect = answer === currentQ.correctAnswer;

        if (isCorrect) {
            playSound('correct');
            triggerFeedback(true);
            setStreak(prev => prev + 1);
            const levelBonus = level * 15;
            setScore(prev => prev + 100 + levelBonus + (streak * 10));
        } else {
            playSound('incorrect');
            triggerFeedback(false);
            setStreak(0);
            setLives(l => {
                if (l <= 1) {
                    setTimeout(() => setGameState('finished'), 1500);
                    return 0;
                }
                return l - 1;
            });
        }

        setTimeout(() => {
            setSelectedAnswer(null);

            if (lives <= 1 && !isCorrect) return;

            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                if (round >= totalRounds) {
                    setGameState('finished');
                } else {
                    if (round % 2 === 0 && level < 7) {
                        setLevel(prev => prev + 1);
                    }
                    setRound(prev => prev + 1);
                    startRound();
                }
            }
        }, 1500);
    };

    const currentQuestion = questions[currentQuestionIndex];

    // Welcome Screen
    if (gameState === 'idle') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-rose-950 to-pink-950 text-white">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
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
                                background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
                                boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                            }}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Link2 size={52} className="text-white drop-shadow-lg" />
                        </motion.div>

                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
                            🔗 Çift Mod Hafıza
                        </h1>

                        {/* Preview */}
                        <div
                            className="rounded-2xl p-5 mb-6"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-red-500" />
                                <ArrowRight className="text-slate-400" size={20} />
                                <span className="text-2xl">⭐</span>
                                <span className="text-slate-500 mx-2">|</span>
                                <span className="text-2xl">⭐</span>
                                <ArrowRight className="text-slate-400" size={20} />
                                <div className="w-8 h-8 rounded-lg bg-red-500" />
                            </div>
                            <p className="text-slate-400 text-sm">Çift yönlü eşleştirme!</p>
                        </div>

                        {/* Instructions */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                            <h3 className="text-lg font-bold text-rose-300 mb-3 flex items-center gap-2">
                                <Eye size={20} /> Nasıl Oynanır?
                            </h3>
                            <ul className="space-y-2 text-slate-300 text-sm">
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-rose-400" />
                                    <span>Şekil-renk eşleşmelerini <strong>ezberle</strong></span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-rose-400" />
                                    <span><strong>Renk→Şekil</strong> ve <strong>Şekil→Renk</strong> sorularını cevapla</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-rose-400" />
                                    <span>3 can, {totalRounds} tur, çift yönlü hafıza!</span>
                                </li>
                            </ul>
                        </div>

                        {/* TUZÖ Badge */}
                        <div className="bg-rose-500/10 text-rose-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-rose-500/30">
                            TUZÖ 5.2.1 Görsel Hafıza
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
                </div>
            </div>
        );
    }

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
                                background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(225, 29, 72, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                border: '1px solid rgba(244, 63, 94, 0.3)'
                            }}
                        >
                            <Target className="text-rose-400" size={18} />
                            <span className="font-bold text-rose-400">{round}/{totalRounds}</span>
                        </div>

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
                    {/* Memorize State */}
                    {gameState === 'memorize' && (
                        <motion.div
                            key="memorize"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center space-y-6 w-full max-w-lg"
                        >
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Eye className="text-rose-400" size={24} />
                                <span className="text-slate-400">Ezberle:</span>
                                <span className="text-3xl font-black text-white">{countdown}</span>
                            </div>

                            <div
                                className="rounded-3xl p-8"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <div className="grid grid-cols-3 gap-4">
                                    {symbolColors.map((sc, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.15 }}
                                            className="bg-slate-800/50 rounded-2xl p-4 flex flex-col items-center gap-2"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-lg"
                                                style={{ backgroundColor: sc.color }}
                                            />
                                            <span className="text-4xl" style={{ color: sc.color }}>
                                                {sc.symbol}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: memorizeTime, ease: 'linear' }}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Question State */}
                    {gameState === 'question' && currentQuestion && (
                        <motion.div
                            key="question"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-center space-y-6 w-full max-w-lg"
                        >
                            <div className="flex justify-center gap-2 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentQuestionIndex === 0
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-slate-700/50 text-slate-500'
                                    }`}>
                                    Renk → Şekil
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentQuestionIndex === 1
                                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                                    : 'bg-slate-700/50 text-slate-500'
                                    }`}>
                                    Şekil → Renk
                                </span>
                            </div>

                            <div
                                className="rounded-3xl p-8"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <p className="text-slate-400 text-sm mb-4">{currentQuestion.query}</p>
                                {currentQuestion.type === 'color-to-symbol' ? (
                                    <div
                                        className="w-20 h-20 rounded-2xl mx-auto mb-4"
                                        style={{ backgroundColor: currentQuestion.hint }}
                                    />
                                ) : (
                                    <div className="text-7xl mb-4">{currentQuestion.hint}</div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = selectedAnswer === option;
                                    const isCorrect = option === currentQuestion.correctAnswer;
                                    const showResult = feedbackState !== null;
                                    const colorHex = COLORS.find(c => c.name === option)?.hex;

                                    return (
                                        <motion.button
                                            key={idx}
                                            onClick={() => handleAnswer(option)}
                                            disabled={feedbackState !== null}
                                            whileHover={{ scale: feedbackState ? 1 : 0.98 }}
                                            whileTap={{ scale: feedbackState ? 1 : 0.95 }}
                                            style={currentQuestion.type === 'symbol-to-color' && colorHex ? { backgroundColor: colorHex } : {}}
                                            className={`p-5 rounded-2xl font-bold text-xl transition-all ${showResult
                                                ? isCorrect
                                                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                                                    : isSelected
                                                        ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                                                        : 'bg-slate-800/50 border border-white/5 text-slate-500'
                                                : currentQuestion.type === 'symbol-to-color'
                                                    ? 'border-2 border-white/20 text-white hover:border-white/50'
                                                    : 'bg-slate-800/50 border border-white/10 text-white hover:bg-slate-700/50 hover:border-rose-500/30'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                {showResult && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                                                {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
                                                {currentQuestion.type === 'color-to-symbol' ? (
                                                    <span className="text-4xl">{option}</span>
                                                ) : (
                                                    <span>{option}</span>
                                                )}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Game Over */}
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

                            <h2 className="text-3xl font-black text-rose-300 mb-2">
                                {round >= totalRounds ? '🎉 Harika!' : 'İyi İş!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                Seviye {level}'e ulaştın!
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
                                        <p className="text-slate-400 text-sm">Tur</p>
                                        <p className="text-2xl font-bold text-rose-400">{round}/{totalRounds}</p>
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

export default DualBindGame;

