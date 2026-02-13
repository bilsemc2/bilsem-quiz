import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon,
    ChevronLeft, Zap, Heart, MapPin, Sparkles
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
const CANVAS_SIZE = 300;
const GAME_ID = 'konum-bulmaca';

type ShapeType = 'circle' | 'rect' | 'triangle';
interface Point { x: number; y: number; }
interface BaseShape { id: string; type: ShapeType; color: string; rotation: number; }
interface CircleShape extends BaseShape { type: 'circle'; cx: number; cy: number; r: number; }
interface RectShape extends BaseShape { type: 'rect'; x: number; y: number; w: number; h: number; }
interface TriangleShape extends BaseShape { type: 'triangle'; p1: Point; p2: Point; p3: Point; }
type Shape = CircleShape | RectShape | TriangleShape;
interface PuzzleOption { id: number; rotation: number; point: Point; }
interface PuzzleState { shapes: Shape[]; targetPoint: Point; options: PuzzleOption[]; correctOptionId: number; }
type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

const SHAPE_COLORS_DARK = ['#818CF8', '#FB7185', '#34D399', '#FBBF24'];
const degreesToRadians = (deg: number) => deg * (Math.PI / 180);
const rotatePoint = (p: Point, center: Point, angleDeg: number): Point => {
    const rad = degreesToRadians(angleDeg);
    const cos = Math.cos(rad); const sin = Math.sin(rad);
    const dx = p.x - center.x; const dy = p.y - center.y;
    return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
};

const isPointInShape = (p: Point, s: Shape): boolean => {
    if (s.type === 'circle') return Math.pow(p.x - s.cx, 2) + Math.pow(p.y - s.cy, 2) <= s.r * s.r;
    if (s.type === 'rect') {
        const c = { x: s.x + s.w / 2, y: s.y + s.h / 2 };
        const u = rotatePoint(p, c, -s.rotation);
        return u.x >= s.x && u.x <= s.x + s.w && u.y >= s.y && u.y <= s.y + s.h;
    }
    const { p1, p2, p3 } = s; const d = (p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y);
    const a = ((p2.y - p3.y) * (p.x - p3.x) + (p3.x - p2.x) * (p.y - p3.y)) / d;
    const b = ((p3.y - p1.y) * (p.x - p3.x) + (p1.x - p3.x) * (p.y - p3.y)) / d;
    const c = 1 - a - b; return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
};

const generatePuzzle = (lvl: number): PuzzleState | null => {
    const shapeCount = lvl <= 8 ? 2 : 3;
    for (let attempts = 0; attempts < 30; attempts++) {
        const shapes: Shape[] = []; const padding = 60; const minSize = 80; const maxSize = 140;
        for (let i = 0; i < shapeCount; i++) {
            const t = Math.floor(Math.random() * 3); const color = SHAPE_COLORS_DARK[i % SHAPE_COLORS_DARK.length];
            const rot = Math.floor(Math.random() * 360); const cx = Math.floor(Math.random() * (CANVAS_SIZE - 2 * padding)) + padding;
            const cy = Math.floor(Math.random() * (CANVAS_SIZE - 2 * padding)) + padding;
            if (t === 0) shapes.push({ id: `s-${i}`, type: 'circle', color, rotation: 0, cx, cy, r: Math.floor(Math.random() * (maxSize / 2 - minSize / 2)) + minSize / 2 });
            else if (t === 1) { const w = Math.floor(Math.random() * (maxSize - minSize)) + minSize; const h = Math.floor(Math.random() * (maxSize - minSize)) + minSize; shapes.push({ id: `s-${i}`, type: 'rect', color, rotation: rot, x: cx - w / 2, y: cy - h / 2, w, h }); }
            else {
                const s = Math.floor(Math.random() * (maxSize - minSize)) + minSize; const h = (Math.sqrt(3) / 2) * s;
                const p1 = { x: cx, y: cy - (2 / 3) * h }; const p2 = { x: cx - s / 2, y: cy + (1 / 3) * h }; const p3 = { x: cx + s / 2, y: cy + (1 / 3) * h };
                shapes.push({ id: `s-${i}`, type: 'triangle', color, rotation: rot, p1: rotatePoint(p1, { x: cx, y: cy }, rot), p2: rotatePoint(p2, { x: cx, y: cy }, rot), p3: rotatePoint(p3, { x: cx, y: cy }, rot) });
            }
        }
        const regionMap = new Map<string, Point[]>();
        for (let i = 0; i < 600; i++) {
            const p = { x: Math.floor(Math.random() * CANVAS_SIZE), y: Math.floor(Math.random() * CANVAS_SIZE) };
            const sig = shapes.map(s => isPointInShape(p, s) ? '1' : '0').join('');
            if (!sig.includes('1')) continue;
            if (!regionMap.has(sig)) regionMap.set(sig, []); regionMap.get(sig)?.push(p);
        }
        const validRegions = Array.from(regionMap.entries()).filter(([, p]) => p.length > 10);
        if (validRegions.length < 2) continue;
        const intersect = validRegions.filter(([s]) => s.split('1').length - 1 >= 2);
        const [targetSig, targetPoints] = intersect.length > 0 ? intersect[Math.floor(Math.random() * intersect.length)] : validRegions[Math.floor(Math.random() * validRegions.length)];
        const targetPoint = targetPoints[Math.floor(Math.random() * targetPoints.length)];
        const correctPoint = targetPoints[Math.floor(Math.random() * targetPoints.length)];
        const distractors = validRegions.filter(([s]) => s !== targetSig); if (distractors.length === 0) continue;
        const correctId = Math.floor(Math.random() * 4); const options: PuzzleOption[] = [];
        for (let i = 0; i < 4; i++) {
            const rot = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
            if (i === correctId) options.push({ id: i, rotation: rot, point: correctPoint });
            else { const [, dP] = distractors[Math.floor(Math.random() * distractors.length)]; options.push({ id: i, rotation: rot, point: dP[Math.floor(Math.random() * dP.length)] }); }
        }
        return { shapes, targetPoint, options, correctOptionId: correctId };
    }
    return null;
};

const ShapeRenderer: React.FC<{ shapes: Shape[]; dot?: Point; rotation?: number; size?: number; showDot?: boolean; }> = ({ shapes, dot, rotation = 0, size = 300, showDot = true }) => (
    <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 300 300" width="100%" height="100%" style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.5s ease-in-out' }}>
            {shapes.map(s => {
                const p = { key: s.id, fill: s.color, fillOpacity: 0.25, stroke: s.color, strokeWidth: 2.5 };
                if (s.type === 'circle') return <circle {...p} cx={s.cx} cy={s.cy} r={s.r} />;
                if (s.type === 'rect') return <rect {...p} x={s.x} y={s.y} width={s.w} height={s.h} transform={`rotate(${s.rotation}, ${s.x + s.w / 2}, ${s.y + s.h / 2})`} />;
                return <polygon {...p} points={`${s.p1.x},${s.p1.y} ${s.p2.x},${s.p2.y} ${s.p3.x},${s.p3.y}`} />;
            })}
            {showDot && dot && <circle cx={dot.x} cy={dot.y} r={6} fill="white" stroke="#1e293b" strokeWidth={2.5} />}
        </svg>
    </div>
);

const PositionPuzzleGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const location = useLocation();
    const navigate = useNavigate();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    const initLevel = useCallback((lvl: number) => {
        let p = generatePuzzle(lvl); let r = 0;
        while (!p && r < 5) { p = generatePuzzle(lvl); r++; }
        if (p) { setPuzzle(p); setSelectedOption(null); }
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing'); setScore(0); setLevel(1); setLives(INITIAL_LIVES); setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        initLevel(1); playSound('slide');
    }, [initLevel, playSound, examMode, examTimeLimit]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart(); }, [location.state, phase, handleStart, examMode]);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

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

    const handleOption = (id: number) => {
        if (phase !== 'playing' || selectedOption !== null || !puzzle) return;
        setSelectedOption(id);
        const correct = id === puzzle.correctOptionId;
        showFeedback(correct); playSound(correct ? 'correct' : 'incorrect');
        setTimeout(() => {
            dismissFeedback();
            if (correct) {
                setScore(p => p + 20 * level);
                if (level >= MAX_LEVEL) setPhase('victory');
                else { setLevel(l => l + 1); initLevel(level + 1); }
            } else {
                setLives(l => {
                    const nl = l - 1;
                    if (nl <= 0) setTimeout(() => setPhase('game_over'), 500);
                    else { setSelectedOption(null); initLevel(level); }
                    return nl;
                });
            }
        }, 1500);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-indigo-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><MapPin size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Konum Bulmaca</h1>
                    <p className="text-slate-400 mb-8 text-lg">Şekillerin kesişim bölgelerini analiz et ve noktanın doğru konumunu belirle. Uzamsal ilişkileri çöz!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-cyan-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-cyan-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Üstteki şekil grubunda <strong>noktanın yerini</strong> incele</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-cyan-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Aynı <strong>mantıksal bölgedeki</strong> seçeneği bul</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-cyan-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Seçenekler <strong>döndürülmüş olabilir</strong>, dikkatli ol!</span></li>
                        </ul>
                    </div>
                    <div className="bg-cyan-500/10 text-cyan-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-cyan-500/30 font-bold uppercase tracking-widest">TUZÖ 5.5.3 Uzamsal İlişki</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(8, 145, 178, 0.1) 100%)', border: '1px solid rgba(34, 211, 238, 0.3)' }}><Zap className="text-cyan-400" size={18} /><span className="font-bold text-cyan-400">Seviye {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'feedback') && puzzle && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-8 w-full max-w-4xl">
                            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 border border-white/10 shadow-3xl text-center">
                                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4 block">Analiz Edilecek Konum</span>
                                <div className="bg-slate-900/50 rounded-3xl p-4 border border-white/5 shadow-inner inline-block"><ShapeRenderer shapes={puzzle.shapes} dot={puzzle.targetPoint} size={220} /></div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                                {puzzle.options.map((opt) => {
                                    const isSel = opt.id === selectedOption; const isCorr = opt.id === puzzle.correctOptionId;
                                    const showOk = phase === 'feedback' && isCorr; const showErr = phase === 'feedback' && isSel && !isCorr;
                                    return (
                                        <motion.button key={opt.id} whileHover={phase === 'playing' ? { scale: 1.05, y: -4 } : {}} whileTap={phase === 'playing' ? { scale: 0.95 } : {}} onClick={() => handleOption(opt.id)} disabled={phase !== 'playing'} className="relative aspect-square rounded-[32px] overflow-hidden border-4 transition-all p-3" style={{ background: 'rgba(255,255,255,0.05)', borderColor: showOk ? '#22c55e' : showErr ? '#ef4444' : isSel ? '#06b6d4' : 'rgba(255,255,255,0.1)', boxShadow: isSel ? '0 0 20px rgba(6, 182, 212, 0.4)' : 'none' }}>
                                            <ShapeRenderer shapes={puzzle.shapes} dot={opt.point} rotation={opt.rotation} size={150} />
                                            {phase === 'feedback' && isCorr && <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={48} className="text-emerald-400 drop-shadow-lg" /></div>}
                                            <div className="absolute top-2 left-2 w-6 h-6 bg-black/40 rounded-full flex items-center justify-center text-[10px] font-bold">{String.fromCharCode(65 + opt.id)}</div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-cyan-500 to-indigo-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Uzamsal Zeka Ustası!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Şekiller arası ilişkileri ve döndürme mantığını mükemmel çözüyorsun!' : 'Daha fazla pratikle uzamsal zekanı ve mantıksal analiz yeteneğini geliştirebilirsin.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-cyan-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

const CheckCircle2: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" /></svg>
);

export default PositionPuzzleGame;
