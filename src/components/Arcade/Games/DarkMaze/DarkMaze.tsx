import React, { useCallback, useEffect, useRef } from 'react';
import { Battery, Brain, Clock3, Compass, Flashlight, Play, Sparkles, Star, Trophy } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import DarkMazeCanvas from './components/DarkMazeCanvas';
import VirtualJoystick from './components/VirtualJoystick';
import { useDarkMazeGame } from './hooks/useDarkMazeGame';
import { useVirtualJoystick } from './hooks/useVirtualJoystick';
import { useArcadeSoundEffects } from '../../Shared/useArcadeSoundEffects';
import { KidGameFeedbackBanner, KidGameShell, KidGameStatusOverlay } from '../../../kid-ui';
import { useGameViewportFocus } from '../../../../hooks/useGameViewportFocus';

const DarkMaze: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { playAreaRef, focusPlayArea } = useGameViewportFocus();
    const { playArcadeSound } = useArcadeSoundEffects();
    const prevPhaseRef = useRef<string | null>(null);
    const {
        sessionState,
        phase,
        gridSize,
        maze,
        playerPos,
        energy,
        timeLeft,
        isIlluminated,
        energyEffects,
        lastCollectionTime,
        canvasSize,
        feedback,
        showLevelUp,
        levelScore,
        startGame: rawStartGame,
        nextLevel: rawNextLevel,
        move,
        handleTouchStart,
        handleTouchEnd
    } = useDarkMazeGame({
        autoStart: location.state?.autoStart,
        onGameStart: focusPlayArea,
        onNextLevel: focusPlayArea,
    });
    const joystick = useVirtualJoystick({
        enabled: phase === 'playing',
        onMove: move
    });

    const startGame = useCallback(() => {
        playArcadeSound('start');
        rawStartGame();
    }, [playArcadeSound, rawStartGame]);

    const nextLevel = useCallback(() => {
        playArcadeSound('levelUp');
        rawNextLevel();
    }, [playArcadeSound, rawNextLevel]);

    useEffect(() => {
        const prev = prevPhaseRef.current;
        prevPhaseRef.current = phase;
        if (prev === 'playing' && phase === 'level_cleared') {
            playArcadeSound('success');
        }
        if (prev === 'playing' && phase === 'finished') {
            playArcadeSound('fail');
        }
    }, [phase, playArcadeSound]);

    const overlay = sessionState.status === 'START' ? (
        <KidGameStatusOverlay
            tone="yellow"
            icon={Compass}
            title="Karanlık Labirent"
            description="Fenerinle çıkışı bul, pil topla ve yolu kısa sürede keşfet."
            stats={[
                { label: 'Hedef', value: 'Çıkışa Ulaş', tone: 'blue' },
                { label: 'Odak', value: 'Uzamsal Bellek', tone: 'emerald' },
            ]}
            actions={[
                { label: 'Başlayalım', variant: 'primary', size: 'lg', icon: Play, onClick: startGame },
                { label: 'Hemen Keşfet', variant: 'ghost', size: 'lg', icon: Sparkles, onClick: startGame },
            ]}
        />
    ) : sessionState.status === 'GAME_OVER' ? (
        <KidGameStatusOverlay
            tone="pink"
            icon={Trophy}
            title="Labirent Turu Bitti"
            description="Güzel bir keşif yaptın. Rotaları biraz daha hızlı okuyarak daha yüksek seviyeye çıkabilirsin."
            stats={[
                { label: 'Puan', value: sessionState.score, tone: 'blue' },
                { label: 'Seviye', value: sessionState.level, tone: 'yellow' },
                { label: 'Enerji', value: `${Math.round(energy)}%`, tone: 'emerald' },
            ]}
            actions={[
                { label: 'Tekrar Oyna', variant: 'primary', size: 'lg', icon: Play, onClick: startGame },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => navigate('/bilsem-zeka') },
            ]}
            backdropClassName="bg-slate-950/60"
        />
    ) : showLevelUp && phase === 'level_cleared' ? (
        <KidGameStatusOverlay
            tone="emerald"
            icon={Flashlight}
            title="Bölüm Tamam"
            description="Çıkışı buldun. Sıradaki labirent daha büyük ve biraz daha hareketli olacak."
            stats={[
                { label: 'Bonus', value: `+${levelScore}`, tone: 'yellow' },
                { label: 'Seviye', value: sessionState.level, tone: 'blue' },
            ]}
            actions={[
                { label: 'Sonraki Seviye', variant: 'secondary', size: 'lg', icon: Sparkles, onClick: nextLevel },
            ]}
            backdropClassName="bg-black/50"
            maxWidthClassName="max-w-md"
        />
    ) : null;

    return (
        <KidGameShell
            title="Karanlık Labirent"
            subtitle="Fenerini dikkatli kullan, enerji topla ve çıkışı en kısa yoldan bul."
            instruction="Joystick ile ilerle. Pil kutuları enerji verir, beyin işaretleri yolu bir anlığına aydınlatır."
            backHref="/bilsem-zeka"
            backLabel="Arcade'e Dön"
            badges={[
                { label: 'Uzamsal Bellek', variant: 'difficulty' },
                { label: '5.5.1 Uzamsal Akıl Yürütme', variant: 'tuzo' },
            ]}
            stats={[
                { label: 'Seviye', value: sessionState.level, tone: 'blue', icon: Brain },
                { label: 'Puan', value: sessionState.score, tone: 'yellow', icon: Star },
                {
                    label: 'Enerji',
                    value: `${Math.round(energy)}%`,
                    tone: energy <= 25 ? 'pink' : 'emerald',
                    emphasis: energy <= 25 ? 'danger' : 'default',
                    icon: Battery,
                    helper: lastCollectionTime > 0 ? 'Pil toplayarak tekrar dolar.' : 'Başlangıçta tam dolu.',
                },
                {
                    label: 'Süre',
                    value: `${timeLeft}s`,
                    tone: timeLeft <= 10 ? 'orange' : 'blue',
                    emphasis: timeLeft <= 10 ? 'danger' : 'default',
                    icon: Clock3,
                    helper: 'Süre bitmeden çıkışa ulaş.',
                },
            ]}
            supportTitle="Keşif Rehberi"
            supportDescription="Labirentte işine yarayacak ipuçları ve kontroller burada."
            playAreaRef={playAreaRef}
            supportArea={(
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.9fr)]">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-emerald/20 px-4 py-4 shadow-neo-sm">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-black dark:text-white">
                                <Battery size={16} className="stroke-[2.5]" />
                                Pil Kutusu
                            </div>
                            <p className="mt-2 text-sm font-bold leading-relaxed text-slate-700 dark:text-slate-300">
                                Enerjin azalırken pil kutularını toplayıp fenerini daha uzun açık tutabilirsin.
                            </p>
                        </div>

                        <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/30 px-4 py-4 shadow-neo-sm">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-black dark:text-white">
                                <Brain size={16} className="stroke-[2.5]" />
                                Beyin İşareti
                            </div>
                            <p className="mt-2 text-sm font-bold leading-relaxed text-slate-700 dark:text-slate-300">
                                Beyin hücreleri yolu kısa bir süre aydınlatır. Dönüşleri planlamak için kullan.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-white/80 px-4 py-4 shadow-neo-sm dark:border-white/10 dark:bg-slate-900/70">
                        <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                            Kontrol İpuçları
                        </div>
                        <div className="mt-3 space-y-2 text-sm font-bold leading-relaxed text-slate-700 dark:text-slate-300">
                            <p>Joystick sadece oyun başladığında aktif olur.</p>
                            <p>Köşe dönüşlerinde önce yön seç, sonra hızlı ama düzenli ilerle.</p>
                            <p className="xl:hidden rounded-2xl border-2 border-black/10 bg-cyber-blue/10 px-3 py-2 text-black dark:text-white">
                                Mobilde alt taraftaki joystick ile kahramanı yönlendir.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            overlay={overlay}
        >
            <div className="flex flex-col gap-5">
                <KidGameFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                <div className="relative flex flex-col items-center justify-center gap-6 xl:flex-row xl:items-start">
                    <div className="w-full xl:flex xl:justify-center">
                        <DarkMazeCanvas
                            maze={maze}
                            playerPos={playerPos}
                            isIlluminated={isIlluminated}
                            energy={energy}
                            gridSize={gridSize}
                            canvasSize={canvasSize}
                            energyEffects={energyEffects}
                            onTouchStart={(x, y) => handleTouchStart({ x, y })}
                            onTouchEnd={(x, y) => handleTouchEnd({ x, y })}
                        />
                    </div>

                    {phase === 'playing' && (
                        <VirtualJoystick
                            joystickRef={joystick.joystickRef}
                            joystickPos={joystick.joystickPos}
                            isDragging={joystick.isDragging}
                            activeDirection={joystick.activeDirection}
                            onStart={joystick.handleJoystickStart}
                            onMove={joystick.handleJoystickMove}
                            onEnd={joystick.handleJoystickEnd}
                        />
                    )}
                </div>
            </div>
        </KidGameShell>
    );
};

export default DarkMaze;
