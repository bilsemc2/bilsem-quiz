import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, RotateCcw, Play, Trophy, Sparkles, Heart, Star,
    Timer as TimerIcon, Puzzle, Eye, RefreshCw, Zap
} from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

// ─── Types ───────────────────────────────────────────────
interface PatternProps { points?: number; sides?: number; lines?: number; pathData?: string; }
interface Pattern { defs: string; type: string; backgroundColor: string; foregroundColor: string; size: number; rotation: number; opacity: number; id: string; props?: PatternProps; }
interface GameOption { pattern: Pattern[]; isCorrect: boolean; }
type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

// ─── Constants ───────────────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = 'parca-butun';

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43', '#A29BFE', '#55E6C1', '#FD79A8', '#FAB1A0', '#00D2D3', '#54A0FF', '#5F27CD'];
const PATTERN_TYPES = ['dots', 'stripes', 'zigzag', 'waves', 'checkerboard', 'crosshatch', 'star', 'polygon', 'scribble', 'burst'];

const PartWholeGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [gamePattern, setGamePattern] = useState<Pattern[]>([]);
    const [options, setOptions] = useState<GameOption[]>([]);
    const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const svgSize = 300;
    const pieceSize = 100;

    const getPatternDefs = useCallback((pattern: Pattern): string => {
        const { size, backgroundColor, foregroundColor, type, id, props } = pattern;
        const sw = size / 6;
        const br = `<rect width="${size}" height="${size}" fill="${backgroundColor}"/>`;
        switch (type) {
            case 'dots': return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="${foregroundColor}"/></pattern>`;
            case 'stripes': return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<rect width="${size}" height="${size / 3}" fill="${foregroundColor}"/></pattern>`;
            case 'zigzag': return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<path d="M0 0 L${size / 2} ${size} L${size} 0" stroke="${foregroundColor}" fill="none" stroke-width="${sw}"/></pattern>`;
            case 'waves': return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<path d="M0 ${size / 2} Q${size / 4} 0 ${size / 2} ${size / 2} T${size} ${size / 2}" stroke="${foregroundColor}" fill="none" stroke-width="${sw}"/></pattern>`;
            case 'checkerboard': return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<rect width="${size / 2}" height="${size / 2}" fill="${foregroundColor}"/><rect x="${size / 2}" y="${size / 2}" width="${size / 2}" height="${size / 2}" fill="${foregroundColor}"/></pattern>`;
            case 'crosshatch': return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<path d="M0 0 L${size} ${size} M0 ${size} L${size} 0" stroke="${foregroundColor}" stroke-width="${sw}"/></pattern>`;
            case 'star': { const p = props?.points || 5; let d = ''; for (let i = 0; i < p * 2; i++) { const r = i % 2 === 0 ? size / 2.5 : size / 4; const x = size / 2 + Math.cos(i * Math.PI / p) * r; const y = size / 2 + Math.sin(i * Math.PI / p) * r; d += (i === 0 ? 'M' : 'L') + `${x},${y}`; } return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<path d="${d}Z" fill="${foregroundColor}"/></pattern>`; }
            case 'polygon': { const s = props?.sides || 6; let d = ''; for (let i = 0; i < s; i++) { const x = size / 2 + Math.cos(i * 2 * Math.PI / s) * (size / 2.5); const y = size / 2 + Math.sin(i * 2 * Math.PI / s) * (size / 2.5); d += (i === 0 ? 'M' : 'L') + `${x},${y}`; } return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<path d="${d}Z" fill="${foregroundColor}"/></pattern>`; }
            case 'scribble': return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<path d="${props?.pathData}" stroke="${foregroundColor}" fill="none" stroke-width="${sw}" stroke-linecap="round"/></pattern>`;
            case 'burst': { const l = props?.lines || 8; let d = ''; for (let i = 0; i < l; i++) { const x2 = size / 2 + Math.cos(i * 2 * Math.PI / l) * (size / 2); const y2 = size / 2 + Math.sin(i * 2 * Math.PI / l) * (size / 2); d += `M${size / 2},${size / 2} L${x2},${y2} `; } return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}<path d="${d}" stroke="${foregroundColor}" stroke-width="${sw}"/></pattern>`; }
            default: return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${br}</pattern>`;
        }
    }, []);

    const generatePattern = useCallback((): Pattern => {
        const type = PATTERN_TYPES[Math.floor(Math.random() * PATTERN_TYPES.length)];
        const bc = COLORS[Math.floor(Math.random() * COLORS.length)];
        const fc = COLORS.filter(c => c !== bc)[Math.floor(Math.random() * (COLORS.length - 1))];
        const sz = 30 + Math.random() * 40;
        const props: PatternProps = {};
        if (type === 'star') props.points = 4 + Math.floor(Math.random() * 5);
        if (type === 'polygon') props.sides = 3 + Math.floor(Math.random() * 6);
        if (type === 'burst') props.lines = 6 + Math.floor(Math.random() * 10);
        if (type === 'scribble') { const pts = Array.from({ length: 4 }, () => ({ x: Math.random() * sz, y: Math.random() * sz })); props.pathData = `M${pts[0].x},${pts[0].y} Q${pts[1].x},${pts[1].y} ${pts[2].x},${pts[2].y} T${pts[3].x},${pts[3].y}`; }
        const b: Pattern = { defs: '', type, backgroundColor: bc, foregroundColor: fc, size: sz, rotation: Math.random() * 360, opacity: 0.85 + Math.random() * 0.15, id: `p-${Math.random().toString(36).slice(2, 9)}`, props };
        return { ...b, defs: getPatternDefs(b) };
    }, [getPatternDefs]);

    const distortColor = (hex: string, intensity: number = 15): string => {
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        const adj = (c: number) => Math.max(0, Math.min(255, c + Math.round((Math.random() - 0.5) * intensity))).toString(16).padStart(2, '0');
        return `#${adj(r)}${adj(g)}${adj(b)}`;
    };

    const setupRound = useCallback(() => {
        const count = Math.min(Math.floor(level / 3) + 2, 8);
        const p = Array.from({ length: count }, () => generatePattern());
        setGamePattern(p);
        const tx = Math.floor(Math.random() * (svgSize - pieceSize)), ty = Math.floor(Math.random() * (svgSize - pieceSize));
        setTargetPos({ x: tx, y: ty });
        const correct: GameOption = { pattern: p, isCorrect: true };
        const distractors: GameOption[] = Array.from({ length: 3 }, () => {
            const wp = p.map(pi => {
                const up = { ...pi, id: `p-${Math.random().toString(36).slice(2, 9)}`, rotation: pi.rotation + (Math.random() - 0.5) * (level + 5), size: pi.size * (0.9 + Math.random() * 0.2), backgroundColor: distortColor(pi.backgroundColor), foregroundColor: distortColor(pi.foregroundColor) };
                return { ...up, defs: getPatternDefs(up) };
            });
            return { pattern: wp, isCorrect: false };
        });
        setOptions([...distractors, correct].sort(() => Math.random() - 0.5));
    }, [level, generatePattern, getPatternDefs]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing'); setScore(0); setLevel(1); setLives(INITIAL_LIVES);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        setupRound(); playSound('slide');
    }, [setupRound, playSound, examMode, examTimeLimit]);

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

    const handleAnswer = (option: GameOption) => {
        if (phase !== 'playing' || options.length === 0) return;
        const correct = option.isCorrect;
        showFeedback(correct); playSound(correct ? 'correct' : 'incorrect');
        setPhase('feedback');
        setTimeout(() => {
            dismissFeedback();
            if (correct) {
                setScore(s => s + 100 + level * 20);
                if (level >= MAX_LEVEL) setPhase('victory');
                else { setLevel(l => l + 1); setPhase('playing'); setupRound(); }
            } else {
                setLives(l => {
                    const nl = l - 1;
                    if (nl <= 0) setTimeout(() => setPhase('game_over'), 500);
                    else { setPhase('playing'); setupRound(); }
                    return nl;
                });
            }
        }, 1500);
    };

    const skipQuestion = useCallback(() => {
        if (phase !== 'playing') return;
        setScore(s => Math.max(0, s - 50)); setupRound();
    }, [phase, setupRound]);

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

    const PatternSVG = ({ pattern, size, viewBox, isMain = false }: { pattern: Pattern[], size: number, viewBox?: string, isMain?: boolean }) => (
        <svg width={size} height={size} viewBox={viewBox || `0 0 ${svgSize} ${svgSize}`} className="rounded-3xl overflow-hidden shadow-2xl">
            {pattern.map((p, i) => (
                <React.Fragment key={`${p.id}-${i}`}>
                    <defs dangerouslySetInnerHTML={{ __html: p.defs }} />
                    <rect x="0" y="0" width={svgSize} height={svgSize} fill={`url(#${p.id})`} opacity={p.opacity} transform={`rotate(${p.rotation} ${svgSize / 2} ${svgSize / 2})`} />
                </React.Fragment>
            ))}
            {isMain && <rect x={targetPos.x} y={targetPos.y} width={pieceSize} height={pieceSize} fill="white" stroke="white" strokeWidth="4" rx="16" style={{ filter: 'drop-shadow(0 0 15px rgba(0,0,0,0.4))' }} />}
        </svg>
    );

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Puzzle size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">Parça Bütün</h1>
                    <p className="text-slate-300 mb-8 text-lg">Büyük desendeki eksik parçayı bul ve görsel algını test et. Renklerin ve desenlerin uyumuna dikkat et!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-teal-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-teal-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Desendeki <strong>beyaz boşluğa</strong> odaklan</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-teal-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Aşağıdaki parçalardan <strong>uygun olanı</strong> seç</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-teal-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Hızlı ol, seviye ilerledikçe <strong>desenler karmaşıklaşır</strong>!</span></li>
                        </ul>
                    </div>
                    <div className="bg-teal-500/10 text-teal-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-teal-500/30 font-bold uppercase tracking-widest">TUZÖ 4.2.1 Parça-Bütün İlişkileri</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-950 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20 text-white">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-950'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)', border: '1px solid rgba(20, 184, 166, 0.3)' }}><Zap className="text-teal-400" size={18} /><span className="font-bold text-teal-400">Seviye {level}/{MAX_LEVEL}</span></div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={skipQuestion} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/20 hover:bg-white/20 transition-all font-bold text-sm text-teal-300"><RefreshCw size={16} /><span>Atla</span></motion.button>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'feedback') && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 md:p-12 border border-white/10 shadow-3xl text-center">
                                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-6 flex items-center justify-center gap-2"><Eye size={16} /> Deseni İncele</p>
                                <div className="inline-block p-4 bg-white/5 rounded-[40px] border border-white/5 shadow-inner"><PatternSVG pattern={gamePattern} size={svgSize} isMain={true} /></div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 md:p-12 border border-white/10 shadow-3xl">
                                <h2 className="text-2xl font-black text-center mb-8 flex items-center justify-center gap-3">Eksik Parçayı Bul! <Sparkles size={24} className="text-yellow-400" /></h2>
                                <div className="grid grid-cols-2 gap-6">
                                    {options.map((opt, idx) => (
                                        <motion.button key={idx} whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }} onClick={() => handleAnswer(opt)} disabled={phase === 'feedback'} className="p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all shadow-xl flex items-center justify-center relative overflow-hidden" style={{ borderColor: phase === 'feedback' && opt.isCorrect ? '#10b981' : 'rgba(255,255,255,0.1)' }}>
                                            <PatternSVG pattern={opt.pattern} size={130} viewBox={`${targetPos.x} ${targetPos.y} ${pieceSize} ${pieceSize}`} />
                                            {phase === 'feedback' && opt.isCorrect && <div className="absolute inset-0 bg-emerald-500/20 pointer-events-none" />}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-teal-500 to-emerald-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-teal-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Desen Ustası!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Parça-bütün ilişkisini kavrama ve görsel tamamlama becerin harika!' : 'Daha fazla pratikle görsel zekanı ve dikkatini geliştirebilirsin.'}</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm font-bold">Skor</p><p className="text-3xl font-black text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm font-bold">Seviye</p><p className="text-3xl font-black text-teal-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default PartWholeGame;
