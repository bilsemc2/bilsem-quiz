import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Star, Timer, CheckCircle2, XCircle, ChevronLeft, Zap, Target, AlertCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';

type GameMode = 'simple' | 'selective';
type RoundState = 'waiting' | 'ready' | 'go' | 'early' | 'result';

const ReactionTimeGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
    const [gameMode, setGameMode] = useState<GameMode>('simple');
    const [roundState, setRoundState] = useState<RoundState>('waiting');
    const [currentRound, setCurrentRound] = useState(0);
    const [reactionTimes, setReactionTimes] = useState<number[]>([]);
    const [currentReactionTime, setCurrentReactionTime] = useState<number | null>(null);
    const [earlyClicks, setEarlyClicks] = useState(0);
    const [wrongClicks, setWrongClicks] = useState(0);
    const [targetColor, setTargetColor] = useState<string>('green');
    const [currentColor, setCurrentColor] = useState<string>('red');
    const [score, setScore] = useState(0);
    const gameStartTimeRef = useRef<number>(0);
    const roundStartTimeRef = useRef<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasSavedRef = useRef<boolean>(false);

    const totalRounds = 10;

    // Renk seçenekleri (seçmeli mod için)
    const COLORS = [
        { name: 'Yeşil', value: 'green', bg: 'bg-emerald-500', hex: '#10b981' },
        { name: 'Kırmızı', value: 'red', bg: 'bg-red-500', hex: '#ef4444' },
        { name: 'Mavi', value: 'blue', bg: 'bg-blue-500', hex: '#3b82f6' },
        { name: 'Sarı', value: 'yellow', bg: 'bg-yellow-500', hex: '#eab308' },
    ];

    // Temizlik
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Yeni tur başlat
    const startRound = useCallback(() => {
        setRoundState('waiting');
        setCurrentReactionTime(null);

        // Rastgele bekleme süresi (1.5 - 4 saniye)
        const waitTime = 1500 + Math.random() * 2500;

        timeoutRef.current = setTimeout(() => {
            setRoundState('ready');

            // Seçmeli modda rastgele renk seç
            if (gameMode === 'selective') {
                const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
                setCurrentColor(randomColor.value);
            }

            // Kısa bir süre sonra GO!
            timeoutRef.current = setTimeout(() => {
                setRoundState('go');
                roundStartTimeRef.current = performance.now();
            }, 200 + Math.random() * 300);
        }, waitTime);
    }, [gameMode]);

    // Oyunu başlat
    const startGame = useCallback((mode: GameMode) => {
        setGameMode(mode);
        setGameState('playing');
        setCurrentRound(1);
        setReactionTimes([]);
        setEarlyClicks(0);
        setWrongClicks(0);
        setScore(0);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;

        // Seçmeli modda hedef renk belirle
        if (mode === 'selective') {
            setTargetColor('green'); // Yeşil hedef renk
        }

        // İlk turu başlat
        setTimeout(() => startRound(), 500);
    }, [startRound]);

    // Tıklama işlemi
    const handleClick = useCallback(() => {
        if (gameState !== 'playing') return;

        if (roundState === 'waiting' || roundState === 'ready') {
            // Erken tıklama!
            setRoundState('early');
            setEarlyClicks(prev => prev + 1);
            setScore(prev => Math.max(0, prev - 50));

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                if (currentRound < totalRounds) {
                    setCurrentRound(prev => prev + 1);
                    startRound();
                } else {
                    setGameState('finished');
                }
            }, 1500);
        } else if (roundState === 'go') {
            const reactionTime = performance.now() - roundStartTimeRef.current;
            setCurrentReactionTime(Math.round(reactionTime));

            // Seçmeli modda renk kontrolü
            if (gameMode === 'selective' && currentColor !== targetColor) {
                // Yanlış renge tıkladı!
                setRoundState('result');
                setWrongClicks(prev => prev + 1);
                setScore(prev => Math.max(0, prev - 30));
            } else {
                // Doğru tepki!
                setRoundState('result');
                setReactionTimes(prev => [...prev, Math.round(reactionTime)]);

                // Puan hesapla (hızlı tepki = daha çok puan)
                const timeScore = Math.max(0, 500 - Math.round(reactionTime));
                const roundScore = Math.round(timeScore / 2) + 50;
                setScore(prev => prev + roundScore);
            }

            timeoutRef.current = setTimeout(() => {
                if (currentRound < totalRounds) {
                    setCurrentRound(prev => prev + 1);
                    startRound();
                } else {
                    setGameState('finished');
                }
            }, 1500);
        }
    }, [gameState, roundState, currentRound, gameMode, currentColor, targetColor, startRound]);

    // Seçmeli modda bekleme (tıklamama)
    const handleWait = useCallback(() => {
        if (gameState !== 'playing' || gameMode !== 'selective') return;
        if (roundState !== 'go') return;

        // Hedef renk değilse beklemeli
        if (currentColor !== targetColor) {
            // Doğru bekleme!
            setRoundState('result');
            setCurrentReactionTime(null);
            setScore(prev => prev + 75);

            timeoutRef.current = setTimeout(() => {
                if (currentRound < totalRounds) {
                    setCurrentRound(prev => prev + 1);
                    startRound();
                } else {
                    setGameState('finished');
                }
            }, 1500);
        }
    }, [gameState, gameMode, roundState, currentColor, targetColor, currentRound, startRound]);

    // Seçmeli modda otomatik timeout
    useEffect(() => {
        if (gameMode === 'selective' && roundState === 'go') {
            const timeout = setTimeout(() => {
                if (roundState === 'go') {
                    handleWait();
                }
            }, 1500); // 1.5 saniye içinde tepki vermezse

            return () => clearTimeout(timeout);
        }
    }, [gameMode, roundState, handleWait]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (gameState === 'finished' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            const avgReaction = reactionTimes.length > 0
                ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
                : 0;
            const bestReaction = reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0;

            saveGamePlay({
                game_id: 'tepki-suresi',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    game_mode: gameMode,
                    average_reaction_ms: avgReaction,
                    best_reaction_ms: bestReaction,
                    early_clicks: earlyClicks,
                    wrong_clicks: wrongClicks,
                    successful_reactions: reactionTimes.length,
                    total_rounds: totalRounds,
                    game_name: 'Tepki Süresi',
                }
            });
        }
    }, [gameState]);

    const averageReaction = reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;

    const bestReaction = reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0;

    const getColorClass = (color: string) => {
        switch (color) {
            case 'green': return 'bg-emerald-500';
            case 'red': return 'bg-red-500';
            case 'blue': return 'bg-blue-500';
            case 'yellow': return 'bg-yellow-500';
            default: return 'bg-emerald-500';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-6"
                >
                    <Link
                        to={location.state?.arcadeMode ? "/arcade" : "/atolyeler/bireysel-degerlendirme"}
                        className="inline-flex items-center gap-2 text-amber-400 font-bold hover:text-amber-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        {location.state?.arcadeMode ? "ARCADE HUB" : "Bireysel Değerlendirme"}
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-2">
                        ⚡ <span className="text-amber-400">Tepki</span> Süresi
                    </h1>
                    <p className="text-slate-400">Ne kadar hızlı tepki verebilirsin?</p>
                </motion.div>

                {/* Stats */}
                {gameState !== 'idle' && (
                    <div className="flex justify-center gap-4 mb-6 flex-wrap">
                        <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-400" />
                            <span className="text-white font-bold">{score}</span>
                        </div>
                        <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                            <Target className="w-5 h-5 text-amber-400" />
                            <span className="text-white font-bold">{currentRound}/{totalRounds}</span>
                        </div>
                        {averageReaction > 0 && (
                            <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                                <Timer className="w-5 h-5 text-cyan-400" />
                                <span className="text-white font-bold">{averageReaction}ms</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Game Area */}
                <div className="flex flex-col items-center">
                    {/* Idle State - Mode Selection */}
                    {gameState === 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-8 max-w-lg">
                                <div className="text-6xl mb-4">⚡</div>
                                <h2 className="text-2xl font-bold text-white mb-4">Tepki Süresi Testi</h2>

                                <p className="text-slate-400 mb-6">
                                    Bir mod seç ve tepki hızını test et!
                                </p>

                                <div className="space-y-4">
                                    {/* Basit Mod */}
                                    <button
                                        onClick={() => startGame('simple')}
                                        className="w-full p-6 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50 rounded-2xl hover:border-emerald-400 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-emerald-500 rounded-xl flex items-center justify-center">
                                                <Zap className="w-8 h-8 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                                                    Basit Tepki
                                                </h3>
                                                <p className="text-slate-400 text-sm">
                                                    Yeşil görünce hemen tıkla!
                                                </p>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Seçmeli Mod */}
                                    <button
                                        onClick={() => startGame('selective')}
                                        className="w-full p-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 rounded-2xl hover:border-amber-400 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-amber-500 rounded-xl flex items-center justify-center">
                                                <Target className="w-8 h-8 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                                                    Seçmeli Tepki
                                                </h3>
                                                <p className="text-slate-400 text-sm">
                                                    Sadece yeşile tıkla, diğerlerinde bekle!
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Playing State */}
                    {gameState === 'playing' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full max-w-xl"
                        >
                            {/* Seçmeli mod bilgisi */}
                            {gameMode === 'selective' && (
                                <div className="bg-slate-800/70 border border-emerald-500/50 rounded-2xl p-4 mb-4 flex items-center justify-center gap-3">
                                    <span className="text-slate-400">Hedef Renk:</span>
                                    <div className="w-10 h-10 bg-emerald-500 rounded-lg"></div>
                                    <span className="text-emerald-400 font-bold">YEŞİL</span>
                                </div>
                            )}

                            {/* Reaction Area */}
                            <motion.button
                                onClick={handleClick}
                                className={`w-full aspect-video rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all ${roundState === 'waiting' ? 'bg-slate-700' :
                                    roundState === 'ready' ? 'bg-amber-500' :
                                        roundState === 'go' ? getColorClass(gameMode === 'selective' ? currentColor : 'green') :
                                            roundState === 'early' ? 'bg-red-600' :
                                                roundState === 'result' ? 'bg-slate-700' : 'bg-slate-700'
                                    }`}
                                whileHover={{ scale: roundState === 'go' ? 1.02 : 1 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {roundState === 'waiting' && (
                                    <div className="text-center">
                                        <Timer className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                        <p className="text-2xl font-bold text-slate-300">Bekle...</p>
                                        <p className="text-slate-500">Yeşil görünce tıkla</p>
                                    </div>
                                )}

                                {roundState === 'ready' && (
                                    <div className="text-center">
                                        <AlertCircle className="w-16 h-16 text-amber-900 mx-auto mb-4 animate-pulse" />
                                        <p className="text-2xl font-bold text-amber-900">Hazırlan!</p>
                                    </div>
                                )}

                                {roundState === 'go' && (
                                    <div className="text-center">
                                        <Zap className="w-20 h-20 text-white mx-auto mb-4" />
                                        <p className="text-4xl font-black text-white">
                                            {gameMode === 'selective' && currentColor !== targetColor ? 'BEKLEME!' : 'TIKLA!'}
                                        </p>
                                    </div>
                                )}

                                {roundState === 'early' && (
                                    <div className="text-center">
                                        <XCircle className="w-16 h-16 text-white mx-auto mb-4" />
                                        <p className="text-2xl font-bold text-white">Çok Erken!</p>
                                        <p className="text-red-200">-50 puan</p>
                                    </div>
                                )}

                                {roundState === 'result' && (
                                    <div className="text-center">
                                        {currentReactionTime !== null ? (
                                            <>
                                                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                                                <p className="text-4xl font-black text-emerald-400">{currentReactionTime} ms</p>
                                                <p className="text-slate-400 mt-2">
                                                    {currentReactionTime < 200 ? '⚡ Şimşek hızı!' :
                                                        currentReactionTime < 300 ? '🚀 Harika!' :
                                                            currentReactionTime < 400 ? '👍 İyi!' : '🐢 Daha hızlı olabilir'}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                                                <p className="text-2xl font-bold text-emerald-400">Doğru Bekleme!</p>
                                                <p className="text-slate-400">+75 puan</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </motion.button>

                            {/* Stats */}
                            <div className="flex justify-center items-center gap-6 mt-6 text-sm text-slate-400">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>{reactionTimes.length} Başarılı</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    <span>{earlyClicks + wrongClicks} Hata</span>
                                </div>
                                {bestReaction > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-amber-400" />
                                        <span>En iyi: {bestReaction}ms</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Finished State */}
                    {gameState === 'finished' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6 w-full max-w-md"
                        >
                            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-3xl p-8">
                                <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                                <h2 className="text-3xl font-black text-white mb-2">Test Tamamlandı! ⚡</h2>

                                <div className="grid grid-cols-2 gap-4 my-6">
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">Toplam Puan</p>
                                        <p className="text-2xl font-black text-amber-400">{score}</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">Ortalama</p>
                                        <p className="text-2xl font-black text-cyan-400">{averageReaction}ms</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">En İyi</p>
                                        <p className="text-2xl font-black text-emerald-400">{bestReaction}ms</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">Başarılı</p>
                                        <p className="text-2xl font-black text-purple-400">{reactionTimes.length}/{totalRounds}</p>
                                    </div>
                                </div>

                                <div className="text-sm text-slate-400 mb-6">
                                    {averageReaction < 250 ? '⚡ Şimşek gibi refleksler!' :
                                        averageReaction < 350 ? '🚀 Harika tepki süresi!' :
                                            averageReaction < 450 ? '👍 İyi performans!' :
                                                '💪 Pratik yaparak gelişebilirsin!'}
                                </div>

                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={() => setGameState('idle')}
                                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all flex items-center gap-2"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Tekrar Oyna
                                    </button>
                                    <Link
                                        to={location.state?.arcadeMode ? "/arcade" : "/atolyeler/bireysel-degerlendirme"}
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

export default ReactionTimeGame;
