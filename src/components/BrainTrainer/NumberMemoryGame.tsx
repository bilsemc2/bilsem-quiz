import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon,
    ChevronLeft, Zap, Heart,
    Volume2, Headphones, Sparkles
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
const GAME_ID = 'sayi-hafiza';

const NUMBER_SOUNDS: Record<number, string> = {
    0: '/mp3/rakamlar/0-sifir.mp3', 1: '/mp3/rakamlar/1-bir.mp3', 2: '/mp3/rakamlar/2-iki.mp3', 3: '/mp3/rakamlar/3-uc.mp3', 4: '/mp3/rakamlar/4-dort.mp3',
    5: '/mp3/rakamlar/5-bes.mp3', 6: '/mp3/rakamlar/6-alti.mp3', 7: '/mp3/rakamlar/7-yedi.mp3', 8: '/mp3/rakamlar/8-sekiz.mp3', 9: '/mp3/rakamlar/9-dokuz.mp3',
};

type Phase = 'welcome' | 'listening' | 'question' | 'feedback' | 'game_over' | 'victory';
interface Question { text: string; answer: number | string; options: (number | string)[]; type: 'number' | 'order' | 'sum' | 'max'; }

const NumberMemoryGame: React.FC = () => {
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
    const [numberSequence, setNumberSequence] = useState<number[]>([]);
    const [currentPlayIndex, setCurrentPlayIndex] = useState(-1);
    const [question, setQuestion] = useState<Question | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const playSequence = useCallback(async (seq: number[]) => {
        setPhase('listening');
        for (let i = 0; i < seq.length; i++) {
            await new Promise(r => setTimeout(r, 600));
            setCurrentPlayIndex(i);
            await new Promise((resolve) => {
                if (audioRef.current) audioRef.current.pause();
                const a = new Audio(NUMBER_SOUNDS[seq[i]]); audioRef.current = a; a.onended = () => resolve(null); a.onerror = () => resolve(null); a.play().catch(() => resolve(null));
            });
            await new Promise(r => setTimeout(r, 400));
        }
        setCurrentPlayIndex(-1); await new Promise(r => setTimeout(r, 500));

        const type = level <= 3 ? 'number' as const : pick(['number', 'order', 'sum', 'max'] as const);
        let qText = '', qAns: number | string = 0, qOpts: (number | string)[] = [];
        if (type === 'number') { qText = 'Duyduğun rakamlardan hangisi dizide vardı?'; qAns = seq[Math.floor(Math.random() * seq.length)]; qOpts = [qAns]; while (qOpts.length < 4) { const r = Math.floor(Math.random() * 10); if (!qOpts.includes(r)) qOpts.push(r); } }
        else if (type === 'order') { const idx = Math.floor(Math.random() * seq.length); qText = `${idx + 1}. sırada hangi rakamı duydun?`; qAns = seq[idx]; qOpts = [qAns]; while (qOpts.length < 4) { const r = Math.floor(Math.random() * 10); if (!qOpts.includes(r)) qOpts.push(r); } }
        else if (type === 'sum') { qText = 'Duyduğun ilk ve son rakamın toplamı kaçtır?'; qAns = seq[0] + seq[seq.length - 1]; qOpts = [qAns]; while (qOpts.length < 4) { const r = Math.floor(Math.random() * 20); if (!qOpts.includes(r)) qOpts.push(r); } }
        else if (type === 'max') { qText = 'Duyduğunuz en büyük rakam hangisiydi?'; qAns = Math.max(...seq); qOpts = [qAns]; while (qOpts.length < 4) { const r = Math.floor(Math.random() * 10); if (!qOpts.includes(r)) qOpts.push(r); } }

        setQuestion({ text: qText, answer: qAns, options: qOpts.sort(() => Math.random() - 0.5), type });
        setPhase('question');
    }, [level]);

    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    const startLevel = useCallback((lvl: number) => {
        const len = Math.min(3 + Math.floor(lvl / 4), 7);
        const seq = Array.from({ length: len }, () => Math.floor(Math.random() * 10));
        setNumberSequence(seq); setSelectedAnswer(null); playSound('slide');
        playSequence(seq);
    }, [playSequence, playSound]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0); setPhase('welcome'); setScore(0); setLives(INITIAL_LIVES); setLevel(1); setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false; startLevel(1);
    }, [startLevel, examMode, examTimeLimit]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart(); }, [location.state, examMode, phase, handleStart]);

    useEffect(() => {
        if ((phase === 'listening' || phase === 'question' || phase === 'feedback') && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

    const handleAnswer = (val: number | string) => {
        if (phase !== 'question' || !!feedbackState) return;
        setSelectedAnswer(val); const correct = val === question?.answer;
        if (correct) {
            playSound('correct'); showFeedback(true); setScore(s => s + 30 + level * 5);
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
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Headphones size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">Sayı Hafızası</h1>
                    <p className="text-slate-300 mb-8 text-lg">Sesli olarak okunan rakamları dikkatle dinle, zihninde tut ve soruları yanıtlayarak hafızanı test et!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-indigo-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Rakamların <strong>sesli okunuşunu</strong> pür dikkat dinle</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-indigo-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Dinleme bittikten sonra sorulan mantıksal soruyu yanıtla</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-indigo-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Dizideki rakamları, <strong>sıralarını ve büyüklüklerini</strong> aklında tutmaya çalış</span></li>
                        </ul>
                    </div>
                    <div className="bg-indigo-500/10 text-indigo-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-indigo-500/30 font-bold uppercase tracking-widest">TUZÖ 5.4.1 İşitsel Sayı Dizisi & Çalışma Belleği</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase === 'listening' || phase === 'question' || phase === 'feedback') && (
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
                    {phase === 'listening' && (
                        <motion.div key="listening" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="flex flex-col items-center gap-8">
                            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-32 h-32 bg-indigo-500/20 rounded-full flex items-center justify-center border-4 border-indigo-400/50 shadow-2xl"><Volume2 size={48} className="text-indigo-400" /></motion.div>
                            <h2 className="text-3xl font-black text-indigo-300">DİKKATLE DİNLE!</h2>
                            <div className="flex gap-3">
                                {numberSequence.map((_, i) => (
                                    <motion.div key={i} animate={i === currentPlayIndex ? { scale: 1.2, backgroundColor: 'rgba(99, 102, 241, 0.4)' } : {}} className={`w-4 h-4 rounded-full border border-white/20 ${i < currentPlayIndex ? 'bg-indigo-500' : 'bg-white/5'}`} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {phase === 'question' && !feedbackState && (
                        <motion.div key="question" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl flex flex-col items-center gap-8">
                            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 shadow-3xl text-center w-full">
                                <span className="text-xs font-black uppercase text-white/30 tracking-widest mb-4 block">SORU</span>
                                <h3 className="text-2xl font-black text-white leading-relaxed">{question?.text}</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full">
                                {question?.options.map(opt => (
                                    <motion.button key={opt} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => handleAnswer(opt)} className={`p-6 rounded-3xl font-black text-2xl transition-all shadow-xl ${selectedAnswer === opt ? (opt === question.answer ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white') : 'bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:border-indigo-500/50'}`}>
                                        {opt}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {feedbackState && (
                        <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center"><h2 className={`text-5xl font-black ${feedbackState.correct ? 'text-emerald-400' : 'text-red-400'} drop-shadow-2xl italic tracking-tighter`}>{feedbackState.correct ? 'KESKİN KULAKLAR! 🎧' : 'DİKKAT!'}</h2><GameFeedbackBanner feedback={feedbackState} /></motion.div>
                    )}

                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-indigo-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ İşitsel Deha!' : 'Harika!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'İşitsel hafıza ve işleme hızın tek kelimeyle mükemmel!' : 'Duyduğun rakamları zihninde daha iyi tutmak için odaklanmalısın!'}</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm font-bold">Skor</p><p className="text-3xl font-black text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm font-bold">Seviye</p><p className="text-3xl font-black text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NumberMemoryGame;
