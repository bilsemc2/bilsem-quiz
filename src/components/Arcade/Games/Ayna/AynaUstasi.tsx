import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import { ARCADE_SCORE_FORMULA, ARCADE_SCORE_BASE, ARCADE_FEEDBACK_TEXTS } from '../../Shared/ArcadeConstants';
import { useArcadeSoundEffects } from '../../Shared/useArcadeSoundEffects';
import { Target, Level } from './types';
import GameCanvas from './components/GameCanvas';
import { Brain, Play, RotateCcw, Sparkles, Star, Target as TargetIcon, Trophy } from 'lucide-react';
import { useGameViewportFocus } from '../../../../hooks/useGameViewportFocus';
import { KidCard, KidGameFeedbackBanner, KidGameShell, KidGameStatusOverlay } from '../../../kid-ui';

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

type GamePhase = 'idle' | 'playing' | 'finished';

const AynaUstasiPreview: React.FC = () => {
    const steps = [
        {
            title: 'Solda Çiz',
            description: 'Çizgiyi kendi alanında rahatça hareket ettir ve bir şekil oluştur.',
            accentColor: 'yellow',
        },
        {
            title: 'Aynayı İzle',
            description: 'Sağ tarafta oluşan yansımayı takip ederek hedeflerin üzerinden geç.',
            accentColor: 'blue',
        },
        {
            title: 'Bölümü Tamamla',
            description: 'Tüm hedefleri vurunca sıradaki bölüme geçip daha kalabalık desenlerle oynarsın.',
            accentColor: 'emerald',
        },
    ] as const;

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="rounded-[2rem] border-2 border-black/10 bg-white/85 p-5 shadow-neo-md dark:border-white/10 dark:bg-slate-900/80">
                <div className="rounded-[1.5rem] border-2 border-black/10 bg-[linear-gradient(180deg,#e0f2fe_0%,#ffffff_45%,#ffe4e6_100%)] p-6 shadow-inner dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.96)_0%,rgba(15,23,42,0.96)_100%)]">
                    <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                        <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue/15 p-4 shadow-neo-sm">
                            <div className="text-center text-[11px] font-black uppercase tracking-[0.22em] text-black dark:text-white">
                                Senin Alanın
                            </div>
                            <div className="mt-4 h-40 rounded-[1.5rem] border-2 border-dashed border-black/15 bg-white/85 dark:border-white/10 dark:bg-slate-800/80" />
                        </div>
                        <div className="mx-auto h-12 w-12 rounded-full border-2 border-black/10 bg-cyber-yellow shadow-neo-sm md:h-40 md:w-3" />
                        <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-pink/15 p-4 shadow-neo-sm">
                            <div className="text-center text-[11px] font-black uppercase tracking-[0.22em] text-black dark:text-white">
                                Ayna Dünyası
                            </div>
                            <div className="mt-4 grid h-40 place-items-center rounded-[1.5rem] border-2 border-black/10 bg-white/85 dark:border-white/10 dark:bg-slate-800/80">
                                <div className="flex gap-3">
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <div
                                            key={index}
                                            className="h-10 w-10 rounded-full border-2 border-black/10 bg-cyber-pink shadow-neo-sm"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/80 px-4 py-3 text-center text-sm font-black uppercase tracking-[0.22em] text-black shadow-neo-sm">
                        Çizgi sağda aynalanır, hedefi yansıma vurur
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {steps.map((step) => (
                    <KidCard key={step.title} accentColor={step.accentColor} animate={false} className="h-full">
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                            Ayna Görevi
                        </div>
                        <div className="mt-2 text-2xl font-black tracking-tight text-black dark:text-white">
                            {step.title}
                        </div>
                        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            {step.description}
                        </p>
                    </KidCard>
                ))}
            </div>
        </div>
    );
};

const AynaUstasi: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { saveGamePlay } = useGamePersistence();
    const { playAreaRef, focusPlayArea } = useGameViewportFocus();
    const { playArcadeSound } = useArcadeSoundEffects();
    const gameStartTimeRef = useRef<number>(0);
    const isResolvingRef = useRef(false);
    const hasSavedRef = useRef(false);
    const levelCompleteTimeoutRef = useRef<number | null>(null);

    const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
    const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
    const [levels, setLevels] = useState<Level[]>(INITIAL_LEVELS);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [resetTrigger, setResetTrigger] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [totalScore, setTotalScore] = useState(0);

    const currentLevel = levels[currentLevelIdx] ?? levels[levels.length - 1];
    const totalHits = currentLevel?.targets.filter(t => t.hit).length || 0;
    const totalTargets = currentLevel?.targets.length || 0;

    const clearLevelCompleteTimeout = useCallback(() => {
        if (levelCompleteTimeoutRef.current !== null) {
            window.clearTimeout(levelCompleteTimeoutRef.current);
            levelCompleteTimeoutRef.current = null;
        }
    }, []);

    const startGame = useCallback(() => {
        clearLevelCompleteTimeout();
        setGamePhase('playing');
        setCurrentLevelIdx(0);
        setLevels(INITIAL_LEVELS.map(l => ({
            ...l,
            targets: l.targets.map(t => ({ ...t, hit: false }))
        })));
        setTotalScore(0);
        setResetTrigger(prev => prev + 1);
        setFeedback(null);
        setShowLevelUp(false);
        hasSavedRef.current = false;
        isResolvingRef.current = false;
        gameStartTimeRef.current = Date.now();
        playArcadeSound('start');
        focusPlayArea();
    }, [clearLevelCompleteTimeout, focusPlayArea, playArcadeSound]);

    // Auto-start from Arcade Hub
    useEffect(() => {
        if (location.state?.autoStart && gamePhase === 'idle') {
            startGame();
        }
    }, [gamePhase, location.state, startGame]);

    useEffect(() => clearLevelCompleteTimeout, [clearLevelCompleteTimeout]);

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
        if (isResolvingRef.current) return;

        setLevels(prev => {
            const newLevels = [...prev];
            const target = newLevels[currentLevelIdx].targets.find(t => t.id === targetId);
            if (target && !target.hit) {
                target.hit = true;
                const hitScore = ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, currentLevelIdx + 1);
                setTotalScore(s => s + hitScore);
                playArcadeSound('hit');
            }
            return newLevels;
        });
    };

    const handleDrawComplete = () => {
        if (!currentLevel || isResolvingRef.current) return;
        const hits = currentLevel.targets.filter(t => t.hit).length;
        const total = currentLevel.targets.length;

        if (hits === total) {
            isResolvingRef.current = true;
            playArcadeSound('success');
            const msgs = ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES;
            setFeedback({ message: msgs[Math.floor(Math.random() * msgs.length)], type: 'success' });

            clearLevelCompleteTimeout();
            levelCompleteTimeoutRef.current = window.setTimeout(() => {
                levelCompleteTimeoutRef.current = null;
                setFeedback(null);
                setShowLevelUp(true);
                isResolvingRef.current = false;
            }, 1500);
        }
    };

    const nextLevel = () => {
        clearLevelCompleteTimeout();
        setShowLevelUp(false);
        playArcadeSound('levelUp');
        if (currentLevelIdx >= levels.length - 1) {
            const newLevel = generateProceduralLevel(levels.length + 1);
            setLevels(prev => [...prev, newLevel]);
        }
        setCurrentLevelIdx(prev => prev + 1);
        setResetTrigger(prev => prev + 1);
        focusPlayArea();
    };

    const resetLevel = () => {
        clearLevelCompleteTimeout();
        setLevels(prev => {
            const newLevels = [...prev];
            newLevels[currentLevelIdx].targets = newLevels[currentLevelIdx].targets.map(t => ({ ...t, hit: false }));
            return newLevels;
        });
        setResetTrigger(prev => prev + 1);
        setShowLevelUp(false);
        focusPlayArea();
    };

    const endGame = () => {
        clearLevelCompleteTimeout();
        setGamePhase('finished');
        if (!hasSavedRef.current) {
            hasSavedRef.current = true;
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
        }
    };

    const overlay = gamePhase === 'idle' ? (
        <KidGameStatusOverlay
            tone="blue"
            icon={TargetIcon}
            title="Ayna Ustası"
            description="Solda çiz, sağda oluşan ayna görüntüsüyle hedefleri vur ve her bölümde desenleri büyüt."
            actions={[
                { label: 'Oyuna Başla', variant: 'primary', size: 'lg', icon: Play, onClick: startGame },
                { label: 'Hızlı Başlangıç', variant: 'ghost', size: 'lg', icon: Sparkles, onClick: startGame },
            ]}
        >
            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border-2 border-black/10 bg-cyber-yellow/80 px-4 py-4 shadow-neo-sm">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-black/70">1</div>
                    <div className="mt-2 text-sm font-black uppercase">Çizgiyi Kur</div>
                </div>
                <div className="rounded-2xl border-2 border-black/10 bg-cyber-blue px-4 py-4 text-white shadow-neo-sm">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">2</div>
                    <div className="mt-2 text-sm font-black uppercase">Aynayı İzle</div>
                </div>
                <div className="rounded-2xl border-2 border-black/10 bg-cyber-emerald px-4 py-4 text-black shadow-neo-sm">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-black/70">3</div>
                    <div className="mt-2 text-sm font-black uppercase">Hedefleri Bitir</div>
                </div>
            </div>
        </KidGameStatusOverlay>
    ) : gamePhase === 'finished' ? (
        <KidGameStatusOverlay
            tone="pink"
            icon={Trophy}
            title="Tur Tamamlandı"
            description="Ayna simetrisini güzel kullandın. Yeni turda daha çok hedefe ve daha yüksek puana oynayabilirsin."
            stats={[
                { label: 'Puan', value: totalScore, tone: 'yellow' },
                { label: 'Seviye', value: currentLevelIdx + 1, tone: 'blue' },
                { label: 'Hedef', value: `${totalHits}/${totalTargets}`, tone: 'emerald' },
            ]}
            actions={[
                { label: 'Tekrar Oyna', variant: 'primary', size: 'lg', icon: RotateCcw, onClick: startGame },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => navigate('/bilsem-zeka') },
            ]}
            backdropClassName="bg-slate-950/60"
        />
    ) : showLevelUp ? (
        <KidGameStatusOverlay
            tone="emerald"
            icon={Star}
            title="Mükemmel"
            description="Tüm simetrileri buldun. İstersen bölümü tekrar açabilir ya da sıradaki desene geçebilirsin."
            stats={[
                { label: 'Seviye', value: currentLevelIdx + 1, tone: 'blue' },
                { label: 'Puan', value: totalScore, tone: 'yellow' },
                { label: 'Hedef', value: `${totalHits}/${totalTargets}`, tone: 'emerald' },
            ]}
            actions={[
                { label: 'Bölümü Tekrarla', variant: 'ghost', size: 'lg', icon: RotateCcw, onClick: resetLevel },
                { label: 'Sıradaki Bölüm', variant: 'primary', size: 'lg', icon: Play, onClick: nextLevel },
            ]}
            backdropClassName="bg-slate-950/55"
        />
    ) : null;

    return (
        <KidGameShell
            title="Ayna Ustası"
            subtitle="Solda çizdiğin çizgi sağda aynalanır. Yansıma ile hedefleri vur ve bölümleri büyüt."
            instruction="Çizgiyi kendi alanında sürükle. Asıl vuruş sağdaki ayna tarafında oluşur."
            backHref="/bilsem-zeka"
            backLabel="Arcade'e Dön"
            badges={[
                { label: 'Ayna Simetrisi', variant: 'difficulty' },
                { label: 'TUZÖ 3.2.1', variant: 'tuzo' },
            ]}
            stats={[
                { label: 'Seviye', value: currentLevelIdx + 1, tone: 'blue', icon: Brain, helper: currentLevel.title },
                { label: 'Puan', value: totalScore, tone: 'yellow', icon: Star, helper: 'Her hedef ekstra puan getirir' },
                { label: 'Hedef', value: `${totalHits}/${totalTargets}`, tone: 'emerald', icon: TargetIcon, helper: currentLevel.description },
                { label: 'Durum', value: showLevelUp ? 'Geçiş' : gamePhase === 'playing' ? 'Oyun' : 'Hazır', tone: 'orange', icon: Trophy, helper: showLevelUp ? 'Sıradaki bölüme geçebilirsin' : 'Çizgiyi aynaya dönüştür' },
            ]}
            supportTitle="Ayna Rehberi"
            supportDescription="Simetriyi daha hızlı kurmak ve hedefleri kaçırmamak için kısa ipuçları burada."
            playAreaRef={playAreaRef}
            playAreaClassName="min-h-[760px]"
            supportArea={(
                <div className="grid gap-3 lg:grid-cols-3">
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/30 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Nasıl Çalışır?
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Sol tarafta çizdiğin yol sağ tarafta terslenerek görünür. Hedefleri çizen el değil, aynadaki yol vurur.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue/15 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Seviye İpucu
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Her bölümde hedef sayısı artar. Önce en üstteki ve en alttaki hedefleri hizalamak işini kolaylaştırır.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-pink/15 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Hızlı Kontrol
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Çizgiyi bir turda bitiremezsen bölümü sıfırlayıp yeniden deneyebilirsin. Geçişten sonra yeni bölüm otomatik odaklanır.
                        </p>
                    </div>
                </div>
            )}
            overlay={overlay}
        >
            <div className="w-full space-y-5">
                <KidGameFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                {gamePhase === 'playing' ? (
                    <div className="space-y-5">
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                            <KidCard accentColor="yellow" animate={false}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                                            Aktif Bölüm
                                        </div>
                                        <div className="mt-2 text-2xl font-black tracking-tight text-black dark:text-white">
                                            {currentLevel.title}
                                        </div>
                                        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                                            {currentLevel.description}
                                        </p>
                                    </div>

                                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue px-5 py-4 text-center text-white shadow-neo-sm">
                                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/75">
                                            Bölüm
                                        </div>
                                        <div className="mt-2 text-4xl font-black leading-none">
                                            {currentLevelIdx + 1}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    {Array.from({ length: totalTargets }).map((_, index) => (
                                        <div
                                            key={index}
                                            className={[
                                                'h-4 rounded-full border-2 border-black/10 transition-all duration-300',
                                                index < totalHits ? 'w-12 bg-cyber-emerald shadow-neo-sm' : 'w-6 bg-slate-200 dark:bg-slate-700',
                                            ].join(' ')}
                                        />
                                    ))}
                                </div>
                            </KidCard>

                            <div className="flex flex-wrap gap-3 lg:flex-col">
                                <button
                                    type="button"
                                    onClick={resetLevel}
                                    className="rounded-2xl border-2 border-black/10 bg-cyber-yellow px-5 py-3 text-sm font-black uppercase tracking-[0.22em] text-black shadow-neo-sm transition-all hover:-translate-y-1 hover:shadow-neo-md"
                                >
                                    Bölümü Sıfırla
                                </button>
                                <button
                                    type="button"
                                    onClick={endGame}
                                    className="rounded-2xl border-2 border-black/10 bg-cyber-pink px-5 py-3 text-sm font-black uppercase tracking-[0.22em] text-white shadow-neo-sm transition-all hover:-translate-y-1 hover:shadow-neo-md"
                                >
                                    Turu Bitir
                                </button>
                            </div>
                        </div>

                        <div className="rounded-[2rem] border-2 border-black/10 bg-[linear-gradient(180deg,#dbeafe_0%,#f8fafc_42%,#ffe4e6_100%)] p-2 shadow-neo-md dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.96)_0%,rgba(15,23,42,0.96)_100%)]">
                            <GameCanvas
                                targets={currentLevel.targets}
                                onTargetHit={handleTargetHit}
                                onDrawComplete={handleDrawComplete}
                                resetTrigger={resetTrigger}
                            />
                        </div>
                    </div>
                ) : (
                    <AynaUstasiPreview />
                )}
            </div>
        </KidGameShell>
    );
};

export default AynaUstasi;
