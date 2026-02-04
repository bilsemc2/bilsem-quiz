import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    ChevronLeft, Zap, Heart, Search, Home,
    CheckCircle2, XCircle, Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

// --- Puzzle Generator Utility ---
class PuzzleGenerator {
    static generate(seed: string): string {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        const s = seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const random = (i: number) => {
            const x = Math.sin(s + i) * 10000;
            return x - Math.floor(x);
        };

        const grad = ctx.createLinearGradient(0, 0, size, size);
        const baseHue = Math.floor(random(1) * 360);
        grad.addColorStop(0, `hsl(${baseHue}, 50%, 85%)`);
        grad.addColorStop(1, `hsl(${(baseHue + 60) % 360}, 50%, 80%)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        for (let i = 0; i < 250; i++) {
            const x = random(i * 2.5) * size;
            const y = random(i * 3.7) * size;
            const shapeSize = 15 + random(i * 4.2) * 85;
            const hue = Math.floor(random(i * 5.1) * 360);
            const opacity = 0.4 + random(i * 6.3) * 0.4;
            const type = Math.floor(random(i * 7.8) * 6);

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(random(i * 8.9) * Math.PI * 2);
            ctx.fillStyle = `hsla(${hue}, 75%, 55%, ${opacity})`;
            ctx.strokeStyle = `hsla(${hue}, 85%, 25%, 0.7)`;
            ctx.lineWidth = 1.5 + random(i * 9.2) * 2;
            ctx.beginPath();
            if (type === 0) ctx.rect(-shapeSize / 2, -shapeSize / 2, shapeSize, shapeSize);
            else if (type === 1) ctx.arc(0, 0, shapeSize / 2, 0, Math.PI * 2);
            else if (type === 2) {
                ctx.moveTo(0, -shapeSize / 2);
                ctx.lineTo(shapeSize / 2, shapeSize / 2);
                ctx.lineTo(-shapeSize / 2, shapeSize / 2);
            } else if (type === 3) {
                for (let j = 0; j < 5; j++) {
                    ctx.lineTo(Math.cos((j * 72) * Math.PI / 180) * shapeSize / 2, Math.sin((j * 72) * Math.PI / 180) * shapeSize / 2);
                    ctx.lineTo(Math.cos((j * 72 + 36) * Math.PI / 180) * shapeSize / 4, Math.sin((j * 72 + 36) * Math.PI / 180) * shapeSize / 4);
                }
            } else if (type === 4) {
                for (let j = 0; j < 6; j++) ctx.lineTo(Math.cos((j * 60) * Math.PI / 180) * shapeSize / 2, Math.sin((j * 60) * Math.PI / 180) * shapeSize / 2);
            } else ctx.ellipse(0, 0, shapeSize / 2, shapeSize / 4, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            if (random(i) > 0.4) ctx.stroke();
            ctx.restore();
        }

        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < size; i += 40) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
        }

        const imgData = ctx.getImageData(0, 0, size, size);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const n = (random(i * 0.1) - 0.5) * 20;
            data[i] = Math.max(0, Math.min(255, data[i] + n));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
        }
        ctx.putImageData(imgData, 0, 0);
        return canvas.toDataURL('image/png');
    }
}

// --- Game Constants ---
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const SELECTION_SIZE = 100;

// Child-friendly messages
const SUCCESS_MESSAGES = [
    "Mükemmel göz! 👁️",
    "Harikasın! ⭐",
    "Tam isabet! 🎯",
    "Süpersin! 🌟",
    "Keskin dikkat! 🔍",
];

const FAIL_MESSAGES = [
    "Tekrar bak! 👀",
    "Biraz daha dikkat! 🎯",
    "Yaklaştın! 💪",
];

type Phase = 'welcome' | 'playing' | 'game_over' | 'victory';

interface GameLevel {
    imageUrl: string;
    targetBox: { x: number; y: number; width: number; height: number };
    targetThumbnail: string;
}

const PuzzleMasterGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();

    // Exam Mode Props
    const examMode = location.state?.examMode || false;

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [levelNumber, setLevelNumber] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [gameLevel, setGameLevel] = useState<GameLevel | null>(null);
    const [selection, setSelection] = useState({ x: 206, y: 206 });
    const [isDragging, setIsDragging] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    const generateLevel = useCallback(() => {
        setIsLoading(true);
        setIsCorrect(null);
        setShowFeedback(false);

        const seed = `puzzle-${Date.now()}-${Math.random()}`;
        const imageUrl = PuzzleGenerator.generate(seed);

        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, 512, 512);

            const tx = 10 + Math.floor(Math.random() * (492 - SELECTION_SIZE));
            const ty = 10 + Math.floor(Math.random() * (492 - SELECTION_SIZE));

            const thumbCanvas = document.createElement('canvas');
            thumbCanvas.width = SELECTION_SIZE;
            thumbCanvas.height = SELECTION_SIZE;
            const thumbCtx = thumbCanvas.getContext('2d');
            if (thumbCtx) {
                thumbCtx.drawImage(canvas, tx, ty, SELECTION_SIZE, SELECTION_SIZE, 0, 0, SELECTION_SIZE, SELECTION_SIZE);
            }

            setGameLevel({
                imageUrl,
                targetBox: { x: tx, y: ty, width: SELECTION_SIZE, height: SELECTION_SIZE },
                targetThumbnail: thumbCanvas.toDataURL('image/png')
            });
            setIsLoading(false);
            setSelection({ x: 206, y: 206 });
        };
    }, []);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    // Handle Auto Start from HUB or Exam Mode
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, phase, examMode]);

    const handleStart = useCallback(() => {
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevelNumber(1);
        setTimeLeft(TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        generateLevel();
    }, [generateLevel]);

    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        // Exam mode: submit result and navigate
        if (examMode) {
            const passed = levelNumber >= 5;
            submitResult(passed, score, 1000, duration).then(() => {
                navigate('/atolyeler/sinav-simulasyonu/devam');
            });
            return;
        }

        await saveGamePlay({
            game_id: 'puzzle-master',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: levelNumber, final_lives: lives }
        });
    }, [saveGamePlay, score, levelNumber, lives, examMode, submitResult, navigate]);

    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        // Exam mode: submit result and navigate
        if (examMode) {
            submitResult(true, score, 1000, duration).then(() => {
                navigate('/atolyeler/sinav-simulasyonu/devam');
            });
            return;
        }

        await saveGamePlay({
            game_id: 'puzzle-master',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true }
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (phase !== 'playing' || isLoading || isCorrect !== null) return;
        setIsDragging(true);
        updateSelection(e);
    };

    const updateSelection = (e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const scale = 512 / rect.width;
        let x = (e.clientX - rect.left) * scale - SELECTION_SIZE / 2;
        let y = (e.clientY - rect.top) * scale - SELECTION_SIZE / 2;
        x = Math.max(0, Math.min(x, 512 - SELECTION_SIZE));
        y = Math.max(0, Math.min(y, 512 - SELECTION_SIZE));
        setSelection({ x, y });
    };

    const handleCheck = () => {
        if (!gameLevel) return;
        const dx = Math.abs(selection.x - gameLevel.targetBox.x);
        const dy = Math.abs(selection.y - gameLevel.targetBox.y);

        if (dx < 20 && dy < 20) {
            setIsCorrect(true);
            setFeedbackMessage(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
            setShowFeedback(true);
            setScore(prev => prev + 10 * levelNumber);

            if (levelNumber >= MAX_LEVEL) {
                setTimeout(() => {
                    setShowFeedback(false);
                    handleVictory();
                }, 1500);
            } else {
                setTimeout(() => {
                    setShowFeedback(false);
                    setLevelNumber(prev => prev + 1);
                    generateLevel();
                }, 1500);
            }
        } else {
            setIsCorrect(false);
            setFeedbackMessage(FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)]);
            setShowFeedback(true);
            const newLives = lives - 1;
            setLives(newLives);

            if (newLives <= 0) {
                setTimeout(() => {
                    setShowFeedback(false);
                    handleGameOver();
                }, 1500);
            } else {
                setTimeout(() => {
                    setShowFeedback(false);
                    setIsCorrect(null);
                }, 1500);
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";

    // =============== WELCOME SCREEN ===============
    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-950 via-pink-950 to-slate-900 flex items-center justify-center p-6 text-white relative overflow-hidden">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl" />
                </div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl border border-white/20 text-center max-w-xl relative z-10"
                    style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}
                >
                    {/* 3D Gummy Icon */}
                    <motion.div
                        className="w-28 h-28 bg-gradient-to-br from-rose-400 to-pink-600 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                        style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Search size={52} className="text-white drop-shadow-lg" />
                    </motion.div>

                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-rose-300 via-pink-300 to-fuchsia-300 bg-clip-text text-transparent">
                        Puzzle Master
                    </h1>

                    <p className="text-slate-300 mb-6 text-lg">
                        Parçayı bul, konumu işaretle! 🔍
                    </p>

                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="font-bold text-rose-300 mb-3 flex items-center gap-2">
                            <Sparkles size={18} />
                            Nasıl Oynanır?
                        </h3>
                        <ul className="text-sm text-slate-200 space-y-2">
                            <li className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-rose-500/30 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                Hedef parçayı incele
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-pink-500/30 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                Büyük tabloda yerini bul
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-fuchsia-500/30 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                Seçimi sürükle ve kontrol et
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center text-xs font-bold">🎯</span>
                                20 seviyeyi tamamla!
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                        <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                            <Heart className="text-red-400" size={16} />
                            <span className="text-sm text-slate-200">{INITIAL_LIVES} Can</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                            <Timer className="text-blue-400" size={16} />
                            <span className="text-sm text-slate-200">3 Dakika</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                            <Target className="text-emerald-400" size={16} />
                            <span className="text-sm text-slate-200">{MAX_LEVEL} Seviye</span>
                        </div>
                    </div>

                    {/* TUZÖ Badge */}
                    <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/30 rounded-full">
                        <span className="text-[9px] font-black text-rose-300 uppercase tracking-wider">TUZÖ</span>
                        <span className="text-[9px] font-bold text-rose-400">5.3.2 Görsel Analiz</span>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStart}
                        className="px-10 py-5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl font-bold text-xl"
                        style={{ boxShadow: '0 8px 32px rgba(244, 63, 94, 0.4)' }}
                    >
                        <div className="flex items-center gap-3">
                            <Play size={28} className="fill-white" />
                            <span>Başla</span>
                        </div>
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    // =============== GAME SCREEN ===============
    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-950 via-pink-950 to-slate-900 text-white relative overflow-hidden">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl" />
            </div>

            {/* Feedback Overlay */}
            <AnimatePresence>
                {showFeedback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ y: 50 }}
                            animate={{ y: 0 }}
                            className={`px-12 py-8 rounded-3xl text-center ${isCorrect
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                : 'bg-gradient-to-br from-orange-500 to-amber-600'
                                }`}
                            style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], rotate: isCorrect ? [0, 10, -10, 0] : [0, -5, 5, 0] }}
                                transition={{ duration: 0.5 }}
                            >
                                {isCorrect
                                    ? <CheckCircle2 size={64} className="mx-auto mb-4 text-white" />
                                    : <XCircle size={64} className="mx-auto mb-4 text-white" />
                                }
                            </motion.div>
                            <p className="text-3xl font-black text-white">{feedbackMessage}</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 p-4">
                {/* Header */}
                <div className="max-w-6xl mx-auto flex items-center justify-between mb-4">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                        <span>Geri</span>
                    </Link>

                    {phase === 'playing' && (
                        <div className="flex items-center gap-3 flex-wrap justify-end">
                            {/* Score */}
                            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400">{score}</span>
                            </div>

                            {/* Lives */}
                            <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-500/30">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart
                                        key={i}
                                        size={14}
                                        className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'}
                                    />
                                ))}
                            </div>

                            {/* Timer */}
                            <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-500/30">
                                <Timer className="text-blue-400" size={18} />
                                <span className={`font-bold ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            {/* Level */}
                            <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={18} />
                                <span className="font-bold text-emerald-400">Lv.{levelNumber}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Game Area */}
                {phase === 'playing' && (
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Panel - Target */}
                        <div className="lg:col-span-3 space-y-4">
                            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20">
                                <p className="text-xs font-bold text-rose-300 mb-4 tracking-wider uppercase flex items-center gap-2">
                                    <Search size={14} />
                                    Bu Parçayı Bul
                                </p>

                                {/* 3D Gummy Target Card */}
                                <motion.div
                                    className="w-full aspect-square rounded-2xl overflow-hidden"
                                    style={{
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.3)',
                                        border: '2px solid rgba(244, 63, 94, 0.4)',
                                    }}
                                >
                                    {gameLevel?.targetThumbnail ? (
                                        <img src={gameLevel.targetThumbnail} alt="Target" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full animate-pulse bg-slate-800" />
                                    )}
                                </motion.div>
                            </div>
                        </div>

                        {/* Main Puzzle Board */}
                        <div className="lg:col-span-9">
                            <div
                                className="bg-white/10 backdrop-blur-xl p-4 rounded-3xl border border-white/20"
                                style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}
                            >
                                <div
                                    className="relative aspect-square rounded-2xl overflow-hidden cursor-crosshair"
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={(e) => isDragging && updateSelection(e)}
                                    onMouseUp={() => setIsDragging(false)}
                                    onMouseLeave={() => setIsDragging(false)}
                                    style={{
                                        boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.05)',
                                    }}
                                >
                                    {isLoading && (
                                        <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
                                            <p className="mt-4 text-rose-400 font-bold text-sm">Yükleniyor...</p>
                                        </div>
                                    )}

                                    {gameLevel?.imageUrl && (
                                        <img src={gameLevel.imageUrl} className="w-full h-full object-cover select-none" draggable={false} alt="Puzzle Board" />
                                    )}

                                    {/* Selection Box */}
                                    <div
                                        className={`absolute pointer-events-none transition-all duration-150 rounded-xl border-4 ${isCorrect === true
                                            ? 'border-emerald-400'
                                            : isCorrect === false
                                                ? 'border-red-400'
                                                : 'border-white/80'
                                            }`}
                                        style={{
                                            left: `${(selection.x / 512) * 100}%`,
                                            top: `${(selection.y / 512) * 100}%`,
                                            width: `${(SELECTION_SIZE / 512) * 100}%`,
                                            height: `${(SELECTION_SIZE / 512) * 100}%`,
                                            boxShadow: isCorrect === true
                                                ? '0 0 30px rgba(52, 211, 153, 0.5)'
                                                : isCorrect === false
                                                    ? '0 0 30px rgba(248, 113, 113, 0.5)'
                                                    : '0 0 20px rgba(255,255,255,0.3)',
                                        }}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center opacity-40">
                                            <div className="w-full h-px bg-white" />
                                            <div className="h-full w-px bg-white absolute" />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="p-6 flex justify-center">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleCheck}
                                        disabled={isLoading || isCorrect !== null}
                                        className="bg-gradient-to-r from-rose-500 to-pink-600 disabled:opacity-30 px-12 py-4 rounded-2xl font-bold flex items-center gap-3"
                                        style={{ boxShadow: '0 8px 32px rgba(244, 63, 94, 0.4)' }}
                                    >
                                        <Target size={24} />
                                        Kontrol Et
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Game Over Screen */}
                {phase === 'game_over' && (
                    <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 border border-white/20 text-center max-w-md w-full"
                            style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
                        >
                            <motion.div
                                className="w-24 h-24 bg-gradient-to-br from-rose-500 to-pink-600 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                                style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.3), 0 8px 32px rgba(244, 63, 94, 0.4)' }}
                            >
                                <XCircle size={48} className="text-white" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-rose-300 mb-2">Süre Doldu!</h2>
                            <p className="text-slate-300 mb-6">Bir dahaki sefere daha dikkatli ol!</p>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/20">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-2xl font-black text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Seviye</p>
                                        <p className="text-2xl font-black text-emerald-400">{levelNumber}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleStart}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl font-bold text-lg"
                                    style={{ boxShadow: '0 8px 32px rgba(244, 63, 94, 0.4)' }}
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <RotateCcw size={24} />
                                        <span>Tekrar Oyna</span>
                                    </div>
                                </motion.button>
                                <Link
                                    to={backLink}
                                    className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm rounded-2xl font-bold flex items-center justify-center gap-2 border border-white/20"
                                >
                                    <Home size={20} />
                                    <span>Çıkış</span>
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Victory Screen */}
                {phase === 'victory' && (
                    <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 border border-white/20 text-center max-w-md w-full"
                            style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
                        >
                            <motion.div
                                className="w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                                style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.4), 0 8px 32px rgba(251, 191, 36, 0.5)' }}
                                animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Trophy size={48} className="text-white" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-amber-300 mb-2">🎉 Puzzle Ustası!</h2>
                            <p className="text-slate-300 mb-6">Tüm seviyeleri tamamladın!</p>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/20">
                                <p className="text-4xl font-black text-amber-400">{score}</p>
                                <p className="text-slate-400 text-sm">Toplam Puan</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleStart}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-lg"
                                    style={{ boxShadow: '0 8px 32px rgba(251, 191, 36, 0.4)' }}
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <RotateCcw size={24} />
                                        <span>Tekrar Oyna</span>
                                    </div>
                                </motion.button>
                                <Link
                                    to={backLink}
                                    className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm rounded-2xl font-bold flex items-center justify-center gap-2 border border-white/20"
                                >
                                    <Home size={20} />
                                    <span>Çıkış</span>
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PuzzleMasterGame;
