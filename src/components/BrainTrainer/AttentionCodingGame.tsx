import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Heart, Zap, ChevronLeft,
    CheckCircle2, Code2, Sparkles,
    Timer as TimerIcon,
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
const GAME_ID = 'dikkat-kodlama';

type ShapeType = 'circle' | 'square' | 'triangle' | 'plus' | 'star' | 'diamond' | 'hexagon';
interface KeyMapping { number: number; shape: ShapeType; }
interface TestItem { id: string; targetNumber: number; userShape: ShapeType | null; }
type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

const ALL_SHAPES: ShapeType[] = ['circle', 'square', 'triangle', 'plus', 'star', 'diamond', 'hexagon'];
const SHAPE_LABELS: Record<ShapeType, string> = { circle: 'Daire', square: 'Kare', triangle: 'Üçgen', plus: 'Artı', star: 'Yıldız', diamond: 'Elmas', hexagon: 'Altıgen' };

const ShapeIcon: React.FC<{ type: ShapeType; className?: string; size?: number; strokeWidth?: number }> = ({ type, className = 'text-slate-300', size = 24, strokeWidth = 2 }) => {
    const props = { width: size, height: size, stroke: 'currentColor', strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className };
    switch (type) {
        case 'circle': return <svg viewBox="0 0 24 24" {...props}><circle cx="12" cy="12" r="10" /></svg>;
        case 'square': return <svg viewBox="0 0 24 24" {...props}><rect x="3" y="3" width="18" height="18" rx="2" /></svg>;
        case 'triangle': return <svg viewBox="0 0 24 24" {...props}><path d="M12 3L22 20H2L12 3Z" /></svg>;
        case 'plus': return <svg viewBox="0 0 24 24" {...props}><path d="M12 5V19M5 12H19" strokeWidth={strokeWidth + 1} /></svg>;
        case 'star': return <svg viewBox="0 0 24 24" {...props}><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>;
        case 'diamond': return <svg viewBox="0 0 24 24" {...props}><path d="M12 2L22 12L12 22L2 12L12 2Z" /></svg>;
        case 'hexagon': return <svg viewBox="0 0 24 24" {...props}><path d="M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z" /></svg>;
        default: return null;
    }
};

const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};

const AttentionCodingGame: React.FC = () => {
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
    const [keyMappings, setKeyMappings] = useState<KeyMapping[]>([]);
    const [items, setItems] = useState<TestItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const startLevel = useCallback((lvl: number) => {
        const shapeCount = lvl <= 5 ? 5 : lvl <= 10 ? 6 : 7;
        const shapes = shuffle(ALL_SHAPES).slice(0, shapeCount);
        const mappings = shapes.map((shape, i) => ({ number: i + 1, shape }));
        setKeyMappings(mappings);

        const itemCount = lvl <= 3 ? 5 : lvl <= 7 ? 6 : lvl <= 12 ? 7 : lvl <= 16 ? 8 : 9;
        const newItems: TestItem[] = Array.from({ length: itemCount }, (_, i) => ({ id: `${lvl}-${i}`, targetNumber: Math.floor(Math.random() * shapeCount) + 1, userShape: null }));
        setItems(newItems); setCurrentIndex(0); playSound('slide');
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

    const handleAnswer = (shape: ShapeType) => {
        if (phase !== 'playing' || !!feedbackState) return;
        const currentItem = items[currentIndex];
        const correctShape = keyMappings.find(m => m.number === currentItem.targetNumber)?.shape;
        const isCorrect = shape === correctShape;

        if (isCorrect) {
            playSound('pop'); setScore(s => s + 20 + level * 5);
            if (currentIndex === items.length - 1) {
                playSound('correct'); showFeedback(true);
                setTimeout(() => {
                    dismissFeedback();
                    if (level >= MAX_LEVEL) setPhase('victory');
                    else { const nl = level + 1; setLevel(nl); setTimeLeft(p => Math.min(p + 10, TIME_LIMIT)); startLevel(nl); }
                }, 1000);
            } else setCurrentIndex(p => p + 1);
        } else {
            playSound('incorrect'); setLives(l => { const nl = l - 1; if (nl <= 0) setPhase('game_over'); return nl; });
            showFeedback(false); setTimeout(dismissFeedback, 1000);
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
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Code2 size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-blue-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">Dikkat Kodlama</h1>
                    <p className="text-slate-300 mb-8 text-lg">Sayılarla şekilleri eşleştir, zihnindeki kodları en hızlı şekilde çözerek zirveye ulaş!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-blue-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-blue-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Üstteki tablodan her <strong>sayıya karşılık gelen şekli</strong> bul</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-blue-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Sorulan sayıya ait doğru şekli aşağıdaki butonlardan seç</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-blue-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Tüm eşleştirmeleri <strong>hata yapmadan</strong> ve hızla tamamla</span></li>
                        </ul>
                    </div>
                    <div className="bg-blue-500/10 text-blue-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-blue-500/30 font-bold uppercase tracking-widest">TUZÖ 5.6.1 Dikkat Kodlama & Sembol Eşleştirme</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white relative overflow-hidden flex flex-col">
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
                        <motion.div key="game" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="w-full max-w-4xl space-y-8">
                            <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] p-6 border border-white/10 shadow-3xl">
                                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                                    {keyMappings.map(m => (
                                        <div key={m.number} className="bg-white/5 rounded-2xl p-3 border border-white/10 flex flex-col items-center gap-2 shadow-inner group hover:bg-white/10 transition-colors">
                                            <span className="text-2xl font-black text-blue-400">{m.number}</span>
                                            <div className="h-px w-8 bg-white/10" />
                                            <ShapeIcon type={m.shape} className="text-white group-hover:scale-110 transition-transform" size={24} strokeWidth={2.5} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-6">
                                <span className="text-xs font-black uppercase text-white/30 tracking-widest">SIRADAKİ SORU</span>
                                <div className="flex items-center gap-4">
                                    {items.map((item, idx) => (
                                        <div key={item.id} className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${idx === currentIndex ? 'bg-blue-500 border-blue-400 scale-125 shadow-2xl' : idx < currentIndex ? 'bg-emerald-500/20 border-emerald-500/40 opacity-50' : 'bg-white/5 border-white/10 opacity-30'}`}>
                                            <span className="text-2xl font-black">{item.targetNumber}</span>
                                            {idx < currentIndex && <CheckCircle2 size={12} className="text-emerald-400 mt-1" />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-4">
                                {ALL_SHAPES.filter(s => keyMappings.some(m => m.shape === s)).map(shape => (
                                    <motion.button key={shape} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => handleAnswer(shape)} className="aspect-square bg-white/10 border border-white/10 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-xl hover:bg-white/20 hover:border-blue-500/50 transition-all group">
                                        <ShapeIcon type={shape} className="text-white group-hover:scale-110 transition-transform" size={32} strokeWidth={2.5} />
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">{SHAPE_LABELS[shape]}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {feedbackState && (
                        <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center"><h2 className={`text-5xl font-black ${feedbackState.correct ? 'text-emerald-400' : 'text-red-400'} drop-shadow-2xl italic tracking-tighter`}>{feedbackState.correct ? 'KOD ÇÖZÜLDÜ!' : 'DİKKAT!'}</h2><GameFeedbackBanner feedback={feedbackState} /></motion.div>
                    )}

                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-blue-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Usta Kodlayıcı!' : 'Harika!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Hızlı eşleştirme ve görsel tarama becerin tek kelimeyle mükemmel!' : 'Sayılarla şekilleri eşleştirirken biraz daha hızlanmalısın!'}</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm font-bold">Skor</p><p className="text-3xl font-black text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm font-bold">Seviye</p><p className="text-3xl font-black text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AttentionCodingGame;
