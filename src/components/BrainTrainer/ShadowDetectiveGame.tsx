import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Eye, Timer, Trophy,
    RotateCcw, ChevronLeft, Play,
    Circle, Square, Triangle, Hexagon, Star, Pentagon,
    Cross, Moon, Heart, CheckCircle2, XCircle, Sparkles, Zap
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// --- Şekil ve Renk Havuzu ---
const SHAPE_ICONS = [Circle, Square, Triangle, Hexagon, Star, Pentagon, Cross, Moon, Heart];

// High Contrast Candy Colors
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96F97B', '#FFEAA7', '#DDA0DD', '#FF9FF3', '#FFFFFF'];

// Child-friendly messages
const SUCCESS_MESSAGES = [
    "Süper Gözlem! 👀",
    "Harika Dedektif! 🔍",
    "süper! Buldun! 🎯",
    "Muhteşem! ⭐",
    "Tam İsabet! 🎉",
];

const FAILURE_MESSAGES = [
    "Tekrar dene! 💪",
    "Dikkatli bak! 👀",
    "Neredeyse! 🌟",
    "Bir daha dene! ✨",
];

interface PatternItem {
    id: string;
    iconIdx: number;
    color: string;
    x: number;
    y: number;
    rotation: number;
    scale: number;
}

type GameStatus = 'waiting' | 'preview' | 'deciding' | 'result' | 'gameover';

const ShadowDetectiveGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [correctPattern, setCorrectPattern] = useState<PatternItem[]>([]);
    const [options, setOptions] = useState<PatternItem[][]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(60);
    const [previewTimer, setPreviewTimer] = useState(3);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState("");
    const gameStartTimeRef = useRef<number>(0);

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Bilsem Zeka" : "Geri";

    // --- Uniklik İmzası Üretme ---
    const getPatternSignature = (items: PatternItem[]) => {
        return items
            .map(i => {
                let normalizedRotation = i.rotation;
                switch (i.iconIdx) {
                    case 0: normalizedRotation = 0; break;
                    case 1:
                    case 6: normalizedRotation = i.rotation % 90; break;
                    case 2: normalizedRotation = i.rotation % 120; break;
                    case 3: normalizedRotation = i.rotation % 60; break;
                    case 4:
                    case 5: normalizedRotation = i.rotation % 72; break;
                }
                return `${i.iconIdx}-${i.color}-${Math.round(i.x)}-${Math.round(i.y)}-${normalizedRotation}`;
            })
            .sort()
            .join('|');
    };

    // --- Desen Üretme Mantığı ---
    const generatePattern = useCallback((count: number) => {
        const pattern: PatternItem[] = [];
        const MIN_DIST = 25;

        for (let i = 0; i < count; i++) {
            let x: number, y: number, isTooClose: boolean, attempts = 0;
            do {
                x = Math.random() * 70 + 15;
                y = Math.random() * 70 + 15;
                isTooClose = pattern.some(p => Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)) < MIN_DIST);
                attempts++;
            } while (isTooClose && attempts < 50);

            pattern.push({
                id: Math.random().toString(36).substr(2, 9),
                iconIdx: Math.floor(Math.random() * SHAPE_ICONS.length),
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                x, y,
                rotation: Math.floor(Math.random() * 8) * 45,
                scale: 0.9 + Math.random() * 0.5
            });
        }
        return pattern;
    }, []);

    const generateDistractor = (base: PatternItem[]) => {
        const distractor: PatternItem[] = JSON.parse(JSON.stringify(base));
        const targetIdx = Math.floor(Math.random() * distractor.length);
        const mutationType = Math.floor(Math.random() * 4);

        switch (mutationType) {
            case 0: {
                const otherColors = COLORS.filter(c => c !== distractor[targetIdx].color);
                distractor[targetIdx].color = otherColors[Math.floor(Math.random() * otherColors.length)];
                break;
            }
            case 1:
                if (distractor[targetIdx].iconIdx === 0) {
                    distractor[targetIdx].iconIdx = (distractor[targetIdx].iconIdx + 2) % SHAPE_ICONS.length;
                } else {
                    distractor[targetIdx].rotation = (distractor[targetIdx].rotation + 180) % 360;
                }
                break;
            case 2:
                distractor[targetIdx].iconIdx = (distractor[targetIdx].iconIdx + 3) % SHAPE_ICONS.length;
                break;
            case 3: {
                const moveX = distractor[targetIdx].x > 50 ? -25 : 25;
                const moveY = distractor[targetIdx].y > 50 ? -25 : 25;
                distractor[targetIdx].x = Math.max(15, Math.min(85, distractor[targetIdx].x + moveX));
                distractor[targetIdx].y = Math.max(15, Math.min(85, distractor[targetIdx].y + moveY));
                break;
            }
        }
        return distractor;
    };

    const startNewLevel = useCallback(() => {
        const shapeCount = Math.min(6, 2 + Math.floor(level / 3));
        const correct = generatePattern(shapeCount);
        const correctSig = getPatternSignature(correct);
        const opts = [correct];
        const sigs = new Set([correctSig]);

        let attempts = 0;
        while (opts.length < 4 && attempts < 20) {
            const dist = generateDistractor(correct);
            const sig = getPatternSignature(dist);
            if (!sigs.has(sig)) {
                opts.push(dist);
                sigs.add(sig);
            }
            attempts++;
        }

        setCorrectPattern(correct);
        setOptions(opts.sort(() => Math.random() - 0.5));
        setSelectedIndex(null);
        setPreviewTimer(3);
        setStatus('preview');
        playSound('detective_click');
    }, [level, generatePattern, playSound]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'preview' && previewTimer > 0) {
            interval = setInterval(() => setPreviewTimer(prev => prev - 1), 1000);
        } else if (status === 'preview' && previewTimer === 0) {
            setStatus('deciding');
            playSound('detective_mystery');
        }
        return () => clearInterval(interval);
    }, [status, previewTimer, playSound]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'deciding' && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && status === 'deciding') {
            setStatus('gameover');
        }
        return () => clearInterval(interval);
    }, [status, timeLeft]);

    const handleSelect = (idx: number) => {
        if (status !== 'deciding') return;
        setSelectedIndex(idx);
        const isCorrect = getPatternSignature(options[idx]) === getPatternSignature(correctPattern);

        if (isCorrect) {
            setFeedback('correct');
            setFeedbackMsg(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
            setScore(prev => prev + (level * 100));
            playSound('detective_correct');
            setStatus('result');
            setTimeout(() => {
                setLevel(prev => prev + 1);
                setFeedback(null);
                startNewLevel();
            }, 1500);
        } else {
            setFeedback('wrong');
            setFeedbackMsg(FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)]);
            playSound('detective_incorrect');
            const newLives = lives - 1;
            setLives(newLives);
            setTimeout(() => {
                setFeedback(null);
                if (newLives <= 0) {
                    setStatus('gameover');
                } else {
                    startNewLevel();
                }
            }, 1500);
        }
    };

    const startApp = useCallback(() => {
        setLevel(1);
        setScore(0);
        setLives(3);
        setTimeLeft(60);
        setFeedback(null);
        startNewLevel();
    }, [startNewLevel]);

    // Handle Auto Start from HUB
    useEffect(() => {
        if (location.state?.autoStart && status === 'waiting') {
            startApp();
        }
    }, [location.state, status, startApp]);

    // Oyun başladığında süre başlat
    useEffect(() => {
        if (status === 'preview') {
            gameStartTimeRef.current = Date.now();
        }
    }, [status]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (status === 'gameover' && gameStartTimeRef.current > 0) {
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'golge-dedektifi',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    level_reached: level,
                    game_name: 'Gölge Dedektifi',
                }
            });
        }
    }, [status, score, level, saveGamePlay]);

    // Format Time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderPattern = (items: PatternItem[], size: number = 300) => (
        <div
            className="relative overflow-hidden rounded-[30%]"
            style={{
                width: size,
                height: size,
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
                boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}
        >
            {items.map((item) => {
                const Icon = SHAPE_ICONS[item.iconIdx];
                return (
                    <motion.div
                        key={item.id}
                        initial={status === 'preview' ? { scale: 0, opacity: 0 } : false}
                        animate={{ scale: item.scale, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        style={{
                            position: 'absolute',
                            left: `${item.x}%`,
                            top: `${item.y}%`,
                            color: item.color,
                            transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                            filter: `drop-shadow(0 2px 4px ${item.color}40)`
                        }}
                    >
                        <Icon size={size / 8} strokeWidth={2.5} />
                    </motion.div>
                );
            })}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
                    <Link
                        to={backLink}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>{backLabel}</span>
                    </Link>

                    {(status === 'preview' || status === 'deciding' || status === 'result') && (
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

                            {/* Timer */}
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: timeLeft <= 10
                                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)'
                                        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: `1px solid ${timeLeft <= 10 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                                }}
                            >
                                <Timer className={timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} />
                                <span className={`font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            {/* Level */}
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                <Zap className="text-emerald-400" size={18} />
                                <span className="font-bold text-emerald-400">Seviye {level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {/* Welcome Screen */}
                    {status === 'waiting' && (
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
                                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Search size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                🔍 Gölge Dedektifi
                            </h1>

                            {/* Instructions */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
                                    <Eye size={20} /> Nasıl Oynanır?
                                </h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-purple-400" />
                                        <span>Deseni 3 saniye incele</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-purple-400" />
                                        <span>Tıpatıp aynısını bul</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-purple-400" />
                                        <span>Dikkatli ol, şekiller çok benziyor!</span>
                                    </li>
                                </ul>
                            </div>

                            {/* TUZÖ Badge */}
                            <div className="bg-indigo-500/10 text-indigo-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-indigo-500/30">
                                TUZÖ 5.3.2 Görsel Analiz
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startApp}
                                className="px-8 py-4 rounded-2xl font-bold text-lg"
                                style={{
                                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(99, 102, 241, 0.4)'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={24} fill="currentColor" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Preview Phase */}
                    {status === 'preview' && (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <div className="flex items-center justify-center gap-3 mb-6">
                                <Eye className="text-purple-400 animate-pulse" size={24} />
                                <span className="text-xl font-bold text-purple-300">
                                    Deseni Ezberle: {previewTimer}s
                                </span>
                            </div>

                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="p-8 rounded-[3rem] mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                                    boxShadow: '0 0 60px rgba(99, 102, 241, 0.2)',
                                    border: '2px solid rgba(99, 102, 241, 0.3)'
                                }}
                            >
                                {renderPattern(correctPattern, 320)}
                            </motion.div>

                            {/* Progress Bar */}
                            <div className="w-full bg-slate-800 h-2 rounded-full max-w-sm mx-auto overflow-hidden">
                                <motion.div
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full"
                                    initial={{ width: "100%" }}
                                    animate={{ width: "0%" }}
                                    transition={{ duration: 3, ease: "linear" }}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Deciding Phase */}
                    {(status === 'deciding' || status === 'result') && (
                        <motion.div
                            key="deciding"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-4xl"
                        >
                            <h2 className="text-xl font-bold text-center text-slate-300 mb-6">
                                Hangisi az önceki desenle aynıydı?
                            </h2>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {options.map((item, idx) => {
                                    const isSelected = selectedIndex === idx;
                                    const isItemCorrect = getPatternSignature(item) === getPatternSignature(correctPattern);

                                    let cardStyle: React.CSSProperties = {
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    };

                                    if (selectedIndex !== null) {
                                        if (isSelected) {
                                            cardStyle = isItemCorrect ? {
                                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                                boxShadow: '0 0 40px rgba(16, 185, 129, 0.4), inset 0 -4px 8px rgba(0,0,0,0.2)',
                                                border: '2px solid rgba(16, 185, 129, 0.6)'
                                            } : {
                                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                                                boxShadow: '0 0 40px rgba(239, 68, 68, 0.4), inset 0 -4px 8px rgba(0,0,0,0.2)',
                                                border: '2px solid rgba(239, 68, 68, 0.6)'
                                            };
                                        } else if (isItemCorrect && feedback === 'wrong') {
                                            cardStyle = {
                                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
                                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2)',
                                                border: '2px solid rgba(16, 185, 129, 0.4)'
                                            };
                                        }
                                    }

                                    return (
                                        <motion.button
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            whileHover={selectedIndex === null ? { scale: 1.02, y: -4 } : {}}
                                            whileTap={selectedIndex === null ? { scale: 0.98 } : {}}
                                            onClick={() => handleSelect(idx)}
                                            disabled={selectedIndex !== null}
                                            className="p-4 rounded-2xl transition-all"
                                            style={cardStyle}
                                        >
                                            <div className="flex flex-col items-center">
                                                {renderPattern(item, 160)}
                                                <span className="mt-3 text-xs font-bold text-slate-500">
                                                    Seçenek {idx + 1}
                                                </span>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Game Over Screen */}
                    {status === 'gameover' && (
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
                                {score >= 500 ? '🎉 Süper Dedektif!' : 'Görev Tamamlandı!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {score >= 500 ? 'Muhteşem bir gözlem yeteneğin var!' : 'Biraz daha pratik yap!'}
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
                                        <p className="text-3xl font-bold text-emerald-400">{level}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startApp}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(99, 102, 241, 0.4)'
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
                                className={`
                                    px-12 py-8 rounded-3xl text-center
                                    ${feedback === 'correct'
                                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                        : 'bg-gradient-to-br from-orange-500 to-amber-600'
                                    }
                                `}
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

export default ShadowDetectiveGame;
