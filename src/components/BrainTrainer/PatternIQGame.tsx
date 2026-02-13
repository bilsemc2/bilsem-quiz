import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon,
    ChevronLeft, Zap, Heart, Shapes, Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import { useSound } from '../../hooks/useSound';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// ============== CONSTANTS ==============
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const WAGON_COUNT = 5;
const GAME_ID = 'patterniq-express';

// ============== TYPES ==============
enum ShapeType { LINE = 'LINE', CIRCLE = 'CIRCLE', SQUARE = 'SQUARE', TRIANGLE = 'TRIANGLE', ARROW = 'ARROW' }
enum TransformationType { ROTATION = 'ROTATION', CLOCK_MOVE = 'CLOCK_MOVE', CORNER_MOVE = 'CORNER_MOVE' }
interface LayerConfig { id: string; shape: ShapeType; color: string; transformation: TransformationType; startValue: number; stepChange: number; size?: number; offset?: number; }
interface PatternData { id: string; difficulty: 'Kolay' | 'Orta' | 'Zor'; layers: LayerConfig[]; description: string; }
interface WagonState { index: number; layerStates: { layerId: string; rotation: number; position: number; visible: boolean; }[]; }
type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

const COLORS = ['#818CF8', '#FB7185', '#34D399', '#FBBF24', '#A78BFA'];
const SHAPES = [ShapeType.LINE, ShapeType.CIRCLE, ShapeType.SQUARE, ShapeType.TRIANGLE, ShapeType.ARROW];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function generatePattern(level: number): PatternData {
    const maxLayers = level <= 5 ? 1 : level <= 12 ? 2 : 3;
    const layerCount = Math.min(getRandomInt(1, maxLayers), 3);
    const difficulty = layerCount === 1 ? 'Kolay' : layerCount === 2 ? 'Orta' : 'Zor';
    const layers: LayerConfig[] = [];
    const usedShapes = new Set<ShapeType>();
    for (let i = 0; i < layerCount; i++) {
        let shape = getRandomItem(SHAPES);
        while (usedShapes.has(shape) && usedShapes.size < SHAPES.length) shape = getRandomItem(SHAPES);
        usedShapes.add(shape);
        const transTypes = [TransformationType.ROTATION, TransformationType.CLOCK_MOVE, TransformationType.CORNER_MOVE];
        let transType = getRandomItem(transTypes);
        if (shape === ShapeType.LINE || shape === ShapeType.ARROW) if (Math.random() > 0.3) transType = TransformationType.ROTATION;
        let startValue = 0, stepChange = 0;
        switch (transType) {
            case TransformationType.ROTATION: startValue = getRandomInt(0, 11) * 30; stepChange = getRandomItem([30, 45, 90, -30, -45, -90]); break;
            case TransformationType.CLOCK_MOVE: startValue = getRandomInt(1, 12); stepChange = getRandomItem([1, 2, 3, -1, -2]); break;
            case TransformationType.CORNER_MOVE: startValue = getRandomInt(0, 3); stepChange = getRandomItem([1, -1]); break;
        }
        layers.push({ id: `layer-${i}`, shape, color: COLORS[i % COLORS.length], transformation: transType, startValue, stepChange, size: shape === ShapeType.LINE ? 40 : 15, offset: transType === TransformationType.ROTATION ? 0 : 30 });
    }
    return { id: Date.now().toString(), difficulty, layers, description: layers.map(l => `${l.shape} (${l.transformation})`).join(' | ') };
}

function calculateWagonState(pattern: PatternData, wagonIndex: number): WagonState {
    const layerStates = pattern.layers.map(layer => {
        let rotation = 0, position = 0;
        if (layer.transformation === TransformationType.ROTATION) rotation = layer.startValue + (layer.stepChange * wagonIndex);
        else if (layer.transformation === TransformationType.CLOCK_MOVE) { const rawPos = layer.startValue + (layer.stepChange * wagonIndex); position = ((rawPos - 1) % 12); if (position < 0) position += 12; position += 1; }
        else if (layer.transformation === TransformationType.CORNER_MOVE) { const rawPos = layer.startValue + (layer.stepChange * wagonIndex); position = rawPos % 4; if (position < 0) position += 4; }
        return { layerId: layer.id, rotation, position, visible: true };
    });
    return { index: wagonIndex, layerStates };
}

function generateOptions(pattern: PatternData, correctIndex: number): WagonState[] {
    const correctState = calculateWagonState(pattern, correctIndex);
    const areStatesEqual = (s1: WagonState, s2: WagonState): boolean => {
        if (s1.layerStates.length !== s2.layerStates.length) return false;
        return s1.layerStates.every((l1, i) => { const l2 = s2.layerStates[i]; const r1 = (l1.rotation % 360 + 360) % 360, r2 = (l2.rotation % 360 + 360) % 360; return l1.layerId === l2.layerId && Math.abs(r1 - r2) < 0.1 && l1.position === l2.position && l1.visible === l2.visible; });
    };
    const options: WagonState[] = [correctState];
    let attempts = 0;
    while (options.length < 4 && attempts < 50) {
        attempts++;
        const fake: WagonState = JSON.parse(JSON.stringify(correctState));
        if (fake.layerStates.length > 0) {
            const layerToMod = getRandomItem(fake.layerStates);
            const config = pattern.layers.find(l => l.id === layerToMod.layerId);
            if (config) {
                if (config.transformation === TransformationType.ROTATION) layerToMod.rotation += getRandomItem([90, 180, 270, 45, -45]);
                else if (config.transformation === TransformationType.CLOCK_MOVE) { let offset = getRandomItem([1, 2, 3, 4, 5, 6]); if (Math.random() > 0.5) offset *= -1; let newPos = layerToMod.position + offset; newPos = ((newPos - 1) % 12); if (newPos < 0) newPos += 12; layerToMod.position = newPos + 1; }
                else if (config.transformation === TransformationType.CORNER_MOVE) layerToMod.position = (layerToMod.position + getRandomItem([1, 2, 3])) % 4;
            }
        }
        if (!options.some(opt => areStatesEqual(opt, fake))) options.push(fake);
    }
    return options.sort(() => Math.random() - 0.5);
}

const WagonView: React.FC<{ state: WagonState; pattern: PatternData; isQuestion?: boolean; isRevealed?: boolean; status?: 'default' | 'correct' | 'wrong'; onClick?: () => void; }> = ({ state, pattern, isQuestion, isRevealed, status = 'default', onClick }) => {
    const renderedLayers = useMemo(() => {
        return state.layerStates.map((ls) => {
            const config = pattern.layers.find(l => l.id === ls.layerId);
            if (!config || !ls.visible) return null;
            let translateX = 50, translateY = 50, rotation = 0;
            if (config.transformation === TransformationType.ROTATION) rotation = ls.rotation;
            else if (config.transformation === TransformationType.CLOCK_MOVE) { const angleRad = ((ls.position - 3) * 30) * (Math.PI / 180); const radius = 35; translateX = 50 + radius * Math.cos(angleRad); translateY = 50 + radius * Math.sin(angleRad); }
            else if (config.transformation === TransformationType.CORNER_MOVE) { const margin = 20; switch (ls.position) { case 0: translateX = margin; translateY = margin; break; case 1: translateX = 100 - margin; translateY = margin; break; case 2: translateX = 100 - margin; translateY = 100 - margin; break; case 3: translateX = margin; translateY = 100 - margin; break; } }
            const cp = { stroke: config.color, strokeWidth: 4, fill: config.shape === ShapeType.CIRCLE || config.shape === ShapeType.SQUARE ? config.color : 'none' };
            const size = config.size || 20, hf = size / 2;
            const om = (x: number, y: number) => <circle cx={x} cy={y} r={3} fill="white" stroke={config.color} strokeWidth={1.5} />;
            let sSvg = null;
            switch (config.shape) {
                case ShapeType.CIRCLE: sSvg = <g><circle cx={0} cy={0} r={hf} {...cp} />{om(0, -hf)}</g>; break;
                case ShapeType.SQUARE: sSvg = <g><rect x={-hf} y={-hf} width={size} height={size} {...cp} />{om(hf - 2, -hf + 2)}</g>; break;
                case ShapeType.TRIANGLE: { const h = size * 0.866; sSvg = <g><polygon points={`0,-${h / 2} -${hf},${h / 2} ${hf},${h / 2}`} {...cp} />{om(0, -h / 2)}</g>; break; }
                case ShapeType.LINE: sSvg = <g><line x1={0} y1={0} x2={0} y2={-35} stroke={config.color} strokeWidth={5} strokeLinecap="round" />{om(0, -35)}</g>; break;
                case ShapeType.ARROW: sSvg = <g><line x1={0} y1={10} x2={0} y2={-30} stroke={config.color} strokeWidth={4} strokeLinecap="round" /><path d="M -10 -20 L 0 -35 L 10 -20" fill="none" stroke={config.color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /></g>; break;
            }
            return <g key={config.id} transform={`translate(${translateX}, ${translateY}) rotate(${rotation})`}>{sSvg}</g>;
        });
    }, [state, pattern.layers]);

    if (isQuestion && !isRevealed) return <div className="w-full aspect-square rounded-2xl bg-white/5 backdrop-blur-sm border-2 border-dashed border-indigo-400/60 flex items-center justify-center animate-pulse"><span className="text-3xl text-indigo-300 font-black">?</span></div>;
    let bc = 'border-white/10', ec = '';
    if (status === 'correct') { bc = 'border-emerald-400 ring-4 ring-emerald-400/20'; ec = 'scale-105 shadow-emerald-500/20'; }
    else if (status === 'wrong') { bc = 'border-red-400 opacity-60'; ec = 'scale-95'; }
    return <div className={`w-full aspect-square rounded-2xl bg-white/5 backdrop-blur-xl border-2 ${bc} ${ec} relative overflow-hidden transition-all duration-300 ${onClick && status === 'default' ? 'cursor-pointer hover:border-indigo-400 hover:bg-white/10 active:scale-95' : ''}`} onClick={onClick}><svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 100 100"><line x1="50" y1="5" x2="50" y2="15" stroke="white" strokeWidth="2" /><line x1="95" y1="50" x2="85" y2="50" stroke="white" strokeWidth="2" /><line x1="50" y1="95" x2="50" y2="85" stroke="white" strokeWidth="2" /><line x1="5" y1="50" x2="15" y2="50" stroke="white" strokeWidth="2" /><circle cx="50" cy="50" r="1.5" fill="white" /></svg><svg className="w-full h-full p-2" viewBox="0 0 100 100">{renderedLayers}</svg></div>;
};

const PatternIQGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [currentPattern, setCurrentPattern] = useState<PatternData | null>(null);
    const [options, setOptions] = useState<WagonState[]>([]);
    const [revealed, setRevealed] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const setupRound = useCallback((lvl: number) => {
        const pat = generatePattern(lvl); setCurrentPattern(pat); setOptions(generateOptions(pat, WAGON_COUNT - 1)); setRevealed(false); setSelectedIndex(null);
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing'); setScore(0); setLevel(1); setLives(INITIAL_LIVES);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        setupRound(1); playSound('slide');
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

    const handleAnswer = (idx: number) => {
        if (phase !== 'playing' || revealed || !currentPattern) return;
        setSelectedIndex(idx); setRevealed(true);
        const correct = (options[idx].layerStates.every((ls, i) => {
            const cs = calculateWagonState(currentPattern, WAGON_COUNT - 1).layerStates[i];
            const r1 = (ls.rotation % 360 + 360) % 360, r2 = (cs.rotation % 360 + 360) % 360;
            return Math.abs(r1 - r2) < 0.1 && ls.position === cs.position;
        }));
        showFeedback(correct); playSound(correct ? 'correct' : 'incorrect');
        setTimeout(() => {
            dismissFeedback();
            if (correct) {
                setScore(s => s + 10 * level);
                if (level >= MAX_LEVEL) setPhase('victory');
                else { setLevel(l => l + 1); setupRound(level + 1); }
            } else {
                setLives(l => {
                    const nl = l - 1;
                    if (nl <= 0) setTimeout(() => setPhase('game_over'), 500);
                    else setupRound(level);
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

    useEffect(() => { if (phase === 'game_over' || phase === 'victory') handleFinish(); }, [phase, handleFinish]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-indigo-400 to-violet-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Shapes size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent">PatternIQ Express</h1>
                    <p className="text-slate-300 mb-8 text-lg">Görsel örüntülerin gizemini çöz ve bir sonraki şekli tahmin et. Mantık ve dikkat yeteneğini zirveye taşı!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-indigo-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Şekillerin nasıl değiştiğine <strong>dikkat et</strong></span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-indigo-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Oluşan <strong>örüntü kuralını bul</strong></span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-indigo-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Sıradaki vagonu <strong>en hızlı şekilde seç</strong></span></li>
                        </ul>
                    </div>
                    <div className="bg-indigo-500/10 text-indigo-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-indigo-500/30 font-bold uppercase tracking-widest">TUZÖ 5.5.1 Örüntü Analizi</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
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
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-950'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}><Zap className="text-emerald-400" size={18} /><span className="font-bold text-emerald-400">Seviye {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'feedback') && currentPattern && (
                        <motion.div key="game" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-4xl">
                            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 sm:p-10 border border-white/10 shadow-3xl mb-8 overflow-hidden">
                                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest text-center mb-10 flex items-center justify-center gap-3"><Shapes size={20} /> Örüntüyü Çöz</p>
                                <div className="grid grid-cols-5 items-center gap-1 sm:gap-2 md:gap-4 w-full max-w-2xl mx-auto">
                                    {Array.from({ length: WAGON_COUNT }).map((_, idx) => {
                                        const state = calculateWagonState(currentPattern, idx);
                                        const isLast = idx === WAGON_COUNT - 1;
                                        return (
                                            <div key={idx} className="flex items-center gap-1 sm:gap-2">
                                                <div className="w-full">
                                                    <WagonView state={state} pattern={currentPattern} isQuestion={isLast} isRevealed={revealed} status={(isLast && revealed) ? 'correct' : 'default'} />
                                                </div>
                                                {!isLast && <div className="w-2 sm:w-4 h-1 bg-white/10 rounded-full shrink-0" />}
                                            </div>
                                        );
                                    })}
                                </div>
                                {currentPattern.difficulty && <div className="mt-8 text-center"><span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${currentPattern.difficulty === 'Kolay' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : currentPattern.difficulty === 'Orta' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{currentPattern.difficulty}</span></div>}
                            </div>
                            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 border border-white/10 shadow-3xl">
                                <h2 className="text-xl font-black text-center mb-8 flex items-center justify-center gap-3">Sıradaki Vagon Hangisi? <Sparkles size={24} className="text-yellow-400" /></h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                                    {options.map((opt, idx) => (
                                        <div key={idx} className="flex flex-col items-center gap-3">
                                            <div className="w-full max-w-[120px]">
                                                <WagonView state={opt} pattern={currentPattern} onClick={() => handleAnswer(idx)} status={revealed ? (idx === selectedIndex ? (feedbackState?.correct ? 'correct' : 'wrong') : (checkAnswer(opt, calculateWagonState(currentPattern, WAGON_COUNT - 1)) ? 'correct' : 'default')) : 'default'} />
                                            </div>
                                            <span className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest">SEÇENEK {String.fromCharCode(65 + idx)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-violet-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-indigo-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Örüntü Şampiyonu!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Görsel örüntüleri analiz etme ve mantıksal çıkarsama becerin tek kelimeyle mükemmel!' : 'Daha fazla pratikle örüntüleri çözme hızını ve başarını artırabilirsin.'}</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm font-bold">Skor</p><p className="text-3xl font-black text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm font-bold">Seviye</p><p className="text-3xl font-black text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

const checkAnswer = (s1: WagonState, s2: WagonState): boolean => {
    if (s1.layerStates.length !== s2.layerStates.length) return false;
    return s1.layerStates.every((l1, i) => { const l2 = s2.layerStates[i]; const r1 = (l1.rotation % 360 + 360) % 360, r2 = (l2.rotation % 360 + 360) % 360; return Math.abs(r1 - r2) < 0.1 && l1.position === l2.position; });
};

export default PatternIQGame;
