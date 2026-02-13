import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon,
    ChevronLeft, Zap, Heart, Eye, Sparkles, CheckCircle2
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useSound } from '../../hooks/useSound';

// ─── Constants ───────────────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = 'gorsel-tarama';
const ALL_SYMBOLS = ['★', '●', '■', '▲', '◆', '♦', '♣', '♠', '♥', '○', '□', '△', '◇', '✕', '✓', '⬟'];
const GRID_SIZE = 64; // 8x8

interface CellData { symbol: string; isTarget: boolean; isClicked: boolean; isWrongClick: boolean; }
type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

const VisualScanningGame: React.FC = () => {
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
    const [targetSymbol, setTargetSymbol] = useState('★');
    const [grid, setGrid] = useState<CellData[]>([]);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const genLevelGrid = useCallback((target: string, lvl: number): CellData[] => {
        const targetCount = lvl < 3 ? 6 : lvl < 6 ? 8 : lvl < 10 ? 10 : lvl < 15 ? 12 : 14;
        const distractorCount = lvl < 5 ? 3 : lvl < 10 ? 5 : lvl < 15 ? 7 : 10;
        const cells: CellData[] = [];
        const distractors = ALL_SYMBOLS.filter(s => s !== target).sort(() => Math.random() - 0.5).slice(0, distractorCount);
        const targetPos = new Set<number>(); while (targetPos.size < targetCount) targetPos.add(Math.floor(Math.random() * GRID_SIZE));
        for (let i = 0; i < GRID_SIZE; i++) {
            const symbols = targetPos.has(i) ? target : distractors[Math.floor(Math.random() * distractors.length)];
            cells.push({ symbol: symbols, isTarget: targetPos.has(i), isClicked: false, isWrongClick: false });
        }
        return cells;
    }, []);

    const startRound = useCallback((lvl: number) => {
        const nextTarget = ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
        setTargetSymbol(nextTarget); setGrid(genLevelGrid(nextTarget, lvl));
    }, [genLevelGrid]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0); setPhase('playing'); setScore(0); setLives(INITIAL_LIVES); setLevel(1); setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        setStreak(0); setBestStreak(0); startTimeRef.current = Date.now(); hasSavedRef.current = false; playSound('slide');
        startRound(1);
    }, [examMode, examTimeLimit, playSound, startRound]);

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

    const handleFinish = useCallback(async (isVictory: boolean) => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) { await submitResult(isVictory || level >= 5, score, MAX_LEVEL * 100, duration); navigate('/atolyeler/sinav-simulasyonu/devam'); return; }
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: duration, metadata: { level_reached: level, best_streak: bestStreak, victory: isVictory } });
    }, [score, level, bestStreak, examMode, submitResult, navigate, saveGamePlay]);

    useEffect(() => { if (phase === 'game_over' || phase === 'victory') handleFinish(phase === 'victory'); }, [phase, handleFinish]);

    useEffect(() => {
        if (phase !== 'playing') return;
        const remaining = grid.filter(c => c.isTarget && !c.isClicked).length;
        if (remaining === 0 && grid.length > 0) {
            playSound('correct'); showFeedback(true);
            setTimeout(() => {
                dismissFeedback();
                if (level >= MAX_LEVEL) setPhase('victory');
                else { const nl = level + 1; setLevel(nl); setTimeLeft(p => Math.min(p + 10, TIME_LIMIT)); startRound(nl); }
            }, 1000);
        }
    }, [grid, phase, level, startRound, playSound, showFeedback, dismissFeedback]);

    const handleCellClick = (idx: number) => {
        if (phase !== 'playing' || !!feedbackState) return;
        const cell = grid[idx]; if (cell.isClicked || cell.isWrongClick) return;
        const newGrid = [...grid];
        if (cell.isTarget) {
            newGrid[idx] = { ...cell, isClicked: true };
            setStreak(s => { const ns = s + 1; if (ns > bestStreak) setBestStreak(ns); return ns; });
            const bonus = Math.min(streak * 2, 20); setScore(p => p + 25 + bonus); playSound('pop');
        } else {
            newGrid[idx] = { ...cell, isWrongClick: true };
            setStreak(0); setScore(p => Math.max(0, p - 10)); playSound('incorrect');
            setLives(l => { const nl = l - 1; if (nl <= 0) setPhase('game_over'); return nl; });
            showFeedback(false); setTimeout(dismissFeedback, 1000);
        }
        setGrid(newGrid);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-rose-950 to-pink-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-rose-400 to-pink-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Eye size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-rose-300 via-pink-300 to-fuchsia-300 bg-clip-text text-transparent">Görsel Tarama</h1>
                    <p className="text-slate-300 mb-8 text-lg">Hızlı ve keskin bir bakışla kalabalık içindeki hedef sembolleri bul, seçici dikkatinle zirveye tırman!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-rose-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-rose-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Üstte gösterilen <strong>hedef sembolü</strong> aklında tut</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-rose-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Grid içindeki tüm hedef sembolleri <strong>en kısa sürede</strong> bulup dokun</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-rose-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Yanlış tıklarsan <strong>can kaybedersin</strong>, dikkatli ol!</span></li>
                        </ul>
                    </div>
                    <div className="bg-rose-500/10 text-rose-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-rose-500/30 font-bold uppercase tracking-widest">TUZÖ 5.2.1 Görsel Tarama & Seçici Dikkat</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    const remaining = grid.filter(c => c.isTarget && !c.isClicked).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-rose-950 to-pink-950 text-white relative overflow-hidden flex flex-col">
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
                        <motion.div key="game" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="w-full max-w-xl space-y-6">
                            <div className="bg-white/5 backdrop-blur-xl rounded-[40px] p-4 border border-white/10 shadow-2xl flex items-center justify-center gap-8 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 via-transparent to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center gap-3"><span className="text-xs font-black uppercase text-white/30 tracking-widest">HEDEF:</span><div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-600 rounded-3xl flex items-center justify-center shadow-lg border-2 border-white/20"><span className="text-3xl text-white drop-shadow-md">{targetSymbol}</span></div></div>
                                <div className="h-10 w-px bg-white/10" />
                                <div className="flex items-center gap-3"><span className="text-xs font-black uppercase text-white/30 tracking-widest">KALAN:</span><div className="text-3xl font-black text-rose-300">{remaining}</div></div>
                            </div>
                            <div className="grid grid-cols-8 gap-1.5 p-4 bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/10 shadow-3xl">
                                {grid.map((c, i) => (
                                    <motion.button key={i} whileHover={{ scale: 1.1, zIndex: 10 }} whileTap={{ scale: 0.9 }} onClick={() => handleCellClick(i)} className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-300 relative shadow-inner overflow-hidden ${c.isClicked ? 'bg-emerald-500 border-emerald-400 scale-95 shadow-none' : c.isWrongClick ? 'bg-red-500 border-red-400 scale-95 shadow-none' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                                        <span className={`text-xl lg:text-2xl font-black ${c.isClicked || c.isWrongClick ? 'text-white' : 'text-slate-400'}`}>{c.symbol}</span>
                                        {c.isClicked && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center bg-emerald-500/20"><CheckCircle2 className="text-white opacity-40" size={16} /></motion.div>}
                                    </motion.button>
                                ))}
                            </div>
                            {streak > 1 && (
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center"><span className="px-6 py-2 bg-purple-500/20 border border-purple-500/40 rounded-full text-purple-300 font-black text-sm uppercase tracking-widest shadow-lg">KOMBO x{streak} 🔥</span></motion.div>
                            )}
                        </motion.div>
                    )}

                    {feedbackState && (
                        <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center"><h2 className={`text-5xl font-black ${feedbackState.correct ? 'text-emerald-400' : 'text-red-400'} drop-shadow-2xl italic tracking-tighter`}>{feedbackState.correct ? 'SEVİYE TAMAMLANDI!' : 'DİKKAT!'}</h2><GameFeedbackBanner feedback={feedbackState} /></motion.div>
                    )}

                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-rose-500 to-pink-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-rose-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Keskin Göz!' : 'Harika!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Görsel tarama ve seçici dikkat becerin tek kelimeyle mükemmel!' : 'Kalabalık içindeki hedefleri bulmak için biraz daha odaklanmalısın!'}</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm font-bold">Skor</p><p className="text-3xl font-black text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm font-bold">Seviye</p><p className="text-3xl font-black text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default VisualScanningGame;
