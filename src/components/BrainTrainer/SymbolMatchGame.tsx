import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Target, CheckCircle2, XCircle, ChevronLeft, Zap, Eye, Shapes } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';

interface SymbolColor {
    symbol: string;
    color: string;
    colorName: string;
}

type QuestionType = 'color' | 'symbol';

interface Question {
    type: QuestionType;
    query: string; // "Mavi şekil hangisiydi?" veya "Yıldız hangi renkteydi?"
    correctAnswer: string;
    options: string[];
}

const SYMBOLS = ['⭐', '▲', '●', '◆', '⬟', '⬢'];

const COLORS = [
    { hex: '#ef4444', name: 'Kırmızı' },
    { hex: '#3b82f6', name: 'Mavi' },
    { hex: '#22c55e', name: 'Yeşil' },
    { hex: '#f59e0b', name: 'Sarı' },
    { hex: '#a855f7', name: 'Mor' },
    { hex: '#ec4899', name: 'Pembe' },
];

const SymbolMatchGame = () => {
    const { saveGamePlay } = useGamePersistence();
    const [gameState, setGameState] = useState<'idle' | 'memorize' | 'question' | 'finished'>('idle');
    const [symbolColors, setSymbolColors] = useState<SymbolColor[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [roundNumber, setRoundNumber] = useState(0);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [level, setLevel] = useState(1);
    const [memorizeTime, setMemorizeTime] = useState(5);
    const [countdown, setCountdown] = useState(5);
    const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    const totalRounds = 15;
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Zorluk seviyesine göre şekil sayısı
    const getSymbolCount = () => {
        if (level <= 3) return 4;
        if (level <= 6) return 5;
        return 6;
    };

    // Zorluk seviyesine göre ezberleme süresi
    const getMemorizeTime = () => {
        if (level <= 2) return 5;
        if (level <= 4) return 4;
        if (level <= 6) return 3;
        return 2;
    };

    // Şekil-renk eşleşmelerini oluştur
    const generateSymbolColors = useCallback(() => {
        const count = getSymbolCount();
        const shuffledSymbols = [...SYMBOLS].sort(() => Math.random() - 0.5).slice(0, count);
        const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5).slice(0, count);

        return shuffledSymbols.map((symbol, i) => ({
            symbol,
            color: shuffledColors[i].hex,
            colorName: shuffledColors[i].name,
        }));
    }, [level]);

    // Soru oluştur
    const generateQuestion = useCallback((pairs: SymbolColor[]): Question => {
        const type: QuestionType = Math.random() > 0.5 ? 'color' : 'symbol';
        const targetPair = pairs[Math.floor(Math.random() * pairs.length)];
        const otherPairs = pairs.filter(p => p !== targetPair);

        if (type === 'color') {
            // "X renkteki şekil hangisiydi?"
            const correctAnswer = targetPair.symbol;
            const wrongOptions = otherPairs.map(p => p.symbol).slice(0, 3);
            const allOptions = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);

            return {
                type: 'color',
                query: `${targetPair.colorName} renkteki şekil hangisiydi?`,
                correctAnswer,
                options: allOptions,
            };
        } else {
            // "X şekli hangi renkteydi?"
            const correctAnswer = targetPair.colorName;
            const wrongOptions = otherPairs.map(p => p.colorName).slice(0, 3);
            const allOptions = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);

            return {
                type: 'symbol',
                query: `${targetPair.symbol} şekli hangi renkteydi?`,
                correctAnswer,
                options: allOptions,
            };
        }
    }, []);

    // Yeni tur başlat
    const startRound = useCallback(() => {
        const pairs = generateSymbolColors();
        setSymbolColors(pairs);
        const time = getMemorizeTime();
        setMemorizeTime(time);
        setCountdown(time);
        setGameState('memorize');
        setSelectedAnswer(null);
        setShowFeedback(null);
    }, [generateSymbolColors, level]);

    // Oyunu başlat
    const startGame = useCallback(() => {
        setScore(0);
        setCorrectCount(0);
        setWrongCount(0);
        setRoundNumber(1);
        setLevel(1);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
        startRound();
    }, [startRound]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (gameState === 'finished' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'sekil-hafizasi',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    level_reached: level,
                    correct_count: correctCount,
                    wrong_count: wrongCount,
                    total_rounds: totalRounds,
                    accuracy: Math.round((correctCount / (correctCount + wrongCount)) * 100),
                    game_name: 'Şekil Hafızası',
                }
            });
        }
    }, [gameState]);

    // Ezberleme geri sayımı
    useEffect(() => {
        if (gameState === 'memorize' && countdown > 0) {
            timerRef.current = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (gameState === 'memorize' && countdown === 0) {
            // Ezberleme bitti, soru sorma aşamasına geç
            const question = generateQuestion(symbolColors);
            setCurrentQuestion(question);
            setGameState('question');
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [gameState, countdown, symbolColors, generateQuestion]);

    // Cevap kontrolü
    const handleAnswer = (answer: string) => {
        if (showFeedback || !currentQuestion) return;

        setSelectedAnswer(answer);
        const isCorrect = answer === currentQuestion.correctAnswer;

        if (isCorrect) {
            setShowFeedback('correct');
            setCorrectCount(prev => prev + 1);
            const levelBonus = level * 10;
            setScore(prev => prev + 100 + levelBonus);
        } else {
            setShowFeedback('wrong');
            setWrongCount(prev => prev + 1);
        }

        // Sonraki tura geç veya oyunu bitir
        setTimeout(() => {
            if (roundNumber >= totalRounds) {
                setGameState('finished');
            } else {
                // Her 3 turda zorluk artır
                if ((roundNumber + 1) % 3 === 0 && level < 7) {
                    setLevel(prev => prev + 1);
                }
                setRoundNumber(prev => prev + 1);
                startRound();
            }
        }, 1500);
    };

    const accuracy = correctCount + wrongCount > 0
        ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="inline-flex items-center gap-2 text-violet-400 font-bold hover:text-violet-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Bireysel Değerlendirme
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-2">
                        🎨 <span className="text-violet-400">Şekil</span> Hafızası
                    </h1>
                    <p className="text-slate-400">Şekilleri ve renklerini ezberle!</p>
                </motion.div>

                {/* Stats */}
                <div className="flex justify-center gap-4 mb-8 flex-wrap">
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400" />
                        <span className="text-white font-bold">{score}</span>
                    </div>
                    {gameState !== 'idle' && gameState !== 'finished' && (
                        <>
                            <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                                <Target className="w-5 h-5 text-violet-400" />
                                <span className="text-white font-bold">{roundNumber}/{totalRounds}</span>
                            </div>
                            <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-emerald-400" />
                                <span className="text-white font-bold">Lv.{level}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Game Area */}
                <div className="flex flex-col items-center">
                    {/* Idle State */}
                    {gameState === 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-8 max-w-md">
                                <div className="text-6xl mb-4">🎨</div>
                                <h2 className="text-2xl font-bold text-white mb-4">Şekil Hafızası</h2>

                                <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
                                    <p className="text-slate-300 text-sm mb-3">Nasıl Oynanır:</p>
                                    <div className="flex justify-center gap-4 mb-3">
                                        <span style={{ color: '#ef4444' }} className="text-3xl">⭐</span>
                                        <span style={{ color: '#3b82f6' }} className="text-3xl">▲</span>
                                        <span style={{ color: '#22c55e' }} className="text-3xl">●</span>
                                        <span style={{ color: '#f59e0b' }} className="text-3xl">◆</span>
                                    </div>
                                    <p className="text-slate-400 text-sm">Şekillerin renklerini ezberle!</p>
                                </div>

                                <ul className="text-slate-400 text-sm space-y-2 text-left mb-6">
                                    <li className="flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-violet-400" />
                                        Renkli şekilleri <strong className="text-white">ezberle</strong>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Shapes className="w-4 h-4 text-pink-400" />
                                        "X renk hangi şekil?" veya "X şekil hangi renk?"
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-emerald-400" />
                                        Her 3 turda zorluk artar!
                                    </li>
                                </ul>

                                <button
                                    onClick={startGame}
                                    className="px-8 py-4 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold rounded-xl hover:from-violet-400 hover:to-pink-400 transition-all flex items-center gap-3 mx-auto"
                                >
                                    <Play className="w-5 h-5" />
                                    Teste Başla
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Memorize State */}
                    {gameState === 'memorize' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center space-y-6 w-full max-w-lg"
                        >
                            {/* Countdown */}
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Eye className="w-6 h-6 text-violet-400" />
                                <span className="text-slate-400">Ezberle:</span>
                                <span className="text-3xl font-black text-white">{countdown}</span>
                            </div>

                            {/* Symbols Display */}
                            <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-8">
                                <div className="flex justify-center gap-6 flex-wrap">
                                    {symbolColors.map((sc, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.15 }}
                                            className="text-6xl lg:text-7xl"
                                            style={{ color: sc.color }}
                                        >
                                            {sc.symbol}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-violet-500 to-pink-500"
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: memorizeTime, ease: 'linear' }}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Question State */}
                    {gameState === 'question' && currentQuestion && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center space-y-6 w-full max-w-lg"
                        >
                            {/* Question */}
                            <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-8">
                                <p className="text-slate-400 text-sm mb-2">Soru:</p>
                                <h2 className="text-2xl lg:text-3xl font-bold text-white">
                                    {currentQuestion.query}
                                </h2>
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-4">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = selectedAnswer === option;
                                    const isCorrect = option === currentQuestion.correctAnswer;
                                    const showResult = showFeedback !== null;

                                    // Renk sorusuysa, seçenekleri renkli göster
                                    const optionStyle = currentQuestion.type === 'symbol'
                                        ? { backgroundColor: COLORS.find(c => c.name === option)?.hex || '#64748b' }
                                        : {};

                                    return (
                                        <motion.button
                                            key={idx}
                                            onClick={() => handleAnswer(option)}
                                            disabled={showFeedback !== null}
                                            whileHover={{ scale: showFeedback ? 1 : 1.02 }}
                                            whileTap={{ scale: showFeedback ? 1 : 0.98 }}
                                            style={currentQuestion.type === 'symbol' ? optionStyle : {}}
                                            className={`p-5 rounded-2xl font-bold text-xl transition-all ${showResult
                                                ? isCorrect
                                                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                                                    : isSelected
                                                        ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                                                        : 'bg-slate-800/50 border border-white/5 text-slate-500'
                                                : currentQuestion.type === 'symbol'
                                                    ? 'border-2 border-white/20 text-white hover:border-white/50'
                                                    : 'bg-slate-800/50 border border-white/10 text-white hover:bg-slate-700/50 hover:border-violet-500/30'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                {showResult && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                                                {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
                                                {currentQuestion.type === 'color' ? (
                                                    <span className="text-4xl">{option}</span>
                                                ) : (
                                                    <span>{option}</span>
                                                )}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Feedback */}
                            <AnimatePresence>
                                {showFeedback && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`flex items-center justify-center gap-2 font-bold ${showFeedback === 'correct' ? 'text-emerald-400' : 'text-red-400'
                                            }`}
                                    >
                                        {showFeedback === 'correct' ? (
                                            <>
                                                <CheckCircle2 className="w-6 h-6" />
                                                Doğru!
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-6 h-6" />
                                                Yanlış! Doğru cevap: {currentQuestion.correctAnswer}
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* Finished State */}
                    {gameState === 'finished' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6 w-full max-w-md"
                        >
                            <div className="bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/30 rounded-3xl p-8">
                                <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                                <h2 className="text-3xl font-black text-white mb-2">Test Tamamlandı! 🎉</h2>

                                <div className="grid grid-cols-2 gap-4 my-6">
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">Toplam Puan</p>
                                        <p className="text-2xl font-black text-amber-400">{score}</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">Doğruluk</p>
                                        <p className="text-2xl font-black text-emerald-400">%{accuracy}</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">Ulaşılan Seviye</p>
                                        <p className="text-2xl font-black text-violet-400">Lv.{level}</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">Toplam Tur</p>
                                        <p className="text-2xl font-black text-blue-400">{totalRounds}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-6">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>{correctCount} Doğru</span>
                                    <span className="text-slate-600">|</span>
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    <span>{wrongCount} Yanlış</span>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={startGame}
                                        className="px-6 py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold rounded-xl hover:from-violet-400 hover:to-pink-400 transition-all flex items-center gap-2"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Tekrar Oyna
                                    </button>
                                    <Link
                                        to="/atolyeler/bireysel-degerlendirme"
                                        className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-all"
                                    >
                                        Geri Dön
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SymbolMatchGame;
