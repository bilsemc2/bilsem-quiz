import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    XCircle, ChevronLeft, Zap, Heart, Calculator
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// Game Constants
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180; // 3 dakika
const MAX_LEVEL = 20;

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

// Operatör sembolleri
const OPERATORS = ['+', '-', '×', '÷'] as const;
type Operator = typeof OPERATORS[number];

const NumberCipherGame: React.FC = () => {
    // Persistence Hook
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);

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

    // Tip 1: Gizli Operatör (Level 1-5)
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

        // İkinci örnek
        const c = Math.floor(Math.random() * 9) + 1;
        const d = Math.floor(Math.random() * 9) + 1;
        const result2 = selected.fn(c, d);

        // Soru
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
        // Fallback
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

    // Tip 2: İkili İlişki (Level 6-10)
    const generatePairRelation = useCallback((): Question => {
        const rules = [
            { name: 'toplam', fn: (a: number, b: number) => a + b },
            { name: 'fark', fn: (a: number, b: number) => Math.abs(a - b) },
            { name: 'çarpım', fn: (a: number, b: number) => a * b },
            { name: 'a²+b', fn: (a: number, b: number) => a * a + b },
        ];

        const selected = rules[Math.floor(Math.random() * rules.length)];

        // Örnekler
        const pairs: { a: number; b: number; result: number }[] = [];
        for (let i = 0; i < 2; i++) {
            const a = Math.floor(Math.random() * 6) + 2;
            const b = Math.floor(Math.random() * 6) + 1;
            pairs.push({ a, b, result: selected.fn(a, b) });
        }

        // Soru
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
        // Fallback
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

    // Tip 3: Koşullu Mantık (Level 11-15)
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

        // Örnekler (1 tek, 1 çift veya 1 küçük, 1 büyük)
        const examples: { input: number; output: number }[] = [];
        const nums = [3, 4, 7, 8, 2, 9];
        const shuffled = nums.sort(() => Math.random() - 0.5);
        for (let i = 0; i < 3; i++) {
            examples.push({ input: shuffled[i], output: selected.fn(shuffled[i]) });
        }

        // Soru
        const qNum = shuffled[3];
        const answer = selected.fn(qNum);

        const options = [answer];
        let attempts = 0;
        while (options.length < 4 && attempts < 30) {
            const fake = answer + Math.floor(Math.random() * 7) - 3;
            if (!options.includes(fake) && fake >= 0) options.push(fake);
            attempts++;
        }
        // Fallback
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

    // Tip 4: Çoklu Kural (Level 16-20)
    const generateMultiRule = useCallback((): Question => {
        const rules = [
            { name: 'A² + B', fn: (a: number, b: number) => a * a + b },
            { name: 'A × B + A', fn: (a: number, b: number) => a * b + a },
            { name: '(A + B) × 2', fn: (a: number, b: number) => (a + b) * 2 },
            { name: 'A² - B', fn: (a: number, b: number) => a * a - b },
        ];

        const selected = rules[Math.floor(Math.random() * rules.length)];

        // Örnekler
        const examples: { a: number; b: number; result: number }[] = [];
        for (let i = 0; i < 2; i++) {
            const a = Math.floor(Math.random() * 5) + 2;
            const b = Math.floor(Math.random() * 5) + 1;
            examples.push({ a, b, result: selected.fn(a, b) });
        }

        // Soru
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
        // Fallback
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

    // Generate Question based on level
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

    // Level Setup
    useEffect(() => {
        if (phase === 'playing' && !currentQuestion) {
            generateQuestion();
        }
    }, [phase, currentQuestion, generateQuestion]);

    // Start Game
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

    // Game Over Handler
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        setPhase('game_over');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        await saveGamePlay({
            game_id: 'sayisal-sifre',
            score_achieved: score,
            duration_seconds: duration,
            metadata: {
                levels_completed: level,
                final_lives: lives,
            }
        });
    }, [saveGamePlay, score, level, lives, hasSavedRef]);

    // Victory Handler
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        setPhase('victory');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        await saveGamePlay({
            game_id: 'sayisal-sifre',
            score_achieved: score + 100, // Bonus
            duration_seconds: duration,
            metadata: {
                levels_completed: MAX_LEVEL,
                victory: true,
            }
        });
    }, [saveGamePlay, score, hasSavedRef]);

    // Answer Handler
    const handleAnswer = useCallback((answer: number | string) => {
        if (!currentQuestion || selectedAnswer !== null) return;

        setSelectedAnswer(answer);
        const correct = answer === currentQuestion.answer;
        setIsCorrect(correct);
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

    // Format Time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Get level type name
    const getLevelTypeName = () => {
        if (level <= 5) return 'Gizli Operatör';
        if (level <= 10) return 'İkili İlişki';
        if (level <= 15) return 'Koşullu Mantık';
        return 'Çoklu Kural';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-900 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
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
                        <div className="flex items-center gap-4 flex-wrap justify-end">
                            {/* Score */}
                            <div className="flex items-center gap-2 bg-amber-500/20 px-3 py-1.5 rounded-xl">
                                <Star className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400">{score}</span>
                            </div>

                            {/* Lives */}
                            <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-xl">
                                <Heart className="text-red-400" size={18} />
                                <span className="font-bold text-red-400">{lives}</span>
                            </div>

                            {/* Timer */}
                            <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1.5 rounded-xl">
                                <Timer className="text-blue-400" size={18} />
                                <span className={`font-bold ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            {/* Level */}
                            <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1.5 rounded-xl">
                                <Zap className="text-emerald-400" size={18} />
                                <span className="font-bold text-emerald-400">Seviye {level}</span>
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
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center">
                                <Calculator size={48} className="text-white" />
                            </div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                                Sayısal Şifre
                            </h1>

                            <p className="text-slate-400 mb-6">
                                Sayılar arasındaki gizli kuralları keşfet! Her seviyede verilen örneklerden
                                matematiksel ilişkiyi çıkararak soruyu çöz.
                            </p>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 mb-6 text-left">
                                <h3 className="font-semibold text-amber-400 mb-2">Seviye Türleri:</h3>
                                <ul className="text-sm text-slate-300 space-y-1">
                                    <li>• <strong>1-5:</strong> Gizli Operatör (+, -, ×)</li>
                                    <li>• <strong>6-10:</strong> İkili İlişki (a,b) → sonuç</li>
                                    <li>• <strong>11-15:</strong> Koşullu Mantık (tek→X, çift→Y)</li>
                                    <li>• <strong>16-20:</strong> Çoklu Kural (A² + B gibi)</li>
                                </ul>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Heart className="text-red-400" size={16} />
                                    <span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Timer className="text-blue-400" size={16} />
                                    <span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Target className="text-emerald-400" size={16} />
                                    <span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl font-bold text-lg shadow-lg shadow-amber-500/25"
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={24} />
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
                            {/* Level Type Badge */}
                            <div className="text-center mb-4">
                                <span className="inline-block bg-amber-500/20 text-amber-400 px-4 py-1.5 rounded-full text-sm font-medium">
                                    {getLevelTypeName()}
                                </span>
                            </div>

                            {/* Question Card */}
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 md:p-8">
                                {/* Examples */}
                                <div className="mb-6">
                                    <p className="text-slate-400 text-sm mb-3">Örnekleri incele:</p>
                                    <div className="flex flex-col gap-2">
                                        {currentQuestion.display.map((line, i) => (
                                            <div
                                                key={i}
                                                className="bg-slate-700/50 rounded-xl px-4 py-3 text-center font-mono text-lg text-white"
                                            >
                                                {line}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Question */}
                                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 mb-6 text-center">
                                    <p className="text-slate-400 text-sm mb-2">Kuralı bul:</p>
                                    <p className="font-mono text-2xl text-amber-400 font-bold">
                                        {currentQuestion.question}
                                    </p>
                                </div>

                                {/* Options */}
                                <div className="grid grid-cols-2 gap-4">
                                    {currentQuestion.options.map((option, i) => {
                                        const isSelected = selectedAnswer === option;
                                        const isAnswer = option === currentQuestion.answer;
                                        const showResult = phase === 'feedback';

                                        let buttonClass = 'bg-slate-700/50 hover:bg-slate-600/50 border-slate-600';
                                        if (showResult) {
                                            if (isAnswer) {
                                                buttonClass = 'bg-emerald-500/30 border-emerald-500';
                                            } else if (isSelected && !isAnswer) {
                                                buttonClass = 'bg-red-500/30 border-red-500';
                                            }
                                        } else if (isSelected) {
                                            buttonClass = 'bg-amber-500/30 border-amber-500';
                                        }

                                        return (
                                            <motion.button
                                                key={i}
                                                whileHover={phase === 'playing' ? { scale: 1.03 } : {}}
                                                whileTap={phase === 'playing' ? { scale: 0.97 } : {}}
                                                onClick={() => phase === 'playing' && handleAnswer(option)}
                                                disabled={phase !== 'playing'}
                                                className={`min-h-[80px] rounded-2xl border-2 font-bold text-xl transition-all ${buttonClass}`}
                                            >
                                                {option}
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Feedback */}
                                {phase === 'feedback' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`mt-6 p-4 rounded-xl text-center ${isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20'
                                            }`}
                                    >
                                        <p className={`font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {isCorrect ? '✓ Doğru!' : 'Bu Sefer Olmadı'}
                                        </p>
                                        <p className="text-slate-300 text-sm mt-1">
                                            {currentQuestion.explanation}
                                        </p>
                                    </motion.div>
                                )}
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
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center">
                                <XCircle size={48} className="text-white" />
                            </div>

                            <h2 className="text-3xl font-bold text-amber-400 mb-4">Tekrar Deneyelim! 💪</h2>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-2xl font-bold text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Seviye</p>
                                        <p className="text-2xl font-bold text-emerald-400">{level}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl font-bold text-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Dene</span>
                                </div>
                            </motion.button>
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
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-400 rounded-3xl flex items-center justify-center animate-bounce">
                                <Trophy size={48} className="text-white" />
                            </div>

                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Tebrikler!</h2>
                            <p className="text-slate-300 mb-6">Tüm seviyeleri tamamladın!</p>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Toplam Skor</p>
                                        <p className="text-2xl font-bold text-amber-400">{score + 100}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Kalan Süre</p>
                                        <p className="text-2xl font-bold text-blue-400">{formatTime(timeLeft)}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl font-bold text-lg"
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
