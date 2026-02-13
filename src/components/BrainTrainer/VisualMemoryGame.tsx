import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon,
    ChevronLeft, Zap, Heart, Eye, Sparkles,
    Circle, Square, Triangle, Hexagon, Diamond,
    Cloud, Sun, Moon, Anchor, Music, Ghost, Flower, Crown
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
const GAME_ID = 'gorsel-hafiza';

type Phase = 'welcome' | 'memorize' | 'transition' | 'recall' | 'feedback' | 'game_over' | 'victory';
type IconType = 'Star' | 'Circle' | 'Square' | 'Triangle' | 'Hexagon' | 'Diamond' | 'Heart' | 'Cloud' | 'Sun' | 'Moon' | 'Zap' | 'Anchor' | 'Music' | 'Ghost' | 'Flower' | 'Crown';
interface GridCell { id: string; icon: IconType | null; color: string; }
const ICON_MAP: Record<IconType, any> = { Star, Circle, Square, Triangle, Hexagon, Diamond, Heart, Cloud, Sun, Moon, Zap, Anchor, Music, Ghost, Flower, Crown };
const ICON_TYPES = Object.keys(ICON_MAP) as IconType[];
const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E'];

interface LevelConfig { gridSize: number; items: number; memorizeMs: number; }
const LEVEL_CONFIG: Record<number, LevelConfig> = {
    1: { gridSize: 3, items: 3, memorizeMs: 3000 }, 2: { gridSize: 3, items: 3, memorizeMs: 2800 }, 3: { gridSize: 3, items: 4, memorizeMs: 3000 },
    4: { gridSize: 3, items: 5, memorizeMs: 3000 }, 5: { gridSize: 3, items: 5, memorizeMs: 2500 }, 6: { gridSize: 3, items: 6, memorizeMs: 3000 },
    7: { gridSize: 3, items: 7, memorizeMs: 2500 }, 8: { gridSize: 4, items: 6, memorizeMs: 3500 }, 9: { gridSize: 4, items: 7, memorizeMs: 3000 },
    10: { gridSize: 4, items: 8, memorizeMs: 3000 }, 11: { gridSize: 4, items: 9, memorizeMs: 2500 }, 12: { gridSize: 4, items: 9, memorizeMs: 2000 },
    13: { gridSize: 4, items: 10, memorizeMs: 2500 }, 14: { gridSize: 4, items: 11, memorizeMs: 2500 }, 15: { gridSize: 4, items: 12, memorizeMs: 2000 },
    16: { gridSize: 5, items: 10, memorizeMs: 3000 }, 17: { gridSize: 5, items: 12, memorizeMs: 2500 }, 18: { gridSize: 5, items: 13, memorizeMs: 2000 },
    19: { gridSize: 5, items: 14, memorizeMs: 1800 }, 20: { gridSize: 5, items: 15, memorizeMs: 1500 },
};

const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a;
};

const genGrid = (gs: number, ic: number): GridCell[] => {
    const cells: GridCell[] = Array.from({ length: gs * gs }, (_, i) => ({ id: `c-${i}`, icon: null, color: '#6B7280' }));
    shuffle(Array.from({ length: gs * gs }, (_, i) => i)).slice(0, ic).forEach(idx => { cells[idx] = { ...cells[idx], icon: getRandom(ICON_TYPES), color: getRandom(COLORS) }; });
    return cells;
};

const createModified = (orig: GridCell[]) => {
    const grid = orig.map(c => ({ ...c })); const act = grid.map((c, i) => c.icon ? i : -1).filter(i => i !== -1);
    const idx = getRandom(act); const old = grid[idx].icon; let next; do { next = getRandom(ICON_TYPES); } while (next === old);
    grid[idx] = { ...grid[idx], icon: next, color: getRandom(COLORS) }; return { grid, targetId: grid[idx].id };
};

const VisualMemoryGame: React.FC = () => {
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
    const [gridBefore, setGridBefore] = useState<GridCell[]>([]);
    const [gridAfter, setGridAfter] = useState<GridCell[]>([]);
    const [targetCellId, setTargetCellId] = useState<string | null>(null);
    const [userSelectedId, setUserSelectedId] = useState<string | null>(null);
    const [memTimeLeft, setMemTimeLeft] = useState(0);
    const [memTimeMax, setMemTimeMax] = useState(0);
    const [gridSize, setGridSize] = useState(3);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0); setPhase('memorize'); setScore(0); setLives(INITIAL_LIVES); setLevel(1); setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false; playSound('slide');
        const cfg = LEVEL_CONFIG[1]; setGridSize(cfg.gridSize); setGridBefore(genGrid(cfg.gridSize, cfg.items)); setGridAfter([]); setTargetCellId(null); setUserSelectedId(null); setMemTimeMax(cfg.memorizeMs); setMemTimeLeft(cfg.memorizeMs);
    }, [examMode, examTimeLimit, playSound]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart(); }, [location.state, examMode, phase, handleStart]);

    useEffect(() => {
        if ((phase === 'memorize' || phase === 'transition' || phase === 'recall') && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

    useEffect(() => {
        if (phase === 'memorize' && memTimeLeft > 0) {
            const int = setInterval(() => setMemTimeLeft(prev => Math.max(0, prev - 100)), 100);
            return () => clearInterval(int);
        } else if (phase === 'memorize' && memTimeLeft <= 0 && gridBefore.length > 0) {
            setPhase('transition'); playSound('slide');
            setTimeout(() => { const { grid, targetId } = createModified(gridBefore); setGridAfter(grid); setTargetCellId(targetId); setPhase('recall'); }, 800);
        }
    }, [phase, memTimeLeft, gridBefore, playSound]);

    const handleFinish = useCallback(async (isVictory: boolean) => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) { await submitResult(isVictory || level >= 5, score, MAX_LEVEL * 100, duration); navigate('/atolyeler/sinav-simulasyonu/devam'); return; }
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: duration, metadata: { level_reached: level, victory: isVictory } });
    }, [score, level, examMode, submitResult, navigate, saveGamePlay]);

    useEffect(() => { if (phase === 'game_over' || phase === 'victory') handleFinish(phase === 'victory'); }, [phase, handleFinish]);

    const handleCellClick = (cid: string) => {
        if (phase !== 'recall' || !!feedbackState) return;
        setUserSelectedId(cid); const correct = cid === targetCellId; playSound(correct ? 'correct' : 'incorrect'); showFeedback(correct);
        setTimeout(() => {
            dismissFeedback();
            if (correct) {
                setScore(p => p + level * 10);
                if (level >= MAX_LEVEL) setPhase('victory');
                else { const nl = level + 1; setLevel(nl); const cfg = LEVEL_CONFIG[nl]; setGridSize(cfg.gridSize); setGridBefore(genGrid(cfg.gridSize, cfg.items)); setGridAfter([]); setTargetCellId(null); setUserSelectedId(null); setMemTimeMax(cfg.memorizeMs); setMemTimeLeft(cfg.memorizeMs); setPhase('memorize'); }
            } else {
                setLives(l => { const nl = l - 1; if (nl <= 0) setPhase('game_over'); else { const cfg = LEVEL_CONFIG[level]; setMemTimeLeft(cfg.memorizeMs); setPhase('memorize'); } return nl; });
            }
        }, 1500);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    const renderGrid = (grid: GridCell[], interactive: boolean) => {
        const cols = gridSize === 3 ? 'grid-cols-3' : gridSize === 4 ? 'grid-cols-4' : 'grid-cols-5';
        const sz = gridSize <= 3 ? 'w-20 h-20 sm:w-24 sm:h-24' : gridSize === 4 ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-14 h-14 sm:w-16 sm:h-16';
        const isz = gridSize <= 3 ? 36 : gridSize === 4 ? 28 : 22;
        return (
            <div className={`grid ${cols} gap-3 sm:gap-4 mx-auto`} style={{ maxWidth: gridSize <= 3 ? '320px' : gridSize === 4 ? '380px' : '400px' }}>
                {grid.map(c => {
                    const Ic = c.icon ? ICON_MAP[c.icon] : null;
                    const isT = !!feedbackState && c.id === targetCellId;
                    const isW = !!feedbackState && userSelectedId === c.id && c.id !== targetCellId;
                    return (
                        <motion.button key={c.id} whileHover={interactive && !feedbackState ? { scale: 1.05, y: -4 } : {}} whileTap={interactive && !feedbackState ? { scale: 0.95 } : {}} onClick={() => interactive && !feedbackState && handleCellClick(c.id)} className={`${sz} rounded-[30%] flex items-center justify-center transition-all duration-300 relative shadow-xl overflow-hidden ${interactive && !feedbackState ? 'cursor-pointer hover:bg-white/10' : ''}`} style={{ background: isT ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : isW ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)' : 'rgba(255,255,255,0.05)', border: `2px solid ${isT ? '#10B981' : isW ? '#EF4444' : 'rgba(255,255,255,0.1)'}`, boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.2)' }}>
                            {Ic ? <span style={{ color: c.color }}><Ic size={isz} strokeWidth={2.5} className="drop-shadow-lg" /></span> : <div className="w-2 h-2 rounded-full bg-white/5" />}
                        </motion.button>
                    );
                })}
            </div>
        );
    };

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-sky-950 to-indigo-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Eye size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">Görsel Hafıza</h1>
                    <p className="text-slate-300 mb-8 text-lg">Sembollerin yerlerini ezberle, değişen şekli anında bul ve görsel zekanı kanıtla!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-sky-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-sky-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Ekranda beliren sembolleri ve yerlerini <strong>hızla ezberle</strong></span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-sky-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Süre dolunca grid yenilenecek ve <strong>bir sembol değişecek</strong></span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-sky-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Değişen sembolü bul ve üzerine <strong>dokun</strong></span></li>
                        </ul>
                    </div>
                    <div className="bg-sky-500/10 text-sky-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-sky-500/30 font-bold uppercase tracking-widest">TUZÖ 5.4.2 Görsel Kısa Süreli Bellek</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-sky-950 to-indigo-950 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
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
                    {phase === 'memorize' && (
                        <motion.div key="mem" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="w-full flex flex-col items-center">
                            <div className="mb-8 text-center"><h2 className="text-3xl font-black text-sky-400 mb-2">EZBERLE!</h2><p className="text-slate-400 uppercase tracking-widest text-xs font-bold">Sembollerin yerlerini aklında tut</p></div>
                            {renderGrid(gridBefore, false)}
                            <div className="w-full max-w-xs mt-10 h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-inner">
                                <motion.div className="h-full bg-gradient-to-r from-sky-400 to-indigo-500" style={{ width: `${(memTimeLeft / memTimeMax) * 100}%` }} transition={{ duration: 0.1, ease: 'linear' }} />
                            </div>
                        </motion.div>
                    )}

                    {phase === 'transition' && (
                        <motion.div key="trans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center"><div className="w-16 h-16 border-4 border-sky-500/20 border-t-sky-400 rounded-full animate-spin mb-4" /><p className="text-sky-400 font-bold animate-pulse uppercase tracking-widest">HAZIRLAN...</p></motion.div>
                    )}

                    {phase === 'recall' && (
                        <motion.div key="recall" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex flex-col items-center">
                            <div className="mb-8 text-center"><h2 className="text-3xl font-black text-amber-400 mb-2">HANGİSİ DEĞİŞTİ?</h2><p className="text-slate-400 uppercase tracking-widest text-xs font-bold">Değişen sembolü bul ve dokun</p></div>
                            {renderGrid(gridAfter, true)}
                        </motion.div>
                    )}

                    {phase === 'feedback' && (
                        <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center">
                            <div className="mb-8 text-center"><h2 className={`text-3xl font-black ${feedbackState?.correct ? 'text-emerald-400' : 'text-red-400'}`}>{feedbackState?.correct ? 'TEBRİKLER!' : 'YANLIŞ!'}</h2></div>
                            {renderGrid(gridAfter, false)}
                            <GameFeedbackBanner feedback={feedbackState} />
                        </motion.div>
                    )}

                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-violet-500 to-purple-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-violet-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Hafıza Ustası!' : 'Harika!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Görsel odaklanma ve kısa süreli bellek gücün tek kelimeyle harika!' : 'Sembollerin formlarına ve renklerine daha çok odaklanmalısın!'}</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm font-bold">Skor</p><p className="text-3xl font-black text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm font-bold">Seviye</p><p className="text-3xl font-black text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default VisualMemoryGame;
