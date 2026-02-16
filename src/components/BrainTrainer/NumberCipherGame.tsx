import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon,
    ChevronLeft, Zap, Heart, Calculator, Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useExam } from '../../contexts/ExamContext';
import { useSound } from '../../hooks/useSound';

// ─── Constants ───────────────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = 'sayisal-sifre';

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

const OPERATORS = ['+', '-', '×'] as const;
type Operator = typeof OPERATORS[number];

const NumberCipherGame: React.FC = () => {
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
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    // ====== QUESTION GENERATORS ======

    const generateHiddenOperator = useCallback((): Question => {
        const ops: { op: Operator; fn: (a: number, b: number) => number }[] = [
            { op: '+', fn: (a, b) => a + b },
            { op: '-', fn: (a, b) => a - b },
            { op: '×', fn: (a, b) => a * b },
        ];
        const selected = ops[Math.floor(Math.random() * ops.length)];
        const a = Math.floor(Math.random() * 9) + 1;
        const b = Math.floor(Math.random() * 9) + 1;
        const res1 = selected.fn(a, b);
        const c = Math.floor(Math.random() * 9) + 1;
        const d = Math.floor(Math.random() * 9) + 1;
        const res2 = selected.fn(c, d);
        const e = Math.floor(Math.random() * 9) + 1;
        const f = Math.floor(Math.random() * 9) + 1;
        const answer = selected.fn(e, f);

        const options = [answer];
        let safety = 0;
        while (options.length < 4 && safety++ < 100) {
            const fake = answer + Math.floor(Math.random() * 11) - 5;
            if (fake !== answer && !options.includes(fake)) options.push(fake);
        }
        while (options.length < 4) options.push(answer + options.length * 2);
        return {
            type: 'hidden_operator',
            display: [`${a} ? ${b} = ${res1}`, `${c} ? ${d} = ${res2}`],
            question: `${e} ? ${f} = ?`,
            answer,
            options: options.sort(() => Math.random() - 0.5),
            explanation: `Kural: ${selected.op}`
        };
    }, []);

    const generatePairRelation = useCallback((): Question => {
        const rules = [
            { name: 'Kural: Toplam', fn: (a: number, b: number) => a + b },
            { name: 'Kural: Fark', fn: (a: number, b: number) => Math.abs(a - b) },
            { name: 'Kural: Çarpım', fn: (a: number, b: number) => a * b },
        ];
        const selected = rules[Math.floor(Math.random() * rules.length)];
        const pairs = Array.from({ length: 2 }, () => {
            const a = Math.floor(Math.random() * 6) + 2;
            const b = Math.floor(Math.random() * 6) + 1;
            return { a, b, res: selected.fn(a, b) };
        });
        const qa = Math.floor(Math.random() * 7) + 2;
        const qb = Math.floor(Math.random() * 7) + 1;
        const answer = selected.fn(qa, qb);
        const options = [answer];
        let safety = 0;
        while (options.length < 4 && safety++ < 100) {
            const fake = answer + Math.floor(Math.random() * 11) - 5;
            if (fake !== answer && !options.includes(fake)) options.push(fake);
        }
        while (options.length < 4) options.push(answer + options.length * 2);
        return {
            type: 'pair_relation',
            display: pairs.map(p => `(${p.a}, ${p.b}) → ${p.res}`),
            question: `(${qa}, ${qb}) → ?`,
            answer,
            options: options.sort(() => Math.random() - 0.5),
            explanation: selected.name
        };
    }, []);

    const generateConditional = useCallback((): Question => {
        const rules = [
            { name: 'Tek→×2, Çift→/2', fn: (n: number) => n % 2 !== 0 ? n * 2 : Math.floor(n / 2) },
            { name: 'Tek→+3, Çift→-2', fn: (n: number) => n % 2 !== 0 ? n + 3 : n - 2 },
            { name: '<5→×3, ≥5→+5', fn: (n: number) => n < 5 ? n * 3 : n + 5 },
        ];
        const selected = rules[Math.floor(Math.random() * rules.length)];
        const examples = [2, 3, 5, 8].sort(() => Math.random() - 0.5).slice(0, 3).map(n => ({ input: n, output: selected.fn(n) }));
        const qNum = [1, 4, 6, 7, 9].sort(() => Math.random() - 0.5)[0];
        const answer = selected.fn(qNum);
        const options = [answer];
        let safety = 0;
        while (options.length < 4 && safety++ < 100) {
            const fake = answer + Math.floor(Math.random() * 7) - 3;
            if (fake !== answer && !options.includes(fake)) options.push(fake);
        }
        while (options.length < 4) options.push(answer + options.length * 2);
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
        ];
        const selected = rules[Math.floor(Math.random() * rules.length)];
        const examples = Array.from({ length: 2 }, () => {
            const a = Math.floor(Math.random() * 4) + 2;
            const b = Math.floor(Math.random() * 4) + 1;
            return { a, b, res: selected.fn(a, b) };
        });
        const qa = Math.floor(Math.random() * 5) + 2;
        const qb = Math.floor(Math.random() * 5) + 1;
        const answer = selected.fn(qa, qb);
        const options = [answer];
        let safety = 0;
        while (options.length < 4 && safety++ < 100) {
            const fake = answer + Math.floor(Math.random() * 11) - 5;
            if (fake !== answer && !options.includes(fake)) options.push(fake);
        }
        while (options.length < 4) options.push(answer + options.length * 2);
        return {
            type: 'multi_rule',
            display: examples.map(e => `A=${e.a}, B=${e.b} → ${e.res}`),
            question: `A=${qa}, B=${qb} → ?`,
            answer,
            options: options.sort(() => Math.random() - 0.5),
            explanation: `Kural: ${selected.name}`
        };
    }, []);

    const setupRound = useCallback(() => {
        let q: Question;
        if (level <= 5) q = generateHiddenOperator();
        else if (level <= 10) q = generatePairRelation();
        else if (level <= 15) q = generateConditional();
        else q = generateMultiRule();
        setCurrentQuestion(q); setSelectedAnswer(null);
    }, [level, generateHiddenOperator, generatePairRelation, generateConditional, generateMultiRule]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing'); setScore(0); setLevel(1); setLives(INITIAL_LIVES);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        setupRound(); playSound('slide');
    }, [setupRound, playSound, examMode, examTimeLimit]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart(); }, [location.state, phase, handleStart, examMode]);

    useEffect(() => {
        if (phase === 'playing') {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase]);

    const handleAnswer = (val: number | string) => {
        if (phase !== 'playing' || selectedAnswer !== null || !currentQuestion) return;
        setSelectedAnswer(val);
        const correct = val === currentQuestion.answer;
        showFeedback(correct); playSound(correct ? 'correct' : 'incorrect');
        setTimeout(() => {
            dismissFeedback();
            if (correct) {
                setScore(p => p + 10 * level);
                if (level >= MAX_LEVEL) setPhase('victory');
                else { setLevel(l => l + 1); setupRound(); }
            } else {
                setLives(l => {
                    const nl = l - 1;
                    if (nl <= 0) setTimeout(() => setPhase('game_over'), 500);
                    else setupRound();
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
            <div className="min-h-screen bg-gradient-to-br from-amber-950 via-orange-950 to-slate-900 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Calculator size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-300 bg-clip-text text-transparent">Sayısal Şifre</h1>
                    <p className="text-slate-300 mb-8 text-lg">Sayıların arasındaki gizli kuralları keşfet ve şifreleri çöz. Matematiksel mantık yeteneğini geliştir!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-amber-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Verilen sayı <strong>örneklerini dikkatle incele</strong></span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-amber-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Sayılar arasındaki <strong>gizli kuralı bul</strong></span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-amber-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Soru işareti yerine gelecek <strong>doğru sayıyı seç</strong></span></li>
                        </ul>
                    </div>
                    <div className="bg-amber-500/10 text-amber-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-amber-500/30 font-bold uppercase tracking-widest">TUZÖ 5.2.3 Soyut Sayısal Mantık</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-950 via-orange-950 to-slate-900 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-950'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30"><Zap className="text-emerald-400" size={18} /><span className="font-bold text-emerald-400">Seviye {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {phase === 'playing' && currentQuestion && (
                        <motion.div key="game" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-2xl bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 md:p-12 border border-white/10 shadow-3xl">
                            <div className="text-center mb-10"><span className="bg-amber-500/10 text-amber-300 px-6 py-2 rounded-full text-sm font-black border border-amber-500/30 uppercase tracking-widest leading-none block w-fit mx-auto">{currentQuestion.type.replace('_', ' ')}</span></div>
                            <div className="space-y-4 mb-10">
                                {currentQuestion.display.map((line, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="bg-white/5 p-5 rounded-2xl text-center font-mono text-2xl border border-white/5 shadow-inner">{line}</motion.div>
                                ))}
                            </div>
                            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-8 rounded-3xl border border-amber-500/30 text-center mb-10 shadow-xl"><p className="text-slate-400 text-sm mb-2 font-bold uppercase tracking-wider">Gizemli Şifre</p><h2 className="text-4xl lg:text-5xl font-black text-white font-mono tracking-tighter">{currentQuestion.question}</h2></div>
                            <div className="grid grid-cols-2 gap-4">
                                {currentQuestion.options.map((opt, i) => (
                                    <motion.button key={i} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => handleAnswer(opt)} className="py-6 rounded-3xl bg-white/5 border border-white/10 text-3xl font-black hover:bg-white/10 transition-colors shadow-lg shadow-black/20 font-mono">{opt}</motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-amber-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Şifre Çözücü!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Sayıların gizli dünyasını keşfetmekte harikasın. Müthiş bir mantık!' : 'Daha fazla pratikle sayısal şifreleri çözme becerini hızlandırabilirsin.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm font-bold">Skor</p><p className="text-3xl font-black text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm font-bold">Seviye</p><p className="text-3xl font-black text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default NumberCipherGame;
