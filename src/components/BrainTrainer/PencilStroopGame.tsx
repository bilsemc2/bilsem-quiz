import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, ChevronLeft, Zap, Pencil, Heart, Sparkles, Timer as TimerIcon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useSound } from '../../hooks/useSound';

const COLORS = [
    { name: 'Kırmızı', hex: '#FF5252' }, { name: 'Mavi', hex: '#4285F4' }, { name: 'Yeşil', hex: '#0F9D58' }, { name: 'Sarı', hex: '#FFC107' },
    { name: 'Mor', hex: '#9C27B0' }, { name: 'Turuncu', hex: '#FF9800' }, { name: 'Pembe', hex: '#E91E63' }
];

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = 'kalem-stroop';

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';
interface Round { pencilColor: string; word: string; correctAnswer: string; options: string[]; }

const PencilStroopGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [currentRound, setCurrentRound] = useState<Round | null>(null);
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const generateRound = useCallback((): Round => {
        const colorIdx = Math.floor(Math.random() * COLORS.length);
        const pencilColor = COLORS[colorIdx].hex;
        const correctAnswer = COLORS[colorIdx].name;
        let wordIdx; do { wordIdx = Math.floor(Math.random() * COLORS.length); } while (wordIdx === colorIdx);
        const word = COLORS[wordIdx].name;
        const opts = new Set<string>([correctAnswer]); while (opts.size < 4) opts.add(COLORS[Math.floor(Math.random() * COLORS.length)].name);
        return { pencilColor, word, correctAnswer, options: Array.from(opts).sort(() => Math.random() - 0.5) };
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
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-purple-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-violet-400 to-purple-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Pencil size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-violet-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">Kalem Stroop</h1>
                    <p className="text-slate-300 mb-8 text-lg">Kalemin rengine odaklan, üzerindeki yazıya ALDANMA! Zihinsel hızını ve dikkatini kanıtla.</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-violet-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Ekrandaki <strong>kalemin rengine</strong> bak, içindeki yazıya aldanma</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Kalemin gerçek rengini aşağıdaki seçeneklerden bul</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Zihinsel çelişkiyi yen ve <strong>en doğru kararı</strong> en hızlı şekilde ver</span></li>
                        </ul>
                    </div>
                    <div className="bg-violet-500/10 text-violet-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-violet-500/30 font-bold uppercase tracking-widest">TUZÖ 5.1.1 Renk-Kelime Stroop & Bilişsel Esneklik</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-purple-950 text-white relative overflow-hidden flex flex-col">
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
                        <motion.div key="game" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="w-full max-w-xl space-y-12">
                            <div className="flex flex-col items-center gap-8">
                                <motion.div key={currentRound?.pencilColor} initial={{ rotate: -15, y: 20 }} animate={{ rotate: 0, y: 0 }} className="relative">
                                    <Pencil size={180} style={{ color: currentRound?.pencilColor }} className="drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] filter" />
                                    <div className="absolute inset-x-0 top-[40%] text-center pointer-events-none origin-center transform -rotate-45">
                                        <span className="text-2xl font-black text-slate-900 mix-blend-overlay uppercase tracking-[0.2em]">{currentRound?.word}</span>
                                    </div>
                                </motion.div>
                                <div className="bg-white/5 backdrop-blur-xl px-12 py-4 rounded-[2.5rem] border border-white/10 shadow-3xl">
                                    <span className="text-sm font-black text-white/40 tracking-widest uppercase">KALEMİN RENGİ NE?</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                {currentRound?.options.map(opt => (
                                    <motion.button key={opt} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => handleAnswer(opt)} className="p-6 bg-white/10 border border-white/10 rounded-3xl font-black text-xl hover:bg-white/20 hover:border-violet-500/50 shadow-xl transition-all group">
                                        <span className="text-white group-hover:text-violet-300">{opt}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {feedbackState && (
                        <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center"><h2 className={`text-5xl font-black ${feedbackState.correct ? 'text-emerald-400' : 'text-red-400'} drop-shadow-2xl italic tracking-tighter`}>{feedbackState.correct ? 'KESKİN DİKKAT! ✏️' : 'DİKKAT!'}</h2><GameFeedbackBanner feedback={feedbackState} /></motion.div>
                    )}

                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-violet-500 to-purple-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-violet-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Renklerin Ustası!' : 'Harika!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Kelime-renk çatışmasını yönetme ve bilişsel hızın tek kelimeyle mükemmel!' : 'Kalemlerin rengi ile üzerindeki yazıları ayırmak için biraz daha odaklanmalısın!'}</p>
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

export default PencilStroopGame;
