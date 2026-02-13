import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon,
    ChevronLeft, Zap, Heart, Sparkles, Eye
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useExam } from '../../contexts/ExamContext';

// ============== TYPES ==============
type ColorInfo = {
    name: string;
    hex: string;
};

type GameCardData = {
    id: string;
    number: number;
    color: ColorInfo;
};

enum QuestionType {
    NUMBER = 'NUMBER',
    COLOR = 'COLOR',
    ADDITION = 'ADDITION',
    SUBTRACTION = 'SUBTRACTION'
}

type QuestionData = {
    type: QuestionType;
    text: string;
    answer: string | number;
    targetIndices: number[];
};

// ============== CONSTANTS ==============
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

const COLORS: ColorInfo[] = [
    { name: 'Kırmızı', hex: '#FF5252' },
    { name: 'Mavi', hex: '#4285F4' },
    { name: 'Yeşil', hex: '#0F9D58' },
    { name: 'Sarı', hex: '#FFC107' },
    { name: 'Mor', hex: '#9C27B0' },
    { name: 'Turuncu', hex: '#FF9800' },
    { name: 'Pembe', hex: '#E91E63' },
];

const CARD_DISPLAY_TIME = 2000;
const CARD_SEQUENCE_DELAY = 800;

type Phase = 'welcome' | 'showing' | 'questioning' | 'feedback' | 'game_over' | 'victory';

// ============== GAME CARD COMPONENT ==============
const GameCard: React.FC<{
    card: GameCardData;
    isVisible: boolean;
    isTarget?: boolean;
}> = ({ card, isVisible, isTarget = false }) => {
    return (
        <motion.div
            className={`perspective-1000 w-24 h-32 sm:w-32 sm:h-44 transition-all duration-500 ${isTarget ? 'scale-110 z-10' : ''}`}
            style={{ perspective: '1000px' }}
            animate={isTarget && !isVisible ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
        >
            <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: isVisible ? 0 : 180 }}
                transition={{ duration: 0.6 }}
            >
                {/* Front Face */}
                <div
                    className="absolute w-full h-full rounded-2xl border-4 border-white shadow-xl flex flex-col items-center justify-center transition-colors duration-500"
                    style={{ backfaceVisibility: 'hidden', backgroundColor: card.color.hex }}
                >
                    <span className="text-white text-4xl sm:text-6xl font-black drop-shadow-lg">
                        {card.number}
                    </span>
                    <div className="mt-2 bg-white/20 px-2 py-0.5 rounded-full">
                        <p className="text-white font-bold text-[10px] uppercase">{card.color.name}</p>
                    </div>
                </div>

                {/* Back Face */}
                <div
                    className={`absolute w-full h-full rounded-2xl border-4 shadow-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-800 ${isTarget ? 'border-amber-400' : 'border-white/20'}`}
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                        <Zap size={32} className="text-white/40" />
                    </div>
                    {isTarget && (
                        <motion.div
                            className="absolute -top-2 -right-2 bg-amber-400 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        >
                            <Sparkles size={14} className="text-white" />
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

// ============== MAIN COMPONENT ==============
const MathMagicGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1000 });
    const location = useLocation();
    const navigate = useNavigate();

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [cards, setCards] = useState<GameCardData[]>([]);
    const [visibleIndices, setVisibleIndices] = useState<number[]>([]);
    const [question, setQuestion] = useState<QuestionData | null>(null);
    const [numberInput, setNumberInput] = useState('');

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const cardSequenceRef = useRef<NodeJS.Timeout[]>([]);
    const startTimeRef = useRef<number>(0);
    const hasSavedRef = useRef(false);

    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    useEffect(() => {
        if ((phase === 'showing' || phase === 'questioning') && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0 && (phase === 'showing' || phase === 'questioning')) {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    const generateQuestion = useCallback((currentCards: GameCardData[]) => {
        const types = Object.values(QuestionType);
        const type = types[Math.floor(Math.random() * types.length)];
        const cardIndex = Math.floor(Math.random() * currentCards.length);
        const targetCard = currentCards[cardIndex];

        let q: QuestionData;

        switch (type) {
            case QuestionType.COLOR:
                q = {
                    type,
                    text: `İşaretli kartın rengi neydi?`,
                    answer: targetCard.color.name,
                    targetIndices: [cardIndex]
                };
                break;
            case QuestionType.NUMBER:
                q = {
                    type,
                    text: `İşaretli kartın sayısı kaçtı?`,
                    answer: targetCard.number,
                    targetIndices: [cardIndex]
                };
                break;
            case QuestionType.ADDITION: {
                const idx2 = (cardIndex + 1) % currentCards.length;
                const card2 = currentCards[idx2];
                q = {
                    type,
                    text: `İşaretli kartların toplamı nedir?`,
                    answer: targetCard.number + card2.number,
                    targetIndices: [cardIndex, idx2]
                };
                break;
            }
            case QuestionType.SUBTRACTION: {
                const idx2 = (cardIndex + 1) % currentCards.length;
                const card2 = currentCards[idx2];
                q = {
                    type,
                    text: `İşaretli kartların farkı nedir?`,
                    answer: Math.abs(targetCard.number - card2.number),
                    targetIndices: [cardIndex, idx2]
                };
                break;
            }
            default:
                q = { type: QuestionType.NUMBER, text: 'Hata', answer: 0, targetIndices: [] };
        }

        setQuestion(q);
        setPhase('questioning');
    }, []);

    const startNewRound = useCallback(() => {
        cardSequenceRef.current.forEach(t => clearTimeout(t));
        cardSequenceRef.current = [];

        const numCards = Math.min(2 + Math.floor(level / 4), 6);
        const newCards: GameCardData[] = Array.from({ length: numCards }).map(() => ({
            id: Math.random().toString(36).substr(2, 9),
            number: Math.floor(Math.random() * (level + 5)),
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
        }));

        setCards(newCards);
        setVisibleIndices([]);
        setPhase('showing');
        setQuestion(null);
        setNumberInput('');

        let cumulativeDelay = 400;
        newCards.forEach((_, index) => {
            const openTimeout = setTimeout(() => {
                setVisibleIndices(prev => [...prev, index]);
                playSound('pop');
            }, cumulativeDelay);
            cardSequenceRef.current.push(openTimeout);

            const displayTime = Math.max(600, CARD_DISPLAY_TIME - (level * 50));
            const closeTimeout = setTimeout(() => {
                setVisibleIndices(prev => prev.filter(i => i !== index));
            }, cumulativeDelay + displayTime);
            cardSequenceRef.current.push(closeTimeout);

            cumulativeDelay += Math.max(400, CARD_SEQUENCE_DELAY - (level * 20));
        });

        const totalSequenceTime = cumulativeDelay + 800;
        const questionTimeout = setTimeout(() => {
            generateQuestion(newCards);
        }, totalSequenceTime);
        cardSequenceRef.current.push(questionTimeout);

    }, [level, generateQuestion, playSound]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        startNewRound();
    }, [examMode, examTimeLimit, startNewRound]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, examMode, phase, handleStart]);

    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(level >= 5, score, MAX_LEVEL * 100, duration);
            navigate('/atolyeler/sinav-simulasyonu/devam');
            return;
        }
        await saveGamePlay({
            game_id: 'sayi-sihirbazi',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives, game_name: 'Sayı Sihirbazı' },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(true, score, MAX_LEVEL * 100, duration);
            navigate('/atolyeler/sinav-simulasyonu/devam');
            return;
        }
        await saveGamePlay({
            game_id: 'sayi-sihirbazi',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true, game_name: 'Sayı Sihirbazı' },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    const handleAnswer = useCallback((userAnswer: string | number) => {
        if (phase !== 'questioning' || !question) return;

        const correct = String(userAnswer).toLowerCase() === String(question.answer).toLowerCase();
        showFeedback(correct);
        setPhase('feedback');
        playSound(correct ? 'correct' : 'incorrect');

        setTimeout(() => {
            dismissFeedback();
            if (correct) {
                setScore(s => s + 10 * level);
                if (level >= MAX_LEVEL) {
                    handleVictory();
                } else {
                    setLevel(l => l + 1);
                    startNewRound();
                }
            } else {
                const newLives = lives - 1;
                setLives(newLives);
                if (newLives <= 0) {
                    handleGameOver();
                } else {
                    startNewRound();
                }
            }
        }, 1200);
    }, [question, level, lives, playSound, handleVictory, handleGameOver, startNewRound, dismissFeedback, phase, showFeedback]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase === 'showing' || phase === 'questioning' || phase === 'feedback') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)' }}><Zap className="text-violet-400" size={18} /><span className="font-bold text-violet-400">{level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {phase === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}><Zap size={52} className="text-white drop-shadow-lg" /></motion.div>
                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Sayı Sihirbazı</h1>
                            <p className="text-slate-400 mb-8">Kartları dikkatle izle, renkleri ve sayıları aklında tut! Sihirli soruları cevaplayarak hafızanı kanıtla.</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-orange-400" /><span>Ekranda sıra ile açılan kartları ezberle</span></li>
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-orange-400" /><span>Kartların rengini, sayısını ve sırasını unutma</span></li>
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-orange-400" /><span>İşaretlenen kart hakkındaki soruları cevapla!</span></li>
                                </ul>
                            </div>
                            <div className="bg-orange-500/10 text-orange-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-orange-500/30 font-bold uppercase tracking-widest">TUZÖ 5.9.1 Çalışma Belleği</div>
                            <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 rounded-2xl font-bold text-xl" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)' }}><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                        </motion.div>
                    )}
                    {(phase === 'showing' || phase === 'questioning' || phase === 'feedback') && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl">
                            <div className="flex flex-wrap justify-center mb-12 gap-6 min-h-[200px]">
                                {cards.map((card, idx) => (<GameCard key={card.id} card={card} isVisible={visibleIndices.includes(idx) || phase === 'feedback'} isTarget={question?.targetIndices.includes(idx)} />))}
                            </div>
                            {phase === 'questioning' && question && (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 rounded-[40px] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl max-w-xl mx-auto">
                                    <div className="text-center mb-8">
                                        <div className="inline-block p-4 rounded-3xl bg-amber-400/20 border border-amber-400/30 mb-4"><Zap size={32} className="text-amber-400" /></div>
                                        <h3 className="text-2xl font-black text-white">{question.text}</h3>
                                    </div>
                                    {question.type === QuestionType.COLOR ? (
                                        <div className="flex flex-wrap justify-center gap-4">
                                            {COLORS.map((color, i) => (<motion.button key={i} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleAnswer(color.name)} className="w-16 h-16 rounded-full border-4 border-white shadow-xl" style={{ backgroundColor: color.hex }} title={color.name} />))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-full p-6 rounded-3xl bg-black/30 border-2 border-white/10 text-center mb-8"><span className="text-5xl font-black text-white">{numberInput || '?'}</span></div>
                                            <div className="grid grid-cols-5 gap-3 mb-6">
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (<motion.button key={n} whileTap={{ scale: 0.9 }} onClick={() => numberInput.length < 3 && setNumberInput(p => p + n)} className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl text-2xl font-black hover:bg-white/10 shadow-lg">{n}</motion.button>))}
                                            </div>
                                            <div className="flex gap-4 w-full">
                                                <button onClick={() => setNumberInput('')} className="flex-1 py-4 rounded-2xl bg-white/5 text-slate-400 font-black border border-white/10 hover:bg-white/10 uppercase tracking-widest text-xs">Temizle</button>
                                                <button onClick={() => numberInput && handleAnswer(Number(numberInput))} disabled={!numberInput} className={`flex-[2] py-4 rounded-2xl font-black shadow-xl transition-all ${numberInput ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'}`}>KONTROL ET</button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' ? '🎖️ Sayı Sihirbazı!' : 'Harika Deneme!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' ? 'Tüm sihirli soruları kusursuz cevapladın!' : 'Daha fazla odaklanarak rekorunu tazeleyebilirsin!'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl font-bold text-xl mb-4" style={{ boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)' }}><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default MathMagicGame;
