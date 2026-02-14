import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RotateCcw, Trophy, Play, Timer as TimerIcon,
    Star, Heart, Zap, CheckCircle2, Calculator, FlipHorizontal, Sparkles, Eye
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

// ─── Constants ───────────────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = 'yansima-toplami';

type GameStatus = 'waiting' | 'display' | 'input_sequence' | 'input_sum' | 'result' | 'gameover';

const ReflectionSumGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });
    const location = useLocation();
    const navigate = useNavigate();

    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [digits, setDigits] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [userSum, setUserSum] = useState<string>('');
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [isMirrored, setIsMirrored] = useState(false);
    const [_streak, setStreak] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const generateSequence = useCallback((lvl: number) => {
        const len = Math.min(10, 4 + Math.floor(lvl / 2));
        const newDigits = Array.from({ length: len }, () => Math.floor(Math.random() * 9) + 1);
        setDigits(newDigits); setUserSequence([]); setUserSum(''); setCurrentIndex(-1);
        setIsMirrored(lvl > 2 && Math.random() < 0.4); setStatus('display');
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setStatus('waiting'); setLevel(1); setScore(0); setLives(INITIAL_LIVES); setStreak(0);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        generateSequence(1); playSound('slide');
    }, [generateSequence, playSound, examMode, examTimeLimit]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && status === 'waiting') handleStart(); }, [location.state, status, handleStart, examMode]);

    useEffect(() => {
        if (status === 'display') {
            if (currentIndex < digits.length - 1) {
                const t = setTimeout(() => setCurrentIndex(p => p + 1), 1200);
                return () => clearTimeout(t);
            } else {
                const t = setTimeout(() => { setCurrentIndex(-1); setStatus('input_sequence'); }, 1500);
                return () => clearTimeout(t);
            }
        }
    }, [status, currentIndex, digits]);

    useEffect(() => {
        if ((status === 'input_sequence' || status === 'input_sum') && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setStatus('gameover'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [status, timeLeft]);

    const handleDigitClick = (digit: number) => {
        if (status !== 'input_sequence' || feedbackState) return;
        const ns = [...userSequence, digit]; setUserSequence(ns); playSound('pop');
        const rev = [...digits].reverse();
        if (digit !== rev[ns.length - 1]) {
            playSound('incorrect'); showFeedback(false); setStreak(0);
            setLives(l => {
                const nl = l - 1;
                if (nl <= 0) setTimeout(() => setStatus('gameover'), 1500);
                else setTimeout(() => { generateSequence(level); }, 1500);
                return nl;
            });
            return;
        }
        if (ns.length === digits.length) setTimeout(() => setStatus('input_sum'), 500);
    };

    const handleSumSubmit = () => {
        if (feedbackState || !userSum) return;
        const total = digits.reduce((a, b) => a + b, 0);
        const correct = parseInt(userSum) === total;
        showFeedback(correct); playSound(correct ? 'correct' : 'incorrect');
        if (correct) {
            setStreak(p => p + 1); setScore(s => s + (level * 10) + Math.floor(timeLeft / 10));
            setTimeout(() => {
                dismissFeedback();
                if (level >= MAX_LEVEL) setStatus('gameover');
                else { setLevel(l => l + 1); generateSequence(level + 1); }
            }, 1500);
        } else {
            setStreak(0);
            setLives(l => {
                const nl = l - 1;
                if (nl <= 0) setTimeout(() => setStatus('gameover'), 1500);
                else setTimeout(() => { dismissFeedback(); generateSequence(level); }, 1500);
                return nl;
            });
        }
    };

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(level >= 5, score, MAX_LEVEL * 100, duration);
            navigate("/atolyeler/sinav-simulasyonu/devam"); return;
        }
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: duration, metadata: { level_reached: level, victory: level >= MAX_LEVEL } });
    }, [score, level, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => { if (status === 'gameover') handleFinish(); }, [status, handleFinish]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (status === 'waiting') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-violet-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-violet-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><FlipHorizontal size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-purple-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">Yansıma Toplamı</h1>
                    <p className="text-slate-300 mb-8 text-lg">Sayıları izle, zihninde ters çevir ve toplamlarını bul. Çalışma belleğini bir üst seviyeye taşı!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-purple-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Sırayla ekrana gelen <strong>sayıları aklında tut</strong></span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-purple-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Gördüğün sayıları <strong>en sondan başa doğru</strong> tuşla</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-purple-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Son aşamada tüm sayıların <strong>toplamını hesapla</strong></span></li>
                        </ul>
                    </div>
                    <div className="bg-purple-500/10 text-purple-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-purple-500/30 font-bold uppercase tracking-widest">TUZÖ 5.4.1 Çalışma Belleği Güncelleme</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-violet-950 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {status !== 'gameover' && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-950'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)', border: '1px solid rgba(168, 85, 247, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-purple-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-purple-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)' }}><Zap className="text-violet-400" size={18} /><span className="font-bold text-violet-400">Seviye {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {status === 'display' && (
                        <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-12">
                            <div className="relative w-64 h-64 flex items-center justify-center">
                                <div className="absolute inset-0 border-[6px] border-purple-500/10 rounded-full animate-spin-slow shadow-[0_0_50px_rgba(168,85,247,0.1)]" />
                                <div className="absolute inset-4 border-2 border-dashed border-purple-500/20 rounded-full" />
                                <AnimatePresence mode="wait">
                                    {currentIndex >= 0 && (
                                        <motion.div key={currentIndex} initial={{ scale: 0, opacity: 0, rotateY: isMirrored ? 180 : 0 }} animate={{ scale: 1.2, opacity: 1, rotateY: isMirrored ? 180 : 0 }} exit={{ scale: 2, opacity: 0 }} className="text-9xl font-black text-white" style={{ textShadow: '0 0 40px rgba(168, 85, 247, 0.6)' }}>{digits[currentIndex]}</motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="flex gap-3">
                                {digits.map((_, i) => (<div key={i} className={`w-4 h-4 rounded-full border-2 border-purple-500/30 transition-all duration-500 ${i <= currentIndex ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)] scale-110' : 'bg-white/5'}`} />))}
                            </div>
                            <p className="text-purple-400 font-black uppercase tracking-widest text-sm animate-pulse">Sayıları Aklında Tut</p>
                        </motion.div>
                    )}

                    {status === 'input_sequence' && (
                        <motion.div key="sequence" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-xl space-y-10">
                            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 md:p-12 border border-white/10 shadow-3xl text-center">
                                <p className="text-slate-400 text-sm font-black uppercase tracking-widest mb-8 flex items-center justify-center gap-3"><Eye size={20} className="text-purple-400" /> Tersine Tuşla</p>
                                <div className="flex justify-center gap-3 min-h-[70px] flex-wrap">
                                    {userSequence.map((d, i) => (<motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-14 h-16 bg-purple-500/20 border-2 border-purple-500/40 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg">{d}</motion.div>))}
                                    {Array.from({ length: digits.length - userSequence.length }).map((_, i) => (<div key={i + 100} className="w-14 h-16 border-2 border-dashed border-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500/10 text-3xl font-black">?</div>))}
                                </div>
                            </div>
                            <div className="grid grid-cols-5 gap-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
                                    <motion.button key={n} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => handleDigitClick(n)} className="py-6 rounded-2xl text-2xl font-black bg-white/5 border border-white/10 hover:bg-white/10 transition-all shadow-xl" style={{ boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.05)' }}>{n}</motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {status === 'input_sum' && (
                        <motion.div key="sum" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md space-y-8">
                            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-10 border border-white/10 shadow-3xl text-center">
                                <Calculator className="mx-auto text-purple-400 mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" size={56} />
                                <p className="text-slate-400 text-sm font-black uppercase tracking-widest mb-6">Toplamı Nedir?</p>
                                <input type="number" value={userSum} onChange={(e) => setUserSum(e.target.value)} autoFocus onKeyPress={(e) => e.key === 'Enter' && handleSumSubmit()} className="w-full bg-slate-950/40 border-b-4 border-purple-500/50 text-center text-6xl font-black text-white py-6 rounded-3xl focus:border-purple-400 focus:outline-none transition-all placeholder:text-white/5" placeholder="0" />
                            </div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleSumSubmit} className="w-full py-5 bg-gradient-to-r from-purple-500 to-violet-600 rounded-[28px] font-black text-xl shadow-2xl flex items-center justify-center gap-3"><CheckCircle2 size={24} /><span>ONAYLA</span></motion.button>
                        </motion.div>
                    )}

                    {status === 'gameover' && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-violet-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-purple-400 mb-2">{level >= 5 ? '🎖️ Çalışma Belleği Uzmanı!' : 'Mükemmel!'}</h2>
                            <p className="text-slate-400 mb-6">{level >= 5 ? 'Sayıları tersten hatırlama ve zihninde aynı anda işlem yapma becerin harika!' : 'Daha karmaşık sayı dizilerini tersine çevirmek için bol bol pratik yapmalısın.'}</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm font-bold">Skor</p><p className="text-3xl font-black text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm font-bold">Seviye</p><p className="text-3xl font-black text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
            <style>{` .animate-spin-slow { animation: spin 12s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } `}</style>
        </div>
    );
};

export default ReflectionSumGame;
