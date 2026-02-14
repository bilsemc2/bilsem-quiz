import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RotateCcw, Trophy, Play, Star,
    Heart, Zap, Eye, Link2, Sparkles, Timer as TimerIcon
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useSound } from '../../hooks/useSound';
import { useExam } from '../../contexts/ExamContext';

// ─── Constants ──────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

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

const SYMBOLS = ['⭐', '▲', '●', '◆', '⬟', '⬢', '♠', '♥'];
const COLORS = [
    { hex: '#ef4444', name: 'Kırmızı' },
    { hex: '#3b82f6', name: 'Mavi' },
    { hex: '#22c55e', name: 'Yeşil' },
    { hex: '#f59e0b', name: 'Sarı' },
    { hex: '#8b5cf6', name: 'Mor' },
    { hex: '#ec4899', name: 'Pembe' },
    { hex: '#06b6d4', name: 'Cyan' },
    { hex: '#f97316', name: 'Turuncu' },
];

type Phase = 'welcome' | 'memorize' | 'question' | 'game_over' | 'victory';

const DualBindGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1000 });
    const { submitResult } = useExam();
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [symbolColors, setSymbolColors] = useState<SymbolColor[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [countdown, setCountdown] = useState(6);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [streak, setStreak] = useState(0);


    const startTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const generateSymbolColors = useCallback((lvl: number) => {
        const count = lvl <= 5 ? 3 : lvl <= 12 ? 4 : 5;
        const shuffledSymbols = [...SYMBOLS].sort(() => Math.random() - 0.5).slice(0, count);
        const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5).slice(0, count);

        return shuffledSymbols.map((symbol, i) => ({
            symbol,
            color: shuffledColors[i].hex,
            colorName: shuffledColors[i].name,
        }));
    }, []);

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

    const startRound = useCallback(() => {
        const pairs = generateSymbolColors(level);
        setSymbolColors(pairs);
        setQuestions(generateDualQuestions(pairs));
        setCurrentQuestionIndex(0);
        const mTime = Math.max(3, 7 - Math.floor(level / 4));
        setCountdown(mTime);
        setPhase('memorize');
        setSelectedAnswer(null);
    }, [level, generateSymbolColors, generateDualQuestions]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setScore(0);
        setLives(INITIAL_LIVES);
        setStreak(0);
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        startRound();
    }, [startRound, examMode, examTimeLimit]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, phase, handleStart, examMode]);

    useEffect(() => {
        if (phase === 'memorize' && countdown > 0) {
            const timer = setTimeout(() => setCountdown(p => p - 1), 1000);
            return () => clearTimeout(timer);
        } else if (phase === 'memorize' && countdown === 0) {
            setPhase('question');
        }
    }, [phase, countdown]);

    useEffect(() => {
        if ((phase === 'memorize' || phase === 'question') && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setPhase('game_over');
                    return 0;
                }
                return prev - 1;
            }), 1000);
            return () => clearInterval(timer);
        }
    }, [phase, timeLeft]);

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const isVictory = phase === 'victory';

        if (examMode) {
            await submitResult(isVictory || level >= 5, score, MAX_LEVEL * 100, duration);
            navigate("/atolyeler/sinav-simulasyonu/devam");
            return;
        }

        await saveGamePlay({
            game_id: 'cift-mod-hafiza',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { level_reached: level, game_name: 'Çift Mod Hafıza', victory: isVictory }
        });
    }, [phase, score, level, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => {
        if (phase === 'game_over' || phase === 'victory') handleFinish();
    }, [phase, handleFinish]);

    const handleAnswer = (answer: string) => {
        if (feedbackState || questions.length === 0) return;

        const currentQ = questions[currentQuestionIndex];
        setSelectedAnswer(answer);
        const isCorrect = answer === currentQ.correctAnswer;

        showFeedback(isCorrect);
        playSound(isCorrect ? 'correct' : 'incorrect');

        if (isCorrect) {
            setStreak(prev => prev + 1);
            setScore(prev => prev + 10 * level + (streak * 5));
        } else {
            setStreak(0);
            setLives(l => {
                const nl = l - 1;
                if (nl <= 0) setTimeout(() => setPhase('game_over'), 1000);
                return nl;
            });
        }

        setTimeout(() => {
            dismissFeedback();
            setSelectedAnswer(null);
            if (lives <= 0 && !isCorrect) return;

            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                if (level >= MAX_LEVEL) {
                    setPhase('victory');
                } else {
                    setLevel(prev => prev + 1);
                    startRound();
                }
            }
        }, 1200);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-rose-950 to-pink-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
                </div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.3)] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3)]" style={{ background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}><Link2 size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-rose-300 to-pink-300 bg-clip-text text-transparent">Çift Mod Hafıza</h1>
                    <p className="text-slate-400 mb-8 text-lg">Hem şekilleri hem renkleri hafızana yaz! Çift yönlü sorularla zihnini test et.</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-rose-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-rose-400" /><span>Şekil ve renk eşleşmelerini kısa sürede ezberle</span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-rose-400" /><span>"Bu renk hangi şekildi?" veya "Bu şekil hangi renkti?" sorularını cevapla</span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-rose-400" /><span>20 seviyeyi tamamlayarak şampiyonluğa ulaş!</span></li>
                        </ul>
                    </div>
                    <div className="bg-rose-500/10 text-rose-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-rose-500/30 font-bold uppercase tracking-widest">TUZÖ 5.2.1 Görsel Hafıza</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl font-bold text-xl" style={{ boxShadow: '0 8px 32px rgba(244, 63, 94, 0.4)' }}><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-rose-950 to-pink-950 text-white relative overflow-hidden">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase === 'memorize' || phase === 'question') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(225, 29, 72, 0.1) 100%)', border: '1px solid rgba(244, 63, 94, 0.3)' }}><Zap className="text-rose-400" size={18} /><span className="font-bold text-rose-400">{level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {phase === 'memorize' && (
                        <motion.div key="memorize" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center w-full max-w-lg">
                            <div className="flex items-center justify-center gap-2 mb-8"><Eye className="text-rose-400" size={32} /><span className="text-4xl font-black text-rose-400 tracking-widest">{countdown}</span></div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-8 bg-white/5 backdrop-blur-3xl rounded-[48px] border border-white/10 shadow-3xl">
                                {symbolColors.map((sc, idx) => (
                                    <motion.div key={idx} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: idx * 0.1 }} className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/5 border border-white/10 shadow-xl">
                                        <div className="w-12 h-12 rounded-xl shadow-lg" style={{ backgroundColor: sc.color }} />
                                        <span className="text-5xl drop-shadow-md" style={{ color: sc.color }}>{sc.symbol}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                    {phase === 'question' && currentQuestion && (
                        <motion.div key="question" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="w-full max-w-xl text-center">
                            <div className="mb-4 flex justify-center gap-2"><span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest ${currentQuestion.type === 'color-to-symbol' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-500'}`}>RENK ➔ ŞEKİL</span><span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest ${currentQuestion.type === 'symbol-to-color' ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-500'}`}>ŞEKİL ➔ RENK</span></div>
                            <div className="p-10 bg-white/5 backdrop-blur-3xl rounded-[48px] border border-white/10 shadow-3xl mb-8">
                                <p className="text-slate-400 font-bold mb-6 text-lg tracking-wide uppercase">{currentQuestion.query}</p>
                                {currentQuestion.type === 'color-to-symbol' ? (<div className="w-24 h-24 rounded-3xl mx-auto shadow-2xl" style={{ backgroundColor: currentQuestion.hint }} />) : (<div className="text-8xl drop-shadow-md">{currentQuestion.hint}</div>)}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = selectedAnswer === option;
                                    const isCorrect = option === currentQuestion.correctAnswer;
                                    const showingResult = feedbackState !== null;
                                    const colorHex = COLORS.find(c => c.name === option)?.hex;
                                    return (
                                        <motion.button key={idx} whileHover={!showingResult ? { scale: 1.05, y: -2 } : {}} whileTap={!showingResult ? { scale: 0.95 } : {}} onClick={() => handleAnswer(option)} disabled={showingResult} className={`p-6 rounded-3xl font-black text-2xl transition-all duration-300 relative overflow-hidden shadow-xl ${showingResult ? (isCorrect ? 'bg-emerald-500 border-2 border-white' : isSelected ? 'bg-red-500 border-2 border-white opacity-50' : 'bg-slate-800 opacity-20') : 'bg-slate-800/80 border border-white/10 hover:border-white/30'}`} style={!showingResult && currentQuestion.type === 'symbol-to-color' && colorHex ? { boxShadow: `inset 0 0 40px ${colorHex}50`, border: `2px solid ${colorHex}40` } : {}}>
                                            {currentQuestion.type === 'symbol-to-color' && colorHex && !showingResult && (<div className="absolute inset-0 opacity-20" style={{ backgroundColor: colorHex }} />)}
                                            <span className="relative z-10">{option}</span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-rose-500 to-pink-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' ? '🎖️ Bağlantı Ustası!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' ? 'Tüm şekil ve renk bağlantılarını kusursuz kurdun!' : 'Hafızan her geçen gün daha da güçleniyor!'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-rose-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl font-bold text-xl mb-4" style={{ boxShadow: '0 8px 32px rgba(244, 63, 94, 0.4)' }}><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default DualBindGame;
