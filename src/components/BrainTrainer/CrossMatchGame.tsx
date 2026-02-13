import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RotateCcw, Trophy, Timer, Play,
    Circle, Square, Triangle, Hexagon, Star, Pentagon,
    Cross, Moon, Heart, Zap, Eye, Sparkles, Grid3X3
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

// --- Shapes ---
const SHAPE_ICONS = [Circle, Square, Triangle, Hexagon, Star, Pentagon, Cross, Moon, Heart];

// High Contrast Candy Colors
const COLORS = [
    { name: 'Yeşil', hex: '#6BCB77' },
    { name: 'Turuncu', hex: '#FFA500' },
    { name: 'Mavi', hex: '#4ECDC4' },
    { name: 'Pembe', hex: '#FF6B6B' },
    { name: 'Mor', hex: '#9B59B6' },
];

// Child-friendly messages


interface Card {
    id: string;
    symbolIdx: number;
    colorIdx: number;
    isFlipped: boolean;
    isMatched: boolean;
    position: number;
}

type GameStatus = 'waiting' | 'preview' | 'playing' | 'shuffling' | 'gameover';

const CrossMatchGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback } = useGameFeedback();
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [timeLeft, setTimeLeft] = useState(60);
    const shuffleIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    // Exam Mode Props
    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || 60;

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // --- Card Generation ---
    const generateCards = useCallback((lvl: number) => {
        const pairCount = Math.min(8, 2 + Math.floor(lvl / 2));
        const selectedPairs: { s: number, c: number }[] = [];

        while (selectedPairs.length < pairCount) {
            const s = Math.floor(Math.random() * SHAPE_ICONS.length);
            const c = Math.floor(Math.random() * COLORS.length);
            if (!selectedPairs.some(p => p.s === s && p.c === c)) {
                selectedPairs.push({ s, c });
            }
        }

        const newCards: Card[] = [];
        [...selectedPairs, ...selectedPairs].forEach((pair, idx) => {
            newCards.push({
                id: Math.random().toString(36).substr(2, 9),
                symbolIdx: pair.s,
                colorIdx: pair.c,
                isFlipped: true,
                isMatched: false,
                position: idx
            });
        });

        return newCards.sort(() => Math.random() - 0.5);
    }, []);

    // --- Shuffle Logic ---
    const shufflePositions = useCallback(() => {
        if (status !== 'playing') return;

        playSound('memory_shuffle');
        setCards(prev => {
            const newPositions = [...prev.map((_, i) => i)].sort(() => Math.random() - 0.5);
            return prev.map((card, idx) => ({
                ...card,
                position: newPositions[idx]
            }));
        });
    }, [status, playSound]);

    // --- Start Level ---
    const startLevel = useCallback((lvl: number) => {
        const newCards = generateCards(lvl);
        setCards(newCards);
        setFlippedIndices([]);
        setStatus('preview');
        setTimeLeft(60);

        setTimeout(() => {
            setCards(prev => prev.map(c => ({ ...c, isFlipped: false })));
            setStatus('playing');
        }, 3000);
    }, [generateCards]);

    const startApp = useCallback(async () => {
        window.scrollTo(0, 0);
        hasSavedRef.current = false;
        gameStartTimeRef.current = Date.now();
        setLevel(1);
        setScore(0);
        setLives(3);
        setTimeLeft(examMode ? examTimeLimit : 60);
        startLevel(1);
    }, [startLevel, examMode, examTimeLimit]);

    // Handle Auto Start from HUB or examMode
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && status === 'waiting') {
            startApp();
        }
    }, [location.state, status, startApp, examMode]);

    // --- Shuffle Timer ---
    useEffect(() => {
        if (status === 'playing' && level > 2) {
            const intervalTime = Math.max(3000, 8000 - (level * 500));
            shuffleIntervalRef.current = setInterval(shufflePositions, intervalTime);
        }
        return () => {
            if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
        };
    }, [status, level, shufflePositions]);

    // --- Timer ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'playing' && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && status === 'playing') {
            setStatus('gameover');
        }
        return () => clearInterval(interval);
    }, [status, timeLeft]);

    // Save game data on game over
    useEffect(() => {
        if (status === 'gameover' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);

            // Exam mode: submit result and redirect
            if (examMode) {
                (async () => {
                    await submitResult(score > 500, score, 1000, durationSeconds);
                    navigate("/atolyeler/sinav-simulasyonu/devam");
                })();
                return;
            }

            saveGamePlay({
                game_id: 'capraz-eslesme',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    level_reached: level,
                    game_name: 'Çapraz Eşleşme',
                }
            });
        }
    }, [status, score, level, saveGamePlay, examMode, submitResult, navigate]);

    // Format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Card Click ---
    const handleCardClick = (idx: number) => {
        if (status !== 'playing' || cards[idx].isFlipped || cards[idx].isMatched || flippedIndices.length >= 2) return;

        playSound('memory_flip');
        const newFlipped = [...flippedIndices, idx];
        setFlippedIndices(newFlipped);

        setCards(prev => prev.map((c, i) => i === idx ? { ...c, isFlipped: true } : c));

        if (newFlipped.length === 2) {
            const [firstIdx, secondIdx] = newFlipped;
            const first = cards[firstIdx];
            const second = cards[secondIdx];

            if (first.symbolIdx === second.symbolIdx && first.colorIdx === second.colorIdx) {
                // Match!
                setTimeout(() => {
                    playSound('memory_match');
                    showFeedback(true);
                    setCards(prev => prev.map((c, i) =>
                        (i === firstIdx || i === secondIdx) ? { ...c, isMatched: true } : c
                    ));
                    setFlippedIndices([]);
                    setScore(prev => prev + (level * 50));


                    // Check level complete
                    setCards(currentCards => {
                        const allMatched = currentCards.every(c =>
                            (c.id === first.id || c.id === second.id) ? true : c.isMatched
                        );
                        if (allMatched) {
                            setTimeout(() => {
                                setLevel(prev => prev + 1);
                                startLevel(level + 1);
                            }, 1000);
                        }
                        return currentCards;
                    });
                }, 500);
            } else {
                // Wrong match
                setTimeout(() => {
                    playSound('memory_fail');
                    showFeedback(false);

                    const newLives = lives - 1;
                    setLives(newLives);

                    setCards(prev => prev.map((c, i) =>
                        (i === firstIdx || i === secondIdx) ? { ...c, isFlipped: false } : c
                    ));
                    setFlippedIndices([]);

                    setTimeout(() => {
                        if (newLives <= 0) {
                            setStatus('gameover');
                        }
                    }, 1200);
                }, 1000);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
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

                    {(status === 'preview' || status === 'playing') && (
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
                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Grid3X3 size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                🃏 Çapraz Eşleşme
                            </h1>

                            {/* Instructions */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-emerald-300 mb-3 flex items-center gap-2">
                                    <Eye size={20} /> Nasıl Oynanır?
                                </h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-teal-400" />
                                        <span>Kartları 3 saniye incele</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-teal-400" />
                                        <span>Aynı şekil ve rengi eşleştir</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-teal-400" />
                                        <span>Dikkat! Kartlar yer değiştirebilir</span>
                                    </li>
                                </ul>
                            </div>

                            {/* TUZÖ Badge */}
                            <div className="bg-emerald-500/10 text-emerald-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-emerald-500/30">
                                TUZÖ 5.4.2 Görsel Kısa Süreli Bellek
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startApp}
                                className="px-8 py-4 rounded-2xl font-bold text-lg"
                                style={{
                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(16, 185, 129, 0.4)'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={24} fill="currentColor" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Game Screen */}
                    {(status === 'preview' || status === 'playing' || status === 'shuffling') && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-4xl"
                        >
                            {/* Status */}
                            <div className="text-center mb-6">
                                <p className="text-lg font-bold text-emerald-300">
                                    {status === 'preview' ? '👀 Kartları İncele...' : '🃏 Eşleştir!'}
                                </p>
                            </div>

                            {/* Cards Grid */}
                            <div
                                className="grid grid-cols-4 gap-3 p-6 rounded-3xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                {cards.map((card, idx) => {
                                    const Icon = SHAPE_ICONS[card.symbolIdx];
                                    const color = COLORS[card.colorIdx];

                                    return (
                                        <motion.button
                                            key={card.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={!card.isFlipped && !card.isMatched && status === 'playing' ? { scale: 0.95 } : {}}
                                            whileTap={!card.isFlipped && !card.isMatched && status === 'playing' ? { scale: 0.9 } : {}}
                                            onClick={() => handleCardClick(idx)}
                                            className={`aspect-square rounded-[30%] transition-all ${card.isMatched ? 'opacity-30' : ''}`}
                                            style={{
                                                background: card.isFlipped || card.isMatched
                                                    ? `linear-gradient(135deg, ${color.hex}40 0%, ${color.hex}20 100%)`
                                                    : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                                boxShadow: card.isFlipped || card.isMatched
                                                    ? `inset 0 -6px 12px rgba(0,0,0,0.3), inset 0 6px 12px rgba(255,255,255,0.2), 0 0 20px ${color.hex}40`
                                                    : 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)',
                                                border: card.isFlipped || card.isMatched
                                                    ? `2px solid ${color.hex}80`
                                                    : '1px solid rgba(255,255,255,0.1)',
                                                cursor: !card.isFlipped && !card.isMatched && status === 'playing' ? 'pointer' : 'default'
                                            }}
                                            disabled={card.isFlipped || card.isMatched || status !== 'playing'}
                                        >
                                            {(card.isFlipped || card.isMatched) && (
                                                <div className="flex flex-col items-center justify-center h-full">
                                                    <Icon size={36} color={color.hex} strokeWidth={2.5} />
                                                </div>
                                            )}
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
                                {score >= 500 ? '🎉 Harika!' : 'Görev Tamamlandı!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {score >= 500 ? 'Muhteşem bir hafızan var!' : 'Biraz daha pratik yap!'}
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
                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(16, 185, 129, 0.4)'
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

export default CrossMatchGame;

