import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Eye, Timer as TimerIcon, Trophy,
    RotateCcw, ChevronLeft, Play,
    Circle, Square, Triangle, Star, Diamond,
    Cross, Moon, Heart, Sparkles, Zap, Octagon
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

// ─── Constants ───────────────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = 'golge-dedektifi';

// Visually distinct shapes: Circle(0), Square(1), Triangle(2), Diamond(3), Star(4), Octagon(5), Cross(6), Moon(7), Heart(8)
const SHAPE_ICONS = [Circle, Square, Triangle, Diamond, Star, Octagon, Cross, Moon, Heart];
// High-contrast colors with good visual separation
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96F97B', '#FFEAA7', '#FF9FF3', '#FFA07A', '#FFFFFF'];

interface PatternItem { id: string; iconIdx: number; color: string; x: number; y: number; rotation: number; scale: number; }
type GameStatus = 'waiting' | 'preview' | 'deciding' | 'result' | 'gameover' | 'victory';

const ShadowDetectiveGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });
    const location = useLocation();
    const navigate = useNavigate();

    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [correctPattern, setCorrectPattern] = useState<PatternItem[]>([]);
    const [options, setOptions] = useState<PatternItem[][]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [previewTimer, setPreviewTimer] = useState(3);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const getSig = (p: PatternItem[]) => p.map(i => `${i.iconIdx}-${i.color}-${Math.round(i.x)}-${Math.round(i.y)}-${i.rotation}`).sort().join('|');

    const genPattern = useCallback((count: number) => {
        const p: PatternItem[] = [];
        for (let i = 0; i < count; i++) {
            let x: number, y: number, tooClose: boolean, att = 0;
            do { x = Math.random() * 70 + 15; y = Math.random() * 70 + 15; tooClose = p.some(curr => Math.sqrt(Math.pow(curr.x - x, 2) + Math.pow(curr.y - y, 2)) < 25); att++; } while (tooClose && att < 50);
            p.push({ id: Math.random().toString(36).substr(2, 9), iconIdx: Math.floor(Math.random() * SHAPE_ICONS.length), color: COLORS[Math.floor(Math.random() * COLORS.length)], x, y, rotation: Math.floor(Math.random() * 8) * 45, scale: 0.9 + Math.random() * 0.5 });
        }
        return p;
    }, []);

    // Shapes that look identical when rotated 90° (Circle, Square, Star, Octagon, Cross)
    const SYMMETRIC_ICONS = new Set([0, 1, 4, 5, 6]);

    const genDist = (base: PatternItem[]) => {
        const d: PatternItem[] = JSON.parse(JSON.stringify(base));
        const idx = Math.floor(Math.random() * d.length);
        // Pick mutation type, but skip rotation for symmetric shapes
        const types = [0, 1, 2, 3];
        if (SYMMETRIC_ICONS.has(d[idx].iconIdx)) {
            types.splice(types.indexOf(1), 1); // remove rotation option
        }
        const type = types[Math.floor(Math.random() * types.length)];
        if (type === 0) {
            // Pick a distinctly different color
            d[idx].color = COLORS.filter(c => c !== d[idx].color)[Math.floor(Math.random() * (COLORS.length - 1))];
        } else if (type === 1) {
            d[idx].rotation = (d[idx].rotation + 90) % 360;
        } else if (type === 2) {
            // Jump by 3-5 positions for visually distinct shape change
            const jump = 3 + Math.floor(Math.random() * 3);
            d[idx].iconIdx = (d[idx].iconIdx + jump) % SHAPE_ICONS.length;
        } else {
            // Larger position shift for noticeable difference
            const shift = 25;
            d[idx].x = Math.max(15, Math.min(85, d[idx].x + (d[idx].x > 50 ? -shift : shift)));
            d[idx].y = Math.max(15, Math.min(85, d[idx].y + (d[idx].y > 50 ? -shift : shift)));
        }
        return d;
    };

    const startLevel = useCallback(() => {
        const count = Math.min(6, 2 + Math.floor(level / 4));
        const corr = genPattern(count), corrSig = getSig(corr), opts = [corr], sigs = new Set([corrSig]);
        while (opts.length < 4) { const d = genDist(corr), s = getSig(d); if (!sigs.has(s)) { opts.push(d); sigs.add(s); } }
        setCorrectPattern(corr); setOptions(opts.sort(() => Math.random() - 0.5));
        setSelectedIndex(null); setPreviewTimer(3); setStatus('preview'); playSound('detective_click');
    }, [level, genPattern, playSound]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0); setStatus('waiting'); setLevel(1); setScore(0); setLives(INITIAL_LIVES); setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false; startLevel();
    }, [startLevel, examMode, examTimeLimit]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && status === 'waiting') handleStart(); }, [location.state, status, handleStart, examMode]);

    useEffect(() => {
        if (status === 'preview' && previewTimer > 0) { const itv = setInterval(() => setPreviewTimer(p => p - 1), 1000); return () => clearInterval(itv); }
        else if (status === 'preview' && previewTimer === 0) { setStatus('deciding'); playSound('detective_mystery'); }
    }, [status, previewTimer, playSound]);

    useEffect(() => {
        if (status === 'deciding' && timeLeft > 0) { timerRef.current = setInterval(() => setTimeLeft(p => { if (p <= 1) { clearInterval(timerRef.current!); setStatus('gameover'); return 0; } return p - 1; }), 1000); return () => clearInterval(timerRef.current!); }
    }, [status, timeLeft]);

    const handleSelect = (idx: number) => {
        if (status !== 'deciding' || selectedIndex !== null) return;
        setSelectedIndex(idx); const correct = getSig(options[idx]) === getSig(correctPattern);
        showFeedback(correct); playSound(correct ? 'detective_correct' : 'detective_incorrect');
        setTimeout(() => {
            dismissFeedback();
            if (correct) {
                setScore(p => p + level * 10);
                if (level >= MAX_LEVEL) setStatus('victory');
                else { setLevel(p => p + 1); startLevel(); }
            } else {
                setLives(l => {
                    const nl = l - 1;
                    if (nl <= 0) setTimeout(() => setStatus('gameover'), 500);
                    else startLevel();
                    return nl;
                });
            }
        }, 1500);
    };

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) { await submitResult(level >= 5 || status === 'victory', score, MAX_LEVEL * 100, duration); navigate("/atolyeler/sinav-simulasyonu/devam"); return; }
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: duration, metadata: { level_reached: level, victory: status === 'victory' } });
    }, [status, score, level, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => { if (status === 'gameover' || status === 'victory') handleFinish(); }, [status, handleFinish]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    const renderPattern = (items: PatternItem[], size: number = 300) => (
        <div className="relative overflow-hidden rounded-[40%] bg-indigo-950/20 border border-white/10 shadow-inner" style={{ width: size, height: size }}>
            {items.map((it) => {
                const Icon = SHAPE_ICONS[it.iconIdx]; return (
                    <motion.div key={it.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: it.scale, opacity: 1 }} style={{ position: 'absolute', left: `${it.x}%`, top: `${it.y}%`, color: it.color, transform: `translate(-50%, -50%) rotate(${it.rotation}deg)`, filter: `drop-shadow(0 2px 4px ${it.color}40)` }}>
                        <Icon size={size / 8} strokeWidth={2.5} />
                    </motion.div>
                );
            })}
        </div>
    );

    if (status === 'waiting') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Search size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-indigo-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent">Gölge Dedektifi</h1>
                    <p className="text-slate-300 mb-8 text-lg">Şekilleri incele, zihninde kopyala ve benzerleri arasından gerçeği bul. Görsel analiz yeteneğini zirveye taşı!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-indigo-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Ekrana gelen deseni <strong>3 saniye boyunca</strong> dikkatle incele</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-indigo-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Aşağıdaki 4 seçenek arasından <strong>tıpatıp aynısını</strong> bul</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-indigo-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Renk, dönüş ve konum farklarını <strong>bir dedektif gibi</strong> yakala</span></li>
                        </ul>
                    </div>
                    <div className="bg-indigo-500/10 text-indigo-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-indigo-500/30 font-bold uppercase tracking-widest">TUZÖ 5.3.2 Görsel Analiz</div>
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
                    {(status === 'preview' || status === 'deciding' || status === 'result') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-950'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30"><Zap className="text-emerald-400" size={18} /><span className="font-bold text-emerald-400">Seviye {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {status === 'preview' && (
                        <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-8">
                            <div className="flex items-center justify-center gap-3"><Eye className="text-purple-400 animate-pulse" size={32} /><span className="text-2xl font-black text-purple-300 uppercase tracking-widest">Ezberle: {previewTimer}s</span></div>
                            <div className="p-8 bg-white/5 backdrop-blur-3xl rounded-[60px] border-2 border-white/10 shadow-3xl">{renderPattern(correctPattern, 320)}</div>
                            <div className="w-full bg-slate-800/50 h-3 rounded-full max-w-sm mx-auto overflow-hidden border border-white/5"><motion.div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full" initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 3, ease: "linear" }} /></div>
                        </motion.div>
                    )}
                    {(status === 'deciding' || status === 'result') && (
                        <motion.div key="deciding" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-5xl space-y-10">
                            <h2 className="text-2xl font-black text-center text-slate-300 uppercase tracking-widest flex items-center justify-center gap-3">Hangi Desen Doğru? <Search size={24} className="text-indigo-400" /></h2>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {options.map((item, idx) => (
                                    <motion.button key={idx} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} whileHover={selectedIndex === null ? { y: -8, scale: 1.02 } : {}} whileTap={selectedIndex === null ? { scale: 0.98 } : {}} onClick={() => handleSelect(idx)} disabled={selectedIndex !== null} className={`p-4 rounded-[40px] transition-all flex flex-col items-center gap-4 bg-white/5 border border-white/10 shadow-2xl relative overflow-hidden ${selectedIndex === idx && (getSig(options[idx]) === getSig(correctPattern) ? 'bg-emerald-500/20 border-emerald-500 animate-pulse' : 'bg-red-500/20 border-red-500')} ${selectedIndex !== null && getSig(options[idx]) === getSig(correctPattern) ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : ''}`} style={{ boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.05)' }}>
                                        {renderPattern(item, 180)}
                                        <div className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black uppercase text-white/30 tracking-widest">Seçenek {idx + 1}</div>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                    {(status === 'gameover' || status === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-indigo-400 mb-2">{status === 'victory' || level >= 5 ? '🎖️ Usta Dedektif!' : 'Harika!'}</h2>
                            <p className="text-slate-400 mb-6">{status === 'victory' || level >= 5 ? 'Görsel analiz ve detay yakalama becerin tek kelimeyle kusursuz!' : 'Küçük farkları daha hızlı yakalamak için gözlerini eğitmeye devam et.'}</p>
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

export default ShadowDetectiveGame;
