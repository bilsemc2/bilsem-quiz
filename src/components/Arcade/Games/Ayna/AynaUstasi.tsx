import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import { Target, Level } from './types';
import GameCanvas from './components/GameCanvas';

const FEEDBACK_MESSAGES = [
    "Harikasın! 🌈",
    "Muhteşem simetri! 🌟",
    "Çizgilerin çok düzgün! 🎨",
    "Hadi, bir tane daha yakala! 🚀",
    "Ayna seni çok sevdi! ✨",
    "Tam bir usta çizimi! 🏆",
    "Neredeyse bitti, devam et! 💪"
];

const INITIAL_LEVELS: Level[] = [
    {
        id: 1,
        title: "Gece Yansımaları",
        description: "Karanlıkta parlayan hedefleri vurmak için sol tarafa çizim yap!",
        targets: [
            { id: '1-1', x: 200, y: 150, hit: false },
            { id: '1-2', x: 200, y: 350, hit: false },
        ],
        backgroundPrompt: "Static"
    },
    {
        id: 2,
        title: "Karanlık Köşeler",
        description: "Karanlığın içindeki hedefleri bulmaya çalış!",
        targets: [
            { id: '2-1', x: 100, y: 100, hit: false },
            { id: '2-2', x: 300, y: 100, hit: false },
            { id: '2-3', x: 100, y: 400, hit: false },
            { id: '2-4', x: 300, y: 400, hit: false },
        ],
        backgroundPrompt: "Static"
    }
];

type GameState = 'idle' | 'playing' | 'finished';

const AynaUstasi: React.FC = () => {
    const location = useLocation();
    const { saveGamePlay } = useGamePersistence();
    const gameStartTimeRef = useRef<number>(0);

    const [gameState, setGameState] = useState<GameState>('idle');
    const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
    const [levels, setLevels] = useState<Level[]>(INITIAL_LEVELS);
    const [feedback, setFeedback] = useState<string>("Hazır mısın? Karanlıkta parlayan hedefleri yakala!");
    const [resetTrigger, setResetTrigger] = useState(0);
    const [showWin, setShowWin] = useState(false);
    const [totalScore, setTotalScore] = useState(0);

    const currentLevel = levels[currentLevelIdx];
    const totalHits = currentLevel?.targets.filter(t => t.hit).length || 0;
    const totalTargets = currentLevel?.targets.length || 0;

    // Auto-start from Arcade Hub
    useEffect(() => {
        if (location.state?.autoStart && gameState === 'idle') {
            startGame();
        }
    }, [location.state]);

    const startGame = useCallback(() => {
        setGameState('playing');
        setCurrentLevelIdx(0);
        setLevels(INITIAL_LEVELS.map(l => ({
            ...l,
            targets: l.targets.map(t => ({ ...t, hit: false }))
        })));
        setTotalScore(0);
        setResetTrigger(prev => prev + 1);
        setFeedback("Karanlıkta parlayan hedefleri vurmak için sol tarafa çizim yap!");
        gameStartTimeRef.current = Date.now();
    }, []);

    const generateProceduralLevel = (num: number): Level => {
        const targetCount = Math.min(3 + Math.floor(num / 1.5), 12);
        const types = ['circle', 'random', 'shapes'];
        const type = types[Math.floor(Math.random() * types.length)];
        const targets: Target[] = [];

        if (type === 'circle') {
            const centerX = 200;
            const centerY = 250;
            const radius = 80 + Math.random() * 80;
            for (let i = 0; i < targetCount; i++) {
                const angle = (i / targetCount) * Math.PI * 2;
                targets.push({
                    id: `p-${num}-${i}`,
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius,
                    hit: false
                });
            }
        } else {
            for (let i = 0; i < targetCount; i++) {
                targets.push({
                    id: `p-${num}-${i}`,
                    x: 60 + Math.random() * 280,
                    y: 60 + Math.random() * 380,
                    hit: false
                });
            }
        }

        return {
            id: Date.now(),
            title: `Karanlık Bölüm #${num}`,
            description: "Neon hedefleri avlama zamanı!",
            targets,
            backgroundPrompt: "Procedural"
        };
    };

    const handleTargetHit = (targetId: string) => {
        setLevels(prev => {
            const newLevels = [...prev];
            const target = newLevels[currentLevelIdx].targets.find(t => t.id === targetId);
            if (target && !target.hit) {
                target.hit = true;
                setTotalScore(s => s + 100);
            }
            return newLevels;
        });
    };

    const handleDrawComplete = () => {
        const hits = currentLevel.targets.filter(t => t.hit).length;
        const total = currentLevel.targets.length;

        if (hits === total) {
            setFeedback("Harika! Hepsini başardın! 🥳");
            setShowWin(true);
        } else {
            const randomTip = FEEDBACK_MESSAGES[Math.floor(Math.random() * FEEDBACK_MESSAGES.length)];
            setFeedback(randomTip);
        }
    };

    const nextLevel = () => {
        setShowWin(false);
        if (currentLevelIdx >= levels.length - 1) {
            const newLevel = generateProceduralLevel(levels.length + 1);
            setLevels(prev => [...prev, newLevel]);
        }
        setCurrentLevelIdx(prev => prev + 1);
        setResetTrigger(prev => prev + 1);
        setFeedback("Yeni bölüm, yeni macera! 🎈");
    };

    const resetLevel = () => {
        setLevels(prev => {
            const newLevels = [...prev];
            newLevels[currentLevelIdx].targets = newLevels[currentLevelIdx].targets.map(t => ({ ...t, hit: false }));
            return newLevels;
        });
        setResetTrigger(prev => prev + 1);
        setFeedback("Tekrar denemek harika bir fikir! 🍎");
    };

    const endGame = () => {
        setGameState('finished');
        const duration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        saveGamePlay({
            game_id: 'arcade-ayna-ustasi',
            score_achieved: totalScore,
            duration_seconds: duration,
            metadata: {
                game_name: 'Ayna Ustası',
                levels_completed: currentLevelIdx + 1
            }
        });
    };

    // Start Overlay
    if (gameState === 'idle') {
        return (
            <div className="min-h-screen bg-[#020617] text-white pt-24 pb-12 flex flex-col items-center justify-center">
                <div className="text-center p-8">
                    <h1 className="text-5xl md:text-7xl font-black text-blue-400 tracking-tight mb-4">
                        Ayna <span className="text-rose-400">Ustası</span>
                    </h1>
                    <p className="text-slate-400 font-medium text-lg mb-8 max-w-md mx-auto">
                        Sol tarafta çiz, sağ tarafta ayna görüntüsüyle hedefleri vur!
                    </p>
                    <button
                        onClick={startGame}
                        className="px-12 py-4 bg-gradient-to-r from-blue-500 to-rose-500 text-white rounded-2xl font-black text-xl shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all"
                    >
                        BAŞLA
                    </button>
                    <Link
                        to="/arcade"
                        className="mt-4 inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm"
                    >
                        <ArrowLeft size={16} /> Arcade'e Dön
                    </Link>
                </div>
            </div>
        );
    }

    // Game Over Overlay
    if (gameState === 'finished') {
        return (
            <div className="min-h-screen bg-[#020617] text-white pt-24 pb-12 flex flex-col items-center justify-center">
                <div className="text-center p-8">
                    <div className="text-8xl mb-6">🏆</div>
                    <h2 className="text-4xl md:text-5xl font-black mb-4 text-blue-400">Oyun Bitti!</h2>
                    <p className="text-2xl text-white mb-2">Toplam Skor: <span className="text-rose-400 font-black">{totalScore}</span></p>
                    <p className="text-slate-400 mb-8">Tamamlanan Seviye: {currentLevelIdx + 1}</p>
                    <button
                        onClick={startGame}
                        className="px-12 py-4 bg-gradient-to-r from-blue-500 to-rose-500 text-white rounded-2xl font-black text-xl shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all"
                    >
                        TEKRAR OYNA
                    </button>
                    <Link
                        to="/arcade"
                        className="mt-4 inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm"
                    >
                        <ArrowLeft size={16} /> Arcade'e Dön
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center py-4 px-2 md:py-8 md:px-4 bg-[#020617] pt-24">
            <header className="text-center mb-4 md:mb-8">
                <Link
                    to="/arcade"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm mb-4"
                >
                    <ArrowLeft size={16} /> Arcade'e Dön
                </Link>
                <h1 className="text-3xl md:text-5xl font-black text-blue-400 tracking-tight flex items-center justify-center gap-3 drop-shadow-[0_0_10px_rgba(96,165,250,0.3)]">
                    Ayna <span className="text-rose-400">Ustası</span>
                </h1>
                <p className="text-slate-500 font-medium text-sm md:text-base mt-1">Gece modunda simetriyi keşfet!</p>
            </header>

            <main className="w-full max-w-5xl bg-slate-900/50 rounded-[2rem] shadow-2xl p-4 md:p-8 border-b-8 border-slate-950 border-x border-t border-slate-800 relative">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                            {currentLevelIdx + 1}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-100">{currentLevel.title}</h2>
                            <div className="flex gap-1 mt-1">
                                {Array.from({ length: totalTargets }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-2 w-4 rounded-full transition-all duration-300 ${i < totalHits ? 'bg-green-400 w-8 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-slate-800'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="px-4 py-2 bg-rose-600/20 text-rose-400 rounded-xl font-bold text-sm border border-rose-600/30">
                            Skor: {totalScore}
                        </div>
                        <button
                            onClick={resetLevel}
                            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 border border-slate-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                            Sıfırla
                        </button>
                        <button
                            onClick={endGame}
                            className="px-6 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl font-bold transition-all active:scale-95 border border-red-700"
                        >
                            Bitir
                        </button>
                    </div>
                </div>

                <div className="mb-6 p-4 bg-slate-950/50 rounded-2xl border border-slate-800 flex items-center gap-4">
                    <span className="text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">💡</span>
                    <p className="text-slate-300 font-semibold text-sm md:text-base">{feedback}</p>
                </div>

                <GameCanvas
                    targets={currentLevel.targets}
                    onTargetHit={handleTargetHit}
                    onDrawComplete={handleDrawComplete}
                    resetTrigger={resetTrigger}
                />

                {showWin && (
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center rounded-[2rem] p-8 text-center text-white bounce-in">
                        <div className="text-8xl mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">🎉</div>
                        <h2 className="text-4xl md:text-5xl font-black mb-4 text-blue-400">MÜKEMMEL!</h2>
                        <p className="text-xl opacity-90 mb-10 font-medium text-slate-300">Bu karanlıkta tüm simetrileri buldun!</p>
                        <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
                            <button
                                onClick={resetLevel}
                                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 rounded-2xl font-black text-xl transition-all text-slate-300"
                            >
                                TEKRAR
                            </button>
                            <button
                                onClick={nextLevel}
                                className="flex-1 py-4 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl font-black text-xl shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all hover:scale-105 active:scale-95"
                            >
                                SIRADAKİ ➔
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AynaUstasi;
