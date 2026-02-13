import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon,
    CheckCircle2, XCircle, ChevronLeft, Zap, Eye, Shapes, Heart, Sparkles,
    Circle, Square, Triangle, Hexagon, Diamond, Pentagon, Octagon,
    type LucideIcon
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useSound } from '../../hooks/useSound';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// ─── Constants ───────────────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = 'sekil-hafizasi';

const SHAPE_DEFS: { name: string; Icon: LucideIcon; fill?: boolean }[] = [
    { name: 'Yıldız', Icon: Star, fill: true },
    { name: 'Daire', Icon: Circle, fill: true },
    { name: 'Kare', Icon: Square, fill: true },
    { name: 'Üçgen', Icon: Triangle, fill: true },
    { name: 'Altıgen', Icon: Hexagon, fill: true },
    { name: 'Elmas', Icon: Diamond, fill: true },
    { name: 'Beşgen', Icon: Pentagon, fill: true },
    { name: 'Sekizgen', Icon: Octagon, fill: true },
    { name: 'Kalp', Icon: Heart, fill: true },
];
const COLORS = [
    { hex: '#ef4444', name: 'Kırmızı' }, { hex: '#3b82f6', name: 'Mavi' },
    { hex: '#22c55e', name: 'Yeşil' }, { hex: '#f59e0b', name: 'Sarı' },
    { hex: '#a855f7', name: 'Mor' }, { hex: '#ec4899', name: 'Pembe' },
    { hex: '#f97316', name: 'Turuncu' }, { hex: '#06b6d4', name: 'Turkuaz' },
    { hex: '#14b8a6', name: 'Deniz Yeşili' }, { hex: '#8b5cf6', name: 'Lila' },
    { hex: '#e11d48', name: 'Bordo' }, { hex: '#84cc16', name: 'Lime' },
    { hex: '#0ea5e9', name: 'Gök Mavi' }, { hex: '#d946ef', name: 'Fuşya' },
];

interface ShapeColor { shapeName: string; Icon: LucideIcon; fill: boolean; color: string; colorName: string; }
type QuestionType = 'color' | 'symbol';
interface Question { type: QuestionType; query: string; correctAnswer: string; options: string[]; targetShapeName?: string; }
type Phase = 'welcome' | 'memorize' | 'question' | 'feedback' | 'game_over' | 'victory';

const SymbolMatchGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback } = useGameFeedback({ duration: 2000 });
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [symbolColors, setSymbolColors] = useState<ShapeColor[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [memorizeCountdown, setMemorizeCountdown] = useState(5);
    const [streak, setStreak] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const getSymbolCount = useCallback(() => (level <= 6 ? 4 : level <= 13 ? 5 : 6), [level]);
    const getMemorizeTime = useCallback(() => (level <= 5 ? 5 : level <= 10 ? 4 : level <= 15 ? 3 : 2), [level]);

    const generateSymbolColors = useCallback(() => {
        const count = getSymbolCount();
        const ss = [...SHAPE_DEFS].sort(() => Math.random() - 0.5).slice(0, count);
        const cc = [...COLORS].sort(() => Math.random() - 0.5).slice(0, count);
        return ss.map((s, i) => ({ shapeName: s.name, Icon: s.Icon, fill: !!s.fill, color: cc[i].hex, colorName: cc[i].name }));
    }, [getSymbolCount]);

    const generateQuestion = useCallback((pairs: ShapeColor[]): Question => {
        const t: QuestionType = Math.random() > 0.5 ? 'color' : 'symbol';
        const target = pairs[Math.floor(Math.random() * pairs.length)];
        const others = pairs.filter(p => p !== target);
        if (t === 'color') {
            const corr = target.shapeName; const wrongs = others.map(p => p.shapeName).slice(0, 3);
            return { type: 'color', query: `${target.colorName} renkteki şekil hangisiydi?`, correctAnswer: corr, options: [corr, ...wrongs].sort(() => Math.random() - 0.5) };
        } else {
            const corr = target.colorName; const wrongs = others.map(p => p.colorName).slice(0, 3);
            return { type: 'symbol', query: `${target.shapeName} hangi renkteydi?`, correctAnswer: corr, options: [corr, ...wrongs].sort(() => Math.random() - 0.5), targetShapeName: target.shapeName };
        }
    }, []);

    const startRound = useCallback(() => {
        const pairs = generateSymbolColors(); setSymbolColors(pairs);
        const time = getMemorizeTime(); setMemorizeCountdown(time);
        setPhase('memorize'); setSelectedAnswer(null);
    }, [generateSymbolColors, getMemorizeTime]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('memorize'); setScore(0); setLevel(1); setLives(INITIAL_LIVES); setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        setStreak(0); startTimeRef.current = Date.now(); hasSavedRef.current = false;
        startRound(); playSound('slide');
    }, [startRound, playSound, examMode, examTimeLimit]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart(); }, [location.state, phase, handleStart, examMode]);

    useEffect(() => {
        if (phase !== 'welcome' && phase !== 'game_over' && phase !== 'victory' && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

    // Body Scroll Lock
    useEffect(() => {
        const isActive = phase === 'memorize' || phase === 'question' || phase === 'feedback';
        if (isActive) {
            window.scrollTo(0, 0);
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
            document.documentElement.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            document.documentElement.style.overflow = '';
        };
    }, [phase]);

    useEffect(() => {
        if (phase === 'memorize' && memorizeCountdown > 0) {
            const t = setTimeout(() => setMemorizeCountdown(c => c - 1), 1000);
            return () => clearTimeout(t);
        } else if (phase === 'memorize' && memorizeCountdown === 0) {
            setCurrentQuestion(generateQuestion(symbolColors)); setPhase('question');
        }
    }, [phase, memorizeCountdown, symbolColors, generateQuestion]);

    const handleAnswer = (ans: string) => {
        if (phase !== 'question' || selectedAnswer !== null) return;
        setSelectedAnswer(ans);
        const correct = ans === currentQuestion?.correctAnswer;
        showFeedback(correct); playSound(correct ? 'correct' : 'incorrect');
        setPhase('feedback');
        if (correct) { setStreak(p => p + 1); setScore(p => p + 100 + level * 10 + streak * 15); }
        else setStreak(0);
        setTimeout(() => {
            if (correct) {
                if (level >= MAX_LEVEL) setPhase('victory');
                else { setLevel(l => l + 1); startRound(); }
            } else {
                const nl = lives - 1;
                setLives(nl);
                if (nl <= 0) setPhase('game_over');
                else startRound();
            }
        }, 1800);
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

    useEffect(() => { if (phase === 'game_over' || phase === 'victory') handleFinish(); }, [phase, handleFinish]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 bg-gradient-to-br from-violet-400 to-fuchsia-600 rounded-[40%] flex items-center justify-center mx-auto mb-6" style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}><Shapes size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-violet-300 via-pink-300 to-fuchsia-300 bg-clip-text text-transparent">Şekil Hafızası</h1>
                    <p className="text-slate-300 mb-8 text-lg">Şekillerin renklerini kısa sürede ezberle ve sorulan sorulara doğru cevap ver. Görsel çalışma belleğini test et!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-violet-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Ekrana gelen <strong>renkli şekilleri</strong> ezberle</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Sana sorulan <strong>şekli veya rengi</strong> bul</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Seviye ilerledikçe <strong>şekil sayısı artar</strong>, süre azalır!</span></li>
                        </ul>
                    </div>
                    <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full"><span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span><span className="text-[9px] font-bold text-violet-400">4.2.1 Görsel Çalışma Belleği</span></div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-violet-500 to-fuchsia-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-950 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.1) 100%)', border: '1px solid rgba(168, 85, 247, 0.3)' }}><Zap className="text-violet-400" size={18} /><span className="font-bold text-violet-400">Seviye {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {phase === 'memorize' && (
                        <motion.div key="memorize" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-8 w-full max-w-lg">
                            <div className="flex items-center justify-center gap-4">
                                <Eye className="w-8 h-8 text-violet-400" />
                                <span className="text-slate-400 text-xl font-medium">Ezberle:</span>
                                <motion.span key={memorizeCountdown} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-5xl font-black text-white">{memorizeCountdown}</motion.span>
                            </div>
                            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-10 border border-white/10 shadow-3xl">
                                <div className="flex justify-center gap-8 flex-wrap">
                                    {symbolColors.map((sc, idx) => {
                                        const ShapeComp = sc.Icon;
                                        return (
                                            <motion.div key={idx} initial={{ opacity: 0, scale: 0, rotate: -180 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: idx * 0.1, type: 'spring' }} className="flex flex-col items-center gap-2">
                                                <ShapeComp size={72} style={{ color: sc.color, filter: `drop-shadow(0 4px 12px ${sc.color}60)` }} fill={sc.fill ? sc.color : 'none'} strokeWidth={sc.fill ? 1 : 2} />
                                                <span className="text-xs font-bold text-white/40">{sc.shapeName}</span>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/5 p-0.5"><motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg" initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: getMemorizeTime(), ease: 'linear' }} /></div>
                        </motion.div>
                    )}
                    {(phase === 'question' || phase === 'feedback') && currentQuestion && (
                        <motion.div key="question" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="text-center space-y-8 w-full max-w-lg">
                            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 border border-white/10 shadow-3xl">
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">Zihin Sorusu</p>
                                <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight">{currentQuestion.query}</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {currentQuestion.options.map((opt, idx) => {
                                    const isSel = selectedAnswer === opt; const isCorr = opt === currentQuestion.correctAnswer;
                                    const showOk = phase === 'feedback' && isCorr; const showErr = phase === 'feedback' && isSel && !isCorr;
                                    const c = currentQuestion.type === 'symbol' ? COLORS.find(cl => cl.name === opt)?.hex || '#64748b' : undefined;
                                    // For 'color' type questions, find shape icon for each option
                                    const optShape = currentQuestion.type === 'color' ? SHAPE_DEFS.find(s => s.name === opt) : null;
                                    // For 'symbol' type questions, find the target shape icon for display
                                    const targetShape = currentQuestion.type === 'symbol' && currentQuestion.targetShapeName ? SHAPE_DEFS.find(s => s.name === currentQuestion.targetShapeName) : null;
                                    return (
                                        <motion.button key={idx} onClick={() => handleAnswer(opt)} disabled={phase !== 'question'} whileHover={phase === 'question' ? { scale: 1.05, y: -4 } : {}} whileTap={phase === 'question' ? { scale: 0.95 } : {}} className="relative aspect-[4/3] rounded-3xl font-bold text-2xl transition-all border-4 flex items-center justify-center gap-3 overflow-hidden" style={{ background: showOk ? 'rgba(16, 185, 129, 0.2)' : showErr ? 'rgba(239, 68, 68, 0.2)' : c ? `${c}15` : 'rgba(255,255,255,0.05)', borderColor: showOk ? '#10b981' : showErr ? '#ef4444' : c ? `${c}40` : 'rgba(255,255,255,0.1)', boxShadow: showOk ? '0 0 20px rgba(16, 185, 129, 0.4)' : showErr ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none' }}>
                                            {showOk && <CheckCircle2 className="text-emerald-400 absolute top-2 right-2" size={20} />}
                                            {showErr && <XCircle className="text-red-400 absolute top-2 right-2" size={20} />}
                                            {currentQuestion.type === 'color' && optShape ? (
                                                <optShape.Icon size={48} style={{ color: showOk ? '#34d399' : showErr ? '#f87171' : 'white' }} fill={optShape.fill ? (showOk ? '#34d399' : showErr ? '#f87171' : 'white') : 'none'} strokeWidth={1.5} />
                                            ) : currentQuestion.type === 'symbol' ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    {targetShape && <targetShape.Icon size={24} style={{ color: c || 'white' }} fill={targetShape.fill ? (c || 'white') : 'none'} strokeWidth={1.5} />}
                                                    <span style={{ color: showOk ? '#34d399' : showErr ? '#f87171' : 'white' }}>{opt}</span>
                                                </div>
                                            ) : <span>{opt}</span>}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-violet-500 to-fuchsia-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Görsel Bellek Ustası!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Şekil ve renk eşleşmelerini zihninde kusursuz tutuyorsun. Harika bir odaklanma!' : 'Daha fazla pratikle görsel çalışma belleğini ve dikkatini geliştirebilirsin.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-violet-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-violet-500 to-fuchsia-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default SymbolMatchGame;
