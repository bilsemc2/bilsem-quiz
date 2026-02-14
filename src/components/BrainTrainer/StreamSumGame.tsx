import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RotateCcw, Trophy, Plus, Star, Zap, Timer as TimerIcon, Heart, ChevronLeft, Play, Eye, Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// Game Constants
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

const StreamSumGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 800 });

    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [current, setCurrent] = useState<number | null>(null);
    const [previous, setPrevious] = useState<number | null>(null);
    const [input, setInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    const flowSpeed = useMemo(() => Math.max(800, 2000 - level * 60), [level]);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    const nextNumber = useCallback(() => {
        setPrevious(current);
        setCurrent(Math.floor(Math.random() * 9) + 1);
        setInput('');
    }, [current]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing');
        setLevel(1);
        setScore(0);
        setLives(INITIAL_LIVES);
        setStreak(0);
        setBestStreak(0);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        setPrevious(null);
        setCurrent(Math.floor(Math.random() * 9) + 1);
        setInput('');
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, [examMode, examTimeLimit]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, examMode, phase, handleStart]);

    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');
        if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(level >= 5, score, MAX_LEVEL * 200, duration);
            navigate('/atolyeler/sinav-simulasyonu/devam');
            return;
        }
        await saveGamePlay({
            game_id: 'akiskan-toplam',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives, best_streak: bestStreak, game_name: 'Akışkan Toplam' },
        });
    }, [saveGamePlay, score, level, lives, bestStreak, examMode, submitResult, navigate]);

    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');
        if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(true, score, MAX_LEVEL * 200, duration);
            navigate('/atolyeler/sinav-simulasyonu/devam');
            return;
        }
        await saveGamePlay({
            game_id: 'akiskan-toplam',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true, best_streak: bestStreak, game_name: 'Akışkan Toplam' },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate, bestStreak]);

    // Stream Loop
    useEffect(() => {
        if (phase !== 'playing' || current === null || previous === null) {
            if (phase === 'playing' && current !== null && previous === null) {
                // First number transition
                const firstDelay = setTimeout(nextNumber, flowSpeed);
                return () => clearTimeout(firstDelay);
            }
            return;
        }

        streamIntervalRef.current = setInterval(() => {
            if (feedbackState === null) {
                // Time's up for current input
                playSound('incorrect');
                showFeedback(false);
                setPhase('feedback');
                setLives(l => l - 1);
                setStreak(0);
                setTimeout(() => {
                    dismissFeedback();
                    const nl = lives - 1;
                    if (nl <= 0) { handleGameOver(); return; }
                    nextNumber();
                    setPhase('playing');
                }, 800);
            }
        }, flowSpeed + 800);

        return () => { if (streamIntervalRef.current) clearInterval(streamIntervalRef.current); };
    }, [phase, current, previous, feedbackState, flowSpeed, nextNumber, playSound, lives, dismissFeedback, handleGameOver]);

    const handleInput = (digit: string) => {
        if (phase !== 'playing' || feedbackState || previous === null || current === null) return;

        const expected = previous + current;
        const nextInput = input + digit;
        setInput(nextInput);

        if (Number(nextInput) === expected) {
            playSound('correct');
            showFeedback(true);
            setPhase('feedback');
            setStreak(s => {
                const ns = s + 1;
                if (ns > bestStreak) setBestStreak(ns);
                return ns;
            });
            setScore(s => s + level * 50 + streak * 10);
            if ((streak + 1) % 5 === 0 && level < MAX_LEVEL) setLevel(l => l + 1);

            setTimeout(() => {
                dismissFeedback();
                if (level >= MAX_LEVEL && (streak + 1) >= 100) { handleVictory(); return; }
                nextNumber();
                setPhase('playing');
            }, 600);
            return;
        }

        if (nextInput.length >= expected.toString().length) {
            playSound('incorrect');
            showFeedback(false);
            setPhase('feedback');
            setStreak(0);
            setLives(l => l - 1);
            setTimeout(() => {
                dismissFeedback();
                const nl = lives - 1;
                if (nl <= 0) { handleGameOver(); return; }
                nextNumber();
                setPhase('playing');
            }, 800);
        }
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-sky-950 to-indigo-950 text-white">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)' }}><Zap className="text-violet-400" size={18} /><span className="font-bold text-violet-400">{level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {phase === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.3)] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3)]" style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}><Plus size={52} className="text-white drop-shadow-lg" /></motion.div>
                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Akışkan Toplam</h1>
                            <p className="text-slate-400 mb-8">Sayılar akarken her sayıyı bir öncekiyle topla! İşlemsel hızını ve dikkati birleştirerek rekor kır.</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-sky-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-sky-400" /><span>Ekrana gelen sayıyı aklında tut</span></li>
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-sky-400" /><span>Yeni sayı gelince, onu bir öncekiyle topla</span></li>
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-sky-400" /><span>Toplamı ekran klavyesinden hızlıca gir</span></li>
                                </ul>
                            </div>
                            <div className="bg-sky-500/10 text-sky-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-sky-500/30 font-bold uppercase tracking-widest">TUZÖ 5.3.1 Zihinden İşlem Hızı</div>
                            <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 rounded-2xl font-bold text-xl" style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)', boxShadow: '0 8px 32px rgba(14, 165, 233, 0.4)' }}><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                        </motion.div>
                    )}
                    {(phase === 'playing' || phase === 'feedback') && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md">
                            <div className="text-center mb-12">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-4">Sıradaki Sayı</span>
                                <AnimatePresence mode="wait">
                                    <motion.div key={current} initial={{ y: 20, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -20, opacity: 0, scale: 1.2 }} transition={{ type: "spring", damping: 15 }} className="text-[10rem] leading-none font-black text-white drop-shadow-2xl">{current}</motion.div>
                                </AnimatePresence>
                            </div>
                            <div className="space-y-8">
                                <div className="flex items-center justify-center gap-4">
                                    {previous !== null && (
                                        <div className="flex items-center gap-4 text-slate-400 text-2xl font-black">
                                            <span>{previous}</span>
                                            <Plus size={24} className="text-sky-500" />
                                            <span className="text-white">{current}</span>
                                            <span className="text-sky-500">=</span>
                                            <div className="w-24 h-24 bg-white/5 rounded-3xl border-2 border-sky-500/30 flex items-center justify-center text-4xl text-white font-black shadow-inner">{input || '?'}</div>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
                                        <motion.button key={n} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleInput(String(n))} className={`h-20 rounded-3xl text-3xl font-black transition-all ${n === 0 ? 'col-span-3 bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 shadow-lg'}`}>{n}</motion.button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' ? '🎖️ İşlem Ustası!' : 'Harika Deneme!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' ? 'Tüm işlemleri hızla tamamladın!' : 'Daha fazla pratikle hızını artırabilirsin!'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{level}/{MAX_LEVEL}</p></div><div className="text-center col-span-2 border-t border-white/5 pt-4 mt-2"><p className="text-slate-400 text-sm">En İyi Seri</p><p className="text-2xl font-bold text-sky-400">x{bestStreak}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl font-bold text-xl mb-4" style={{ boxShadow: '0 8px 32px rgba(14, 165, 233, 0.4)' }}><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default StreamSumGame;
