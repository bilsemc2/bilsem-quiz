import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Target, CheckCircle2, XCircle, ChevronLeft,
    Zap, Eye, Shapes, Heart, Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useSound } from '../../hooks/useSound';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

interface SymbolColor {
    symbol: string;
    color: string;
    colorName: string;
}

type QuestionType = 'color' | 'symbol';

interface Question {
    type: QuestionType;
    query: string;
    correctAnswer: string;
    options: string[];
}

// Child-friendly messages


const SYMBOLS = ['⭐', '▲', '●', '◆', '⬟', '⬢'];

const COLORS = [
    { hex: '#ef4444', name: 'Kırmızı' },
    { hex: '#3b82f6', name: 'Mavi' },
    { hex: '#22c55e', name: 'Yeşil' },
    { hex: '#f59e0b', name: 'Sarı' },
    { hex: '#a855f7', name: 'Mor' },
    { hex: '#ec4899', name: 'Pembe' },
];

const SymbolMatchGame = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback } = useGameFeedback();
    const location = useLocation();
    const navigate = useNavigate();
    const [gameState, setGameState] = useState<'idle' | 'memorize' | 'question' | 'finished'>('idle');
    const [symbolColors, setSymbolColors] = useState<SymbolColor[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [roundNumber, setRoundNumber] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [level, setLevel] = useState(1);
    const [memorizeTime, setMemorizeTime] = useState(5);
    const [countdown, setCountdown] = useState(5);
    const [streak, setStreak] = useState(0);    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    const totalRounds = 15;
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Exam Mode Props
    const examMode = location.state?.examMode || false;

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // Zorluk seviyesine göre şekil sayısı
    const getSymbolCount = () => {
        if (level <= 3) return 4;
        if (level <= 6) return 5;
        return 6;
    };

    // Zorluk seviyesine göre ezberleme süresi
    const getMemorizeTime = () => {
        if (level <= 2) return 5;
        if (level <= 4) return 4;
        if (level <= 6) return 3;
        return 2;
    };

    // Şekil-renk eşleşmelerini oluştur
    const generateSymbolColors = useCallback(() => {
        const count = getSymbolCount();
        const shuffledSymbols = [...SYMBOLS].sort(() => Math.random() - 0.5).slice(0, count);
        const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5).slice(0, count);

        return shuffledSymbols.map((symbol, i) => ({
            symbol,
            color: shuffledColors[i].hex,
            colorName: shuffledColors[i].name,
        }));
    }, [level]);

    // Soru oluştur
    const generateQuestion = useCallback((pairs: SymbolColor[]): Question => {
        const type: QuestionType = Math.random() > 0.5 ? 'color' : 'symbol';
        const targetPair = pairs[Math.floor(Math.random() * pairs.length)];
        const otherPairs = pairs.filter(p => p !== targetPair);

        if (type === 'color') {
            const correctAnswer = targetPair.symbol;
            const wrongOptions = otherPairs.map(p => p.symbol).slice(0, 3);
            const allOptions = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);

            return {
                type: 'color',
                query: `${targetPair.colorName} renkteki şekil hangisiydi?`,
                correctAnswer,
                options: allOptions,
            };
        } else {
            const correctAnswer = targetPair.colorName;
            const wrongOptions = otherPairs.map(p => p.colorName).slice(0, 3);
            const allOptions = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);

            return {
                type: 'symbol',
                query: `${targetPair.symbol} şekli hangi renkteydi?`,
                correctAnswer,
                options: allOptions,
            };
        }
    }, []);

    // Yeni tur başlat
    const startRound = useCallback(() => {
        const pairs = generateSymbolColors();
        setSymbolColors(pairs);
        const time = getMemorizeTime();
        setMemorizeTime(time);
        setCountdown(time);
        setGameState('memorize');
        setSelectedAnswer(null);
    }, [generateSymbolColors, level]);

    // Oyunu başlat
    const startGame = useCallback(() => {
        window.scrollTo(0, 0);
        setScore(0);
        setLives(3);
        setStreak(0);
        setRoundNumber(1);
        setLevel(1);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
        startRound();
    }, [startRound]);

    // Handle Auto Start from HUB or examMode
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && gameState === 'idle') {
            startGame();
        }
    }, [location.state, gameState, startGame, examMode]);

    // Oyun bittiginde verileri kaydet
    useEffect(() => {
        if (gameState === 'finished' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            const correctCount = roundNumber - 1 - (3 - lives);
            const wrongCount = 3 - lives;

            // Exam mode: submit result and redirect
            if (examMode) {
                submitResult(lives > 0, score, totalRounds * 150, durationSeconds).then(() => {
                navigate("/atolyeler/sinav-simulasyonu/devam"); });
                return;
            }

            saveGamePlay({
                game_id: 'sekil-hafizasi',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
                metadata: {
                    level_reached: level,
                    correct_count: correctCount,
                    wrong_count: wrongCount,
                    total_rounds: totalRounds,
                    streak: streak,
                    game_name: 'Şekil Hafızası',
                }
            });
        }
    }, [gameState, score, lives, level, streak, roundNumber, saveGamePlay, examMode, submitResult, navigate]);

    // Ezberleme geri sayımı
    useEffect(() => {
        if (gameState === 'memorize' && countdown > 0) {
            timerRef.current = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (gameState === 'memorize' && countdown === 0) {
            const question = generateQuestion(symbolColors);
            setCurrentQuestion(question);
            setGameState('question');
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [gameState, countdown, symbolColors, generateQuestion]);

    // Cevap kontrolü
    const handleAnswer = (answer: string) => {
        if (feedbackState || !currentQuestion) return;

        setSelectedAnswer(answer);
        const isCorrect = answer === currentQuestion.correctAnswer;

        if (isCorrect) {
            playSound('correct');
            showFeedback(true);
            setStreak(prev => prev + 1);
            const levelBonus = level * 10;
            setScore(prev => prev + 100 + levelBonus + (streak * 15));
        } else {
            playSound('incorrect');
            showFeedback(false);
            setStreak(0);
            setLives(prev => prev - 1);
        }

        setTimeout(() => {
            if (lives <= 1 && !isCorrect) {
                setGameState('finished');
            } else if (roundNumber >= totalRounds) {
                setGameState('finished');
            } else {
                if ((roundNumber + 1) % 3 === 0 && level < 7) {
                    setLevel(prev => prev + 1);
                }
                setRoundNumber(prev => prev + 1);
                startRound();
            }
        }, 1500);
    };

    const correctCount = roundNumber > 0 ? Math.max(0, roundNumber - 1 - (3 - lives)) : 0;

    // Welcome Screen
    if (gameState === 'idle') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-950 text-white">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
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
                                background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)',
                                boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                            }}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Shapes size={52} className="text-white drop-shadow-lg" />
                        </motion.div>

                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                            🎨 Şekil Hafızası
                        </h1>

                        {/* Instructions */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                            <h3 className="text-lg font-bold text-violet-300 mb-3 flex items-center gap-2">
                                <Eye size={20} /> Nasıl Oynanır?
                            </h3>
                            <ul className="space-y-2 text-slate-300 text-sm">
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-violet-400" />
                                    <span>Renkli şekilleri <strong>ezberle</strong></span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-violet-400" />
                                    <span>Soruyu oku ve doğru cevabı seç</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-violet-400" />
                                    <span>Her 3 turda zorluk <strong>artar</strong>!</span>
                                </li>
                            </ul>

                            {/* Preview */}
                            <div className="flex justify-center gap-4 mt-4">
                                <span style={{ color: '#ef4444' }} className="text-3xl">⭐</span>
                                <span style={{ color: '#3b82f6' }} className="text-3xl">▲</span>
                                <span style={{ color: '#22c55e' }} className="text-3xl">●</span>
                                <span style={{ color: '#f59e0b' }} className="text-3xl">◆</span>
                            </div>
                        </div>

                        {/* TUZÖ Badge */}
                        <div className="bg-violet-500/10 text-violet-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-violet-500/30">
                            TUZÖ 4.2.1 Görsel Çalışma Belleği
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startGame}
                            className="px-8 py-4 rounded-2xl font-bold text-lg"
                            style={{
                                background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)',
                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(168, 85, 247, 0.4)'
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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
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
                                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                border: '1px solid rgba(168, 85, 247, 0.3)'
                            }}
                        >
                            <Target className="text-violet-400" size={18} />
                            <span className="font-bold text-violet-400">{roundNumber}/{totalRounds}</span>
                        </div>

                        {/* Level */}
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            <Zap className="text-emerald-400" size={18} />
                            <span className="font-bold text-emerald-400">Lv.{level}</span>
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
                            {/* Countdown */}
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Eye className="w-6 h-6 text-violet-400" />
                                <span className="text-slate-400">Ezberle:</span>
                                <motion.span
                                    key={countdown}
                                    initial={{ scale: 1.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-4xl font-black text-white"
                                >
                                    {countdown}
                                </motion.span>
                            </div>

                            {/* Symbols Display */}
                            <div
                                className="rounded-3xl p-8"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <div className="flex justify-center gap-6 flex-wrap">
                                    {symbolColors.map((sc, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, scale: 0, rotate: -180 }}
                                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                            transition={{ delay: idx * 0.15, type: 'spring' }}
                                            className="text-6xl lg:text-7xl"
                                            style={{ color: sc.color, textShadow: `0 4px 12px ${sc.color}40` }}
                                        >
                                            {sc.symbol}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full"
                                    style={{ background: 'linear-gradient(90deg, #A855F7 0%, #EC4899 100%)' }}
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
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center space-y-6 w-full max-w-lg"
                        >
                            {/* Question */}
                            <div
                                className="rounded-3xl p-8"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <p className="text-slate-400 text-sm mb-2">Soru:</p>
                                <h2 className="text-2xl lg:text-3xl font-bold text-white">
                                    {currentQuestion.query}
                                </h2>
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-4">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = selectedAnswer === option;
                                    const isCorrect = option === currentQuestion.correctAnswer;
                                    const showResult = feedbackState !== null;

                                    const optionColor = currentQuestion.type === 'symbol'
                                        ? COLORS.find(c => c.name === option)?.hex || '#64748b'
                                        : undefined;

                                    return (
                                        <motion.button
                                            key={idx}
                                            onClick={() => handleAnswer(option)}
                                            disabled={feedbackState !== null}
                                            whileHover={{ scale: feedbackState ? 1 : 1.02, y: feedbackState ? 0 : -2 }}
                                            whileTap={{ scale: feedbackState ? 1 : 0.98 }}
                                            className="p-5 rounded-2xl font-bold text-xl transition-all"
                                            style={{
                                                background: showResult
                                                    ? isCorrect
                                                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)'
                                                        : isSelected
                                                            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)'
                                                            : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                                                    : currentQuestion.type === 'symbol'
                                                        ? `linear-gradient(135deg, ${optionColor}40 0%, ${optionColor}20 100%)`
                                                        : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                                border: showResult
                                                    ? isCorrect
                                                        ? '2px solid rgba(16, 185, 129, 0.8)'
                                                        : isSelected
                                                            ? '2px solid rgba(239, 68, 68, 0.8)'
                                                            : '1px solid rgba(255,255,255,0.1)'
                                                    : currentQuestion.type === 'symbol'
                                                        ? `2px solid ${optionColor}60`
                                                        : '1px solid rgba(255,255,255,0.1)',
                                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                                                {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400" />}
                                                {currentQuestion.type === 'color' ? (
                                                    <span className="text-4xl">{option}</span>
                                                ) : (
                                                    <span className={showResult ? (isCorrect ? 'text-emerald-400' : isSelected ? 'text-red-400' : 'text-slate-500') : 'text-white'}>
                                                        {option}
                                                    </span>
                                                )}
                                            </div>
                                        </motion.button>
                                    );
                                })}
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
                                    background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Trophy size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-violet-300 mb-2">
                                🎉 Test Tamamlandı!
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
                                        <p className="text-slate-400 text-sm">Seviye</p>
                                        <p className="text-2xl font-bold text-violet-400">Lv.{level}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Doğru</p>
                                        <p className="text-2xl font-bold text-emerald-400">{correctCount}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Kalan Can</p>
                                        <p className="text-2xl font-bold text-red-400">{lives}/3</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(168, 85, 247, 0.4)'
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

export default SymbolMatchGame;
