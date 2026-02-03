import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
    ChevronLeft, RotateCcw, Play, Trophy, Sparkles,
    Square, Circle, Triangle, Star, Heart, Diamond,
    Box, Layers, Timer, Eye, CheckCircle2, XCircle
} from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// ------------------ Types ------------------
type FaceName = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';

interface FaceContent {
    color: string;
    icon: React.ElementType;
    name: string;
}

interface CubeNet {
    name: string;
    grid: (FaceName | null)[][];
}

interface GameOption {
    rotation: { x: number; y: number };
    isCorrect: boolean;
    id: string;
}

const COLORS = [
    { name: 'Red', hex: '#FF6B6B' },
    { name: 'Teal', hex: '#4ECDC4' },
    { name: 'Yellow', hex: '#FFE66D' },
    { name: 'Orange', hex: '#FF9F43' },
    { name: 'Purple', hex: '#A29BFE' },
    { name: 'Pink', hex: '#FD79A8' }
];

const ICONS = [
    { icon: Square, name: 'Kare' },
    { icon: Circle, name: 'Daire' },
    { icon: Triangle, name: 'Üçgen' },
    { icon: Star, name: 'Yıldız' },
    { icon: Heart, name: 'Kalp' },
    { icon: Diamond, name: 'Baklava' }
];

// Child-friendly messages
const SUCCESS_MESSAGES = [
    "Harika! 🧊",
    "Süper 3D Görüş! 👁️",
    "Müthiş! ⭐",
    "Bravo! 🌟",
];

const FAILURE_MESSAGES = [
    "Tekrar dene! 💪",
    "Dikkatli hayal et! 🧠",
];

// 11 Standard Cube Nets
const NET_LAYOUTS: CubeNet[] = [
    { name: '1-4-1 (T)', grid: [[null, 'TOP', null, null], ['LEFT', 'FRONT', 'RIGHT', 'BACK'], [null, 'BOTTOM', null, null]] },
    { name: '1-4-1 (L)', grid: [['TOP', null, null, null], ['BACK', 'RIGHT', 'FRONT', 'LEFT'], [null, null, null, 'BOTTOM']] },
    { name: '1-4-1 (Z)', grid: [[null, 'TOP', null, null], ['BACK', 'RIGHT', 'FRONT', null], [null, null, 'LEFT', 'BOTTOM']] },
    { name: '2-3-1 (A)', grid: [['TOP', 'BACK', null, null], [null, 'RIGHT', 'FRONT', 'LEFT'], [null, null, null, 'BOTTOM']] },
    { name: '2-3-1 (B)', grid: [['TOP', 'BACK', null, null], [null, 'RIGHT', 'FRONT', null], [null, null, 'LEFT', 'BOTTOM']] },
    { name: '2-2-2 (Basamak)', grid: [['TOP', 'BACK', null], [null, 'RIGHT', 'FRONT'], [null, null, 'LEFT'], [null, null, 'BOTTOM']] },
    { name: '3-3 (Merdiven)', grid: [['TOP', 'BACK', 'RIGHT', null, null], [null, null, 'FRONT', 'LEFT', 'BOTTOM']] },
    { name: '1-4-1 (İnce)', grid: [[null, 'TOP', null, null], [null, 'BACK', null, null], ['LEFT', 'FRONT', 'RIGHT', null], [null, 'BOTTOM', null, null]] },
    { name: '2-3-1 (Karma)', grid: [['TOP', 'BACK', null], [null, 'RIGHT', 'FRONT'], [null, 'LEFT', null], [null, 'BOTTOM', null]] },
    { name: '1-3-2', grid: [[null, 'TOP', null], ['BACK', 'RIGHT', 'FRONT'], [null, 'LEFT', 'BOTTOM']] },
    { name: '3-2-1', grid: [['TOP', 'BACK', 'RIGHT'], [null, null, 'FRONT'], [null, null, 'LEFT'], [null, null, 'BOTTOM']] }
];

const MagicCubeGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
    const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [isFolding, setIsFolding] = useState(false);
    const [timeLeft, setTimeLeft] = useState(45);
    const [lives, setLives] = useState(3);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // Current Level Data
    const [currentNet, setCurrentNet] = useState<CubeNet>(NET_LAYOUTS[0]);
    const [facesData, setFacesData] = useState<Record<FaceName, FaceContent>>({} as Record<FaceName, FaceContent>);
    const [options, setOptions] = useState<GameOption[]>([]);

    const totalQuestions = 10;

    // ------------------ Level Generator ------------------
    const generateLevel = useCallback(() => {
        setIsFolding(false);
        const net = NET_LAYOUTS[Math.floor(Math.random() * NET_LAYOUTS.length)];
        setCurrentNet(net);

        const newFacesData: Partial<Record<FaceName, FaceContent>> = {};
        const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5);
        const shuffledIcons = [...ICONS].sort(() => Math.random() - 0.5);

        const faceNames: FaceName[] = ['FRONT', 'BACK', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM'];
        faceNames.forEach((name, i) => {
            newFacesData[name] = {
                color: shuffledColors[i % shuffledColors.length].hex,
                icon: shuffledIcons[i % shuffledIcons.length].icon,
                name: shuffledIcons[i % shuffledIcons.length].name
            };
        });
        setFacesData(newFacesData as Record<FaceName, FaceContent>);

        const correctOption: GameOption = {
            rotation: { x: -20, y: 35 },
            isCorrect: true,
            id: 'correct'
        };

        const distractorOptions: GameOption[] = [
            { rotation: { x: 160, y: 45 }, isCorrect: false, id: 'wrong-1' },
            { rotation: { x: 45, y: -160 }, isCorrect: false, id: 'wrong-2' }
        ];

        setOptions([...distractorOptions, correctOption].sort(() => Math.random() - 0.5));
        setTimeLeft(45);
        setShowFeedback(null);
    }, []);

    // Start Game
    const startGame = useCallback(() => {
        setGameState('playing');
        setLevel(1);
        setScore(0);
        setLives(3);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
        generateLevel();
    }, [generateLevel]);

    // Auto start from HUB
    useEffect(() => {
        if (location.state?.autoStart && gameState === 'idle') {
            startGame();
        }
    }, [location.state, gameState, startGame]);

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'playing' && timeLeft > 0 && !showFeedback) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        // Time's up - count as wrong
                        playSound('incorrect');
                        setShowFeedback('wrong');
                        setFeedbackMsg(FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)]);
                        setLives(l => l - 1);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState, timeLeft, showFeedback, playSound]);

    // Handle feedback timeout
    useEffect(() => {
        if (showFeedback) {
            const timeout = setTimeout(() => {
                setShowFeedback(null);
                if (lives <= 0 && showFeedback === 'wrong') {
                    setGameState('finished');
                } else if (level >= totalQuestions) {
                    setGameState('finished');
                } else {
                    setLevel(l => l + 1);
                    generateLevel();
                }
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [showFeedback, lives, level, generateLevel]);

    const handleSelect = (option: GameOption) => {
        if (showFeedback) return;

        if (option.isCorrect) {
            playSound('correct');
            setShowFeedback('correct');
            setFeedbackMsg(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
            setScore(s => s + timeLeft * 15);
        } else {
            playSound('incorrect');
            setShowFeedback('wrong');
            setFeedbackMsg(FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)]);
            setIsFolding(true);
            setLives(l => l - 1);
        }
    };

    // Save game data on finish
    useEffect(() => {
        if (gameState === 'finished' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'sihirli-kupler',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
                metadata: {
                    level_reached: level,
                    game_name: '3B Görselleştirme (Sihirli Küpler)',
                }
            });
        }
    }, [gameState, score, lives, level, saveGamePlay]);

    // ------------------ 3D Cube Component ------------------
    const Cube3D = ({ rotation, size = 100, data }: { rotation: { x: number; y: number }; size?: number; data: Record<FaceName, FaceContent> }) => {
        const half = size / 2;
        const faceStyle = (transform: string, color: string) => ({
            position: 'absolute' as const,
            width: size,
            height: size,
            transform,
            backgroundColor: color,
            border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backfaceVisibility: 'hidden' as const,
            borderRadius: '12px',
            boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2)'
        });

        if (!data.FRONT) return null;

        return (
            <div style={{ perspective: '800px', width: size, height: size }}>
                <motion.div
                    animate={{ rotateX: rotation.x, rotateY: rotation.y }}
                    transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        transformStyle: 'preserve-3d',
                    }}
                >
                    <div style={faceStyle(`translateZ(${half}px)`, data.FRONT.color)}>
                        <data.FRONT.icon size={size * 0.5} color="white" />
                    </div>
                    <div style={faceStyle(`translateZ(-${half}px) rotateY(180deg)`, data.BACK.color)}>
                        <data.BACK.icon size={size * 0.5} color="white" />
                    </div>
                    <div style={faceStyle(`translateX(-${half}px) rotateY(-90deg)`, data.LEFT.color)}>
                        <data.LEFT.icon size={size * 0.5} color="white" />
                    </div>
                    <div style={faceStyle(`translateX(${half}px) rotateY(90deg)`, data.RIGHT.color)}>
                        <data.RIGHT.icon size={size * 0.5} color="white" />
                    </div>
                    <div style={faceStyle(`translateY(-${half}px) rotateX(90deg)`, data.TOP.color)}>
                        <data.TOP.icon size={size * 0.5} color="white" />
                    </div>
                    <div style={faceStyle(`translateY(${half}px) rotateX(-90deg)`, data.BOTTOM.color)}>
                        <data.BOTTOM.icon size={size * 0.5} color="white" />
                    </div>
                </motion.div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950 to-orange-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
                    <Link
                        to={backLink}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>{backLabel}</span>
                    </Link>

                    {gameState === 'playing' && (
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Score */}
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(251, 191, 36, 0.3)'
                                }}
                            >
                                <Star className="text-amber-400 fill-amber-400" size={18} />
                                <span className="font-bold text-amber-400">{score}</span>
                            </div>

                            {/* Lives */}
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)'
                                }}
                            >
                                {[...Array(3)].map((_, i) => (
                                    <Heart
                                        key={i}
                                        size={18}
                                        className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'}
                                    />
                                ))}
                            </div>

                            {/* Level */}
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(245, 158, 11, 0.3)'
                                }}
                            >
                                <Box className="text-orange-400" size={18} />
                                <span className="font-bold text-orange-400">{level}/{totalQuestions}</span>
                            </div>

                            {/* Timer */}
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: timeLeft <= 10
                                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)'
                                        : 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(8, 145, 178, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: timeLeft <= 10
                                        ? '1px solid rgba(239, 68, 68, 0.5)'
                                        : '1px solid rgba(6, 182, 212, 0.3)'
                                }}
                            >
                                <Timer className={timeLeft <= 10 ? 'text-red-400' : 'text-cyan-400'} size={18} />
                                <span className={`font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-cyan-400'}`}>{timeLeft}s</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {/* Welcome Screen */}
                    {gameState === 'idle' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            {/* 3D Gummy Icon */}
                            <motion.div
                                className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ y: [0, -8, 0], rotateY: [0, 10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Box size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                                🧊 Sihirli Küpler
                            </h1>

                            {/* Example */}
                            <div
                                className="rounded-2xl p-5 mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <p className="text-slate-400 text-sm mb-3">Örnek:</p>
                                <div className="flex justify-center items-center gap-4 mb-3">
                                    <Layers size={40} className="text-amber-400" />
                                    <span className="text-2xl">➡️</span>
                                    <Box size={40} className="text-orange-400" />
                                </div>
                                <p className="text-slate-400 text-sm">Açınımı katla, doğru küpü bul!</p>
                            </div>

                            {/* Instructions */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
                                    <Eye size={20} /> Nasıl Oynanır?
                                </h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-orange-400" />
                                        <span>Küp açınımını <strong>incele</strong></span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-orange-400" />
                                        <span>Zihninde <strong>katla</strong></span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-orange-400" />
                                        <span>Doğru küpü seç, 3 can!</span>
                                    </li>
                                </ul>
                            </div>

                            {/* TUZÖ Badge */}
                            <div className="bg-amber-500/10 text-amber-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-amber-500/30">
                                TUZÖ 4.2.1 Üç Boyutlu Uzayda Görselleştirme
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="px-8 py-4 rounded-2xl font-bold text-lg"
                                style={{
                                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(245, 158, 11, 0.4)'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={24} fill="currentColor" />
                                    <span>Teste Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Playing State */}
                    {gameState === 'playing' && facesData.FRONT && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-6xl"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left: Net Panel */}
                                <div
                                    className="rounded-3xl p-8 flex flex-col items-center gap-6"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
                                                border: '1px solid rgba(245, 158, 11, 0.3)'
                                            }}
                                        >
                                            <Layers size={16} className="text-amber-400" />
                                            <span className="text-amber-400">{isFolding ? 'Katlanıyor...' : 'Küp Açınımı'}</span>
                                        </div>
                                        <button
                                            onClick={() => setIsFolding(!isFolding)}
                                            className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                                            style={{
                                                background: isFolding ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                                                border: isFolding ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255,255,255,0.1)'
                                            }}
                                        >
                                            {isFolding ? <RotateCcw size={14} /> : <Play size={14} />}
                                            {isFolding ? 'Aç' : 'Katla'}
                                        </button>
                                    </div>

                                    <div
                                        className="relative"
                                        style={{
                                            perspective: '1200px',
                                            width: '280px',
                                            height: '280px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <motion.div
                                            animate={isFolding ? { rotateX: -20, rotateY: 35 } : { rotateX: 0, rotateY: 0 }}
                                            transition={{ duration: 2 }}
                                            style={{
                                                position: 'relative',
                                                width: '60px',
                                                height: '60px',
                                                transformStyle: 'preserve-3d'
                                            }}
                                        >
                                            {currentNet.grid.map((row, rIdx) => (
                                                row.map((faceName, cIdx) => {
                                                    if (!faceName || !facesData[faceName]) return null;

                                                    let frontR = 0, frontC = 0;
                                                    currentNet.grid.forEach((r, ri) => r.forEach((f, ci) => { if (f === 'FRONT') { frontR = ri; frontC = ci; } }));

                                                    const relR = rIdx - frontR;
                                                    const relC = cIdx - frontC;
                                                    const size = 60;

                                                    const foldTargets: Record<FaceName, { rx: number, ry: number, rz: number, tx: number, ty: number, tz: number }> = {
                                                        FRONT: { rx: 0, ry: 0, rz: 0, tx: 0, ty: 0, tz: size / 2 },
                                                        BACK: { rx: 0, ry: 180, rz: 0, tx: 0, ty: 0, tz: -size / 2 },
                                                        LEFT: { rx: 0, ry: -90, rz: 0, tx: -size / 2, ty: 0, tz: 0 },
                                                        RIGHT: { rx: 0, ry: 90, rz: 0, tx: size / 2, ty: 0, tz: 0 },
                                                        TOP: { rx: 90, ry: 0, rz: 0, tx: 0, ty: -size / 2, tz: 0 },
                                                        BOTTOM: { rx: -90, ry: 0, rz: 0, tx: 0, ty: size / 2, tz: 0 }
                                                    };

                                                    const target = foldTargets[faceName];

                                                    return (
                                                        <motion.div
                                                            key={faceName}
                                                            initial={false}
                                                            animate={isFolding ? {
                                                                x: target.tx,
                                                                y: target.ty,
                                                                z: target.tz,
                                                                rotateX: target.rx,
                                                                rotateY: target.ry,
                                                                rotateZ: target.rz,
                                                            } : {
                                                                x: relC * size,
                                                                y: relR * size,
                                                                z: 0,
                                                                rotateX: 0,
                                                                rotateY: 0,
                                                                rotateZ: 0,
                                                            }}
                                                            transition={{ duration: 1.5, ease: "easeInOut" }}
                                                            className="absolute inset-0 rounded-lg border-2 border-white/30 flex items-center justify-center text-white"
                                                            style={{
                                                                backgroundColor: facesData[faceName].color,
                                                                backfaceVisibility: 'hidden',
                                                                transformStyle: 'preserve-3d',
                                                                boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.2)'
                                                            }}
                                                        >
                                                            {React.createElement(facesData[faceName].icon, { size: 30 })}
                                                        </motion.div>
                                                    );
                                                })
                                            ))}
                                        </motion.div>
                                    </div>

                                    <p className="text-slate-500 text-xs italic">
                                        {isFolding ? 'Doğru katlanışı izle' : 'Zihninde katla'}
                                    </p>
                                </div>

                                {/* Right: Options Panel */}
                                <div
                                    className="rounded-3xl p-8 flex flex-col items-center gap-6"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        Hangisi Oluşur? <Sparkles className="text-amber-400" size={20} />
                                    </h2>

                                    <div className="grid grid-cols-3 gap-4">
                                        {options.map((option) => (
                                            <motion.button
                                                key={option.id}
                                                whileHover={!showFeedback ? { scale: 1.05, y: -4 } : {}}
                                                whileTap={!showFeedback ? { scale: 0.95 } : {}}
                                                onClick={() => handleSelect(option)}
                                                disabled={showFeedback !== null}
                                                className="p-6 rounded-[30%] transition-all"
                                                style={{
                                                    background: showFeedback && option.isCorrect
                                                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)'
                                                        : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)',
                                                    border: showFeedback && option.isCorrect
                                                        ? '2px solid #10B981'
                                                        : '1px solid rgba(255,255,255,0.1)',
                                                    cursor: showFeedback ? 'default' : 'pointer'
                                                }}
                                            >
                                                <Cube3D rotation={option.rotation} size={80} data={facesData} />
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Game Over */}
                    {gameState === 'finished' && (
                        <motion.div
                            key="gameover"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Trophy size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-amber-300 mb-2">
                                {level >= 8 ? '🎉 Harika!' : 'Görev Tamam!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {level >= 8 ? '3D uzayı fethettin!' : 'Tekrar deneyelim!'}
                            </p>

                            <div
                                className="rounded-2xl p-6 mb-8"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-3xl font-bold text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Seviye</p>
                                        <p className="text-3xl font-bold text-orange-400">{level}/{totalQuestions}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(245, 158, 11, 0.4)'
                                }}
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Oyna</span>
                                </div>
                            </motion.button>

                            <Link
                                to={backLink}
                                className="block text-slate-500 hover:text-white transition-colors"
                            >
                                {location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                className={`px-12 py-8 rounded-3xl text-center ${showFeedback === 'correct'
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                    : 'bg-gradient-to-br from-orange-500 to-amber-600'
                                    }`}
                                style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], rotate: showFeedback === 'correct' ? [0, 10, -10, 0] : [0, -5, 5, 0] }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {showFeedback === 'correct'
                                        ? <CheckCircle2 size={64} className="mx-auto mb-4 text-white" />
                                        : <XCircle size={64} className="mx-auto mb-4 text-white" />
                                    }
                                </motion.div>
                                <p className="text-3xl font-black text-white">{feedbackMsg}</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MagicCubeGame;
