import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, RotateCcw, Trophy, Play, Star, Timer, Zap, CheckCircle2, XCircle, Search, Move, Eye, Sparkles, Heart, Grid3X3, EyeOff } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// --- Types ---
interface CellData {
    id: string;
    value: number | null;
    initialIndex: number;
    currentIndex: number;
}

type GameStatus = 'waiting' | 'display' | 'shuffle' | 'reveal' | 'hide' | 'question' | 'gameover';

// Child-friendly messages
const SUCCESS_MESSAGES = [
    "Harika! 🧩",
    "Süper Hafıza! 🧠",
    "Müthiş! ⭐",
    "Bravo! 🌟",
];

const FAILURE_MESSAGES = [
    "Tekrar dene! 💪",
    "Dikkatli takip et! 👀",
];

const MatrixEchoGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [cells, setCells] = useState<CellData[]>([]);
    const [question, setQuestion] = useState<{ text: string; answer: number } | null>(null);
    const [options, setOptions] = useState<number[]>([]);
    const [timeLeft, setTimeLeft] = useState(30);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [showNumbers, setShowNumbers] = useState(true);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // --- Game Logic ---
    const generateGame = useCallback((lvl: number) => {
        const cellCount = Math.min(5, 3 + Math.floor(lvl / 4));
        const gridIndices = Array.from({ length: 9 }, (_, i) => i).sort(() => Math.random() - 0.5);
        const selectedIndices = gridIndices.slice(0, cellCount);

        const newCells: CellData[] = selectedIndices.map((idx, i) => ({
            id: `cell-${i}`,
            value: Math.floor(Math.random() * 19) + 1,
            initialIndex: idx,
            currentIndex: idx
        }));

        setCells(newCells);
        setShowNumbers(true);
        setStatus('display');
        setFeedback(null);
        playSound('detective_click');
    }, [playSound]);

    const startLevel = useCallback((lvl: number) => {
        generateGame(lvl);
    }, [generateGame]);

    const startApp = useCallback(() => {
        setLevel(1);
        setScore(0);
        setLives(3);
        setTimeLeft(30);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
        startLevel(1);
    }, [startLevel]);

    // Get position name
    const getPositionName = (index: number): string => {
        return `${index + 1}. kutu`;
    };

    // Generate Question
    const generateQuestion = useCallback((finalCells: CellData[]) => {
        const questionTypes = [
            () => {
                const randomCell = finalCells[Math.floor(Math.random() * finalCells.length)];
                return {
                    text: `Şu anda ${getPositionName(randomCell.currentIndex)}'da hangi sayı var?`,
                    answer: randomCell.value || 0
                };
            },
            () => {
                if (finalCells.length < 2) return null;
                const shuffled = [...finalCells].sort(() => Math.random() - 0.5);
                const cell1 = shuffled[0];
                const cell2 = shuffled[1];
                return {
                    text: `${getPositionName(cell1.currentIndex)}'daki ile ${getPositionName(cell2.currentIndex)}'daki toplamı?`,
                    answer: (cell1.value || 0) + (cell2.value || 0)
                };
            },
            () => {
                const maxCell = [...finalCells].sort((a, b) => (b.value || 0) - (a.value || 0))[0];
                return {
                    text: `En büyük sayı (${maxCell.value}) kaçıncı kutuda?`,
                    answer: maxCell.currentIndex + 1
                };
            },
            () => {
                const minCell = [...finalCells].sort((a, b) => (a.value || 0) - (b.value || 0))[0];
                return {
                    text: `En küçük sayı (${minCell.value}) kaçıncı kutuda?`,
                    answer: minCell.currentIndex + 1
                };
            },
            () => {
                const randomCell = finalCells[Math.floor(Math.random() * finalCells.length)];
                return {
                    text: `${randomCell.value} sayısı kaçıncı kutuda?`,
                    answer: randomCell.currentIndex + 1
                };
            },
        ];

        let q = null;
        let attempts = 0;
        while (!q && attempts < 10) {
            const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
            q = randomType();
            attempts++;
        }

        if (!q) {
            const cell = finalCells[0];
            q = {
                text: `${getPositionName(cell.currentIndex)}'da hangi sayı var?`,
                answer: cell.value || 0
            };
        }

        setQuestion(q);

        const opts = [q.answer];
        while (opts.length < 4) {
            const fake = q.answer + (Math.floor(Math.random() * 10) - 5);
            if (!opts.includes(fake) && fake > 0) opts.push(fake);
        }
        setOptions(opts.sort(() => Math.random() - 0.5));
    }, []);

    // Game Flow State Machine
    useEffect(() => {
        if (status === 'display') {
            // Step 1: Show numbers for 2.5 seconds
            const timer = setTimeout(() => {
                setStatus('shuffle');
                playSound('radar_scan');
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [status, playSound]);

    useEffect(() => {
        if (status === 'shuffle') {
            // Step 2: Perform shuffle animation (numbers still visible!)
            setTimeout(() => {
                // Create new shuffled indices
                const availableIndices = Array.from({ length: 9 }, (_, i) => i).sort(() => Math.random() - 0.5);

                setCells(prev => prev.map((cell, i) => ({
                    ...cell,
                    currentIndex: availableIndices[i]
                })));

                // After shuffle animation, go to reveal state
                setTimeout(() => {
                    setStatus('reveal');
                    playSound('complete');
                }, 800);
            }, 200);
        }
    }, [status, playSound]);

    useEffect(() => {
        if (status === 'reveal') {
            // Step 3: Show shuffled positions briefly (1.5s)
            const timer = setTimeout(() => {
                setStatus('hide');
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [status]);

    useEffect(() => {
        if (status === 'hide') {
            // Step 4: Hide numbers and show question
            setShowNumbers(false);
            generateQuestion(cells);

            const timer = setTimeout(() => {
                setStatus('question');
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [status, cells, generateQuestion]);

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'question' && timeLeft > 0 && !feedback) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && status === 'question' && !feedback) {
            setFeedback('wrong');
            setFeedbackMsg(FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)]);
            setLives(prev => prev - 1);
        }
        return () => clearInterval(interval);
    }, [status, timeLeft, feedback]);

    // Handle feedback timeout
    useEffect(() => {
        if (feedback) {
            const timeout = setTimeout(() => {
                setFeedback(null);
                if (lives <= 0 && feedback === 'wrong') {
                    setStatus('gameover');
                } else {
                    setLevel(prev => prev + 1);
                    setTimeLeft(30);
                    startLevel(level + 1);
                }
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [feedback, lives, level, startLevel]);

    const handleSelect = (val: number) => {
        if (status !== 'question' || feedback) return;

        if (val === question?.answer) {
            setFeedback('correct');
            setFeedbackMsg(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
            playSound('detective_correct');
            setScore(prev => prev + (level * 250) + (timeLeft * 10));
            setShowNumbers(true); // Show correct answer
        } else {
            setFeedback('wrong');
            setFeedbackMsg(FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)]);
            playSound('detective_incorrect');
            setLives(prev => prev - 1);
            setShowNumbers(true); // Show correct positions
        }
    };

    // Handle Auto Start from HUB
    useEffect(() => {
        if (location.state?.autoStart && status === 'waiting') {
            startApp();
        }
    }, [location.state, status, startApp]);

    // Save game data on finish
    useEffect(() => {
        if (status === 'gameover' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'matris-yankisi',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
                metadata: {
                    level_reached: level,
                    game_name: 'Matris Yankısı',
                }
            });
        }
    }, [status, score, lives, level, saveGamePlay]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-teal-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
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

                    {status !== 'waiting' && status !== 'gameover' && (
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
                                    background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(13, 148, 136, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(20, 184, 166, 0.3)'
                                }}
                            >
                                <Grid3X3 className="text-teal-400" size={18} />
                                <span className="font-bold text-teal-400">Seviye {level}</span>
                            </div>

                            {/* Timer */}
                            {status === 'question' && (
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
                            )}
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
                                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Search size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                                🧩 Matris Yankısı
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
                                <p className="text-slate-400 text-sm mb-3">Nasıl Oynanır:</p>
                                <div className="flex items-center justify-center gap-3 mb-3">
                                    <div className="text-center">
                                        <div className="grid grid-cols-3 gap-1 mb-1">
                                            {[1, null, 2, null, 3, null, null, null, null].map((n, i) => (
                                                <div
                                                    key={i}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                                                    style={{
                                                        background: n ? 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)' : 'rgba(255,255,255,0.05)',
                                                    }}
                                                >
                                                    {n || ''}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-teal-400">Sayıları gör</p>
                                    </div>
                                    <span className="text-2xl">→</span>
                                    <div className="text-center">
                                        <div className="grid grid-cols-3 gap-1 mb-1">
                                            {[null, 2, null, 1, null, null, null, null, 3].map((n, i) => (
                                                <div
                                                    key={i}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                                                    style={{
                                                        background: n ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'rgba(255,255,255,0.05)',
                                                    }}
                                                >
                                                    {n || ''}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-amber-400">Karıştır & Takip et</p>
                                    </div>
                                    <span className="text-2xl">→</span>
                                    <div className="text-center">
                                        <div className="grid grid-cols-3 gap-1 mb-1">
                                            {[null, '?', null, '?', null, null, null, null, '?'].map((n, i) => (
                                                <div
                                                    key={i}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                                                    style={{
                                                        background: n === '?' ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' : 'rgba(255,255,255,0.05)',
                                                    }}
                                                >
                                                    {n || ''}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-indigo-400">Soru cevapla</p>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-teal-300 mb-3 flex items-center gap-2">
                                    <Eye size={20} /> Nasıl Oynanır?
                                </h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-cyan-400" />
                                        <span>Matristeki sayıları <strong>iyi ezberle</strong></span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-cyan-400" />
                                        <span>Karıştırmayı <strong>gözlerinle takip et</strong></span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-cyan-400" />
                                        <span>Yeni konumları hatırla, 3 can!</span>
                                    </li>
                                </ul>
                            </div>

                            {/* TUZÖ Badge */}
                            <div className="bg-teal-500/10 text-teal-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-teal-500/30">
                                TUZÖ 5.3.2 Görsel Çalışma Belleği
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startApp}
                                className="px-8 py-4 rounded-2xl font-bold text-lg"
                                style={{
                                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(20, 184, 166, 0.4)'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={24} fill="currentColor" />
                                    <span>Teste Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Playing States */}
                    {(status === 'display' || status === 'shuffle' || status === 'reveal' || status === 'hide' || status === 'question') && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full flex flex-col items-center gap-8"
                        >
                            {/* Status Message */}
                            <div
                                className="rounded-2xl px-6 py-3 text-center"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                    border: status === 'display' ? '2px solid rgba(20, 184, 166, 0.5)' :
                                        (status === 'shuffle' || status === 'reveal') ? '2px solid rgba(245, 158, 11, 0.5)' :
                                            status === 'hide' ? '2px solid rgba(168, 85, 247, 0.5)' :
                                                '2px solid rgba(6, 182, 212, 0.5)'
                                }}
                            >
                                {status === 'display' && (
                                    <div className="flex items-center gap-3 text-teal-400 font-bold">
                                        <Eye className="animate-pulse" size={20} />
                                        <span>Sayıları Ezberle!</span>
                                    </div>
                                )}
                                {status === 'shuffle' && (
                                    <div className="flex items-center gap-3 text-amber-400 font-bold">
                                        <Move className="animate-spin" size={20} />
                                        <span>Karıştırılıyor... Takip Et!</span>
                                    </div>
                                )}
                                {status === 'reveal' && (
                                    <div className="flex items-center gap-3 text-amber-400 font-bold">
                                        <Eye size={20} />
                                        <span>Yeni Konumları Gözlemle!</span>
                                    </div>
                                )}
                                {status === 'hide' && (
                                    <div className="flex items-center gap-3 text-purple-400 font-bold">
                                        <EyeOff size={20} />
                                        <span>Sayılar Gizleniyor...</span>
                                    </div>
                                )}
                                {status === 'question' && (
                                    <div className="flex items-center gap-3 text-cyan-400 font-bold">
                                        <Zap size={20} />
                                        <span>Cevapla!</span>
                                    </div>
                                )}
                            </div>

                            {/* 3x3 Matrix */}
                            <div
                                className="grid grid-cols-3 gap-3 p-4 rounded-3xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                {Array.from({ length: 9 }).map((_, idx) => {
                                    const cell = cells.find(c => c.currentIndex === idx);
                                    const shouldShowNumber = showNumbers || (feedback !== null);

                                    return (
                                        <motion.div
                                            key={idx}
                                            layout
                                            className="w-24 h-24 rounded-[25%] flex items-center justify-center relative"
                                            style={{
                                                background: cell
                                                    ? (status === 'shuffle' || status === 'reveal')
                                                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.4) 0%, rgba(217, 119, 6, 0.3) 100%)'
                                                        : 'linear-gradient(135deg, rgba(20, 184, 166, 0.3) 0%, rgba(13, 148, 136, 0.2) 100%)'
                                                    : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.05)',
                                                border: cell
                                                    ? (status === 'shuffle' || status === 'reveal')
                                                        ? '2px solid rgba(245, 158, 11, 0.5)'
                                                        : '2px solid rgba(20, 184, 166, 0.3)'
                                                    : '1px solid rgba(255,255,255,0.1)'
                                            }}
                                        >
                                            <AnimatePresence mode="popLayout">
                                                {cell && (
                                                    <motion.div
                                                        key={cell.id}
                                                        layoutId={cell.id}
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0, opacity: 0 }}
                                                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                                        className="text-4xl font-black text-white"
                                                    >
                                                        {shouldShowNumber ? cell.value : '?'}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Position Number */}
                                            <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                                                <span className="text-xs font-bold text-white/50">{idx + 1}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Question */}
                            {status === 'question' && question && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full max-w-lg space-y-6"
                                >
                                    <div
                                        className="rounded-2xl p-5 text-center"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                            boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <h3 className="text-xl font-bold text-white mb-2">{question.text}</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {options.map((opt, i) => {
                                            const isCorrect = opt === question.answer;
                                            const showResult = feedback !== null;

                                            return (
                                                <motion.button
                                                    key={i}
                                                    whileHover={!feedback ? { scale: 0.98, y: -2 } : {}}
                                                    whileTap={!feedback ? { scale: 0.95 } : {}}
                                                    onClick={() => handleSelect(opt)}
                                                    disabled={feedback !== null}
                                                    className="py-6 text-2xl font-bold rounded-[25%] transition-all"
                                                    style={{
                                                        background: showResult && isCorrect
                                                            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                                            : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)',
                                                        border: showResult && isCorrect
                                                            ? '2px solid #10B981'
                                                            : '1px solid rgba(255,255,255,0.1)',
                                                        cursor: feedback ? 'default' : 'pointer',
                                                        opacity: showResult && !isCorrect ? 0.5 : 1
                                                    }}
                                                >
                                                    <div className="flex items-center justify-center gap-2">
                                                        {showResult && isCorrect && <CheckCircle2 className="w-6 h-6" />}
                                                        {opt}
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* Game Over */}
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
                                    background: 'linear-gradient(135deg, #14B8A6 0%, #EF4444 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Trophy size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-teal-300 mb-2">
                                {level >= 5 ? '🎉 Harika!' : 'Test Tamamlandı!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {level >= 5 ? 'Süper hafıza!' : 'Tekrar deneyelim!'}
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
                                onClick={startApp}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
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

export default MatrixEchoGame;
