import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RotateCcw, Trophy, TrendingUp, Timer as TimerIcon,
    CheckCircle2, Zap, Heart, Star,
    Play, Eye, Sparkles, Layers
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

// ─── Constants ──────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

interface TowerSegment {
    id: string;
    value: number;
    multiplier?: number;
    isNegative: boolean;
    row: number;
    col: number;
}

type Phase = 'welcome' | 'building' | 'flashing' | 'question' | 'game_over' | 'victory';

const InvisibleTowerGame: React.FC = () => {
    const { playSound } = useSound();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1000 });
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [tower, setTower] = useState<TowerSegment[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [correctAnswer, setCorrectAnswer] = useState(0);
    const [options, setOptions] = useState<number[]>([]);
    const [streak, setStreak] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const generateTower = useCallback((lvl: number) => {
        const rows = Math.min(6, 2 + Math.floor(lvl / 4));
        const newTower: TowerSegment[] = [];
        let totalSum = 0;

        for (let r = 0; r < rows; r++) {
            const colsInRow = rows - r;
            for (let c = 0; c < colsInRow; c++) {
                const isNegative = lvl > 5 && Math.random() < 0.15;
                const multiplier = lvl > 8 && Math.random() < 0.1 ? (Math.random() < 0.7 ? 2 : 3) : undefined;
                let val = Math.floor(Math.random() * 9) + 1;
                if (isNegative) val = -val;
                const effectiveVal = val * (multiplier || 1);
                totalSum += effectiveVal;

                newTower.push({
                    id: Math.random().toString(36).substr(2, 9),
                    value: Math.abs(val),
                    multiplier,
                    isNegative,
                    row: r,
                    col: c
                });
            }
        }

        const opts = [totalSum];
        while (opts.length < 4) {
            const fake = totalSum + (Math.floor(Math.random() * 20) - 10);
            if (!opts.includes(fake)) opts.push(fake);
        }

        setTower(newTower);
        setCorrectAnswer(totalSum);
        setOptions(opts.sort(() => Math.random() - 0.5));
    }, []);

    const startRound = useCallback(() => {
        generateTower(level);
        setCurrentIndex(-1);
        setPhase('building');
        playSound('detective_mystery');
    }, [level, generateTower, playSound]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setStreak(0);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        startRound();
    }, [startRound, examMode, examTimeLimit]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, phase, handleStart, examMode]);

    useEffect(() => {
        if (phase === 'building') {
            const timer = setTimeout(() => setPhase('flashing'), 1000);
            return () => clearTimeout(timer);
        }
        if (phase === 'flashing') {
            if (currentIndex < tower.length - 1) {
                const timer = setTimeout(() => {
                    setCurrentIndex(p => p + 1);
                }, 1000 - Math.min(600, level * 30));
                return () => clearTimeout(timer);
            } else {
                const timer = setTimeout(() => {
                    setPhase('question');
                    playSound('complete');
                }, 1200);
                return () => clearTimeout(timer);
            }
        }
    }, [phase, currentIndex, tower.length, level, playSound]);

    useEffect(() => {
        if ((phase === 'building' || phase === 'flashing' || phase === 'question') && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) {
                    clearInterval(timerRef.current!);
                    setPhase('game_over');
                    return 0;
                }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
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
            game_id: 'gorunmez-kule',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { level_reached: level, game_name: 'Görünmez Kule', victory: isVictory }
        });
    }, [phase, score, level, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => {
        if (phase === 'game_over' || phase === 'victory') handleFinish();
    }, [phase, handleFinish]);

    const handleSelect = (val: number) => {
        if (phase !== 'question' || feedbackState) return;

        const isCorrect = val === correctAnswer;
        showFeedback(isCorrect);
        playSound(isCorrect ? 'detective_correct' : 'detective_incorrect');

        if (isCorrect) {
            setStreak(p => p + 1);
            setScore(p => p + 10 * level + (streak * 5));
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
            if (lives <= 0 && !isCorrect) return;

            if (level >= MAX_LEVEL) {
                setPhase('victory');
            } else {
                setLevel(p => p + 1);
                startRound();
            }
        }, 1200);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
                </div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.3)] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3)]" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}><TrendingUp size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">Görünmez Kule</h1>
                    <p className="text-slate-400 mb-8 text-lg">Zihninde bir kule inşa et ve sayıları topla! Görünmez blokların değerlerini hatırla ve zirveye ulaş.</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-emerald-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-teal-400" /><span>Bloklarda parlayan sayıları dikkatle takip et</span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-teal-400" /><span>Sayıları zihninde toplayarak ilerle (Eksilere DİKKAT!)</span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-teal-400" /><span>20 katı başarıyla tırmanarak kule fatihi ol!</span></li>
                        </ul>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-emerald-500/30 font-bold uppercase tracking-widest">TUZÖ 2.1.1 Ardışık Hafıza & Hesaplama</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-xl" style={{ boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)' }}><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 text-white relative overflow-hidden">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30"><Layers className="text-emerald-400" size={18} /><span className="font-bold text-emerald-400">{level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {(phase === 'building' || phase === 'flashing' || phase === 'question') && (
                        <motion.div key="game" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-2xl flex flex-col items-center gap-10">
                            <div className="flex flex-col-reverse items-center gap-1.5 relative pt-12">
                                {phase === 'flashing' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -top-6 px-4 py-2 rounded-full text-xs font-black bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-lg animate-pulse flex items-center gap-2 italic uppercase tracking-widest"><Zap size={14} fill="currentColor" /> TARAMA: {currentIndex + 1}/{tower.length}</motion.div>
                                )}
                                {Array.from({ length: Math.max(...tower.map(t => t.row)) + 1 }).map((_, rIdx) => (
                                    <div key={rIdx} className="flex gap-1.5">
                                        {tower.filter(t => t.row === rIdx).map((segment) => {
                                            const gIdx = tower.findIndex(t => t.id === segment.id);
                                            const isActive = gIdx === currentIndex;
                                            const isPast = gIdx < currentIndex;
                                            const isQuestion = phase === 'question';
                                            return (
                                                <motion.div key={segment.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: isActive ? 1.15 : 1, opacity: (isQuestion && !isPast) ? 0.2 : 1 }} className={`w-20 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 relative shadow-2xl ${isActive ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-white' : 'bg-emerald-950/40 border border-emerald-900/50 hover:bg-emerald-900/60'}`} style={isActive ? { boxShadow: '0 0 40px rgba(16, 185, 129, 0.6), inset 0 0 15px rgba(255,255,255,0.4)' } : {}}>
                                                    {isActive && (
                                                        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                                                            <span className={`text-4xl font-black italic drop-shadow-md ${segment.isNegative ? 'text-red-100' : 'text-white'}`}>{segment.isNegative ? '-' : ''}{segment.value}</span>
                                                            {segment.multiplier && (<span className="absolute -top-3 -right-3 text-[10px] font-black px-2 py-1 rounded-full bg-red-500 text-white shadow-lg animate-bounce uppercase tracking-tighter">x{segment.multiplier}</span>)}
                                                        </motion.div>
                                                    )}
                                                    {isQuestion && isPast && <CheckCircle2 className="text-emerald-500/40" size={24} />}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                            {phase === 'question' && (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg p-10 bg-white/5 backdrop-blur-3xl rounded-[48px] border border-white/10 shadow-3xl text-center">
                                    <h3 className="text-2xl font-black text-emerald-400 mb-8 tracking-widest uppercase italic">Kulenin Toplam Değeri?</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {options.map((opt, i) => (
                                            <motion.button key={i} whileHover={!feedbackState ? { scale: 1.05, y: -2 } : {}} whileTap={!feedbackState ? { scale: 0.95 } : {}} onClick={() => handleSelect(opt)} disabled={feedbackState !== null} className={`py-6 rounded-3xl text-3xl font-black transition-all duration-300 shadow-xl ${feedbackState ? (opt === correctAnswer ? 'bg-emerald-500 border-2 border-white' : 'bg-slate-800 opacity-20') : 'bg-slate-800/80 border border-white/10 hover:border-emerald-500/50 hover:text-emerald-400'}`}>
                                                {opt}
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' ? '🎖️ Kule Fatihi!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' ? 'Kulenin en tepesine ulaştın ve tüm hesaplamaları doğru yaptın!' : 'Zihinsel hesaplama gücünü artırmak için tırmanmaya devam et.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Kat</p><p className="text-2xl font-bold text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-xl mb-4" style={{ boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)' }}><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default InvisibleTowerGame;
