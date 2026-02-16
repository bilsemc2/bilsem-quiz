import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Timer as TimerIcon, Trophy, Play, RotateCcw, ChevronLeft,
    Brain, Target, Star, Heart, XCircle,
    Square, Circle, Triangle, Pentagon, Hexagon, Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// ─── Constants ───────────────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = 'n-geri-sifresi';

interface Shape {
    id: string; icon: React.ReactNode; color: string; bgGradient: string;
}

const SHAPES: Shape[] = [
    { id: 'square', icon: <Square />, color: '#818CF8', bgGradient: 'from-indigo-400 to-violet-500' },
    { id: 'circle', icon: <Circle />, color: '#34D399', bgGradient: 'from-emerald-400 to-teal-500' },
    { id: 'triangle', icon: <Triangle />, color: '#FBBF24', bgGradient: 'from-amber-400 to-orange-500' },
    { id: 'star', icon: <Star />, color: '#F472B6', bgGradient: 'from-pink-400 to-rose-500' },
    { id: 'hexagon', icon: <Hexagon />, color: '#A78BFA', bgGradient: 'from-purple-400 to-fuchsia-500' },
    { id: 'pentagon', icon: <Pentagon />, color: '#60A5FA', bgGradient: 'from-blue-400 to-cyan-500' }
];

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

const NBackGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const location = useLocation();
    const navigate = useNavigate();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [nValue, setNValue] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [history, setHistory] = useState<Shape[]>([]);
    const [currentShape, setCurrentShape] = useState<Shape | null>(null);
    const [trials, setTrials] = useState(0);

    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const generateShape = useCallback(() => {
        const isMatch = Math.random() < 0.3 && history.length >= nValue;
        let next;
        if (isMatch) next = history[history.length - nValue];
        else {
            const avail = SHAPES.filter(s => history.length < nValue || s.id !== history[history.length - nValue]?.id);
            next = avail[Math.floor(Math.random() * avail.length)];
        }
        setCurrentShape(null);
        setTimeout(() => {
            setCurrentShape(next); setHistory(prev => [...prev, next]); setTrials(p => p + 1);
            playSound('radar_scan');
        }, 300);
    }, [history, nValue, playSound]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing'); setScore(0); setLevel(1); setNValue(1); setLives(INITIAL_LIVES);
        setHistory([]); setTrials(0); setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        gameStartTimeRef.current = Date.now(); hasSavedRef.current = false;
        generateShape(); playSound('slide');
    }, [generateShape, playSound, examMode, examTimeLimit]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart(); }, [location.state, phase, handleStart, examMode]);

    // Auto-advance shapes during data collection phase
    useEffect(() => {
        if (phase === 'playing' && history.length > 0 && history.length <= nValue) {
            const autoTimer = setTimeout(() => generateShape(), 1500);
            return () => clearTimeout(autoTimer);
        }
    }, [phase, history.length, nValue, generateShape]);

    useEffect(() => {
        if (phase === 'playing') {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase]);

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(level >= 5 || phase === 'victory', score, MAX_LEVEL * 100, duration);
            navigate("/atolyeler/sinav-simulasyonu/devam"); return;
        }
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: duration, metadata: { level_reached: level, n_value: nValue, victory: phase === 'victory' } });
    }, [phase, score, level, nValue, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => { if (phase === 'game_over' || phase === 'victory') handleFinish(); }, [phase, handleFinish]);

    const handleDecision = (isMatch: boolean) => {
        if (phase !== 'playing' || feedbackState || history.length <= nValue) return;
        const actual = history[history.length - 1].id === history[history.length - (nValue + 1)].id;
        const correct = isMatch === actual;
        showFeedback(correct); playSound(correct ? 'radar_correct' : 'radar_incorrect');
        if (correct) {
            setScore(p => p + 20 * level);
            if (trials > level * 5) {
                setLevel(l => {
                    const nl = l + 1;
                    if (nl > MAX_LEVEL) { setPhase('victory'); return l; }
                    if (nl % 4 === 0 && nValue < 3) setNValue(nv => nv + 1);
                    return nl;
                });
            }
        } else {
            setLives(l => {
                const nl = l - 1;
                if (nl <= 0) setTimeout(() => setPhase('game_over'), 1000);
                return nl;
            });
        }
        setTimeout(() => { dismissFeedback(); if (lives > 0) generateShape(); }, 1200);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-950 via-emerald-950 to-slate-900 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-[40%] flex items-center justify-center mx-auto mb-6 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.3)] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3)]" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Brain size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">N-Geri Şifresi</h1>
                    <p className="text-slate-300 mb-8 text-lg">Şekilleri hatırla ve karşılaştır! Her şekli N adım öncekiyle karşılaştırarak belleğini test et.</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-emerald-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-teal-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Ekranda beliren şekilleri <strong>sırasıyla takip et</strong></span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-teal-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Gördüğün şekil <strong>N adım öncekiyle aynı mı?</strong></span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-teal-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Hızlı ve doğru karar vererek <strong>seviye atla</strong></span></li>
                        </ul>
                    </div>
                    <div className="bg-teal-500/10 text-teal-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-teal-500/30 font-bold uppercase tracking-widest">TUZÖ 5.9.1 Çalışma Belleği Güncelleme</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-950 via-emerald-950 to-slate-900 text-white relative overflow-hidden">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(13, 148, 136, 0.1) 100%)', border: '1px solid rgba(20, 184, 166, 0.3)' }}><Brain className="text-teal-400" size={18} /><span className="font-bold text-teal-400">N={nValue}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30"><Zap className="text-emerald-400" size={18} /><span className="font-bold text-emerald-400">Seviye {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-120px)]">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'feedback') && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-12 w-full max-w-xl">
                            <motion.div className="w-64 h-64 rounded-[40%] flex items-center justify-center relative bg-white/5 border border-white/10 shadow-3xl overflow-hidden" style={currentShape ? { background: `linear-gradient(135deg, ${currentShape.color}30 0%, ${currentShape.color}10 100%)`, borderColor: `${currentShape.color}40`, boxShadow: `0 0 40px ${currentShape.color}20` } : {}}>
                                <AnimatePresence mode="wait">
                                    {currentShape ? (
                                        <motion.div key={currentShape.id} initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 1.5, opacity: 0 }} className="text-white drop-shadow-2xl" style={{ color: currentShape.color }}>
                                            {React.cloneElement(currentShape.icon as React.ReactElement, { size: 100 })}
                                        </motion.div>
                                    ) : <RotateCcw size={40} className="text-white/20 animate-spin" />}
                                </AnimatePresence>
                                {history.length <= nValue && <div className="absolute bottom-4 left-0 right-0 text-center"><p className="text-[10px] font-bold text-teal-400/60 uppercase tracking-[0.2em]">Veri Toplanıyor ({history.length}/{nValue + 1})</p></div>}
                            </motion.div>

                            <div className="grid grid-cols-2 gap-6 w-full">
                                <motion.button whileHover={history.length > nValue ? { scale: 1.05, y: -4 } : {}} whileTap={history.length > nValue ? { scale: 0.95 } : {}} disabled={history.length <= nValue || feedbackState !== null} onClick={() => handleDecision(true)} className={`group relative p-8 rounded-3xl flex flex-col items-center gap-4 border transition-all duration-300 ${history.length <= nValue ? 'opacity-20 cursor-not-allowed' : 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400'}`}>
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform"><Target size={32} /></div>
                                    <span className="font-black text-emerald-400 uppercase tracking-widest">AYNI</span>
                                </motion.button>
                                <motion.button whileHover={history.length > nValue ? { scale: 1.05, y: -4 } : {}} whileTap={history.length > nValue ? { scale: 0.95 } : {}} disabled={history.length <= nValue || feedbackState !== null} onClick={() => handleDecision(false)} className={`group relative p-8 rounded-3xl flex flex-col items-center gap-4 border transition-all duration-300 ${history.length <= nValue ? 'opacity-20 cursor-not-allowed' : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20 hover:border-red-400'}`}>
                                    <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform"><XCircle size={32} /></div>
                                    <span className="font-black text-red-400 uppercase tracking-widest">FARKLI</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Hafıza Ustası!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'N-Geri testinde gösterdiğin odaklanma ve hafıza becerin harika!' : 'Daha fazla pratikle çalışma belleğini güçlendirebilirsin.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default NBackGame;
