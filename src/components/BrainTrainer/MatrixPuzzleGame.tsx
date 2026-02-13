// Matrix Puzzle Game - Ana Oyun Bileşeni
// 3x3 Matris Bulmaca - Kural Tabanlı Görsel Desen Tamamlama

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, RotateCcw, Play, Trophy, Grid3X3,
    Heart, Star, Timer, CheckCircle2, XCircle, Zap
} from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { ShapeRenderer } from './matrix/ShapeRenderer';
import { MatrixCell, GameOption, BaseShape } from '../../types/matrixRules';
import {
    generateMatrix,
    generateWrongOption,
} from '../../utils/ruleExecutors';
import {
    getRandomRuleForLevel,
    shouldUseInnerGrid,
} from '../../data/matrixRules';

// ============================================
// OYUN SABİTLERİ
// ============================================

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180; // 3 dakika
const MAX_LEVEL = 20;
const OPTIONS_COUNT = 5;

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory' | 'review';

// Soru geçmişi tipi - hata inceleme için
interface QuestionHistory {
    level: number;
    ruleName: string;
    ruleDescription: string;
    grid: MatrixCell[][];
    correctAnswer: BaseShape;
    selectedAnswer: BaseShape;
    isCorrect: boolean;
}

// Çocuk dostu mesajlar


// ============================================
// ANA BİLEŞEN
// ============================================

interface MatrixPuzzleGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

const MatrixPuzzleGame: React.FC = () => {
    // Hooks
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const examMode = location.state?.examMode || false;
    const { submitResult } = useExam();
    const { feedbackState, showFeedback } = useGameFeedback();
    const { playSound } = useSound();

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Oyun State
    const [grid, setGrid] = useState<MatrixCell[][]>([]);
    const [options, setOptions] = useState<GameOption[]>([]);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [currentRuleName, setCurrentRuleName] = useState('');
    const [currentRuleDescription, setCurrentRuleDescription] = useState('');

    // Soru geçmişi - hata inceleme için
    const [questionHistory, setQuestionHistory] = useState<QuestionHistory[]>([]);

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const hasSavedRef = useRef(false);

    // ============================================
    // SORU ÜRETİCİ
    // ============================================

    const generateQuestion = useCallback(() => {
        const useInnerGrid = shouldUseInnerGrid(level);
        const rule = getRandomRuleForLevel(level);
        setCurrentRuleName(rule.name);
        setCurrentRuleDescription(rule.description);

        // 3x3 matris üret
        const matrix = generateMatrix([rule], useInnerGrid);

        // Grid hücrelerini oluştur
        const newGrid: MatrixCell[][] = matrix.map((row, rowIdx) =>
            row.map((shape, colIdx) => ({
                row: rowIdx,
                col: colIdx,
                shape,
                isHidden: false,
            }))
        );

        // Rastgele bir hücreyi gizle (tercihen sağ alt bölge)
        const hiddenRow = Math.floor(Math.random() * 2) + 1; // 1 veya 2
        const hiddenCol = Math.floor(Math.random() * 2) + 1; // 1 veya 2
        newGrid[hiddenRow][hiddenCol].isHidden = true;

        // Doğru cevap
        const correctShape = matrix[hiddenRow][hiddenCol];

        // 5 seçenek üret (1 doğru + 4 yanlış)
        const newOptions: GameOption[] = [
            { id: 'correct', shape: correctShape, isCorrect: true },
        ];

        for (let i = 0; i < OPTIONS_COUNT - 1; i++) {
            const wrongShape = generateWrongOption(
                correctShape,
                newOptions.map(o => o.shape)
            );
            newOptions.push({
                id: `wrong-${i}`,
                shape: wrongShape,
                isCorrect: false,
            });
        }

        // Seçenekleri karıştır
        const shuffledOptions = newOptions.sort(() => Math.random() - 0.5);

        setGrid(newGrid);
        setOptions(shuffledOptions);
        setSelectedOption(null);
        setIsCorrect(null);

        // DEBUG: Konsola doğru cevabı yazdır
        const correctIndex = shuffledOptions.findIndex(o => o.isCorrect) + 1;
        console.log('🎯 DOĞRU CEVAP:', {
            kural: rule.name,
            açıklama: rule.description,
            seçenek: correctIndex, // 1-5 arası
        });
    }, [level]);

    // ============================================
    // OYUN BAŞLATMA
    // ============================================

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(TIME_LIMIT);
        setQuestionHistory([]);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        generateQuestion();
    }, [generateQuestion]);

    // ============================================
    // OYUN SONU İŞLEYİCİLER
    // ============================================

    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        setPhase('game_over');
        playSound?.('incorrect');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            const passed = level >= 5;
            (async () => {
                await submitResult(passed, score, MAX_LEVEL * 10 * MAX_LEVEL, duration);
                navigate('/atolyeler/sinav-simulasyonu/devam');
            })();
            return;
        }

        await saveGamePlay({
            game_id: 'matris-bulmaca',
            score_achieved: score,
            duration_seconds: duration,
            metadata: {
                levels_completed: level,
                final_lives: lives,
            },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate, playSound]);

    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        setPhase('victory');
        playSound?.('complete');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            (async () => {
                await submitResult(true, score, MAX_LEVEL * 10 * MAX_LEVEL, duration);
                navigate('/atolyeler/sinav-simulasyonu/devam');
            })();
            return;
        }

        await saveGamePlay({
            game_id: 'matris-bulmaca',
            score_achieved: score,
            duration_seconds: duration,
            metadata: {
                levels_completed: MAX_LEVEL,
                victory: true,
            },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate, playSound]);

    // ============================================
    // TIMER EFFECT
    // ============================================

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [phase, timeLeft, handleGameOver]);

    // Auto-start
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, examMode, phase, handleStart]);

    // Level değiştiğinde yeni soru üret
    useEffect(() => {
        if (phase === 'playing' && level > 1) {
            generateQuestion();
        }
    }, [level, phase, generateQuestion]);

    // ============================================
    // CEVAP İŞLEYİCİLER
    // ============================================

    const handleOptionSelect = useCallback((option: GameOption) => {
        if (selectedOption || phase !== 'playing') return;

        setSelectedOption(option.id);
        setIsCorrect(option.isCorrect);
        showFeedback(isCorrect ?? false);

        setPhase('feedback');

        // Doğru cevabı bul
        const correctOption = options.find(o => o.isCorrect);

        // Soru geçmişine kaydet
        setQuestionHistory(prev => [...prev, {
            level,
            ruleName: currentRuleName,
            ruleDescription: currentRuleDescription,
            grid: grid.map(row => row.map(cell => ({ ...cell }))),
            correctAnswer: correctOption?.shape || option.shape,
            selectedAnswer: option.shape,
            isCorrect: option.isCorrect,
        }]);

        if (option.isCorrect) {
            playSound?.('correct');
            setScore(prev => prev + 10 * level);

            setTimeout(() => {
                setPhase('playing');
                setSelectedOption(null);
                setIsCorrect(null);
                if (level >= MAX_LEVEL) {
                    handleVictory();
                } else {
                    setLevel(prev => prev + 1);
                }
            }, 1200);
        } else {
            playSound?.('incorrect');
            const newLives = lives - 1;
            setLives(newLives);

            setTimeout(() => {
                setPhase('playing');
                setSelectedOption(null);
                setIsCorrect(null);
                if (newLives <= 0) {
                    handleGameOver();
                } else {
                    generateQuestion();
                }
            }, 1200);
        }
    }, [selectedOption, phase, level, lives, options, grid, currentRuleName, playSound, generateQuestion, handleVictory, handleGameOver]);

    // ============================================
    // YARDIMCI FONKSİYONLAR
    // ============================================

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>Geri</span>
                    </Link>

                    {phase === 'playing' && (
                        <div className="flex items-center gap-4 flex-wrap justify-end">
                            {/* Score */}
                            <div className="flex items-center gap-2 bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400">{score}</span>
                            </div>

                            {/* Lives */}
                            <div className="flex items-center gap-1 bg-red-500/20 px-3 py-1.5 rounded-xl border border-red-500/30">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart
                                        key={i}
                                        size={16}
                                        className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'}
                                    />
                                ))}
                            </div>

                            {/* Timer */}
                            <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1.5 rounded-xl border border-blue-500/30">
                                <Timer className="text-blue-400" size={18} />
                                <span className={`font-bold ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            {/* Level */}
                            <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={18} />
                                <span className="font-bold text-emerald-400">Seviye {level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {/* Welcome Screen */}
                    {phase === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            {/* TUZÖ Badge */}
                            <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
                                <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-violet-400">5.5.2 Kural Çıkarsama</span>
                            </div>

                            {/* 3D Gummy Icon */}
                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-violet-400 to-purple-600 rounded-[40%] flex items-center justify-center"
                                style={{
                                    boxShadow:
                                        'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)',
                                }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Grid3X3 size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                                Matris Bulmaca
                            </h1>

                            <p className="text-slate-400 mb-8">
                                3×3 ızgaradaki deseni analiz et ve gizli hücreyi bul!
                                Her satırda belirli bir kural var.
                            </p>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Heart className="text-red-400" size={16} />
                                    <span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Timer className="text-blue-400" size={16} />
                                    <span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Zap className="text-emerald-400" size={16} />
                                    <span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Playing Screen */}
                    {(phase === 'playing' || phase === 'feedback') && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-4xl"
                        >
                            {/* Rule Hint - gizli, sadece review'da göster */}

                            {/* 3x3 Matrix Grid */}
                            <div className="flex justify-center mb-8">
                                <div
                                    className="grid grid-cols-3 gap-3 p-4 bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-white/10"
                                    style={{
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.3)',
                                    }}
                                >
                                    {grid.map((row, rowIdx) =>
                                        row.map((cell, colIdx) => (
                                            <motion.div
                                                key={`${rowIdx}-${colIdx}`}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: (rowIdx * 3 + colIdx) * 0.05 }}
                                                className="w-24 h-24 md:w-28 md:h-28 flex items-center justify-center"
                                            >
                                                <ShapeRenderer
                                                    shape={cell.shape}
                                                    size={90}
                                                    isHidden={cell.isHidden}
                                                />
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Question */}
                            <p className="text-center text-lg text-slate-300 mb-6">
                                Gizli hücredeki şekil hangisi?
                            </p>

                            {/* Options (5 buttons) */}
                            <div className="flex flex-wrap justify-center gap-4">
                                {options.map((option, idx) => (
                                    <motion.button
                                        key={option.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        whileHover={{ scale: 1.05, y: -4 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleOptionSelect(option)}
                                        disabled={selectedOption !== null}
                                        className={`p-3 rounded-2xl transition-all ${selectedOption === option.id
                                            ? option.isCorrect
                                                ? 'ring-4 ring-emerald-400 bg-emerald-500/20'
                                                : 'ring-4 ring-red-400 bg-red-500/20'
                                            : selectedOption !== null && option.isCorrect
                                                ? 'ring-4 ring-emerald-400 bg-emerald-500/20'
                                                : 'bg-slate-800/50 hover:bg-slate-700/50 border border-white/10'
                                            }`}
                                        style={{
                                            boxShadow:
                                                selectedOption === option.id
                                                    ? option.isCorrect
                                                        ? '0 0 30px rgba(52, 211, 153, 0.5)'
                                                        : '0 0 30px rgba(248, 113, 113, 0.5)'
                                                    : '0 4px 16px rgba(0,0,0,0.2)',
                                        }}
                                    >
                                        <ShapeRenderer shape={option.shape} size={80} />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Game Over Screen */}
                    {phase === 'game_over' && (
                        <motion.div
                            key="game_over"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center">
                                <XCircle size={48} className="text-white" />
                            </div>

                            <h2 className="text-3xl font-bold text-red-400 mb-4">Oyun Bitti!</h2>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-2xl font-bold text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Doğru</p>
                                        <p className="text-2xl font-bold text-emerald-400">{questionHistory.filter(q => q.isCorrect).length}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Yanlış</p>
                                        <p className="text-2xl font-bold text-red-400">{questionHistory.filter(q => !q.isCorrect).length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4">
                                {questionHistory.some(q => !q.isCorrect) && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setPhase('review')}
                                        className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl font-bold text-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 size={24} />
                                            <span>Yanlışlarımı Gör</span>
                                        </div>
                                    </motion.button>
                                )}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleStart}
                                    className="px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl font-bold text-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <RotateCcw size={24} />
                                        <span>Tekrar Dene</span>
                                    </div>
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* Victory Screen */}
                    {phase === 'victory' && (
                        <motion.div
                            key="victory"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-3xl flex items-center justify-center"
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Trophy size={48} className="text-white" />
                            </motion.div>

                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                                <p className="text-4xl font-bold text-amber-400">{score}</p>
                                <p className="text-slate-400">Toplam Puan</p>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Oyna</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Review Screen - Yanlışları İnceleme */}
                    {phase === 'review' && (
                        <motion.div
                            key="review"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-4xl"
                        >
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-amber-400 mb-2">📚 Yanlışlarını İncele</h2>
                                <p className="text-slate-400 text-sm">Her soruyu anlamak için incele</p>
                            </div>

                            <div className="space-y-6 max-h-[60vh] overflow-y-auto px-2">
                                {questionHistory.filter(q => !q.isCorrect).map((q, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 border border-red-500/30"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-violet-400">Seviye {q.level}</span>
                                            <span className="text-xs text-slate-500">{q.ruleName}</span>
                                        </div>

                                        {/* Mini Grid */}
                                        <div className="flex justify-center mb-4">
                                            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/50 rounded-xl">
                                                {q.grid.map((row, rowIdx) =>
                                                    row.map((cell, colIdx) => (
                                                        <div
                                                            key={`${rowIdx}-${colIdx}`}
                                                            className="w-16 h-16 flex items-center justify-center"
                                                        >
                                                            <ShapeRenderer
                                                                shape={cell.shape}
                                                                size={60}
                                                                isHidden={cell.isHidden}
                                                            />
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* Kural Açıklaması */}
                                        <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-3 mb-4">
                                            <p className="text-xs text-violet-300 mb-1">💡 Bu sorunun mantığı:</p>
                                            <p className="text-sm text-white font-medium">{q.ruleDescription}</p>
                                        </div>

                                        {/* Cevaplar */}
                                        <div className="flex justify-center gap-8">
                                            <div className="text-center">
                                                <p className="text-xs text-red-400 mb-2">Senin Cevabın ❌</p>
                                                <div className="p-2 bg-red-500/20 rounded-xl border border-red-500/30">
                                                    <ShapeRenderer shape={q.selectedAnswer} size={50} />
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-emerald-400 mb-2">Doğru Cevap ✅</p>
                                                <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                                                    <ShapeRenderer shape={q.correctAnswer} size={50} />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="flex justify-center gap-4 mt-6">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setPhase('game_over')}
                                    className="px-6 py-3 bg-slate-700 rounded-xl font-medium"
                                >
                                    ← Geri
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleStart}
                                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-bold"
                                >
                                    Tekrar Dene
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Feedback Overlay */}
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default MatrixPuzzleGame;

