import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star,
    ChevronLeft, Zap,
    TrendingUp, Sparkles, Heart, Timer as TimerIcon
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
const GAME_ID = 'sayi-dizileri';

type PatternType = 'arithmetic' | 'geometric' | 'fibonacci' | 'square' | 'cube' | 'prime' | 'alternating' | 'doubleStep';
interface Question { sequence: number[]; answer: number; options: number[]; patternType: PatternType; patternDescription: string; }
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

const NumberSequenceGame: React.FC = () => {
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
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const generatePattern = useCallback((lvl: number): Question => {
        const types: PatternType[] = lvl <= 3 ? ['arithmetic', 'geometric'] : lvl <= 6 ? ['arithmetic', 'geometric', 'square', 'fibonacci'] : lvl <= 10 ? ['arithmetic', 'geometric', 'square', 'fibonacci', 'cube', 'alternating'] : ['arithmetic', 'geometric', 'square', 'fibonacci', 'cube', 'alternating', 'prime', 'doubleStep'];
        const type = types[Math.floor(Math.random() * types.length)];
        const len = Math.min(4 + Math.floor(lvl / 5), 6);
        let seq: number[] = [], ans = 0, desc = '';

        switch (type) {
            case 'arithmetic': { const s = Math.floor(Math.random() * 10) + 1; const d = Math.floor(Math.random() * (lvl + 2)) + 1; seq = Array.from({ length: len }, (_, i) => s + i * d); ans = s + len * d; desc = `+${d}`; break; }
            case 'geometric': { const s = Math.floor(Math.random() * 3) + 1; const r = lvl <= 5 ? 2 : Math.floor(Math.random() * 2) + 2; seq = Array.from({ length: len }, (_, i) => s * Math.pow(r, i)); ans = s * Math.pow(r, len); desc = `x${r}`; break; }
            case 'fibonacci': { let a = Math.floor(Math.random() * 3) + 1, b = Math.floor(Math.random() * 3) + 1; seq = [a, b]; for (let i = 2; i < len; i++) seq.push(seq[i - 1] + seq[i - 2]); ans = seq[len - 1] + seq[len - 2]; desc = 'Toplayarak'; break; }
            case 'square': { const s = Math.floor(Math.random() * 3) + 1; seq = Array.from({ length: len }, (_, i) => Math.pow(s + i, 2)); ans = Math.pow(s + len, 2); desc = 'Kareler'; break; }
            case 'cube': { const s = Math.floor(Math.random() * 2) + 1; seq = Array.from({ length: len }, (_, i) => Math.pow(s + i, 3)); ans = Math.pow(s + len, 3); desc = 'Küpler'; break; }
            case 'alternating': { const s = Math.floor(Math.random() * 10) + 5; const d1 = Math.floor(Math.random() * 4) + 1, d2 = Math.floor(Math.random() * 3) + 1; seq = [s]; for (let i = 1; i < len; i++) seq.push(i % 2 === 1 ? seq[i - 1] + d1 : seq[i - 1] - d2); ans = len % 2 === 1 ? seq[len - 1] + d1 : seq[len - 1] - d2; desc = `+${d1}/-${d2}`; break; }
            case 'doubleStep': { const s = Math.floor(Math.random() * 5) + 1; seq = [s]; let d = 2; for (let i = 1; i < len; i++) { seq.push(seq[i - 1] + d); d += 1; } ans = seq[len - 1] + d; desc = 'Artan Fark'; break; }
            case 'prime': { const idx = Math.floor(Math.random() * (PRIMES.length - len - 1)); seq = PRIMES.slice(idx, idx + len); ans = PRIMES[idx + len]; desc = 'Asallar'; break; }
        }

        const opts = new Set<number>([ans]); while (opts.size < 4) opts.add(ans + (Math.floor(Math.random() * 20) - 10) || ans + 5);
        return { sequence: seq, answer: ans, options: Array.from(opts).sort(() => Math.random() - 0.5), patternType: type, patternDescription: desc };
    }, []);

    const startLevel = useCallback((lvl: number) => {
        setCurrentQuestion(generatePattern(lvl)); setSelectedAnswer(null); playSound('slide');
    }, [generatePattern, playSound]);

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

    const handleAnswer = (val: number) => {
        if (phase !== 'playing' || !!feedbackState) return;
        setSelectedAnswer(val); const correct = val === currentQuestion?.answer;
        if (correct) {
            playSound('correct'); showFeedback(true); setScore(s => s + 25 + level * 5);
            setTimeout(() => {
                dismissFeedback();
                if (level >= MAX_LEVEL) setPhase('victory');
                else { const nl = level + 1; setLevel(nl); setTimeLeft(p => Math.min(p + 15, TIME_LIMIT)); startLevel(nl); }
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
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><TrendingUp size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">Sayı Dizileri</h1>
                    <p className="text-slate-300 mb-8 text-lg">Sayılar arasındaki gizli kuralı keşfet, mantık zincirini tamamlayarak zekanı konuştur!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-emerald-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-emerald-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Verilen sayı dizisindeki <strong>mantıksal kuralı</strong> bul</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-emerald-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Soru işareti yerine gelmesi gereken sayıyı seçeneklerden seç</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-emerald-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Seviye arttıkça kurallar <strong>karmaşıklaşacak</strong>, dikkatli ol!</span></li>
                        </ul>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-emerald-500/30 font-bold uppercase tracking-widest">TUZÖ 5.3.1 Sayısal Mantık & Örüntü Tanıma</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 text-white relative overflow-hidden flex flex-col">
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
                        <motion.div key="game" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="w-full max-w-2xl space-y-12">
                            <div className="flex flex-col items-center gap-8">
                                <span className="text-xs font-black uppercase text-white/30 tracking-widest">SAYI DİZİSİ</span>
                                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                                    {currentQuestion?.sequence.map((n, i) => (
                                        <div key={i} className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 backdrop-blur-xl rounded-[1.5rem] border border-white/10 flex items-center justify-center shadow-xl group hover:bg-white/10 transition-colors">
                                            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{n}</span>
                                        </div>
                                    ))}
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/20 backdrop-blur-xl rounded-[1.5rem] border-2 border-emerald-400/50 flex items-center justify-center shadow-3xl animate-pulse">
                                        <span className="text-3xl font-black text-emerald-400">?</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {currentQuestion?.options.map(opt => (
                                    <motion.button key={opt} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => handleAnswer(opt)} className={`p-6 rounded-3xl font-black text-2xl transition-all shadow-xl group ${selectedAnswer === opt ? (opt === currentQuestion.answer ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white') : 'bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:border-emerald-500/50'}`}>
                                        {opt}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {feedbackState && (
                        <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center"><h2 className={`text-5xl font-black ${feedbackState.correct ? 'text-emerald-400' : 'text-red-400'} drop-shadow-2xl italic tracking-tighter`}>{feedbackState.correct ? 'MANTIKLI SEÇİM!' : 'DİKKAT!'}</h2><GameFeedbackBanner feedback={feedbackState} /></motion.div>
                    )}

                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-emerald-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Örüntü Ustası!' : 'Harika!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Sayı dizileri ve mantıksal örüntü tanıma becerin tek kelimeyle mükemmel!' : 'Sayılar arasındaki kuralları çözmek için biraz daha pratik yapmalısın!'}</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm font-bold">Skor</p><p className="text-3xl font-black text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm font-bold">Seviye</p><p className="text-3xl font-black text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NumberSequenceGame;
