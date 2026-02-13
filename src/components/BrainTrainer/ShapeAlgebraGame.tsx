import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon,
    ChevronLeft, Zap, Heart, Equal, Plus, Delete, Check, Brain, Sparkles
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
const GAME_ID = 'sekil-cebiri';

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';
type ShapeType = 'square' | 'triangle' | 'circle' | 'star' | 'diamond' | 'pentagon' | 'hexagon';
type ColorType = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'orange' | 'teal';

interface GameVariable { id: string; shape: ShapeType; color: ColorType; value: number; dotted?: boolean; }
interface EquationItem { variableId: string; count: number; }
interface Equation { id: string; items: EquationItem[]; result: number; }
interface Question { text: string; items: EquationItem[]; answer: number; }
interface LevelData { level: number; variables: GameVariable[]; equations: Equation[]; question: Question; }

const SHAPES: ShapeType[] = ['square', 'triangle', 'circle', 'star', 'diamond', 'pentagon', 'hexagon'];
const COLORS: ColorType[] = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'teal'];

const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const genId = () => Math.random().toString(36).substr(2, 9);

const genLevel = (level: number): LevelData => {
    let numVars = level < 3 ? 2 : level < 6 ? 3 : level < 10 ? 4 : 5;
    const allowDotted = level >= 5;
    const dottedChance = level >= 12 ? 0.5 : level >= 8 ? 0.35 : 0.25;
    const maxVal = 5 + Math.floor(level / 2);
    const used = new Set<string>();
    const variables: GameVariable[] = [];

    while (variables.length < numVars) {
        const s = getRandom(SHAPES), c = getRandom(COLORS), d = allowDotted && Math.random() < dottedChance, key = `${s}-${c}-${d}`;
        if (!used.has(key)) { used.add(key); variables.push({ id: genId(), shape: s, color: c, value: Math.floor(Math.random() * maxVal) + 1, dotted: d }); }
    }

    const equations: Equation[] = [];
    const varsInOrder = [...variables];
    for (let i = 0; i < numVars; i++) {
        const items: EquationItem[] = [];
        let sum = 0;
        const len = Math.floor(Math.random() * 2) + 2;
        for (let k = 0; k < len; k++) {
            const chosen = k === 0 ? varsInOrder[i] : getRandom(varsInOrder.slice(0, i + 1));
            items.push({ variableId: chosen.id, count: 1 }); sum += chosen.value;
        }
        equations.push({ id: genId(), items, result: sum });
    }
    if (level > 2) equations.sort(() => Math.random() - 0.5);

    let qItems: EquationItem[] = [], ans = 0, qText = 'Aşağıdaki şekil kaç eder?';
    if (level >= 4 && Math.random() > 0.5) {
        const v1 = getRandom(variables), v2 = getRandom(variables);
        qItems = [{ variableId: v1.id, count: 1 }, { variableId: v2.id, count: 1 }];
        ans = v1.value + v2.value; qText = 'İşlemin sonucu kaçtır?';
    } else {
        const t = getRandom(variables); qItems = [{ variableId: t.id, count: 1 }]; ans = t.value;
    }
    return { level, variables, equations, question: { text: qText, items: qItems, answer: ans } };
};

const getColorHex = (c: ColorType) => ({ red: '#FF3B30', green: '#34C759', blue: '#007AFF', yellow: '#FFCC00', purple: '#AF52DE', orange: '#FF9500', teal: '#5AC8FA' }[c] || '#9ca3af');

const ShapeIcon: React.FC<{ shape: ShapeType; color: ColorType; size?: number; dotted?: boolean }> = ({ shape, color, size = 40, dotted = false }) => {
    const fill = getColorHex(color);
    const paths: Record<ShapeType, React.ReactNode> = {
        square: <rect x="4" y="4" width="16" height="16" rx="2" />,
        circle: <circle cx="12" cy="12" r="9" />,
        triangle: <path d="M12 3l9 16H3z" />,
        diamond: <path d="M12 2L2 12l10 10 10-10z" />,
        pentagon: <path d="M12 2l9.5 6.9-3.6 11.1h-11.8l-3.6-11.1z" />,
        hexagon: <path d="M12 2l8.7 5v10l-8.7 5-8.7-5v-10z" />,
        star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
    };
    const dotCenter = shape === 'triangle' ? { cx: 12, cy: 13 } : { cx: 12, cy: 12 };
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} className="drop-shadow-lg scale-110">
            {paths[shape]}
            {dotted && <circle cx={dotCenter.cx} cy={dotCenter.cy} r={2.5} fill="white" stroke="none" opacity={0.9} />}
        </svg>
    );
};

const ShapeAlgebraGame: React.FC = () => {
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
    const [levelData, setLevelData] = useState<LevelData | null>(null);
    const [userAnswer, setUserAnswer] = useState('');

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return prev - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

    const handleStart = useCallback(() => {
        setLevelData(genLevel(1)); window.scrollTo(0, 0); setPhase('playing'); setScore(0); setLives(INITIAL_LIVES); setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT); setUserAnswer('');
        startTimeRef.current = Date.now(); hasSavedRef.current = false; playSound('slide');
    }, [examMode, examTimeLimit, playSound]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart(); }, [location.state, examMode, phase, handleStart]);

    const handleFinish = useCallback(async (isVictory: boolean) => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) { await submitResult(isVictory || level >= 5, score, MAX_LEVEL * 100, duration); navigate('/atolyeler/sinav-simulasyonu/devam'); return; }
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: duration, metadata: { levels_completed: level, victory: isVictory } });
    }, [score, level, examMode, submitResult, navigate, saveGamePlay]);

    useEffect(() => { if (phase === 'game_over' || phase === 'victory') handleFinish(phase === 'victory'); }, [phase, handleFinish]);

    const handleSubmit = () => {
        if (!levelData || !userAnswer || !!feedbackState) return;
        const correct = levelData.question.answer === parseInt(userAnswer, 10);
        playSound(correct ? 'correct' : 'incorrect'); showFeedback(correct);
        setTimeout(() => {
            dismissFeedback();
            if (correct) {
                setScore(p => p + level * 10);
                if (level >= MAX_LEVEL) setPhase('victory');
                else { setLevel(p => p + 1); setLevelData(genLevel(level + 1)); setUserAnswer(''); }
            } else {
                setLives(l => {
                    const nl = l - 1;
                    if (nl <= 0) setPhase('game_over');
                    else setUserAnswer('');
                    return nl;
                });
            }
        }, 1500);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-purple-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-violet-400 to-purple-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Brain size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent">Şekil Cebiri</h1>
                    <p className="text-slate-300 mb-8 text-lg">Şekillerin gizli sayısal değerlerini bul, görsel denklemleri çöz ve matematik dehası olduğunu kanıtla!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-violet-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Her satırdaki şekillerin <strong>toplam değerini</strong> incele</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Her şeklin hangi sayıya karşılık geldiğini <strong>mantık yürüterek</strong> bul</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>En alttaki soruda istenen toplam değeri <strong>klavyeden yaz</strong></span></li>
                        </ul>
                    </div>
                    <div className="bg-violet-500/10 text-violet-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-violet-500/30 font-bold uppercase tracking-widest">TUZÖ 5.5.2 Kural Çıkarsama</div>
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
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20"><Zap className="text-emerald-400" size={16} /><span className="font-bold text-emerald-400">Soru {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'feedback') && levelData && (
                        <motion.div key={level} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg space-y-6">
                            <div className="space-y-4">
                                {levelData.equations.map((eq, i) => (
                                    <motion.div key={eq.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="flex items-center justify-center bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl group">
                                        <div className="flex flex-wrap items-center justify-center gap-2">
                                            {eq.items.map((item, idx) => {
                                                const v = levelData.variables.find(x => x.id === item.variableId);
                                                return (
                                                    <React.Fragment key={idx}>
                                                        {idx > 0 && <Plus className="text-slate-500/50" size={20} />}
                                                        <ShapeIcon shape={v!.shape} color={v!.color} dotted={v!.dotted} size={42} />
                                                    </React.Fragment>
                                                );
                                            })}
                                            <Equal className="text-slate-500 mx-2" size={24} strokeWidth={3} />
                                            <span className="text-4xl font-black text-white">{eq.result}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="bg-violet-500/10 border-2 border-violet-500/30 rounded-[40px] p-8 flex flex-col items-center gap-6 shadow-3xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-30" />
                                <span className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">{levelData.question.text}</span>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {levelData.question.items.map((it, idx) => {
                                            const v = levelData.variables.find(x => x.id === it.variableId);
                                            return (
                                                <React.Fragment key={idx}>
                                                    {idx > 0 && <Plus className="text-slate-500/50" size={20} />}
                                                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}><ShapeIcon shape={v!.shape} color={v!.color} dotted={v!.dotted} size={56} /></motion.div>
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                    <Equal className="text-violet-400" size={32} strokeWidth={3} />
                                    <div className={`w-28 h-20 rounded-3xl border-4 flex items-center justify-center text-5xl font-black transition-all shadow-inner ${!!feedbackState ? (feedbackState.correct ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-red-500 border-red-400 text-white') : 'bg-white/5 border-white/10 text-white'}`}>
                                        {userAnswer || <span className="text-white/20 animate-pulse">?</span>}
                                    </div>
                                </div>
                                <GameFeedbackBanner feedback={feedbackState} />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((k, _i) => (
                                    <motion.button key={k} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => userAnswer.length < 3 && !feedbackState && setUserAnswer(p => p + k)} disabled={!!feedbackState} className={`py-5 rounded-3xl bg-white/5 border border-white/10 text-2xl font-bold shadow-xl flex items-center justify-center hover:bg-white/10 transition-all ${k === '0' ? 'col-start-2' : ''}`} style={{ boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.05)' }}>{k}</motion.button>
                                ))}
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => !feedbackState && setUserAnswer(p => p.slice(0, -1))} disabled={!!feedbackState} className="py-5 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center col-start-1 row-start-4"><Delete size={32} /></motion.button>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={!userAnswer || !!feedbackState} className="py-5 rounded-3xl bg-gradient-to-r from-violet-500 to-purple-600 border border-white/10 text-white flex items-center justify-center col-start-3 row-start-4 shadow-2xl"><Check size={32} /></motion.button>
                            </div>
                        </motion.div>
                    )}

                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-violet-500 to-purple-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-violet-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Cebir Ustası!' : 'Harika!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Matematiksel mantık ve görsel çıkarım yeteneğin tek kelimeyle harika!' : 'Değişkenler arasındaki ilişkileri çözmek için daha fazla pratik yap!'}</p>
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

export default ShapeAlgebraGame;
