import React from 'react';
import { Brain, Battery } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import { GAME_ID } from './constants';
import DarkMazeCanvas from './components/DarkMazeCanvas';
import DarkMazeHudExtras from './components/DarkMazeHudExtras';
import VirtualJoystick from './components/VirtualJoystick';
import { useDarkMazeGame } from './hooks/useDarkMazeGame';
import { useVirtualJoystick } from './hooks/useVirtualJoystick';

const DarkMaze: React.FC = () => {
    const location = useLocation();
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
        startGame,
        nextLevel,
        move,
        handleTouchStart,
        handleTouchEnd
    } = useDarkMazeGame(location.state?.autoStart);
    const joystick = useVirtualJoystick({
        enabled: phase === 'playing',
        onMove: move
    });

    return (
        <ArcadeGameShell
            gameState={sessionState}
            gameMetadata={{
                id: GAME_ID,
                title: 'KARANLIK LABIRENT',
                description: (
                    <>
                        <p>Fenerinle cikisi bul! Pilleri topla ve yolu aydinlat.</p>
                        <p className="mt-2">Karanlikta navigasyon ve uzamsal bellek testi.</p>
                    </>
                ),
                tuzoCode: '5.5.1 Uzamsal Akil Yurutme',
                icon: <Brain className="w-14 h-14 text-black" strokeWidth={3} />,
                iconBgColor: 'bg-amber-400',
                containerBgColor: 'bg-sky-200 dark:bg-slate-900'
            }}
            onStart={startGame}
            onRestart={startGame}
            showLevel={true}
            showLives={false}
            hudExtras={
                <DarkMazeHudExtras
                    energy={energy}
                    timeLeft={timeLeft}
                    lastCollectionTime={lastCollectionTime}
                />
            }
        >
            <div className="h-full bg-sky-200 dark:bg-slate-900 text-black dark:text-white pt-4 pb-6 overflow-hidden flex flex-col font-sans touch-none [-webkit-tap-highlight-color:transparent] transition-colors duration-300">
                <ArcadeFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                <div className="container mx-auto max-w-4xl relative z-10 px-4 sm:px-6 flex flex-col flex-1">
                    <div className="relative flex flex-col xl:flex-row items-center xl:items-start justify-center gap-6 mt-4">
                        <DarkMazeCanvas
                            maze={maze}
                            playerPos={playerPos}
                            isIlluminated={isIlluminated}
                            energy={energy}
                            gridSize={gridSize}
                            canvasSize={canvasSize}
                            energyEffects={energyEffects}
                            showLevelUp={showLevelUp}
                            levelScore={levelScore}
                            onNextLevel={nextLevel}
                            onTouchStart={(x, y) => handleTouchStart({ x, y })}
                            onTouchEnd={(x, y) => handleTouchEnd({ x, y })}
                        />

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

                    <div className="mt-8 mb-4 flex gap-4 justify-center items-center text-xs font-black uppercase tracking-widest text-black dark:text-white flex-wrap">
                        <div className="flex items-center gap-2 bg-emerald-100 border-2 border-black/10 px-4 py-2 rounded-xl shadow-neo-sm -rotate-2">
                            <Battery size={18} className="text-emerald-500 fill-emerald-500 stroke-black stroke-2" /> PIL: ENERJI VERIR
                        </div>
                        <div className="flex items-center gap-2 bg-amber-100 border-2 border-black/10 px-4 py-2 rounded-xl shadow-neo-sm rotate-1">
                            <Brain size={18} className="text-amber-500 fill-amber-500 stroke-black stroke-2" /> BEYIN: AYDINLATIR
                        </div>
                    </div>

                    <p className="xl:hidden text-center bg-white dark:bg-slate-700 border-2 border-black/10 dark:border-slate-600 inline-block mx-auto rounded-xl px-4 py-2 text-xs font-black tracking-widest shadow-neo-sm rotate-1 mt-2 text-black dark:text-white">
                        Joystick'i kullan
                    </p>
                </div>
            </div>
        </ArcadeGameShell>
    );
};

export default DarkMaze;
