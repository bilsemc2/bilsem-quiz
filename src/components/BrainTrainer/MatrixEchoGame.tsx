import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RotateCcw, Trophy, Play, Star, Timer as TimerIcon,
    Zap, Heart, Grid3X3, Eye, Sparkles, Brain
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useSound } from '../../hooks/useSound';

// ─── Platform Standards ─────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

type Phase = 'welcome' | 'memorize' | 'hidden' | 'question' | 'feedback' | 'game_over' | 'victory';
interface CellData { gridIndex: number; value: number; }
interface QuestionData { text: string; answer: number; options: number[]; }

function generateQuestion(cells: CellData[], level: number): QuestionData {
    const posName = (idx: number) => `${idx + 1}. kutu`;
    const questionTypes = [
        () => { const cell = cells[Math.floor(Math.random() * cells.length)]; return { text: `${posName(cell.gridIndex)}'da hangi sayı var?`, answer: cell.value }; },
        () => { const cell = cells[Math.floor(Math.random() * cells.length)]; return { text: `${cell.value} sayısı kaçıncı kutuda?`, answer: cell.gridIndex + 1 }; },
        () => { const maxCell = [...cells].sort((a, b) => b.value - a.value)[0]; return { text: `En büyük sayı kaçıncı kutuda?`, answer: maxCell.gridIndex + 1 }; },
        () => { const minCell = [...cells].sort((a, b) => a.value - b.value)[0]; return { text: `En küçük sayı kaçıncı kutuda?`, answer: minCell.gridIndex + 1 }; },
    ];
    if (level >= 5 && cells.length >= 2) { questionTypes.push(() => { const shuffled = [...cells].sort(() => Math.random() - 0.5); const c1 = shuffled[0], c2 = shuffled[1]; return { text: `${posName(c1.gridIndex)} + ${posName(c2.gridIndex)} toplamı?`, answer: c1.value + c2.value }; }); }
    if (level >= 10 && cells.length >= 2) { questionTypes.push(() => { const shuffled = [...cells].sort(() => Math.random() - 0.5); const c1 = shuffled[0], c2 = shuffled[1]; const bigger = Math.max(c1.value, c2.value), smaller = Math.min(c1.value, c2.value); return { text: `${posName(c1.gridIndex)} ile ${posName(c2.gridIndex)} farkı?`, answer: bigger - smaller }; }); }
    const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    const q = randomType();
    const opts = new Set([q.answer]);
    while (opts.size < 4) { const offset = Math.floor(Math.random() * 8) - 4; const fake = q.answer + (offset === 0 ? 1 : offset); if (fake > 0) opts.add(fake); }
    return { text: q.text, answer: q.answer, options: [...opts].sort(() => Math.random() - 0.5) };
}

function generateCells(level: number): CellData[] {
    const cellCount = Math.min(7, 3 + Math.floor((level - 1) / 3));
    const maxNumber = Math.min(30, 9 + level * 2);
    const shuffledIndices = Array.from({ length: 9 }, (_, i) => i).sort(() => Math.random() - 0.5);
    const selectedIndices = shuffledIndices.slice(0, cellCount);
    const usedValues = new Set<number>();
    return selectedIndices.map(gridIndex => {
        let value; do { value = Math.floor(Math.random() * maxNumber) + 1; } while (usedValues.has(value));
        usedValues.add(value); return { gridIndex, value };
    });
}

function getMemorizeTime(level: number): number { return Math.max(1500, 4000 - (level - 1) * 150); }

const MatrixEchoGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const location = useLocation();
    const navigate = useNavigate();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [cells, setCells] = useState<CellData[]>([]);
    const [question, setQuestion] = useState<QuestionData | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);
    const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const backLink = location.state?.arcadeMode ? '/bilsem-zeka' : '/atolyeler/bireysel-degerlendirme';
    const backLabel = location.state?.arcadeMode ? 'Arcade' : 'Geri';

    useEffect(() => {
        if ((phase === 'memorize' || phase === 'hidden' || phase === 'question') && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return prev - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

    const startRound = useCallback((lvl: number) => {
        const newCells = generateCells(lvl);
        setCells(newCells); setQuestion(null); setSelectedAnswer(null); setPhase('memorize');
        if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = setTimeout(() => {
            setPhase('hidden');
            phaseTimerRef.current = setTimeout(() => {
                setQuestion(generateQuestion(newCells, lvl));
                setPhase('question');
            }, 600);
        }, getMemorizeTime(lvl));
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('memorize'); setScore(0); setLives(INITIAL_LIVES); setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        startRound(1); playSound('slide');
    }, [examMode, examTimeLimit, startRound, playSound]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart(); }, [location.state, examMode, phase, handleStart]);

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(level >= 5 || phase === 'victory', score, MAX_LEVEL * 100, duration);
            navigate('/atolyeler/sinav-simulasyonu/devam'); return;
        }
        await saveGamePlay({ game_id: 'matris-yankisi', score_achieved: score, duration_seconds: duration, metadata: { levels_completed: level, victory: phase === 'victory' } });
    }, [saveGamePlay, score, level, examMode, submitResult, navigate, phase]);

    useEffect(() => { if (phase === 'game_over' || phase === 'victory') handleFinish(); }, [phase, handleFinish]);

    const handleAnswer = (selected: number) => {
        if (phase !== 'question' || feedbackState || !question) return;
        setSelectedAnswer(selected);
        const ok = selected === question.answer;
        showFeedback(ok); playSound(ok ? 'correct' : 'incorrect');
        if (ok) {
            setScore(p => p + 10 * level);
            setTimeout(() => {
                dismissFeedback();
                if (level >= MAX_LEVEL) setPhase('victory');
                else { setLevel(l => l + 1); startRound(level + 1); }
            }, 1500);
        } else {
            setLives(l => {
                const nl = l - 1;
                if (nl <= 0) setTimeout(() => setPhase('game_over'), 1500);
                else setTimeout(() => { dismissFeedback(); startRound(level); }, 1500);
                return nl;
            });
        }
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-teal-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.3)] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3)]" style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Grid3X3 size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Matris Yankısı</h1>
                    <p className="text-slate-400 mb-8 text-lg">3x3 matristeki sayıları ezberle, kutular kapandıktan sonra sorulan soruları doğru cevapla!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-teal-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-cyan-400" /><span>Matristeki <strong>sayıların yerlerini ezberle</strong></span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-cyan-400" /><span>Sayılar gizlendikten sonra gelen <strong>soruyu oku</strong></span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-cyan-400" /><span>Doğru seçeneği işaretleyerek <strong>puanları topla</strong></span></li>
                        </ul>
                    </div>
                    <div className="bg-cyan-500/10 text-cyan-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-cyan-500/30 font-bold uppercase tracking-widest">TUZÖ 5.9.2 Görsel Çalışma Belleği</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-teal-950 text-white relative overflow-hidden">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(13, 148, 136, 0.1) 100%)', border: '1px solid rgba(20, 184, 166, 0.3)' }}><Zap className="text-teal-400" size={18} /><span className="font-bold text-teal-400">Seviye {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-120px)]">
                <AnimatePresence mode="wait">
                    {(phase === 'memorize' || phase === 'hidden' || phase === 'question' || phase === 'feedback') && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-8 w-full max-w-3xl">
                            <div className="bg-white/5 backdrop-blur-3xl rounded-[32px] p-8 border border-white/10 shadow-3xl flex flex-col items-center gap-6">
                                <div className="grid grid-cols-3 gap-4">
                                    {Array.from({ length: 9 }).map((_, idx) => {
                                        const cell = cells.find(c => c.gridIndex === idx);
                                        const showN = phase === 'memorize' || (phase === 'feedback' && feedbackState);
                                        return (
                                            <div key={idx} className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center relative border transition-all duration-300 ${cell ? (showN ? 'bg-teal-500/30 border-teal-400' : 'bg-cyan-500/20 border-cyan-400/30') : 'bg-white/5 border-white/10 opacity-30'}`}>
                                                {cell && <span className={`text-3xl font-black ${showN ? 'text-white' : 'text-transparent'}`}>{showN ? cell.value : ''}</span>}
                                                {!showN && cell && <Brain size={24} className="text-cyan-400/40" />}
                                                <div className="absolute top-1 right-2 text-[10px] font-bold text-white/20">{idx + 1}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="text-center">
                                    <h2 className={`text-lg font-black uppercase tracking-widest ${phase === 'memorize' ? 'text-teal-400' : phase === 'hidden' ? 'text-purple-400' : 'text-cyan-400'}`}>
                                        {phase === 'memorize' ? 'Sayıları Ezberle' : phase === 'hidden' ? 'Hazır Ol...' : 'Cevapla!'}
                                    </h2>
                                </div>
                            </div>
                            {(phase === 'question' || phase === 'feedback') && question && (
                                <div className="w-full flex flex-col gap-4">
                                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/20 shadow-xl"><h3 className="text-xl font-bold">{question.text}</h3></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {question.options.map((opt, i) => {
                                            const showR = feedbackState !== null; const isCor = opt === question.answer; const isSel = selectedAnswer === opt;
                                            return <motion.button key={i} whileHover={!showR ? { scale: 1.02, y: -2 } : {}} whileTap={!showR ? { scale: 0.98 } : {}} onClick={() => handleAnswer(opt)} disabled={showR} className={`py-6 text-2xl font-black rounded-2xl border transition-all duration-300 ${showR ? (isCor ? 'bg-emerald-500 border-white' : isSel ? 'bg-red-500 border-white' : 'opacity-20 bg-slate-800') : 'bg-white/5 border-white/10 hover:border-cyan-400 hover:bg-white/10 shadow-lg'}`}>{opt}</motion.button>
                                        })}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-cyan-500 to-teal-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Matris Dehası!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Hafıza ve odaklanma yeteneğin gerçekten mükemmel!' : 'Daha fazla pratikle görsel belleğini güçlendirebilirsin.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-teal-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default MatrixEchoGame;
