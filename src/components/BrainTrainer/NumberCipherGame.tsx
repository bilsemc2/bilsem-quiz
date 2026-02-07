import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    XCircle, ChevronLeft, Zap, Heart, Calculator,
    CheckCircle2, Home, Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

// Game Constants
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

// Child-friendly feedback messages
const CORRECT_MESSAGES = [
    "Matematik dahisi! 🧮",
    "Süpersin! ⭐",
    "Harika mantık! 🧠",
    "Mükemmel! 🌟",
    "Tam isabet! 🎯",
];

const WRONG_MESSAGES = [
    "Desenin sırrına yaklaş! 🔍",
    "Tekrar dene! 💪",
    "Düşün ve bul! 🧐",
];

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';
type QuestionType = 'hidden_operator' | 'pair_relation' | 'conditional' | 'multi_rule';

interface Question {
    type: QuestionType;
    display: string[];
    question: string;
    answer: number | string;
    options: (number | string)[];
    explanation: string;
}

const OPERATORS = ['+', '-', '×', '÷'] as const;
type Operator = typeof OPERATORS[number];

const NumberCipherGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const hasSavedRef = useRef(false);

    // Exam Mode Props
    const examMode = location.state?.examMode || false;

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Game-Specific State
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [feedbackMessage, setFeedbackMessage] = useState('');

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Timer Effect
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [phase, timeLeft]);

    // ====== SORU ÜRETİCİLER ======

    const generateHiddenOperator = useCallback((): Question => {
        const ops: { op: Operator; fn: (a: number, b: number) => number }[] = [
            { op: '+', fn: (a, b) => a + b },
            { op: '-', fn: (a, b) => a - b },
            { op: '×', fn: (a, b) => a * b },
        ];

        const selected = ops[Math.floor(Math.random() * ops.length)];
        const a = Math.floor(Math.random() * 9) + 1;
        const b = Math.floor(Math.random() * 9) + 1;
        const result = selected.fn(a, b);

        const c = Math.floor(Math.random() * 9) + 1;
        const d = Math.floor(Math.random() * 9) + 1;
        const result2 = selected.fn(c, d);

        const e = Math.floor(Math.random() * 9) + 1;
        const f = Math.floor(Math.random() * 9) + 1;
        const answer = selected.fn(e, f);

        const options = [answer];
        let attempts = 0;
        while (options.length < 4 && attempts < 30) {
            const fake = answer + Math.floor(Math.random() * 11) - 5;
            if (!options.includes(fake) && fake >= 0) options.push(fake);
            attempts++;
        }
        for (let i = 0; options.length < 4 && i < 20; i++) {
            if (!options.includes(i)) options.push(i);
        }

        return {
            type: 'hidden_operator',
            display: [`${a} ? ${b} = ${result}`, `${c} ? ${d} = ${result2}`],
            question: `${e} ? ${f} = ?`,
            answer,
            options: options.sort(() => Math.random() - 0.5),
            explanation: `Kural: ${selected.op} (${selected.op === '+' ? 'toplama' : selected.op === '-' ? 'çıkarma' : 'çarpma'})`
        };
    }, []);

    const generatePairRelation = useCallback((): Question => {
        const rules = [
            { name: 'toplam', fn: (a: number, b: number) => a + b },
            { name: 'fark', fn: (a: number, b: number) => Math.abs(a - b) },
            { name: 'çarpım', fn: (a: number, b: number) => a * b },
            { name: 'a²+b', fn: (a: number, b: number) => a * a + b },
        ];

        const selected = rules[Math.floor(Math.random() * rules.length)];

        const pairs: { a: number; b: number; result: number }[] = [];
        for (let i = 0; i < 2; i++) {
            const a = Math.floor(Math.random() * 6) + 2;
            const b = Math.floor(Math.random() * 6) + 1;
            pairs.push({ a, b, result: selected.fn(a, b) });
        }

        const qa = Math.floor(Math.random() * 6) + 2;
        const qb = Math.floor(Math.random() * 6) + 1;
        const answer = selected.fn(qa, qb);

        const options = [answer];
        let attempts = 0;
        while (options.length < 4 && attempts < 30) {
            const fake = answer + Math.floor(Math.random() * 11) - 5;
            if (!options.includes(fake) && fake >= 0) options.push(fake);
            attempts++;
        }
        for (let i = 0; options.length < 4 && i < 50; i++) {
            if (!options.includes(i)) options.push(i);
        }

        return {
            type: 'pair_relation',
            display: pairs.map(p => `(${p.a}, ${p.b}) → ${p.result}`),
            question: `(${qa}, ${qb}) → ?`,
            answer,
            options: options.sort(() => Math.random() - 0.5),
            explanation: `Kural: ${selected.name}`
        };
    }, []);

    const generateConditional = useCallback((): Question => {
        const rules = [
            {
                name: 'Tek→2×, Çift→÷2',
                fn: (n: number) => n % 2 === 1 ? n * 2 : Math.floor(n / 2)
            },
            {
                name: 'Tek→+3, Çift→-2',
                fn: (n: number) => n % 2 === 1 ? n + 3 : n - 2
            },
            {
                name: '<5→×3, ≥5→+5',
                fn: (n: number) => n < 5 ? n * 3 : n + 5
            },
        ];

        const selected = rules[Math.floor(Math.random() * rules.length)];

        const examples: { input: number; output: number }[] = [];
        // Hem tek hem çift sayı içeren örnekler üret (kuralı anlayabilmek için)
        const oddNums = [3, 5, 7, 9];
        const evenNums = [2, 4, 6, 8];
        const selectedOdd = oddNums[Math.floor(Math.random() * oddNums.length)];
        const selectedEven = evenNums[Math.floor(Math.random() * evenNums.length)];
        examples.push({ input: selectedOdd, output: selected.fn(selectedOdd) });
        examples.push({ input: selectedEven, output: selected.fn(selectedEven) });
        // Üçüncü örnek rastgele
        const thirdNum = Math.random() > 0.5
            ? oddNums.filter(n => n !== selectedOdd)[Math.floor(Math.random() * 3)]
            : evenNums.filter(n => n !== selectedEven)[Math.floor(Math.random() * 3)];
        examples.push({ input: thirdNum, output: selected.fn(thirdNum) });

        // Soru için örneklerde olmayan bir sayı seç
        const allNums = [...oddNums, ...evenNums];
        const usedNums = examples.map(e => e.input);
        const availableNums = allNums.filter(n => !usedNums.includes(n));
        const qNum = availableNums[Math.floor(Math.random() * availableNums.length)];
        const answer = selected.fn(qNum);

        const options = [answer];
        let attempts = 0;
        while (options.length < 4 && attempts < 30) {
            const fake = answer + Math.floor(Math.random() * 7) - 3;
            if (!options.includes(fake) && fake >= 0) options.push(fake);
            attempts++;
        }
        for (let i = 0; options.length < 4 && i < 30; i++) {
            if (!options.includes(i)) options.push(i);
        }

        return {
            type: 'conditional',
            display: examples.map(e => `${e.input} → ${e.output}`),
            question: `${qNum} → ?`,
            answer,
            options: options.sort(() => Math.random() - 0.5),
            explanation: `Kural: ${selected.name}`
        };
    }, []);

    const generateMultiRule = useCallback((): Question => {
        const rules = [
            { name: 'A² + B', fn: (a: number, b: number) => a * a + b },
            { name: 'A × B + A', fn: (a: number, b: number) => a * b + a },
            { name: '(A + B) × 2', fn: (a: number, b: number) => (a + b) * 2 },
            { name: 'A² - B', fn: (a: number, b: number) => a * a - b },
        ];

        const selected = rules[Math.floor(Math.random() * rules.length)];

        const examples: { a: number; b: number; result: number }[] = [];
        for (let i = 0; i < 2; i++) {
            const a = Math.floor(Math.random() * 5) + 2;
            const b = Math.floor(Math.random() * 5) + 1;
            examples.push({ a, b, result: selected.fn(a, b) });
        }

        const qa = Math.floor(Math.random() * 5) + 2;
        const qb = Math.floor(Math.random() * 5) + 1;
        const answer = selected.fn(qa, qb);

        const options = [answer];
        let attempts = 0;
        while (options.length < 4 && attempts < 30) {
            const fake = answer + Math.floor(Math.random() * 11) - 5;
            if (!options.includes(fake) && fake >= 0) options.push(fake);
            attempts++;
        }
        for (let i = 0; options.length < 4 && i < 50; i++) {
            if (!options.includes(i)) options.push(i);
        }

        return {
            type: 'multi_rule',
            display: examples.map(e => `A=${e.a}, B=${e.b} → ${e.result}`),
            question: `A=${qa}, B=${qb} → ?`,
            answer,
            options: options.sort(() => Math.random() - 0.5),
            explanation: `Kural: ${selected.name}`
        };
    }, []);

    const generateQuestion = useCallback(() => {
        let question: Question;

        if (level <= 5) {
            question = generateHiddenOperator();
        } else if (level <= 10) {
            question = generatePairRelation();
        } else if (level <= 15) {
            question = generateConditional();
        } else {
            question = generateMultiRule();
        }

        setCurrentQuestion(question);
        setSelectedAnswer(null);
        setIsCorrect(null);
    }, [level, generateHiddenOperator, generatePairRelation, generateConditional, generateMultiRule]);

    useEffect(() => {
        if (phase === 'playing' && !currentQuestion) {
            generateQuestion();
        }
    }, [phase, currentQuestion, generateQuestion]);

    const handleStart = useCallback(() => {
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(TIME_LIMIT);
        setCurrentQuestion(null);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, [hasSavedRef]);

    // Handle Auto Start from HUB or Exam Mode
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, phase, examMode, handleStart]);

    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        setPhase('game_over');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        // Exam mode: submit result and navigate
        if (examMode) {
            const passed = level >= 5;
            submitResult(passed, score, 1000, duration).then(() => {
                navigate('/atolyeler/sinav-simulasyonu/devam');
            });
            return;
        }

        await saveGamePlay({
            game_id: 'sayisal-sifre',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives }
        });
    }, [saveGamePlay, score, level, lives, hasSavedRef, examMode, submitResult, navigate]);

    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        setPhase('victory');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        // Exam mode: submit result and navigate
        if (examMode) {
            submitResult(true, score + 100, 1000, duration).then(() => {
                navigate('/atolyeler/sinav-simulasyonu/devam');
            });
            return;
        }

        await saveGamePlay({
            game_id: 'sayisal-sifre',
            score_achieved: score + 100,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true }
        });
    }, [saveGamePlay, score, hasSavedRef, examMode, submitResult, navigate]);

    const handleAnswer = useCallback((answer: number | string) => {
        if (!currentQuestion || selectedAnswer !== null) return;

        setSelectedAnswer(answer);
        const correct = answer === currentQuestion.answer;
        setIsCorrect(correct);
        setFeedbackMessage(
            correct
                ? CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]
                : WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)]
        );
        setPhase('feedback');

        setTimeout(() => {
            if (correct) {
                const newScore = score + 10 * level;
                setScore(newScore);

                if (level >= MAX_LEVEL) {
                    handleVictory();
                } else {
                    setLevel(prev => prev + 1);
                    setPhase('playing');
                    setCurrentQuestion(null);
                }
            } else {
                const newLives = lives - 1;
                setLives(newLives);

                if (newLives <= 0) {
                    handleGameOver();
                } else {
                    setPhase('playing');
                    setCurrentQuestion(null);
                }
            }
        }, 1500);
    }, [currentQuestion, selectedAnswer, score, level, lives, handleVictory, handleGameOver]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getLevelTypeName = () => {
        if (level <= 5) return 'Gizli Operatör';
        if (level <= 10) return 'İkili İlişki';
        if (level <= 15) return 'Koşullu Mantık';
        return 'Çoklu Kural';
    };

    // 3D Gummy button style
    const getButtonStyle = (isSelected: boolean, isAnswer: boolean, showResult: boolean) => {
        if (showResult && isAnswer) {
            return {
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3), 0 0 24px rgba(16, 185, 129, 0.5)',
                border: 'none',
            };
        }
        if (showResult && isSelected && !isAnswer) {
            return {
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 0 20px rgba(249, 115, 22, 0.4)',
                border: 'none',
                opacity: 0.8,
            };
        }
        if (isSelected) {
            return {
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3)',
                border: 'none',
            };
        }
        return {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.1)',
        };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-950 via-orange-950 to-slate-900 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl" />
                <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>Geri</span>
                    </Link>

                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-3 flex-wrap justify-end">
                            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400">{score}</span>
                            </div>

                            <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-500/30">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart
                                        key={i}
                                        size={14}
                                        className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-500/30">
                                <Timer className="text-blue-400" size={18} />
                                <span className={`font-bold ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={18} />
                                <span className="font-bold text-emerald-400">Lv.{level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {/* Welcome Screen */}
                    {phase === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Calculator size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-300 bg-clip-text text-transparent">
                                Sayısal Şifre
                            </h1>

                            <p className="text-slate-300 mb-6 text-lg">
                                Sayıların gizli kurallarını keşfet! 🧮
                            </p>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="font-bold text-amber-300 mb-3 flex items-center gap-2">
                                    <Sparkles size={18} />
                                    Seviye Türleri
                                </h3>
                                <ul className="text-sm text-slate-200 space-y-2">
                                    <li className="flex items-center gap-2">
                                        <span className="w-6 h-6 bg-amber-500/30 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                        <strong className="text-amber-300">1-5:</strong> Gizli Operatör (+, -, ×)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-6 h-6 bg-orange-500/30 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                        <strong className="text-orange-300">6-10:</strong> İkili İlişki
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-6 h-6 bg-yellow-500/30 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                        <strong className="text-yellow-300">11-15:</strong> Koşullu Mantık
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-6 h-6 bg-red-500/30 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                                        <strong className="text-red-300">16-20:</strong> Çoklu Kural
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
                                    <span className="text-sm text-slate-200">{TIME_LIMIT / 60} Dakika</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                                    <Target className="text-emerald-400" size={16} />
                                    <span className="text-sm text-slate-200">{MAX_LEVEL} Seviye</span>
                                </div>
                            </div>

                            {/* TUZÖ Badge */}
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full">
                                <span className="text-[9px] font-black text-amber-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-amber-400">5.2.3 Soyut Sayısal Mantık</span>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Game Board */}
                    {(phase === 'playing' || phase === 'feedback') && currentQuestion && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-2xl"
                        >
                            {/* Feedback Overlay */}
                            <AnimatePresence>
                                {phase === 'feedback' && (
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
                                                ${isCorrect
                                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                                    : 'bg-gradient-to-br from-orange-500 to-amber-600'
                                                }
                                            `}
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
                                            <p className="text-white/80 text-sm mt-2">{currentQuestion.explanation}</p>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Level Type Badge */}
                            <div className="text-center mb-4">
                                <span
                                    className="inline-block bg-amber-500/20 text-amber-300 px-4 py-1.5 rounded-full text-sm font-bold border border-amber-500/30"
                                    style={{ boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)' }}
                                >
                                    {getLevelTypeName()}
                                </span>
                            </div>

                            {/* Question Card - 3D Glass Style */}
                            <div
                                className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20"
                                style={{ boxShadow: 'inset 0 2px 12px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.3)' }}
                            >
                                {/* Examples */}
                                <div className="mb-6">
                                    <p className="text-slate-300 text-sm mb-3">Örnekleri incele:</p>
                                    <div className="flex flex-col gap-2">
                                        {currentQuestion.display.map((line, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center font-mono text-lg text-white border border-white/10"
                                                style={{ boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)' }}
                                            >
                                                {line}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Question */}
                                <div
                                    className="bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-xl p-4 mb-6 text-center border border-amber-500/30"
                                    style={{ boxShadow: 'inset 0 2px 8px rgba(245, 158, 11, 0.2)' }}
                                >
                                    <p className="text-slate-300 text-sm mb-2">Kuralı bul:</p>
                                    <p className="font-mono text-2xl text-amber-300 font-black">
                                        {currentQuestion.question}
                                    </p>
                                </div>

                                {/* Options - 3D Gummy Buttons */}
                                <div className="grid grid-cols-2 gap-4">
                                    {currentQuestion.options.map((option, i) => {
                                        const isSelected = selectedAnswer === option;
                                        const isAnswer = option === currentQuestion.answer;
                                        const showResult = phase === 'feedback';

                                        return (
                                            <motion.button
                                                key={i}
                                                whileHover={phase === 'playing' ? { scale: 1.05, y: -2 } : {}}
                                                whileTap={phase === 'playing' ? { scale: 0.95 } : {}}
                                                onClick={() => phase === 'playing' && handleAnswer(option)}
                                                disabled={phase !== 'playing'}
                                                className="min-h-[80px] rounded-2xl font-black text-2xl transition-all"
                                                style={getButtonStyle(isSelected, isAnswer, showResult)}
                                            >
                                                {option}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Game Over Screen */}
                    {phase === 'game_over' && (
                        <motion.div
                            key="game_over"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                            >
                                <XCircle size={48} className="text-white" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-orange-300 mb-2">Tekrar Deneyelim!</h2>
                            <p className="text-slate-400 mb-6">Harika bir deneydi! 💪</p>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/20">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-3xl font-black text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Seviye</p>
                                        <p className="text-3xl font-black text-emerald-400">{level}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-center">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleStart}
                                    className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl font-bold text-lg"
                                    style={{ boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <RotateCcw size={24} />
                                        <span>Tekrar Dene</span>
                                    </div>
                                </motion.button>
                                <Link
                                    to="/atolyeler/bireysel-degerlendirme"
                                    className="px-6 py-4 bg-white/10 backdrop-blur-sm rounded-2xl font-bold flex items-center gap-2 border border-white/20"
                                >
                                    <Home size={20} />
                                    <span>Çıkış</span>
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {/* Victory Screen */}
                    {phase === 'victory' && (
                        <motion.div
                            key="victory"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.4), 0 8px 32px rgba(251, 191, 36, 0.5)' }}
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Trophy size={56} className="text-white" />
                            </motion.div>

                            <h2 className="text-4xl font-black text-amber-300 mb-2">🎉 Matematik Dehası!</h2>
                            <p className="text-slate-300 mb-6">Tüm seviyeleri tamamladın!</p>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-amber-500/30">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Toplam Skor</p>
                                        <p className="text-4xl font-black text-amber-400">{score + 100}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Kalan Süre</p>
                                        <p className="text-4xl font-black text-blue-400">{formatTime(timeLeft)}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl font-bold text-lg text-slate-900"
                                style={{ boxShadow: '0 8px 32px rgba(251, 191, 36, 0.5)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Oyna</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NumberCipherGame;
