import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon, Target,
    ChevronLeft, Zap, Heart, Scale, Eye, EyeOff, ArrowRight, HelpCircle, Sparkles
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
const GAME_ID = 'gorsel-cebir-dengesi';

enum ShapeType { SQUARE = 'SQUARE', TRIANGLE = 'TRIANGLE', CIRCLE = 'CIRCLE', STAR = 'STAR', PENTAGON = 'PENTAGON' }
type WeightMap = { [key in ShapeType]?: number };
type PanContent = { [key in ShapeType]?: number };
interface BalanceState { left: PanContent; right: PanContent; }
interface LevelData { levelNumber: number; weights: WeightMap; referenceEquation: BalanceState; question: { left: PanContent }; description: string; detailedExplanation?: string; }
type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

const AVAILABLE_SHAPES = [ShapeType.SQUARE, ShapeType.TRIANGLE, ShapeType.CIRCLE, ShapeType.STAR];
const getShapesForLevel = (l: number) => l <= 3 ? AVAILABLE_SHAPES.slice(0, 2) : l <= 7 ? AVAILABLE_SHAPES.slice(0, 3) : AVAILABLE_SHAPES;
const calcWeight = (c: PanContent, w: WeightMap) => Object.entries(c).reduce((t, [s, n]) => t + (w[s as ShapeType] || 0) * (n as number), 0);
const genWeights = (sh: ShapeType[], l: number) => {
    const w: WeightMap = {}; const max = Math.min(3 + Math.floor(l / 3), 10);
    sh.forEach(s => w[s] = Math.floor(Math.random() * max) + 1);
    const v = Object.values(w) as number[]; if (v.every(x => x === v[0]) && sh.length > 1) w[sh[1]] = (w[sh[0]]! % max) + 1;
    return w;
};

const genLevel = (l: number): LevelData => {
    const sh = getShapesForLevel(l), w = genWeights(sh, l), rl: PanContent = {}, rr: PanContent = {}, n = Math.min(1 + Math.floor(l / 4), 3);
    for (let i = 0; i < n; i++) { const s = sh[i % sh.length]; rl[s] = (rl[s] || 0) + 1; }
    let rem = calcWeight(rl, w), shuf = [...sh].sort(() => Math.random() - 0.5);
    for (const s of shuf) { const val = w[s]!; if (val > 0 && rem >= val) { const c = Math.min(Math.floor(rem / val), Math.ceil(l / 5) + 1); rr[s] = c; rem -= c * val; } }
    if (rem > 0) { const s1 = sh[0]; rr[s1] = (rr[s1] || 0) + 1; w[s1] = rem + (w[s1]! * ((rr[s1] || 1) - 1)); }
    const ql: PanContent = {}, m = Math.min(1 + Math.floor(l / 3), 4);
    for (let i = 0; i < m; i++) { const s = sh[Math.floor(Math.random() * sh.length)]; ql[s] = (ql[s] || 0) + 1; }
    let expl = `Ağırlıklar:\n` + sh.filter(s => w[s]).map(s => `• ${s} = ${w[s]}`).join('\n') + `\nSol: ${calcWeight(ql, w)}`;
    return { levelNumber: l, weights: w, referenceEquation: { left: rl, right: rr }, question: { left: ql }, description: l <= 2 ? 'Kuralı çöz ve soru terazisini dengele!' : 'İpucu terazisinden kuralı bul!', detailedExplanation: expl };
};

const ShapeIcon: React.FC<{ type: ShapeType; size?: number; weight?: number; className?: string }> = ({ type, size = 32, weight, className = '' }) => {
    const textEl = weight !== undefined && <text x="12" y="16.5" textAnchor="middle" fill="#1e293b" fontSize="11" fontWeight="900" stroke="white" strokeWidth="2.5" paintOrder="stroke" style={{ pointerEvents: 'none' }}>{weight}</text>;
    const cls = `transition-all duration-300 drop-shadow-md ${className}`;
    const colors = { [ShapeType.SQUARE]: '#818CF8', [ShapeType.TRIANGLE]: '#FB7185', [ShapeType.CIRCLE]: '#34D399', [ShapeType.STAR]: '#FBBF24', [ShapeType.PENTAGON]: '#A78BFA' };
    const shapes = {
        [ShapeType.SQUARE]: <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />,
        [ShapeType.TRIANGLE]: <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />,
        [ShapeType.CIRCLE]: <circle cx="12" cy="12" r="10" />,
        [ShapeType.STAR]: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
        [ShapeType.PENTAGON]: <path d="M12 2L2 9l4 13h12l4-13L12 2z" />
    };
    return <svg viewBox="0 0 24 24" fill={colors[type]} className={cls} width={size} height={size}>{shapes[type]}{textEl}</svg>;
};

const VisualAlgebraGame: React.FC = () => {
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
    const [userRightPan, setUserRightPan] = useState<PanContent>({});
    const [showWeights, setShowWeights] = useState(false);
    const [_showExplanation, setShowExplanation] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const handleStart = useCallback(() => {
        const d = genLevel(1); setLevelData(d); window.scrollTo(0, 0); setPhase('playing'); setScore(0); setLives(INITIAL_LIVES); setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT); setUserRightPan({}); setShowWeights(false); setShowExplanation(false);
        startTimeRef.current = Date.now(); hasSavedRef.current = false; playSound('slide');
    }, [examMode, examTimeLimit, playSound]);

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
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: duration, metadata: { level_reached: level, victory: isVictory } });
    }, [score, level, examMode, submitResult, navigate, saveGamePlay]);

    useEffect(() => { if (phase === 'game_over' || phase === 'victory') handleFinish(phase === 'victory'); }, [phase, handleFinish]);

    const checkAnswer = () => {
        if (!levelData || !!feedbackState) return;
        const correct = calcWeight(levelData.question.left, levelData.weights) === calcWeight(userRightPan, levelData.weights);
        playSound(correct ? 'correct' : 'incorrect'); showFeedback(correct);
        setTimeout(() => {
            dismissFeedback();
            if (correct) {
                setScore(p => p + level * 10);
                if (level >= MAX_LEVEL) setPhase('victory');
                else { const nl = level + 1; setLevel(nl); setLevelData(genLevel(nl)); setUserRightPan({}); setShowExplanation(false); }
            } else {
                setLives(l => { const nl = l - 1; if (nl <= 0) setPhase('game_over'); else setUserRightPan({}); return nl; });
            }
        }, 1500);
    };

    const addToPan = (s: ShapeType) => { if (phase === 'playing') { setUserRightPan(p => ({ ...p, [s]: (p[s] || 0) + 1 })); playSound('pop'); } };
    const removeFromPan = (s: ShapeType) => { if (phase === 'playing' && userRightPan[s]) { setUserRightPan(p => { const nc = p[s]! - 1; if (nc === 0) { const { [s]: _, ...r } = p; return r; } return { ...p, [s]: nc }; }); playSound('pop'); } };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    const renderScale = (left: PanContent, right: PanContent, w: WeightMap, interactive = false) => {
        const lw = calcWeight(left, w), rw = calcWeight(right, w);
        const tilt = Math.max(Math.min((rw - lw) * 3, 15), -15);
        const renderC = (c: PanContent, side: string) => Object.entries(c).flatMap(([s, n]) => Array.from({ length: n as number }).map((_, i) => (
            <motion.div key={`${s}-${i}`} whileTap={interactive && side === 'right' ? { scale: 0.8 } : {}} onClick={() => interactive && side === 'right' && removeFromPan(s as ShapeType)} className={interactive && side === 'right' ? 'cursor-pointer hover:scale-110' : ''}>
                <ShapeIcon type={s as ShapeType} size={28} weight={showWeights ? w[s as ShapeType] : undefined} />
            </motion.div>
        )));
        return (
            <div className="relative w-full h-48 flex justify-center items-end select-none">
                <div className="absolute bottom-0 w-24 h-4 bg-slate-500/40 rounded-full" />
                <div className="absolute bottom-4 w-2 h-24 bg-slate-500/40 rounded-t-lg" />
                <div className="absolute bottom-28 w-full transition-transform duration-700 ease-in-out" style={{ transform: `rotate(${tilt}deg)` }}>
                    <div className="h-2 bg-slate-400 rounded-full shadow-inner mx-4" />
                    <div className="absolute left-4 top-1 flex flex-col items-center" style={{ transform: `rotate(${-tilt}deg)` }}>
                        <div className="w-0.5 h-12 bg-slate-500/30" />
                        <div className="w-24 h-4 bg-white/5 border-b-4 border-white/10 rounded-b-3xl relative flex flex-wrap justify-center items-end gap-1 px-1 pb-1">{renderC(left, 'left')}</div>
                    </div>
                    <div className="absolute right-4 top-1 flex flex-col items-center" style={{ transform: `rotate(${-tilt}deg)` }}>
                        <div className="w-0.5 h-12 bg-slate-500/30" />
                        <div className={`w-24 h-4 border-b-4 rounded-b-3xl relative flex flex-wrap justify-center items-end gap-1 px-1 pb-1 ${interactive ? 'bg-violet-500/20 border-violet-500/40 ring-2 ring-violet-500/20' : 'bg-white/5 border-white/10'}`}>{renderC(right, 'right')}</div>
                    </div>
                </div>
            </div>
        );
    };

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-purple-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-violet-400 to-purple-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Scale size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent">Görsel Cebir Dengesi</h1>
                    <p className="text-slate-300 mb-8 text-lg">Terazileri dengeleyerek şekiller arasındaki gizli matematiksel ilişkileri çöz ve cebir zekanı göster!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-violet-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Üstteki <strong>referans teraziye</strong> bakarak şekillerin ağırlığını bul</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Alttaki <strong>soru terazisinin</strong> sağ kefesine şekiller ekle</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Her iki kefedeki ağırlıklar <strong>eşitlendiğinde</strong> kontrol butonuna bas</span></li>
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
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20"><Zap className="text-emerald-400" size={16} /><span className="font-bold text-emerald-400">Terazi {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'feedback') && levelData && (
                        <motion.div key={level} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="w-full max-w-2xl space-y-6">
                            <div className="bg-white/5 backdrop-blur-xl rounded-[40px] p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                                <span className="absolute top-4 left-6 text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-2"><HelpCircle size={14} /> Referans Terazisi</span>
                                {renderScale(levelData.referenceEquation.left, levelData.referenceEquation.right, levelData.weights)}
                                <div className="mt-4 text-center text-[10px] font-bold text-violet-300/60 uppercase tracking-widest italic animate-pulse">Bu terazi dengede!</div>
                            </div>

                            <div className={`bg-violet-500/10 border-2 rounded-[40px] p-8 border-violet-500/30 shadow-3xl relative transition-all duration-500 ${feedbackState ? (feedbackState.correct ? 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)]' : 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.2)]') : ''}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px] font-black uppercase text-violet-300 tracking-widest flex items-center gap-2"><Target size={14} /> Soru Terazisi</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowWeights(!showWeights)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">{showWeights ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                        <button onClick={() => setUserRightPan({})} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><RotateCcw size={16} /></button>
                                    </div>
                                </div>
                                {renderScale(levelData.question.left, userRightPan, levelData.weights, true)}
                                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                                    <div className="flex gap-2 bg-white/5 p-2 rounded-3xl border border-white/10">{getShapesForLevel(level).map(s => (
                                        <motion.button key={s} whileHover={{ y: -4, scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => addToPan(s)} className="p-3 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all flex items-center justify-center min-w-[56px]" style={{ boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2)' }}>
                                            <ShapeIcon type={s} size={32} weight={showWeights ? levelData.weights[s] : undefined} />
                                        </motion.button>
                                    ))}</div>
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={checkAnswer} disabled={Object.keys(userRightPan).length === 0 || !!feedbackState} className="flex-1 py-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-[28px] font-black text-xl shadow-2xl disabled:opacity-30 flex items-center justify-center gap-3">KONTROL ET <ArrowRight size={24} /></motion.button>
                                </div>
                                <GameFeedbackBanner feedback={feedbackState} />
                            </div>
                        </motion.div>
                    )}

                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-violet-500 to-purple-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-violet-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Denge Ustası!' : 'Harika!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Ağırlık ilişkilerini çözme ve denge kurma becerin kusursuz!' : 'Şekiller arasındaki gizli matematiksel bağları daha hızlı çözebilirsin.'}</p>
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

export default VisualAlgebraGame;
