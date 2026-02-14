import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Play, Trophy, Sparkles, Heart, Star, Timer as TimerIcon, Eye, RotateCw, Zap } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

// ─── Constants ───────────────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = 'rotasyon-matrisi';

type Stick = { color: string; isVertical: boolean; x: number; y: number; length: number; };
type Shape = { id: string; type: 'sticks'; rotation: number; sticks: Stick[]; };
interface GameOption { shape: Shape; isCorrect: boolean; }

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43', '#A29BFE', '#55E6C1', '#FD79A8', '#FAB1A0', '#00D2D3', '#54A0FF'];

const RotationMatrixGame: React.FC = () => {
    const { playSound } = useSound();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<'welcome' | 'playing' | 'gameover' | 'victory'>('welcome');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [sequence, setSequence] = useState<Shape[]>([]);
    const [targetIndex, setTargetIndex] = useState<number>(-1);
    const [options, setOptions] = useState<GameOption[]>([]);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [lives, setLives] = useState(INITIAL_LIVES);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const generateShape = useCallback((): Shape => {
        const num = 3 + Math.floor(Math.random() * 4), sticks: Stick[] = [];
        const ox = (Math.random() - 0.5) * 10, oy = (Math.random() - 0.5) * 10;
        for (let i = 0; i < num; i++) {
            const v = Math.random() > 0.5, c = COLORS[Math.floor(Math.random() * COLORS.length)];
            sticks.push({ color: c, isVertical: v, x: ox + (v ? (Math.random() - 0.5) * 44 : (Math.random() - 0.5) * 12), y: oy + (v ? (Math.random() - 0.5) * 12 : (Math.random() - 0.5) * 44), length: 45 + Math.random() * 45 });
        }
        sticks.push({ color: COLORS[Math.floor(Math.random() * COLORS.length)], isVertical: Math.random() > 0.5, x: 22 + Math.random() * 8, y: -22 - Math.random() * 8, length: 35 });
        return { id: `inf-${Math.random().toString(36).slice(2, 11)}`, type: 'sticks', rotation: 0, sticks };
    }, []);

    const setupLevel = useCallback(() => {
        const steps = [45, 90, 135], step = steps[Math.floor(Math.random() * steps.length)];
        const base = generateShape(), newSeq: Shape[] = [];
        for (let i = 0; i < 9; i++) newSeq.push({ ...base, rotation: (i * step) % 360, id: `step-${i}-${Math.random()}` });
        const target = Math.floor(Math.random() * 9); setSequence(newSeq); setTargetIndex(target);
        const correct = newSeq[target], corrRot = Math.round(correct.rotation % 360);
        const distractors: GameOption[] = [], used = [corrRot], rots = [0, 45, 90, 135, 180, 225, 270, 315];
        while (distractors.length < 3) {
            const r = rots[Math.floor(Math.random() * rots.length)];
            if (!used.includes(r)) { distractors.push({ shape: { ...base, rotation: r, id: `w-${distractors.length}-${Math.random()}` }, isCorrect: false }); used.push(r); }
        }
        setOptions([...distractors, { shape: correct, isCorrect: true }].sort(() => Math.random() - 0.5));
    }, [generateShape]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing'); setScore(0); setLevel(1); setLives(INITIAL_LIVES);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        setupLevel(); playSound('slide');
    }, [setupLevel, playSound, examMode, examTimeLimit]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart(); }, [location.state, phase, handleStart, examMode]);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setPhase('gameover'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

    const handleSelect = (opt: GameOption) => {
        if (phase !== 'playing' || feedbackState) return;
        const correct = opt.isCorrect; showFeedback(correct); playSound(correct ? 'correct' : 'incorrect');
        setTimeout(() => {
            dismissFeedback();
            if (correct) {
                setScore(s => s + 10 * level);
                if (level >= MAX_LEVEL) setPhase('victory');
                else { setLevel(l => l + 1); setupLevel(); }
            } else {
                setLives(l => {
                    const nl = l - 1;
                    if (nl <= 0) setTimeout(() => setPhase('gameover'), 500);
                    else setupLevel();
                    return nl;
                });
            }
        }, 1500);
    };

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(level >= 5 || phase === 'victory', score, MAX_LEVEL * 100, duration);
            navigate("/atolyeler/sinav-simulasyonu/devam"); return;
        }
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: duration, metadata: { level_reached: level, victory: phase === 'victory' } });
    }, [phase, score, level, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => { if (phase === 'gameover' || phase === 'victory') handleFinish(); }, [phase, handleFinish]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    const ShapeSVG = ({ shape, size }: { shape: Shape; size: number }) => {
        const c = size / 2, w = 8;
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <motion.g animate={{ rotate: shape.rotation }} style={{ originX: "50%", originY: "50%" }}>
                    {shape.sticks.map((s, i) => (
                        <rect key={i} x={c + s.x - (s.isVertical ? w / 2 : s.length / 2)} y={c + s.y - (s.isVertical ? s.length / 2 : w / 2)} width={s.isVertical ? w : s.length} height={s.isVertical ? s.length : w} fill={s.color} rx={w / 2} stroke="white" strokeWidth="1" />
                    ))}
                    <circle cx={c} cy={c} r="3" fill="white" opacity="0.4" />
                </motion.g>
            </svg>
        );
    };

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0], rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}><RotateCw size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-indigo-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent">Rotasyon Matrisi</h1>
                    <p className="text-slate-300 mb-8 text-lg">Şekillerin dönüş kuralını keşfet ve eksik parçayı bul. Uzamsal zekanı galaksiler arası bir teste sok!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-indigo-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>3x3 Izgaradaki şekillerin <strong>nasıl döndüğünü</strong> anla</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-indigo-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Soru işaretli yere gelmesi gereken <strong>doğru şekli</strong> bul</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-indigo-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>45°, 90° ve 135°'lik dönüş kurallarına <strong>odaklan</strong></span></li>
                        </ul>
                    </div>
                    <div className="bg-indigo-500/10 text-indigo-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-indigo-500/30 font-bold uppercase tracking-widest">TUZÖ 4.1.1 Uzamsal Akıl Yürütme</div>
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
                    {(phase === 'playing') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-950'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)' }}><Zap className="text-purple-400" size={18} /><span className="font-bold text-purple-400">Seviye {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {phase === 'playing' && (
                        <motion.div key="game" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 border border-white/10 shadow-3xl text-center">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6 flex items-center justify-center gap-2"><Eye size={16} className="text-indigo-400" /> Matrisi Analiz Et</p>
                                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto p-4 bg-white/5 rounded-[32px] border border-white/5 shadow-inner">
                                    {sequence.map((s, i) => (
                                        <div key={s.id} className="aspect-square rounded-3xl flex items-center justify-center relative transition-colors shadow-lg" style={{ background: i === targetIndex ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)', border: i === targetIndex ? '2px dashed rgba(139, 92, 246, 0.5)' : '1px solid rgba(255,255,255,0.05)' }}>
                                            <span className="absolute top-1 left-2 text-[8px] font-bold text-white/20 select-none">{i + 1}</span>
                                            {i === targetIndex ? <div className="text-purple-400 font-black text-3xl animate-pulse">?</div> : <ShapeSVG shape={s} size={80} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 border border-white/10 shadow-3xl">
                                <h2 className="text-2xl font-black text-center mb-8 flex items-center justify-center gap-3">Doğru Şekli Seç 🧩</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {options.map((opt) => (
                                        <motion.button key={opt.shape.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleSelect(opt)} className="aspect-square rounded-[32px] flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-all shadow-xl" style={{ boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.05)' }}>
                                            <ShapeSVG shape={opt.shape} size={100} />
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'gameover' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-indigo-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Uzay Gezgini!' : 'Harika!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Şekillerin gizli dönüş kurallarını çözmedeki ustalığın tek kelimeyle muazzam!' : 'Farklı açılardaki dönüşleri daha hızlı algılamak için pratik yapmaya devam et.'}</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm font-bold">Skor</p><p className="text-3xl font-black text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm font-bold">Seviye</p><p className="text-3xl font-black text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default RotationMatrixGame;
