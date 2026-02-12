import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Play, Trophy, Sparkles, Heart, Star, Timer, Puzzle, Eye, RefreshCw } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// ------------------ Tip Tanımları ------------------
interface PatternProps {
    points?: number;
    sides?: number;
    lines?: number;
    pathData?: string;
}

type Pattern = {
    defs: string;
    type: string;
    backgroundColor: string;
    foregroundColor: string;
    size: number;
    rotation: number;
    opacity: number;
    id: string;
    props?: PatternProps;
};

interface GameOption {
    pattern: Pattern[];
    isCorrect: boolean;
}

// Çocuk dostu, canlı renk paleti
const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43', '#A29BFE', '#55E6C1', '#FD79A8', '#FAB1A0', '#00D2D3', '#54A0FF', '#5F27CD', '#FF9F43'];
const PATTERN_TYPES = ['dots', 'stripes', 'zigzag', 'waves', 'checkerboard', 'crosshatch', 'star', 'polygon', 'scribble', 'burst'];

// Child-friendly messages


const PartWholeGame: React.FC = () => {
    const { playSound } = useSound();
    const { feedbackState, showFeedback } = useGameFeedback();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [gamePattern, setGamePattern] = useState<Pattern[]>([]);
    const [options, setOptions] = useState<GameOption[]>([]);
    const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [lives, setLives] = useState(3);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);
    const totalQuestions = 10;

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    const svgSize = 300;
    const pieceSize = 100;

    // ------------------ Desen Generator ------------------
    const getPatternDefs = useCallback((pattern: Pattern): string => {
        const strokeWidth = pattern.size / 6;
        const { size, backgroundColor, foregroundColor, type, id, props } = pattern;

        const baseRect = `<rect width="${size}" height="${size}" fill="${backgroundColor}"/>`;

        switch (type) {
            case 'dots':
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="${foregroundColor}"/></pattern>`;
            case 'stripes':
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<rect width="${size}" height="${size / 3}" fill="${foregroundColor}"/></pattern>`;
            case 'zigzag':
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<path d="M0 0 L${size / 2} ${size} L${size} 0" stroke="${foregroundColor}" fill="none" stroke-width="${strokeWidth}"/></pattern>`;
            case 'waves':
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<path d="M0 ${size / 2} Q${size / 4} 0 ${size / 2} ${size / 2} T${size} ${size / 2}" stroke="${foregroundColor}" fill="none" stroke-width="${strokeWidth}"/></pattern>`;
            case 'checkerboard':
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<rect width="${size / 2}" height="${size / 2}" fill="${foregroundColor}"/><rect x="${size / 2}" y="${size / 2}" width="${size / 2}" height="${size / 2}" fill="${foregroundColor}"/></pattern>`;
            case 'crosshatch':
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<path d="M0 0 L${size} ${size} M0 ${size} L${size} 0" stroke="${foregroundColor}" stroke-width="${strokeWidth}"/></pattern>`;

            case 'star': {
                const points = props?.points || 5;
                const innerRadius = size / 4;
                const outerRadius = size / 2.5;
                let path = '';
                for (let i = 0; i < points * 2; i++) {
                    const angle = (i * Math.PI) / points;
                    const r = i % 2 === 0 ? outerRadius : innerRadius;
                    const x = size / 2 + Math.cos(angle) * r;
                    const y = size / 2 + Math.sin(angle) * r;
                    path += (i === 0 ? 'M' : 'L') + `${x},${y}`;
                }
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<path d="${path}Z" fill="${foregroundColor}"/></pattern>`;
            }

            case 'polygon': {
                const sides = props?.sides || 6;
                const radius = size / 2.5;
                let path = '';
                for (let i = 0; i < sides; i++) {
                    const angle = (i * 2 * Math.PI) / sides;
                    const x = size / 2 + Math.cos(angle) * radius;
                    const y = size / 2 + Math.sin(angle) * radius;
                    path += (i === 0 ? 'M' : 'L') + `${x},${y}`;
                }
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<path d="${path}Z" fill="${foregroundColor}"/></pattern>`;
            }

            case 'scribble': {
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<path d="${props?.pathData}" stroke="${foregroundColor}" fill="none" stroke-width="${strokeWidth}" stroke-linecap="round"/></pattern>`;
            }

            case 'burst': {
                const lines = props?.lines || 8;
                let path = '';
                for (let i = 0; i < lines; i++) {
                    const angle = (i * 2 * Math.PI) / lines;
                    const x2 = size / 2 + Math.cos(angle) * (size / 2);
                    const y2 = size / 2 + Math.sin(angle) * (size / 2);
                    path += `M${size / 2},${size / 2} L${x2},${y2} `;
                }
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<path d="${path}" stroke="${foregroundColor}" stroke-width="${strokeWidth}"/></pattern>`;
            }

            default: return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}</pattern>`;
        }
    }, []);

    const generatePattern = useCallback((): Pattern => {
        const type = PATTERN_TYPES[Math.floor(Math.random() * PATTERN_TYPES.length)];
        const backgroundColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        const foregroundColor = COLORS.filter(c => c !== backgroundColor)[Math.floor(Math.random() * (COLORS.length - 1))];
        const size = 30 + Math.random() * 40;

        const props: PatternProps = {};
        if (type === 'star') props.points = 4 + Math.floor(Math.random() * 5);
        if (type === 'polygon') props.sides = 3 + Math.floor(Math.random() * 6);
        if (type === 'burst') props.lines = 6 + Math.floor(Math.random() * 10);
        if (type === 'scribble') {
            const points = Array.from({ length: 4 }, () => ({
                x: Math.random() * size,
                y: Math.random() * size
            }));
            props.pathData = `M${points[0].x},${points[0].y} Q${points[1].x},${points[1].y} ${points[2].x},${points[2].y} T${points[3].x},${points[3].y}`;
        }

        const base: Pattern = {
            defs: '',
            type,
            backgroundColor,
            foregroundColor,
            size,
            rotation: Math.random() * 360,
            opacity: 0.85 + Math.random() * 0.15,
            id: `pattern-${Math.random().toString(36).slice(2, 11)}`,
            props
        };
        return { ...base, defs: getPatternDefs(base) };
    }, [getPatternDefs]);

    // Mikro renk sapması
    const distortColor = (hex: string | undefined, intensity: number = 10): string => {
        if (!hex || typeof hex !== 'string' || hex.length < 7) {
            return '#888888';
        }
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const adjust = (c: number) => Math.max(0, Math.min(255, c + Math.round((Math.random() - 0.5) * intensity)));
        return `#${adjust(r).toString(16).padStart(2, '0')}${adjust(g).toString(16).padStart(2, '0')}${adjust(b).toString(16).padStart(2, '0')}`;
    };

    const generateLevel = useCallback(() => {
        const numShapes = Math.min(level + 1, 8);
        const newPattern = Array.from({ length: numShapes }, () => generatePattern());
        setGamePattern(newPattern);

        const x = Math.floor(Math.random() * (svgSize - pieceSize));
        const y = Math.floor(Math.random() * (svgSize - pieceSize));
        setTargetPos({ x, y });

        const correctOption: GameOption = { pattern: newPattern, isCorrect: true };
        const distractors: GameOption[] = Array.from({ length: 3 }, () => {
            const wrongPattern = newPattern.map(p => {
                const updatedP = {
                    ...p,
                    id: `pattern-${Math.random().toString(36).slice(2, 11)}`,
                    rotation: p.rotation + (Math.random() - 0.5) * (level + 5),
                    size: p.size * (0.95 + Math.random() * 0.1),
                    backgroundColor: distortColor(p.backgroundColor, 12),
                    foregroundColor: distortColor(p.foregroundColor, 12),
                    opacity: Math.max(0.5, p.opacity * (0.95 + Math.random() * 0.1))
                };
                return { ...updatedP, defs: getPatternDefs(updatedP) };
            });
            return { pattern: wrongPattern, isCorrect: false };
        });

        setOptions([...distractors, correctOption].sort(() => Math.random() - 0.5));
        setTimeLeft(30);
    }, [level, generatePattern, getPatternDefs]);

    useEffect(() => {
        if (gameStarted && !gameOver && !feedbackState) {
            generateLevel();
        }
    }, [gameStarted, gameOver, level, generateLevel, feedbackState]);

    // Timer
    useEffect(() => {
        if (!gameStarted || gameOver || feedbackState) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    showFeedback(false);
                    setLives(l => l - 1);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameStarted, gameOver, feedbackState]);

    // Handle feedbackState timeout
    useEffect(() => {
        if (feedbackState) {
            const timeout = setTimeout(() => {
                if (lives <= 0 && feedbackState?.correct === false) {
                    setGameOver(true);
                } else if (level >= totalQuestions) {
                    setGameOver(true);
                } else {
                    setLevel(l => l + 1);
                }
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [feedbackState, lives, level]);

    const handleOptionSelect = (option: GameOption) => {
        if (feedbackState || gameOver) return;

        if (option.isCorrect) {
            playSound('correct');
            showFeedback(true);
            setScore(s => s + (level * 100) + (timeLeft * 5));
        } else {
            playSound('incorrect');
            showFeedback(false);
            setLives(l => l - 1);
        }
    };

    const startGame = useCallback(() => {
        window.scrollTo(0, 0);
        setOptions([]);
        setGamePattern([]);
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
                game_id: 'parca-butun',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
                metadata: {
                    level_reached: level,
                    game_name: 'Parça Bütün İlişkisi',
                }
            });
        }
    }, [gameOver, score, lives, level, saveGamePlay]);

    // Skip question with penalty
    const skipQuestion = useCallback(() => {
        if (feedbackState || gameOver) return;
        setScore(s => Math.max(0, s - 50));
        generateLevel();
    }, [feedbackState, gameOver, generateLevel]);

    // ------------------ Render Component ------------------
    const PatternSVG = ({ pattern, size, viewBox, isMain = false }: { pattern: Pattern[], size: number, viewBox?: string, isMain?: boolean }) => (
        <svg
            width={size}
            height={size}
            viewBox={viewBox || `0 0 ${svgSize} ${svgSize}`}
            className="rounded-[25%] overflow-hidden"
            style={{ boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2)' }}
        >
            {pattern.map((p, i) => (
                <React.Fragment key={`${p.id}-${i}`}>
                    <defs dangerouslySetInnerHTML={{ __html: p.defs }} />
                    <rect
                        x="0" y="0" width={svgSize} height={svgSize}
                        fill={`url(#${p.id})`}
                        opacity={p.opacity}
                        transform={`rotate(${p.rotation} ${svgSize / 2} ${svgSize / 2})`}
                    />
                </React.Fragment>
            ))}
            {isMain && (
                <motion.rect
                    layoutId="white-gap"
                    x={targetPos.x}
                    y={targetPos.y}
                    width={pieceSize}
                    height={pieceSize}
                    fill="white"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="3"
                    rx="15"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.3))' }}
                />
            )}
        </svg>
    );

    // Welcome Screen
    if (!gameStarted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-950 text-white">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
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
                                background: 'linear-gradient(135deg, #14B8A6 0%, #059669 100%)',
                                boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                            }}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Puzzle size={52} className="text-white drop-shadow-lg" />
                        </motion.div>

                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                            🧩 Parça Bütün
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
                            <div className="flex items-center justify-center gap-4 mb-3">
                                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center relative">
                                    <div className="w-8 h-8 bg-white rounded-lg absolute" />
                                </div>
                                <span className="text-2xl">→</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {[0, 1, 2, 3].map(i => (
                                        <div
                                            key={i}
                                            className="w-8 h-8 rounded-lg"
                                            style={{
                                                background: i === 1
                                                    ? 'linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)'
                                                    : 'rgba(255,255,255,0.1)',
                                                border: i === 1 ? '2px solid #14B8A6' : '1px solid rgba(255,255,255,0.1)'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm">Eksik parçanın desenini bul!</p>
                        </div>

                        {/* Instructions */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                            <h3 className="text-lg font-bold text-teal-300 mb-3 flex items-center gap-2">
                                <Eye size={20} /> Nasıl Oynanır?
                            </h3>
                            <ul className="space-y-2 text-slate-300 text-sm">
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-teal-400" />
                                    <span>Desendeki <strong>beyaz boşluğa</strong> dikkat et</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-teal-400" />
                                    <span>Seçeneklerden <strong>doğru parçayı</strong> bul</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-teal-400" />
                                    <span>Renkler ve desenler aynı olmalı! 3 can!</span>
                                </li>
                            </ul>
                        </div>

                        {/* TUZÖ Badge */}
                        <div className="bg-teal-500/10 text-teal-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-teal-500/30">
                            TUZÖ 4.2.1 Parça-Bütün İlişkileri
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startGame}
                            className="px-8 py-4 rounded-2xl font-bold text-lg"
                            style={{
                                background: 'linear-gradient(135deg, #14B8A6 0%, #059669 100%)',
                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(20, 184, 166, 0.4)'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <Play size={24} fill="currentColor" />
                                <span>Oyuna Başla</span>
                            </div>
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
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
                                background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                border: '1px solid rgba(20, 184, 166, 0.3)'
                            }}
                        >
                            <Puzzle className="text-teal-400" size={18} />
                            <span className="font-bold text-teal-400">{level}/{totalQuestions}</span>
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

                        {/* Skip Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={skipQuestion}
                            disabled={feedbackState !== null}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                border: '1px solid rgba(251, 191, 36, 0.3)',
                                opacity: feedbackState ? 0.5 : 1
                            }}
                        >
                            <RefreshCw size={16} className="text-amber-400" />
                            <span className="text-amber-400 text-sm font-bold">Atla</span>
                        </motion.button>
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
                                {/* Main Pattern */}
                                <div
                                    className="rounded-3xl p-6 flex flex-col items-center"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <div className="text-center mb-4">
                                        <span className="text-sm font-bold text-teal-400 flex items-center justify-center gap-2">
                                            <Puzzle size={16} />
                                            Deseni İncele
                                        </span>
                                    </div>
                                    <PatternSVG pattern={gamePattern} size={svgSize} isMain={true} />
                                </div>

                                {/* Options */}
                                <div
                                    className="rounded-3xl p-6 flex flex-col items-center"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <h2 className="text-xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                                        Doğru Parçayı Bul! <Sparkles className="text-yellow-400" size={20} />
                                    </h2>

                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        {options.length > 0 && options.map((option, idx) => {
                                            const showResult = feedbackState !== null;
                                            const isCorrect = option.isCorrect;

                                            return (
                                                <motion.button
                                                    key={idx}
                                                    whileHover={!feedbackState ? { scale: 0.98, y: -2 } : {}}
                                                    whileTap={!feedbackState ? { scale: 0.95 } : {}}
                                                    onClick={() => handleOptionSelect(option)}
                                                    disabled={feedbackState !== null}
                                                    className="p-4 rounded-2xl transition-all flex items-center justify-center"
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
                                                        cursor: feedbackState ? 'default' : 'pointer',
                                                        opacity: showResult && !isCorrect ? 0.5 : 1
                                                    }}
                                                >
                                                    <PatternSVG
                                                        pattern={option.pattern}
                                                        size={120}
                                                        viewBox={`${targetPos.x} ${targetPos.y} ${pieceSize} ${pieceSize}`}
                                                    />
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
                                    background: 'linear-gradient(135deg, #14B8A6 0%, #EF4444 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Trophy size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-teal-300 mb-2">
                                {level >= 7 ? '🎉 Harika!' : 'Oyun Bitti!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {level >= 7 ? 'Desen ustasısın!' : 'Tekrar deneyelim!'}
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
                                        <p className="text-3xl font-bold text-teal-400">{level}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #14B8A6 0%, #059669 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(20, 184, 166, 0.4)'
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
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default PartWholeGame;

