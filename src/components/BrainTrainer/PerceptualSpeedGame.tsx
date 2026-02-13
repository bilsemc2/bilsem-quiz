import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon,
    CheckCircle2, XCircle, ChevronLeft, Zap, Heart, Eye, Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import { useSound } from '../../hooks/useSound';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useExam } from '../../contexts/ExamContext';

// ─── Constants ───────────────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const BASE_DIGIT_LENGTH = 5;
const GAME_ID = 'algisal-hiz';

const CONFUSION_PAIRS: Record<string, string[]> = {
    '3': ['8', '5'], '8': ['3', '0'], '1': ['7'], '7': ['1'],
    '6': ['9', '0'], '9': ['6'], '5': ['2', '3'], '2': ['5'],
};

interface Challenge { left: string; right: string; isSame: boolean; type: 'same' | 'transposition' | 'similarity' | 'random'; }
type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

const generateRandomNumberString = (length: number): string => {
    let res = ''; for (let i = 0; i < length; i++) res += Math.floor(Math.random() * 10).toString(); return res;
};

const createChallenge = (digitLength: number): Challenge => {
    const base = generateRandomNumberString(digitLength), isSame = Math.random() > 0.5;
    if (isSame) return { left: base, right: base, isSame: true, type: 'same' };
    const mod = base.split(''), roll = Math.random();
    let type: Challenge['type'] = 'random';
    if (roll < 0.45) { const idx = Math.floor(Math.random() * (base.length - 1));[mod[idx], mod[idx + 1]] = [mod[idx + 1], mod[idx]]; type = 'transposition'; }
    else if (roll < 0.90) {
        const candy = base.split('').map((c, i) => ({ c, i })).filter(it => CONFUSION_PAIRS[it.c]);
        if (candy.length > 0) { const target = candy[Math.floor(Math.random() * candy.length)]; const reps = CONFUSION_PAIRS[target.c]; mod[target.i] = reps[Math.floor(Math.random() * reps.length)]; type = 'similarity'; }
        else { const idx = Math.floor(Math.random() * base.length); mod[idx] = ((parseInt(mod[idx]) + 1) % 10).toString(); type = 'random'; }
    } else {
        const idx = Math.floor(Math.random() * base.length); let nd = Math.floor(Math.random() * 10).toString();
        while (nd === mod[idx]) nd = Math.floor(Math.random() * 10).toString(); mod[idx] = nd;
    }
    const right = mod.join(''); if (base === right) mod[0] = mod[0] === '1' ? '2' : '1';
    return { left: base, right: mod.join(''), isSame: false, type };
};

const PerceptualSpeedGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [_correctCount, setCorrectCount] = useState(0);
    const [_totalAttempts, setTotalAttempts] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const challengeStartRef = useRef(0);
    const reactionTimesRef = useRef<number[]>([]);
    const correctInLevelRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const setupChallenge = useCallback(() => {
        const len = Math.min(BASE_DIGIT_LENGTH + Math.floor((level - 1) / 4), 9);
        setChallenge(createChallenge(len)); challengeStartRef.current = performance.now();
    }, [level]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing'); setScore(0); setLevel(1); setLives(INITIAL_LIVES);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        setCorrectCount(0); setTotalAttempts(0); reactionTimesRef.current = []; correctInLevelRef.current = 0;
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        setupChallenge(); playSound('slide');
    }, [setupChallenge, playSound, examMode, examTimeLimit]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart(); }, [location.state, phase, handleStart, examMode]);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

    const handleAnswer = useCallback((val: boolean) => {
        if (!challenge || phase !== 'playing') return;
        const reaction = performance.now() - challengeStartRef.current; reactionTimesRef.current.push(reaction);
        const correct = val === challenge.isSame;
        setTotalAttempts(a => a + 1); showFeedback(correct); playSound(correct ? 'correct' : 'incorrect');
        setPhase('feedback');
        setTimeout(() => {
            dismissFeedback();
            if (correct) {
                setScore(s => s + 10 * level); setCorrectCount(c => c + 1); correctInLevelRef.current += 1;
                if (correctInLevelRef.current >= 3) {
                    correctInLevelRef.current = 0;
                    if (level >= MAX_LEVEL) setPhase('victory');
                    else { setLevel(l => l + 1); setPhase('playing'); setupChallenge(); }
                } else { setPhase('playing'); setupChallenge(); }
            } else {
                setLives(l => {
                    const nl = l - 1;
                    if (nl <= 0) setTimeout(() => setPhase('game_over'), 500);
                    else { setPhase('playing'); setupChallenge(); }
                    return nl;
                });
            }
        }, 1500);
    }, [challenge, phase, level, setupChallenge, playSound, showFeedback, dismissFeedback]);

    useEffect(() => {
        const hk = (e: KeyboardEvent) => { if (phase === 'playing' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) handleAnswer(e.key === 'ArrowLeft'); };
        window.addEventListener('keydown', hk); return () => window.removeEventListener('keydown', hk);
    }, [phase, handleAnswer]);

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const avgReact = reactionTimesRef.current.length > 0 ? Math.round(reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length) : 0;
        if (examMode) {
            await submitResult(level >= 5 || phase === 'victory', score, MAX_LEVEL * 100, duration);
            navigate("/atolyeler/sinav-simulasyonu/devam"); return;
        }
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: duration, metadata: { level_reached: level, victory: phase === 'victory', avg_reaction_ms: avgReact } });
    }, [phase, score, level, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => { if (phase === 'game_over' || phase === 'victory') handleFinish(); }, [phase, handleFinish]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Eye size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">Algısal Hız Testi</h1>
                    <p className="text-slate-300 mb-8 text-lg">İki sayı dizisini saniyeler içinde karşılaştır. Gözlerin ne kadar keskin, zihnin ne kadar hızlı?</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-cyan-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-cyan-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Ekrandaki iki sayıyı <strong>hızlıca tara</strong></span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-cyan-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Aynıysa <strong>AYNI</strong>, farklıysa <strong>FARKLI</strong>'ya bas</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-cyan-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Karıştırılan rakamlara (3-8, 1-7) <strong>dikkat et</strong></span></li>
                        </ul>
                    </div>
                    <div className="bg-cyan-500/10 text-cyan-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-cyan-500/30 font-bold uppercase tracking-widest">TUZÖ 5.6.1 İşleme Hızı</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-950'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}><Zap className="text-emerald-400" size={18} /><span className="font-bold text-emerald-400">Seviye {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'feedback') && challenge && (
                        <motion.div key="game" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-4xl">
                            <div className="bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 md:p-14 border border-white/10 shadow-3xl mb-10 text-center relative overflow-hidden">
                                <p className="text-slate-400 text-sm font-black uppercase tracking-widest mb-10 flex items-center justify-center gap-3"><Eye size={20} className="text-cyan-400" /> Sayı Dizilerini Karşılaştır</p>
                                <div className="space-y-12">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">BİRİNCİ DİZİ</span>
                                        <div className="text-4xl md:text-6xl lg:text-7xl font-mono font-black tracking-[0.15em] text-white drop-shadow-2xl tabular-nums select-none">{challenge.left}</div>
                                    </div>
                                    <div className="w-32 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mx-auto rounded-full" />
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">İKİNCİ DİZİ</span>
                                        <div className="text-4xl md:text-6xl lg:text-7xl font-mono font-black tracking-[0.15em] text-white drop-shadow-2xl tabular-nums select-none">{challenge.right}</div>
                                    </div>
                                </div>
                                <div className="mt-12 text-center"><span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{correctInLevelRef.current}/3 TAMAMLANDI</span></div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
                                <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => handleAnswer(true)} className="flex flex-col items-center justify-center min-h-[120px] bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-2xl rounded-[32px] border border-emerald-500/30 shadow-lg shadow-emerald-500/10 transition-all hover:border-emerald-400 group">
                                    <CheckCircle2 className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" size={32} />
                                    <span className="text-xl font-black text-emerald-300 uppercase tracking-widest">AYNI</span>
                                    <span className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Klavye: Sol Ok</span>
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => handleAnswer(false)} className="flex flex-col items-center justify-center min-h-[120px] bg-gradient-to-br from-rose-500/20 to-rose-600/10 backdrop-blur-2xl rounded-[32px] border border-rose-500/30 shadow-lg shadow-rose-500/10 transition-all hover:border-rose-400 group">
                                    <XCircle className="text-rose-400 mb-2 group-hover:scale-110 transition-transform" size={32} />
                                    <span className="text-xl font-black text-rose-300 uppercase tracking-widest">FARKLI</span>
                                    <span className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Klavye: Sağ Ok</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-cyan-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Algı Şampiyonu!' : 'Fevkalade!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Sayıları tarama hızın ve yüksek doğruluğun tek kelimeyle inanılmaz!' : 'Hızını ve doğruluğunu artırmak için bol bol pratik yapmalısın.'}</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm font-bold">Skor</p><p className="text-3xl font-black text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm font-bold">Seviye</p><p className="text-3xl font-black text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default PerceptualSpeedGame;
