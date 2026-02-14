import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon,
    ChevronLeft, Zap, Heart, Eye, Sparkles
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
const GAME_ID = 'farki-bul';

type DiffType = 'lightness' | 'hue' | 'radius' | 'scale' | 'rotation' | 'shape';
type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

interface ShapeData { id: string; path: string; }
interface TileStyle { hue: number; sat: number; light: number; radius: number; rotate: number; scale: number; }
interface TileDecor { d1x: number; d1y: number; d1s: number; d2x: number; d2y: number; d2s: number; }
interface TileData { index: number; style: TileStyle; shape: ShapeData; decor: TileDecor; }
interface RoundData { size: number; total: number; oddIndex: number; diffType: DiffType; baseShape: ShapeData; oddShape: ShapeData; base: TileStyle; odd: TileStyle; perRoundTime: number; }

const DIFF_LABELS: Record<DiffType, string> = { lightness: 'Açıklık', hue: 'Renk Tonu', radius: 'Köşe', scale: 'Boyut', rotation: 'Açı', shape: 'Şekil' };
const SHAPES: ShapeData[] = [
    { id: 'triangle', path: 'M50 8 L92 88 L8 88 Z' },
    { id: 'star', path: 'M50 6 L62 34 L92 38 L68 56 L76 88 L50 70 L24 88 L32 56 L8 38 L38 34 Z' },
    { id: 'hex', path: 'M26 8 L74 8 L94 50 L74 92 L26 92 L6 50 Z' },
    { id: 'kite', path: 'M50 6 L88 40 L64 94 L36 94 L12 40 Z' },
    { id: 'drop', path: 'M50 6 C70 20 84 40 84 60 C84 80 68 94 50 94 C32 94 16 80 16 60 C16 40 30 20 50 6 Z' },
    { id: 'blob', path: 'M58 8 C74 10 90 24 92 42 C94 60 86 80 68 88 C50 96 30 92 18 78 C6 64 4 44 16 28 C28 12 42 6 58 8 Z' },
    { id: 'diamond', path: 'M50 4 L94 50 L50 96 L6 50 Z' },
    { id: 'octagon', path: 'M30 6 L70 6 L94 30 L94 70 L70 94 L30 94 L6 70 L6 30 Z' },
    { id: 'hourglass', path: 'M18 10 L82 10 L60 50 L82 90 L18 90 L40 50 Z' },
    { id: 'chevron', path: 'M8 32 L50 8 L92 32 L70 54 L92 76 L50 92 L8 76 L30 54 Z' },
    { id: 'leaf', path: 'M14 68 C24 38 48 16 72 14 C90 12 94 28 88 46 C80 74 52 92 28 88 C16 86 10 80 14 68 Z' },
    { id: 'wave', path: 'M8 60 C22 40 40 40 52 54 C64 68 82 68 92 50 C86 78 66 92 44 90 C24 88 10 78 8 60 Z' },
];
const GHOST_PATH = 'M60 12 C78 14 92 30 90 48 C88 66 72 82 54 88 C36 94 16 88 10 70 C4 52 10 30 26 20 C40 10 46 10 60 12 Z';

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const createDecor = (): TileDecor => ({ d1x: randInt(8, 58), d1y: randInt(6, 56), d1s: randInt(18, 32), d2x: randInt(32, 72), d2y: randInt(30, 70), d2s: randInt(12, 24) });

const getLevelConfig = (lvl: number) => {
    const gridMin = Math.min(3 + Math.floor(lvl / 5), 5); const gridMax = Math.min(gridMin + 1, 6);
    const perRoundTime = Math.max(5, 15 - Math.floor(lvl / 3)); const diffFactor = Math.max(0.3, 1 - (lvl - 1) * 0.035);
    const all: DiffType[] = ['lightness', 'hue', 'radius', 'scale', 'rotation', 'shape'];
    const types = all.slice(0, Math.min(all.length, 3 + Math.floor(lvl / 4)));
    return { gridMin, gridMax, perRoundTime, types, deltas: { lightness: Math.round(24 * diffFactor), hue: Math.round(22 * diffFactor), radius: Math.round(28 * diffFactor), scale: +(0.16 * diffFactor).toFixed(3), rotation: Math.round(14 * diffFactor) } };
};

const createRound = (lvl: number): RoundData => {
    const cfg = getLevelConfig(lvl); const size = randInt(cfg.gridMin, cfg.gridMax); const total = size * size;
    const oddIdx = randInt(0, total - 1); const diffType = pick(cfg.types); const baseShape = pick(SHAPES);
    const base: TileStyle = { hue: randInt(0, 360), sat: randInt(62, 88), light: randInt(50, 72), radius: randInt(10, 48), rotate: randInt(-10, 10), scale: 1 };
    const odd: TileStyle = { ...base }; let oddShape = baseShape; const sign = Math.random() > 0.5 ? 1 : -1;
    if (diffType === 'shape') oddShape = pick(SHAPES.filter(s => s.id !== baseShape.id));
    else if (diffType === 'lightness') odd.light = clamp(base.light + sign * cfg.deltas.lightness, 18, 82);
    else if (diffType === 'hue') odd.hue = (base.hue + sign * cfg.deltas.hue + 360) % 360;
    else if (diffType === 'radius') odd.radius = clamp(base.radius + sign * cfg.deltas.radius, 4, 70);
    else if (diffType === 'scale') odd.scale = clamp(base.scale + sign * cfg.deltas.scale, 0.74, 1.22);
    else if (diffType === 'rotation') odd.rotate = base.rotate + sign * cfg.deltas.rotation;
    return { size, total, oddIndex: oddIdx, diffType, baseShape, oddShape, base, odd, perRoundTime: cfg.perRoundTime };
};

const Tile: React.FC<{ tile: TileData; isOdd: boolean; isSelected: boolean; isRevealed: boolean; onClick: () => void; disabled: boolean; }> = ({ tile, isOdd, isSelected, isRevealed, onClick, disabled }) => {
    const s = tile.style; const d = tile.decor;
    return (
        <motion.button whileHover={disabled ? {} : { scale: 1.05 }} whileTap={disabled ? {} : { scale: 0.95 }} animate={isRevealed && isOdd ? { scale: [1, 1.08, 1], boxShadow: ['0 0 0 4px rgba(52,211,153,0.3)', '0 0 0 8px rgba(52,211,153,0.5)', '0 0 0 4px rgba(52,211,153,0.3)'] } : {}} transition={isRevealed && isOdd ? { duration: 1, repeat: Infinity } : {}} onClick={onClick} disabled={disabled} className="aspect-square relative overflow-hidden grid place-items-center rounded-2xl" style={{ background: `radial-gradient(circle at 25% 20%, hsl(${s.hue} ${s.sat}% ${s.light + 14}%), hsl(${s.hue} ${s.sat}% ${s.light}%))`, borderRadius: `${s.radius}%`, transform: `rotate(${s.rotate}deg) scale(${s.scale})`, border: isRevealed && isOdd ? '3px solid rgba(52, 211, 153, 0.9)' : isSelected ? '3px solid rgba(251, 191, 36, 0.9)' : '2px solid rgba(255, 255, 255, 0.15)', boxShadow: isRevealed && isOdd ? '0 0 0 4px rgba(52, 211, 153, 0.3), inset 0 -6px 12px rgba(0,0,0,0.15)' : isSelected ? '0 0 0 4px rgba(251, 191, 36, 0.3), inset 0 -6px 12px rgba(0,0,0,0.15)' : 'inset 0 -6px 12px rgba(0,0,0,0.15), inset 0 4px 8px rgba(255,255,255,0.2)', cursor: disabled ? 'default' : 'pointer' }}>
            <span className="absolute rounded-full pointer-events-none" style={{ width: `${d.d1s}%`, height: `${d.d1s}%`, top: `${d.d1y}%`, left: `${d.d1x}%`, opacity: 0.45, background: `radial-gradient(circle at 30% 30%, hsla(${s.hue + 28}, ${s.sat}%, ${s.light + 26}%, 0.7), transparent 70%)`, filter: 'blur(0.4px)' }} />
            <span className="absolute rounded-full pointer-events-none" style={{ width: `${d.d2s}%`, height: `${d.d2s}%`, top: `${d.d2y}%`, left: `${d.d2x}%`, opacity: 0.35, background: `radial-gradient(circle at 70% 30%, hsla(${s.hue - 22}, ${s.sat}%, ${s.light + 22}%, 0.6), transparent 70%)`, filter: 'blur(0.4px)' }} />
            <svg className="absolute pointer-events-none" style={{ inset: '8%', fill: `hsl(${s.hue + 36} ${s.sat}% ${s.light + 22}%)`, opacity: 0.22 }} viewBox="0 0 100 100"><path d={GHOST_PATH} /></svg>
            <svg className="absolute pointer-events-none" style={{ inset: '18%', fill: `hsl(${s.hue} ${s.sat}% ${s.light + 6}%)`, opacity: 0.92 }} viewBox="0 0 100 100"><path d={tile.shape.path} /></svg>
        </motion.button>
    );
};

const SpotDifferenceGame: React.FC = () => {
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
    const [roundData, setRoundData] = useState<RoundData | null>(null);
    const [roundTimeLeft, setRoundTimeLeft] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const roundTimerRef = useRef<number>(0);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const startNewRound = useCallback((lvl: number) => {
        const data = createRound(lvl); setRoundData(data); setRoundTimeLeft(data.perRoundTime); setSelectedIndex(null);
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing'); setScore(0); setLevel(1); setLives(INITIAL_LIVES); setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        startNewRound(1); playSound('slide');
    }, [startNewRound, playSound, examMode, examTimeLimit]);

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

    useEffect(() => {
        if (phase !== 'playing' || !roundData || selectedIndex !== null) return;
        const start = performance.now();
        const tick = (now: number) => {
            const el = (now - start) / 1000; const rem = Math.max(0, roundData.perRoundTime - el);
            setRoundTimeLeft(rem); if (rem <= 0) { handlePick(-1); return; }
            roundTimerRef.current = requestAnimationFrame(tick);
        };
        roundTimerRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(roundTimerRef.current);
    }, [phase, roundData, selectedIndex]);

    const handlePick = useCallback((idx: number) => {
        if (!roundData || selectedIndex !== null || phase !== 'playing') return;
        cancelAnimationFrame(roundTimerRef.current);
        const correct = idx === roundData.oddIndex;
        setSelectedIndex(idx); showFeedback(correct); playSound(correct ? 'correct' : 'incorrect');
        setTimeout(() => {
            dismissFeedback();
            if (correct) {
                setScore(p => p + 10 * level + Math.round(roundTimeLeft * 5));
                if (level >= MAX_LEVEL) setPhase('victory');
                else { setLevel(l => l + 1); startNewRound(level + 1); }
            } else {
                setLives(l => {
                    const nl = l - 1;
                    if (nl <= 0) setTimeout(() => setPhase('game_over'), 500);
                    else startNewRound(level);
                    return nl;
                });
            }
        }, 1500);
    }, [roundData, selectedIndex, phase, level, roundTimeLeft, startNewRound, playSound, showFeedback, dismissFeedback]);

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

    const tiles = useMemo(() => {
        if (!roundData) return [];
        return Array.from({ length: roundData.total }, (_, idx) => ({ index: idx, style: idx === roundData.oddIndex ? roundData.odd : roundData.base, shape: idx === roundData.oddIndex ? roundData.oddShape : roundData.baseShape, decor: createDecor() }));
    }, [roundData]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/15 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-fuchsia-400 to-purple-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Eye size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-fuchsia-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">Farkı Bul</h1>
                    <p className="text-slate-300 mb-8 text-lg">Bir kare diğerlerinden farklı! Renk, şekil, boyut ve açı ipuçlarını gözlemle, farklı olanı bul. Hızlı ol, zaman daralıyor!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-fuchsia-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-fuchsia-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Ekrana gelen grid içindeki <strong>farklı kareyi</strong> bul</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-fuchsia-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Her round için <strong>üstteki süre barı</strong> dolmadan tıkla</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-fuchsia-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Ne kadar hızlı bulursan <strong>o kadar çok puan</strong> kazanırsın</span></li>
                        </ul>
                    </div>
                    <div className="bg-violet-500/10 text-violet-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-violet-500/30 font-bold uppercase tracking-widest">TUZÖ 5.7.1 Seçici Dikkat</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(192, 38, 211, 0.2) 0%, rgba(147, 51, 234, 0.1) 100%)', border: '1px solid rgba(192, 38, 211, 0.3)' }}><Zap className="text-fuchsia-400" size={18} /><span className="font-bold text-fuchsia-400">Seviye {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'feedback') && roundData && (
                        <motion.div key="game" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-lg">
                            <div className="mb-6 h-3 bg-white/10 rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner">
                                <motion.div className="h-full rounded-full shadow-lg" style={{ width: `${(roundTimeLeft / roundData.perRoundTime) * 100}%`, background: roundTimeLeft < 3 ? 'linear-gradient(90deg, #ef4444, #f97316)' : 'linear-gradient(90deg, #a855f7, #6366f1)', transition: 'background 0.3s' }} />
                            </div>
                            <div className="mb-6 text-center"><span className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-xs font-bold text-slate-400 tracking-wider uppercase">Fark Tipi: <span className="text-fuchsia-400">{DIFF_LABELS[roundData.diffType]}</span></span></div>
                            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-6 border border-white/10 shadow-3xl">
                                <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: `repeat(${roundData.size}, minmax(0, 1fr))` }}>
                                    {tiles.map(tile => (
                                        <Tile key={tile.index} tile={tile} isOdd={tile.index === roundData.oddIndex} isSelected={tile.index === selectedIndex} isRevealed={phase === 'feedback'} onClick={() => handlePick(tile.index)} disabled={phase !== 'playing'} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-fuchsia-500 to-indigo-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Görsel Dikkat Ustası!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'En küçük detayları bile saniyeler içinde fark ediyorsun. Harika bir konsantrasyon!' : 'Daha fazla pratikle konsantrasyonunu ve görsel analiz yeteneğini geliştirebilirsin.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-fuchsia-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default SpotDifferenceGame;
