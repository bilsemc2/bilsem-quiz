import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Play, Trophy, Sparkles, Compass, Heart, Star, Timer, CheckCircle2, XCircle, Eye, RotateCw } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// ------------------ Tip Tanımları ------------------
type Stick = {
    color: string;
    isVertical: boolean;
    x: number;
    y: number;
    length: number;
};

type Shape = {
    id: string;
    type: 'sticks';
    rotation: number;
    sticks: Stick[];
};

interface GameOption {
    shape: Shape;
    isCorrect: boolean;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43', '#A29BFE', '#55E6C1', '#FD79A8', '#FAB1A0', '#00D2D3', '#54A0FF'];

// Child-friendly messages
const SUCCESS_MESSAGES = [
    "Harika! 🚀",
    "Süper Pilot! 🌟",
    "Müthiş! ⭐",
    "Bravo! 🎯",
];

const FAILURE_MESSAGES = [
    "Tekrar dene! 💪",
    "Dikkatli bak! 👀",
];

const RotationMatrixGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [sequence, setSequence] = useState<Shape[]>([]);
    const [targetIndex, setTargetIndex] = useState<number>(-1);
    const [options, setOptions] = useState<GameOption[]>([]);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [isLevelLoading, setIsLevelLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [lives, setLives] = useState(3);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);
    const totalQuestions = 10;

    const svgSize = 100;

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // ------------------ Sonsuz Şekil Motoru (Infinite Shape Engine) ------------------
    const generateShape = useCallback((): Shape => {
        const numSticks = 3 + Math.floor(Math.random() * 4);
        const sticks: Stick[] = [];

        const globalOffsetX = (Math.random() - 0.5) * 10;
        const globalOffsetY = (Math.random() - 0.5) * 10;

        for (let i = 0; i < numSticks; i++) {
            const isVertical = Math.random() > 0.5;
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];

            sticks.push({
                color,
                isVertical,
                x: globalOffsetX + (isVertical ? (Math.random() - 0.5) * 44 : (Math.random() - 0.5) * 12),
                y: globalOffsetY + (isVertical ? (Math.random() - 0.5) * 12 : (Math.random() - 0.5) * 44),
                length: 45 + Math.random() * 45
            });
        }

        // Asimetrik çubuk
        sticks.push({
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            isVertical: Math.random() > 0.5,
            x: 22 + Math.random() * 8,
            y: -22 - Math.random() * 8,
            length: 35
        });

        return {
            id: `inf-${Math.random().toString(36).slice(2, 11)}`,
            type: 'sticks',
            rotation: 0,
            sticks
        };
    }, []);

    const generateLevel = useCallback(() => {
        setIsLevelLoading(true);
        const stepRotations = [45, 90, 135];
        const step = stepRotations[Math.floor(Math.random() * stepRotations.length)];
        const baseShape = generateShape();

        const newSequence: Shape[] = [];
        for (let i = 0; i < 9; i++) {
            newSequence.push({
                ...baseShape,
                rotation: (i * step) % 360,
                id: `step-${i}-${Math.random()}`
            });
        }

        const questionIndex = Math.floor(Math.random() * 9);
        setSequence(newSequence);
        setTargetIndex(questionIndex);

        const correctShape = newSequence[questionIndex];
        const correctRot = Math.round(correctShape.rotation % 360);

        const distractors: GameOption[] = [];
        const usedRotations = [correctRot];

        const allPossibleRotations = [0, 45, 90, 135, 180, 225, 270, 315];

        let safety = 0;
        while (distractors.length < 3 && safety < 100) {
            safety++;
            const randomRot = allPossibleRotations[Math.floor(Math.random() * allPossibleRotations.length)];
            if (!usedRotations.includes(randomRot)) {
                distractors.push({
                    shape: { ...baseShape, rotation: randomRot, id: `wrong-${distractors.length}-${Math.random()}` },
                    isCorrect: false
                });
                usedRotations.push(randomRot);
            }
        }

        const allOptions = [...distractors, { shape: correctShape, isCorrect: true }];
        setOptions(allOptions.sort(() => Math.random() - 0.5));

        setFeedback(null);
        setIsLevelLoading(false);
        setTimeLeft(30);
    }, [generateShape]);

    useEffect(() => {
        if (gameStarted && !gameOver && !feedback && !isLevelLoading) {
            generateLevel();
        }
    }, [gameStarted, gameOver, level, generateLevel, feedback, isLevelLoading]);

    // Timer
    useEffect(() => {
        if (!gameStarted || gameOver || feedback || isLevelLoading) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setFeedback('wrong');
                    setFeedbackMsg(FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)]);
                    setLives(l => l - 1);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameStarted, gameOver, feedback, isLevelLoading]);

    // Handle feedback timeout
    useEffect(() => {
        if (feedback) {
            const timeout = setTimeout(() => {
                setFeedback(null);
                if (lives <= 0 && feedback === 'wrong') {
                    setGameOver(true);
                } else if (level >= totalQuestions) {
                    setGameOver(true);
                } else {
                    setLevel(l => l + 1);
                }
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [feedback, lives, level]);

    const handleOptionSelect = (option: GameOption) => {
        if (feedback || isLevelLoading) return;

        if (option.isCorrect) {
            playSound('correct');
            setFeedback('correct');
            setFeedbackMsg(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
            setScore(s => s + (level * 100) + (timeLeft * 5));
        } else {
            playSound('incorrect');
            setFeedback('wrong');
            setFeedbackMsg(FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)]);
            setLives(l => l - 1);
        }
    };

    const ShapeSVG = ({ shape, size }: { shape: Shape; size: number }) => {
        const center = size / 2;
        const stickWidth = 10;
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <motion.g
                    initial={false}
                    animate={{ rotate: shape.rotation }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                    style={{ originX: "50%", originY: "50%" }}
                >
                    {shape.sticks.map((stick, i) => (
                        <rect
                            key={i}
                            x={center + stick.x - (stick.isVertical ? stickWidth / 2 : stick.length / 2)}
                            y={center + stick.y - (stick.isVertical ? stick.length / 2 : stickWidth / 2)}
                            width={stick.isVertical ? stickWidth : stick.length}
                            height={stick.isVertical ? stick.length : stickWidth}
                            fill={stick.color}
                            rx={stickWidth / 2}
                            stroke="white"
                            strokeWidth="1.5"
                        />
                    ))}
                    <circle cx={center} cy={center} r="3" fill="white" opacity="0.4" />
                </motion.g>
            </svg>
        );
    };

    const startGame = useCallback(() => {
        setLevel(1);
        setScore(0);
        setLives(3);
        setGameOver(false);
        setGameStarted(true);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, []);

    // Handle Auto Start from HUB
    useEffect(() => {
        if (location.state?.autoStart && !gameStarted) {
            startGame();
        }
    }, [location.state, gameStarted, startGame]);

    // Save game data on finish
    useEffect(() => {
        if (gameOver && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'rotasyon-matrisi',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
                metadata: {
                    level_reached: level,
                    game_name: 'Rotasyon Matrisi',
                }
            });
        }
    }, [gameOver, score, lives, level, saveGamePlay]);

    // Welcome Screen
    if (!gameStarted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center max-w-xl"
                    >
                        {/* 3D Gummy Icon */}
                        <motion.div
                            className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                            style={{
                                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                            }}
                            animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <RotateCw size={52} className="text-white drop-shadow-lg" />
                        </motion.div>

                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            🚀 Rotasyon Matrisi
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
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <div className="grid grid-cols-3 gap-1">
                                    {[0, 45, 90, 135, 180, 225, 270, 315, '?'].map((rot, i) => (
                                        <div
                                            key={i}
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{
                                                background: rot === '?'
                                                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)'
                                                    : 'rgba(255,255,255,0.05)',
                                                border: rot === '?' ? '2px dashed rgba(139, 92, 246, 0.5)' : '1px solid rgba(255,255,255,0.1)'
                                            }}
                                        >
                                            {rot === '?' ? (
                                                <span className="text-purple-400 font-bold">?</span>
                                            ) : (
                                                <RotateCw
                                                    size={16}
                                                    className="text-slate-400"
                                                    style={{ transform: `rotate(${rot}deg)` }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm">Dönüş kuralını bul, eksik şekli seç!</p>
                        </div>

                        {/* Instructions */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                            <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
                                <Eye size={20} /> Nasıl Oynanır?
                            </h3>
                            <ul className="space-y-2 text-slate-300 text-sm">
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-indigo-400" />
                                    <span>3x3 ızgaradaki <strong>dönüş kuralını</strong> bul</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-indigo-400" />
                                    <span>Soru işaretli yerdeki doğru şekli seç</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-indigo-400" />
                                    <span>45°, 90° veya 135° dönüşler! 3 can!</span>
                                </li>
                            </ul>
                        </div>

                        {/* TUZÖ Badge */}
                        <div className="bg-purple-500/10 text-purple-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-purple-500/30">
                            TUZÖ 4.1.1 Uzamsal Akıl Yürütme
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startGame}
                            className="px-8 py-4 rounded-2xl font-bold text-lg"
                            style={{
                                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(139, 92, 246, 0.4)'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <Play size={24} fill="currentColor" />
                                <span>Yolculuğa Başla</span>
                            </div>
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
                    <Link
                        to={backLink}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>{backLabel}</span>
                    </Link>

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
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                border: '1px solid rgba(139, 92, 246, 0.3)'
                            }}
                        >
                            <Compass className="text-purple-400" size={18} />
                            <span className="font-bold text-purple-400">{level}/{totalQuestions}</span>
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
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center p-4">
                <AnimatePresence mode="wait">
                    {!gameOver && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-5xl"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                {/* 3x3 Grid */}
                                <div
                                    className="rounded-3xl p-6"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <div className="text-center mb-4">
                                        <span className="text-sm font-bold text-purple-400 flex items-center justify-center gap-2">
                                            <Compass size={16} className="animate-spin" style={{ animationDuration: '8s' }} />
                                            Sekansı Analiz Et
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                                        {sequence.map((shape, idx) => (
                                            <div
                                                key={shape.id}
                                                className="aspect-square rounded-[25%] flex items-center justify-center relative"
                                                style={{
                                                    background: idx === targetIndex
                                                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)'
                                                        : 'rgba(255,255,255,0.05)',
                                                    border: idx === targetIndex
                                                        ? '3px dashed rgba(139, 92, 246, 0.5)'
                                                        : '1px solid rgba(255,255,255,0.1)',
                                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                <span className="absolute top-1 left-2 text-[10px] font-bold text-white/30">{idx + 1}</span>
                                                {idx === targetIndex ? (
                                                    <div className="text-purple-400/70 font-black text-3xl animate-pulse">?</div>
                                                ) : (
                                                    <ShapeSVG shape={shape} size={svgSize - 20} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Options */}
                                <div
                                    className="rounded-3xl p-6"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <h2 className="text-xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                                        Eksik Parçayı Bul! <Sparkles className="text-yellow-400" size={20} />
                                    </h2>

                                    <div className="grid grid-cols-2 gap-4">
                                        {options.map((option) => {
                                            const showResult = feedback !== null;
                                            const isCorrect = option.isCorrect;

                                            return (
                                                <motion.button
                                                    key={option.shape.id}
                                                    whileHover={!feedback ? { scale: 0.98, y: -2 } : {}}
                                                    whileTap={!feedback ? { scale: 0.95 } : {}}
                                                    onClick={() => handleOptionSelect(option)}
                                                    disabled={feedback !== null}
                                                    className="aspect-square rounded-[25%] flex items-center justify-center transition-all"
                                                    style={{
                                                        background: showResult && isCorrect
                                                            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                                            : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                                        boxShadow: showResult && isCorrect
                                                            ? '0 0 30px rgba(16, 185, 129, 0.5)'
                                                            : 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)',
                                                        border: showResult && isCorrect
                                                            ? '2px solid #10B981'
                                                            : '1px solid rgba(255,255,255,0.1)',
                                                        cursor: feedback ? 'default' : 'pointer',
                                                        opacity: showResult && !isCorrect ? 0.5 : 1
                                                    }}
                                                >
                                                    <ShapeSVG shape={option.shape} size={svgSize} />
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Game Over */}
                    {gameOver && (
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
                                    background: 'linear-gradient(135deg, #8B5CF6 0%, #EF4444 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Trophy size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-purple-300 mb-2">
                                {level >= 8 ? '🎉 Harika!' : 'Yolculuk Tamamlandı!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {level >= 8 ? 'Galaksi rotasını çizdin!' : 'Tekrar deneyelim!'}
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
                                        <p className="text-3xl font-bold text-purple-400">{level}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(139, 92, 246, 0.4)'
                                }}
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Yeni Rota</span>
                                </div>
                            </motion.button>

                            <Link
                                to={backLink}
                                className="block text-slate-500 hover:text-white transition-colors"
                            >
                                {location.state?.arcadeMode ? 'Arcade Hub\'a Dön' : 'Geri Dön'}
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Feedback Overlay */}
                <AnimatePresence>
                    {feedback && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ y: 50 }}
                                animate={{ y: 0 }}
                                className={`px-12 py-8 rounded-3xl text-center ${feedback === 'correct'
                                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                        : 'bg-gradient-to-br from-orange-500 to-amber-600'
                                    }`}
                                style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], rotate: feedback === 'correct' ? [0, 10, -10, 0] : [0, -5, 5, 0] }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {feedback === 'correct'
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

export default RotationMatrixGame;
