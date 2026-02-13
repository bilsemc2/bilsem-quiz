import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star,
    ChevronLeft, Zap, Compass, ArrowUp, ArrowDown,
    ArrowLeft, ArrowRight, Heart, Sparkles, Timer as TimerIcon
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useExam } from '../../contexts/ExamContext';
import { useSound } from '../../hooks/useSound';

// ─── Constants ───────────────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = 'yon-stroop';

interface Round { word: string; position: 'left' | 'right' | 'top' | 'bottom'; correctAnswer: string; }
const DIRECTIONS = [
    { word: 'SOL', position: 'left' as const, turkishName: 'Sol', icon: ArrowLeft },
    { word: 'SAĞ', position: 'right' as const, turkishName: 'Sağ', icon: ArrowRight },
    { word: 'YUKARI', position: 'top' as const, turkishName: 'Yukarı', icon: ArrowUp },
    { word: 'AŞAĞI', position: 'bottom' as const, turkishName: 'Aşağı', icon: ArrowDown },
];

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

const DirectionStroopGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [currentRound, setCurrentRound] = useState<Round | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const generateRound = useCallback((): Round => {
        const wordIdx = Math.floor(Math.random() * DIRECTIONS.length);
        let posIdx; do { posIdx = Math.floor(Math.random() * DIRECTIONS.length); } while (posIdx === wordIdx);
        return { word: DIRECTIONS[wordIdx].word, position: DIRECTIONS[posIdx].position, correctAnswer: DIRECTIONS[posIdx].turkishName };
    }, []);

    const startLevel = useCallback((_lvl: number) => {
        setCurrentRound(generateRound()); playSound('slide');
    }, [generateRound, playSound]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0); setPhase('playing'); setScore(0); setLives(INITIAL_LIVES); setLevel(1); setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false; startLevel(1);
    }, [startLevel, examMode, examTimeLimit]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart(); }, [location.state, examMode, phase, handleStart]);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

    const handleAnswer = (answer: string) => {
        if (phase !== 'playing' || !!feedbackState) return;
        const correct = answer === currentRound?.correctAnswer;
        if (correct) {
            playSound('correct'); showFeedback(true); setScore(s => s + 20 + level * 5);
            setTimeout(() => {
                dismissFeedback();
                if (level >= MAX_LEVEL) setPhase('victory');
                else { const nl = level + 1; setLevel(nl); setTimeLeft(p => Math.min(p + 10, TIME_LIMIT)); startLevel(nl); }
            }, 1000);
        } else {
            playSound('incorrect'); showFeedback(false); setLives(l => { const nl = l - 1; if (nl <= 0) setPhase('game_over'); return nl; });
            setTimeout(dismissFeedback, 1000);
        }
    };

    const handleFinish = useCallback(async (v: boolean) => {
        if (hasSavedRef.current) return; hasSavedRef.current = true;
        const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) { await submitResult(v || level >= 5, score, MAX_LEVEL * 100, dur); navigate('/atolyeler/sinav-simulasyonu/devam'); return; }
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: dur, metadata: { level: level, victory: v } });
    }, [score, level, examMode, submitResult, navigate, saveGamePlay]);

    useEffect(() => { if (phase === 'game_over' || phase === 'victory') handleFinish(phase === 'victory'); }, [phase, handleFinish]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-sky-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-sky-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Compass size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-300 bg-clip-text text-transparent">Yön Stroop</h1>
                    <p className="text-slate-300 mb-8 text-lg">Kelimelerin ne dediğine değil, nerede olduklarına odaklan! Zihnini yönlendir ve karmaşayı çöz.</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-cyan-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-cyan-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Ekrandaki kelimenin <strong>anlamına ALDANMA</strong>, bulunduğu konuma bak</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-cyan-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Kelimenin bulunduğu yönü aşağıdaki butonlardan seç</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-cyan-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Örneğin "SAĞ" kelimesi ekranın üstündeyse, cevabın <strong>"YUKARI"</strong> olmalı</span></li>
                        </ul>
                    </div>
                    <div className="bg-cyan-500/10 text-cyan-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-cyan-500/30 font-bold uppercase tracking-widest">TUZÖ 5.1.2 Uzamsal Stroop & İnhibisyon</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-sky-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-sky-950 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20"><Star className="text-amber-400 fill-amber-400" size={16} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={16} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-950'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={16} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20"><Zap className="text-emerald-400" size={16} /><span className="font-bold text-emerald-400">Puan x{level}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'feedback') && !feedbackState && (
                        <motion.div key="game" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="w-full max-w-2xl aspect-square relative border border-white/5 rounded-[4rem] bg-white/5 backdrop-blur-sm shadow-inner flex items-center justify-center p-12">
                            <motion.div key={currentRound?.word} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute bg-white/10 backdrop-blur-xl px-10 py-5 rounded-[2rem] border border-white/20 shadow-3xl select-none" style={{ top: currentRound?.position === 'top' ? '15%' : currentRound?.position === 'bottom' ? 'auto' : '50%', bottom: currentRound?.position === 'bottom' ? '15%' : 'auto', left: currentRound?.position === 'left' ? '15%' : currentRound?.position === 'right' ? 'auto' : '50%', right: currentRound?.position === 'right' ? '15%' : 'auto', transform: currentRound?.position === 'left' || currentRound?.position === 'right' ? 'translateY(-50%)' : currentRound?.position === 'top' || currentRound?.position === 'bottom' ? 'translateX(-50%)' : 'translate(-50%, -50%)' }}>
                                <span className="text-4xl font-black text-white tracking-widest drop-shadow-xl italic">{currentRound?.word}</span>
                            </motion.div>

                            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-[60%] sm:mt-0 z-20">
                                {DIRECTIONS.map(dir => (
                                    <motion.button key={dir.turkishName} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => handleAnswer(dir.turkishName)} className="p-6 bg-white/10 border border-white/10 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-white/20 hover:border-cyan-500/50 shadow-xl transition-all group">
                                        <dir.icon className="text-white group-hover:scale-110 transition-transform" size={32} />
                                        <span className="text-sm font-black text-white/60 tracking-widest uppercase">{dir.turkishName}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {feedbackState && (
                        <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center"><h2 className={`text-5xl font-black ${feedbackState.correct ? 'text-emerald-400' : 'text-red-400'} drop-shadow-2xl italic tracking-tighter`}>{feedbackState.correct ? 'KESKİN YÖNLER! 🧭' : 'DİKKAT!'}</h2><GameFeedbackBanner feedback={feedbackState} /></motion.div>
                    )}

                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-cyan-500 to-sky-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-cyan-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Yönlerin Efendisi!' : 'Harika!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Uzamsal zeka ve bilişsel kontrol becerin tek kelimeyle mükemmel!' : 'Kelimelerin anlamı ile konumlarını ayırmak için biraz daha pratik yapmalısın!'}</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm font-bold">Skor</p><p className="text-3xl font-black text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm font-bold">Seviye</p><p className="text-3xl font-black text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-sky-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DirectionStroopGame;
