// Matrix Puzzle Game - Ana Oyun Bileşeni
// 3x3 Matris Bulmaca - Kural Tabanlı Görsel Desen Tamamlama

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, RotateCcw, Play, Trophy, Grid3X3,
    Heart, Star, Timer as TimerIcon, CheckCircle2, XCircle, Zap, Eye, Sparkles
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

const MatrixPuzzleGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const examMode = location.state?.examMode || false;
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1000 });
    const { playSound } = useSound();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    const [grid, setGrid] = useState<MatrixCell[][]>([]);
    const [options, setOptions] = useState<GameOption[]>([]);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [currentRuleName, setCurrentRuleName] = useState('');
    const [currentRuleDescription, setCurrentRuleDescription] = useState('');
    const [questionHistory, setQuestionHistory] = useState<QuestionHistory[]>([]);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const hasSavedRef = useRef(false);

    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    const generateQuestion = useCallback(() => {
        const useInnerGrid = shouldUseInnerGrid(level);
        const rule = getRandomRuleForLevel(level);
        setCurrentRuleName(rule.name);
        setCurrentRuleDescription(rule.description);

        const matrix = generateMatrix([rule], useInnerGrid);
        const newGrid: MatrixCell[][] = matrix.map((row, rowIdx) =>
            row.map((shape, colIdx) => ({
                row: rowIdx, col: colIdx, shape, isHidden: false,
            }))
        );

        const hiddenRow = Math.floor(Math.random() * 2) + 1;
        const hiddenCol = Math.floor(Math.random() * 2) + 1;
        newGrid[hiddenRow][hiddenCol].isHidden = true;

        const correctShape = matrix[hiddenRow][hiddenCol];
        const newOptions: GameOption[] = [{ id: 'correct', shape: correctShape, isCorrect: true }];

        for (let i = 0; i < OPTIONS_COUNT - 1; i++) {
            const wrongShape = generateWrongOption(correctShape, newOptions.map(o => o.shape));
            newOptions.push({ id: `wrong-${i}`, shape: wrongShape, isCorrect: false });
        }

        setGrid(newGrid);
        setOptions(newOptions.sort(() => Math.random() - 0.5));
        setSelectedOption(null);
    }, [level]);

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

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, examMode, phase, handleStart]);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');
        playSound?.('incorrect');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(level >= 5, score, totalPossibleScore(), duration);
            navigate('/atolyeler/sinav-simulasyonu/devam');
            return;
        }
        await saveGamePlay({
            game_id: 'matris-bulmaca',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives, game_name: 'Matris Bulmaca' },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate, playSound]);

    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');
        playSound?.('complete');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(true, score, totalPossibleScore(), duration);
            navigate('/atolyeler/sinav-simulasyonu/devam');
            return;
        }
        await saveGamePlay({
            game_id: 'matris-bulmaca',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true, game_name: 'Matris Bulmaca' },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate, playSound]);

    const totalPossibleScore = () => MAX_LEVEL * 10 * (MAX_LEVEL + 1) / 2;

    const handleOptionSelect = useCallback((option: GameOption) => {
        if (selectedOption || phase !== 'playing') return;
        setSelectedOption(option.id);
        const isCorrect = option.isCorrect;
        showFeedback(isCorrect);
        setPhase('feedback');

        const correctOption = options.find(o => o.isCorrect);
        setQuestionHistory(prev => [...prev, {
            level,
            ruleName: currentRuleName,
            ruleDescription: currentRuleDescription,
            grid: grid.map(row => row.map(cell => ({ ...cell }))),
            correctAnswer: correctOption?.shape || option.shape,
            selectedAnswer: option.shape,
            isCorrect: option.isCorrect,
        }]);

        if (isCorrect) {
            playSound?.('correct');
            setScore(prev => prev + 10 * level);
        } else {
            playSound?.('incorrect');
            setLives(l => l - 1);
        }

        setTimeout(() => {
            dismissFeedback();
            const newLives = isCorrect ? lives : lives - 1;
            setSelectedOption(null);
            if (!isCorrect && newLives <= 0) { handleGameOver(); return; }
            if (isCorrect && level >= MAX_LEVEL) { handleVictory(); return; }
            if (isCorrect) {
                setLevel(l => l + 1);
                // useEffect will trigger generateQuestion
            } else {
                generateQuestion();
            }
            setPhase('playing');
        }, 1200);
    }, [selectedOption, phase, level, lives, options, grid, currentRuleName, playSound, generateQuestion, handleVictory, handleGameOver]);

    useEffect(() => {
        if (phase === 'playing' && level > 1) generateQuestion();
    }, [level]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 text-white">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)' }}><Zap className="text-violet-400" size={18} /><span className="font-bold text-violet-400">{level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {phase === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-violet-400 to-purple-600 rounded-[40%] flex items-center justify-center" style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}><Grid3X3 size={52} className="text-white drop-shadow-lg" /></motion.div>
                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Matris Bulmaca</h1>
                            <p className="text-slate-400 mb-8">3×3 ızgaradaki deseni analiz et ve gizli hücreyi bul! Her satırda belirli bir kural var.</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-violet-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-violet-400" /><span>Satır ve sütunlardaki değişim kuralını belirle</span></li>
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-violet-400" /><span>Soru işareti yerine gelecek doğru şekli seç</span></li>
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-violet-400" /><span>Yanlış seçimler can götürür, dikkatli ol!</span></li>
                                </ul>
                            </div>
                            <div className="bg-violet-500/10 text-violet-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-violet-500/30 font-bold uppercase tracking-widest">TUZÖ 5.5.2 Kural Çıkarsama</div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl font-bold text-xl" style={{ boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)' }}><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                        </motion.div>
                    )}
                    {(phase === 'playing' || phase === 'feedback') && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl">
                            <div className="flex justify-center mb-8">
                                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-white/10" style={{ boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.3)' }}>
                                    {grid.map((row, rIdx) => row.map((cell, cIdx) => (
                                        <motion.div key={`${rIdx}-${cIdx}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: (rIdx * 3 + cIdx) * 0.05 }} className="w-24 h-24 md:w-28 md:h-28 flex items-center justify-center">
                                            <ShapeRenderer shape={cell.shape} size={90} isHidden={cell.isHidden} />
                                        </motion.div>
                                    )))}
                                </div>
                            </div>
                            <p className="text-center text-lg text-slate-300 mb-6">Gizli hücredeki şekil hangisi?</p>
                            <div className="flex flex-wrap justify-center gap-4">
                                {options.map((option, idx) => {
                                    const isSelected = selectedOption === option.id;
                                    const showResult = selectedOption !== null;
                                    return (
                                        <motion.button key={option.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} whileHover={!showResult ? { scale: 1.05, y: -4 } : {}} whileTap={!showResult ? { scale: 0.95 } : {}} onClick={() => handleOptionSelect(option)} disabled={showResult} className={`p-3 rounded-2xl transition-all ${isSelected ? (option.isCorrect ? 'ring-4 ring-emerald-400 bg-emerald-500/20' : 'ring-4 ring-red-400 bg-red-500/20') : (showResult && option.isCorrect ? 'ring-4 ring-emerald-400 bg-emerald-500/20' : 'bg-slate-800/50 border border-white/10')}`} style={{ boxShadow: isSelected ? (option.isCorrect ? '0 0 30px rgba(52, 211, 153, 0.5)' : '0 0 30px rgba(248, 113, 113, 0.5)') : '0 4px 16px rgba(0,0,0,0.2)' }}><ShapeRenderer shape={option.shape} size={80} /></motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                    {phase === 'game_over' && (
                        <motion.div key="game_over" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center"><XCircle size={48} className="text-white" /></div>
                            <h2 className="text-3xl font-bold text-red-400 mb-4">Oyun Bitti!</h2>
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6"><div className="grid grid-cols-3 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Doğru</p><p className="text-2xl font-bold text-emerald-400">{questionHistory.filter(q => q.isCorrect).length}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Yanlış</p><p className="text-2xl font-bold text-red-400">{questionHistory.filter(q => !q.isCorrect).length}</p></div></div></div>
                            <div className="flex flex-wrap justify-center gap-4">
                                {questionHistory.some(q => !q.isCorrect) && (<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setPhase('review')} className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl font-bold text-lg"><div className="flex items-center gap-3"><CheckCircle2 size={24} /><span>Yanlışlarımı Gör</span></div></motion.button>)}
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl font-bold text-lg"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Dene</span></div></motion.button>
                            </div>
                        </motion.div>
                    )}
                    {phase === 'victory' && (
                        <motion.div key="victory" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-3xl flex items-center justify-center" animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6"><p className="text-4xl font-bold text-amber-400">{score}</p><p className="text-slate-400">Toplam Puan</p></div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-lg"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                        </motion.div>
                    )}
                    {phase === 'review' && (
                        <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl text-center">
                            <h2 className="text-2xl font-bold text-amber-400 mb-6 font-display uppercase tracking-widest">📚 Soru Analizi</h2>
                            <div className="space-y-6 max-h-[60vh] overflow-y-auto px-4 py-4 thin-scrollbar">
                                {questionHistory.filter(q => !q.isCorrect).map((q, idx) => (
                                    <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-slate-800/40 backdrop-blur-xl rounded-[2rem] p-6 border border-red-500/20 shadow-2xl">
                                        <div className="flex items-center justify-between mb-4"><span className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-xs font-bold ring-1 ring-violet-500/30">Seviye {q.level}</span><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{q.ruleName}</span></div>
                                        <div className="flex justify-center mb-6"><div className="grid grid-cols-3 gap-2 p-4 bg-slate-950/50 rounded-2xl border border-white/5 shadow-inner">{q.grid.map((row, rIdx) => row.map((cell, cIdx) => (
                                            <div key={`${rIdx}-${cIdx}`} className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center"><ShapeRenderer shape={cell.shape} size={60} isHidden={cell.isHidden} /></div>
                                        )))}</div></div>
                                        <div className="bg-gradient-to-r from-violet-500/10 to-transparent border-l-4 border-violet-500 p-4 rounded-r-xl text-left mb-6"><p className="text-[10px] font-black text-violet-400 uppercase tracking-tighter mb-1">Düşünme Yolu:</p><p className="text-sm font-medium text-slate-200">{q.ruleDescription}</p></div>
                                        <div className="grid grid-cols-2 gap-6"><div className="text-center"><p className="text-[10px] font-black text-red-500 uppercase mb-3">Senin Seçimin</p><div className="inline-block p-4 bg-red-500/10 rounded-2xl border border-red-500/20 shadow-lg"><ShapeRenderer shape={q.selectedAnswer} size={60} /></div></div><div className="text-center"><p className="text-[10px] font-black text-emerald-500 uppercase mb-3">Doğru Şekil</p><div className="inline-block p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-lg"><ShapeRenderer shape={q.correctAnswer} size={60} /></div></div></div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="flex justify-center gap-4 mt-8"><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setPhase('game_over')} className="px-8 py-4 bg-slate-800 rounded-2xl font-bold flex items-center gap-2 border border-white/10 shadow-lg transition-colors hover:bg-slate-700"><ChevronLeft size={20} /> Geri</motion.button><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl font-bold shadow-xl">Tekrar Dene</motion.button></div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default MatrixPuzzleGame;
