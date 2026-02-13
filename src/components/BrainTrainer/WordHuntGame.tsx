import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon,
    ChevronLeft, Zap, Heart, Search, Sparkles, CheckCircle2
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
const GAME_ID = 'kelime-avi';

type Phase = 'welcome' | 'playing' | 'exposure' | 'feedback' | 'game_over' | 'victory';
const ALPHABET = [...'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'];
const VOWELS = [...'AEIİOÖUÜ'];
const CONSONANTS = [...'BCÇDFGĞHJKLMNPRSŞTVYZ'];
const BIGRAMS = ['AR', 'ER', 'AN', 'AL', 'LA', 'RA', 'TE', 'SE', 'İN', 'IN', 'DE', 'DA', 'EN', 'EL', 'MA', 'ME', 'TA', 'SA', 'YA', 'YE', 'UR', 'UN', 'US', 'UT', 'AK', 'EK', 'IL', 'İL', 'OL'];
// const TRAP_MAP: Record<string, string[]> = { A: ['E'], E: ['A'], I: ['İ'], 'İ': ['I'], O: ['Ö'], 'Ö': ['O'], U: ['Ü'], 'Ü': ['U'], S: ['Ş'], 'Ş': ['S'], C: ['Ç'], 'Ç': ['C'], G: ['Ğ'], 'Ğ': ['G'] };
const CARD_COLORS = ['from-violet-500 to-purple-600', 'from-rose-500 to-pink-600', 'from-amber-500 to-orange-600', 'from-teal-500 to-emerald-600', 'from-indigo-500 to-blue-600', 'from-fuchsia-500 to-pink-600', 'from-cyan-500 to-teal-600', 'from-lime-500 to-green-600'];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getLevelCfg = (lvl: number) => {
    if (lvl <= 5) return { wordLen: 5, items: 8, roundDur: 4.5 - (lvl - 1) * 0.1, flash: 0.6, useBig: false };
    if (lvl <= 10) return { wordLen: 6, items: 9, roundDur: 3.8 - (lvl - 6) * 0.1, flash: 0.55, useBig: lvl >= 8 };
    if (lvl <= 15) return { wordLen: 7, items: 10, roundDur: 3.2 - (lvl - 11) * 0.1, flash: 0.5, useBig: true };
    return { wordLen: 8, items: 12, roundDur: 2.6 - (lvl - 16) * 0.05, flash: 0.4, useBig: true };
};

const makeWord = (len: number) => {
    let w = ''; let v = Math.random() > 0.45;
    for (let i = 0; i < len; i++) { w += v ? pick(VOWELS) : pick(CONSONANTS); v = !v; if (Math.random() < 0.18) v = !v; }
    return w;
};

const insertT = (w: string, t: string) => {
    if (w.length < t.length) return t;
    const s = Math.floor(Math.random() * (w.length - t.length + 1));
    return w.slice(0, s) + t + w.slice(s + t.length);
};

const genItems = (t: string, len: number, count: number) => {
    const tc = Math.min(count - 2, Math.max(2, Math.round(count * 0.5) + (Math.floor(Math.random() * 3) - 1)));
    const items = [];
    for (let i = 0; i < count; i++) {
        const has = i < tc; const base = makeWord(len);
        let text = has ? insertT(base, t) : base;
        if (!has && text.includes(t)) text = text.replace(t, t.split('').reverse().join(''));
        items.push({ id: `${i}-${text}-${Math.random()}`, text, hasTarget: has });
    }
    return items.sort(() => Math.random() - 0.5);
};

const WordHuntGame: React.FC = () => {
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
    const [target, setTarget] = useState('—');
    const [items, setItems] = useState<any[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [roundTime, setRoundTime] = useState(0);
    const [isExp, setIsExp] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const roundRef = useRef(0);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const startLevel = useCallback((lvl: number) => {
        const cfg = getLevelCfg(lvl); const t = cfg.useBig ? pick(BIGRAMS) : pick(ALPHABET);
        setTarget(t); setItems(genItems(t, cfg.wordLen, cfg.items)); setSelected(new Set()); setRoundTime(cfg.roundDur);
        setIsExp(true); setPhase('exposure'); playSound('slide');
        setTimeout(() => { setIsExp(false); setPhase('playing'); }, cfg.flash * 1000);
    }, [playSound]);

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

    const finishRound = useCallback(() => {
        cancelAnimationFrame(roundRef.current);
        const total = items.filter(i => i.hasTarget).length; const correct = items.filter(i => i.hasTarget && selected.has(i.id)).length;
        const acc = total ? correct / total : 0; const isGood = acc >= 0.5;
        playSound(isGood ? 'correct' : 'incorrect'); showFeedback(isGood);
        setTimeout(() => {
            dismissFeedback();
            if (isGood) {
                setScore(s => s + level * 10);
                if (level >= MAX_LEVEL) setPhase('victory');
                else { const nl = level + 1; setLevel(nl); startLevel(nl); }
            } else {
                setLives(l => { const nl = l - 1; if (nl <= 0) setPhase('game_over'); else startLevel(level); return nl; });
            }
        }, 1500);
    }, [items, selected, level, lives, startLevel, playSound, showFeedback, dismissFeedback]);

    useEffect(() => {
        if (phase !== 'playing') return;
        const start = performance.now(); const dur = getLevelCfg(level).roundDur;
        const tick = (now: number) => {
            const el = (now - start) / 1000; const rem = Math.max(0, dur - el); setRoundTime(rem);
            if (rem <= 0) finishRound(); else roundRef.current = requestAnimationFrame(tick);
        };
        roundRef.current = requestAnimationFrame(tick); return () => cancelAnimationFrame(roundRef.current);
    }, [phase, level, items, finishRound]);

    const handleFinish = useCallback(async (v: boolean) => {
        if (hasSavedRef.current) return; hasSavedRef.current = true;
        const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) { await submitResult(v || level >= 5, score, MAX_LEVEL * 100, dur); navigate('/atolyeler/sinav-simulasyonu/devam'); return; }
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: dur, metadata: { level: level, victory: v } });
    }, [score, level, examMode, submitResult, navigate, saveGamePlay]);

    useEffect(() => { if (phase === 'game_over' || phase === 'victory') handleFinish(phase === 'victory'); }, [phase, handleFinish]);

    const toggle = (id: string) => {
        if (phase !== 'playing' || !!feedbackState) return;
        setSelected(prev => {
            const next = new Set(prev); if (next.has(id)) next.delete(id);
            else if (next.size < items.filter(i => i.hasTarget).length) { next.add(id); playSound('pop'); }
            return next;
        });
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const cfg = getLevelCfg(level);
    const prog = Math.max(0, Math.min(100, (roundTime / cfg.roundDur) * 100));
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-violet-400 to-purple-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Search size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">Kelime Avı</h1>
                    <p className="text-slate-300 mb-8 text-lg">Hızlı akan harfler arasında gizli hedefleri yakala, algısal işlem hızınla kelime ormanında fark yarat!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-violet-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Ekranda kısa süre beliren <strong>kelimeleri hızla tara</strong></span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Gösterilen <strong>hedef harfi</strong> (veya harf grubunu) içeren kelimeleri seç</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Süre bitmeden hedefleri yakala, <strong>kombo puanları</strong> topla!</span></li>
                        </ul>
                    </div>
                    <div className="bg-violet-500/10 text-violet-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-violet-500/30 font-bold uppercase tracking-widest">TUZÖ 5.6.1 Algısal İşlem Hızı</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase === 'playing' || phase === 'exposure' || phase === 'feedback') && (
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
                    {(phase === 'playing' || phase === 'exposure') && (
                        <motion.div key="game" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl flex flex-col items-center">
                            <div className="flex items-center gap-6 mb-8 w-full transition-all duration-500">
                                <div className="bg-gradient-to-br from-violet-500 to-purple-700 p-4 rounded-[2rem] shadow-2xl border-2 border-white/20 transform hover:scale-110 transition-transform">
                                    <span className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">HEDEF</span>
                                    <span className="text-4xl font-black text-white drop-shadow-md tracking-widest">{target}</span>
                                </div>
                                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-inner relative">
                                    <motion.div className={`h-full ${prog < 30 ? 'bg-red-500' : 'bg-gradient-to-r from-violet-400 to-indigo-500'}`} style={{ width: `${prog}%` }} transition={{ duration: 0.1, ease: 'linear' }} />
                                    <div className="absolute top-full mt-1 left-0 right-0 flex justify-between px-1"><span className="text-[10px] font-bold text-white/30 tracking-widest uppercase">Zaman</span><span className="text-[10px] font-black text-white/50">{roundTime.toFixed(1)}s</span></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full p-6 bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 shadow-3xl">
                                {items.map((item, id) => {
                                    const sel = selected.has(item.id);
                                    return (
                                        <motion.button key={item.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: id * 0.03 }} whileHover={phase === 'playing' ? { scale: 1.05, y: -4 } : {}} whileTap={phase === 'playing' ? { scale: 0.95 } : {}} onClick={() => toggle(item.id)} className={`relative py-5 px-4 rounded-2xl font-black text-xl tracking-[0.2em] transition-all duration-300 shadow-xl overflow-hidden ${isExp ? `bg-gradient-to-br ${CARD_COLORS[id % CARD_COLORS.length]} text-white` : sel ? 'bg-emerald-500 text-white border-2 border-white/40 shadow-emerald-500/40' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'}`}>
                                            {item.text}
                                            {sel && !isExp && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2"><CheckCircle2 size={16} className="text-white drop-shadow-md" /></motion.div>}
                                        </motion.button>
                                    );
                                })}
                            </div>
                            <div className="mt-8 flex items-center gap-2 px-6 py-2 bg-white/5 rounded-full border border-white/10"><Sparkles size={14} className="text-violet-400" /><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isExp ? 'DİKKATLE İNCELE!' : `İÇİNDE "${target}" OLANLARI SEÇ!`}</p></div>
                        </motion.div>
                    )}

                    {feedbackState && (
                        <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center"><h2 className={`text-5xl font-black ${feedbackState.correct ? 'text-emerald-400' : 'text-red-400'} drop-shadow-2xl italic tracking-tighter`}>{feedbackState.correct ? 'HARİKA HIZ!' : 'DAHA HIZLI!'}</h2><GameFeedbackBanner feedback={feedbackState} /></motion.div>
                    )}

                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-violet-500 to-indigo-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-violet-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Kelime Avcısı!' : 'Güzel Deneme!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Hızlı tarama ve ortografik farkındalık becerin tek kelimeyle muazzam!' : 'Harfleri daha hızlı taramak için odaklanmanı artırmalısın!'}</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm font-bold">Skor</p><p className="text-3xl font-black text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm font-bold">Seviye</p><p className="text-3xl font-black text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WordHuntGame;
