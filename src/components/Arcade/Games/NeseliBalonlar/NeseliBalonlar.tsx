import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import BalloonBoard from './components/BalloonBoard';
import GuessPanel from './components/GuessPanel';
import PhaseStatusPanel from './components/PhaseStatusPanel';
import ResultPanel from './components/ResultPanel';
import { useNeseliBalonlarGame } from './useNeseliBalonlarGame';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';
import { GAME_ID } from './constants';

const NeseliBalonlar: React.FC = () => {
    const location = useLocation();
    const {
        sessionState,
        balloons,
        phase,
        poppedIndices,
        popOrder,
        userGuesses,
        questionType,
        feedback,
        answerOptions,
        questionText,
        shouldHideRemaining,
        watchDurationMs,
        handleStartGame,
        handleGuess,
        submitGuesses
    } = useNeseliBalonlarGame(location.state?.autoStart);

    return (
        <ArcadeGameShell
            gameState={sessionState}
            gameMetadata={{
                id: GAME_ID,
                title: 'NEŞELİ BALONLAR',
                description: <p>Balonları izle, patlayan balonların renk ve rakamlarını hatırla!</p>,
                tuzoCode: '1.1.1 Renk-Sayı Hafızası',
                icon: <Sparkles className="w-14 h-14 text-black" strokeWidth={3} />,
                iconBgColor: 'bg-sky-400',
                containerBgColor: 'bg-sky-200 dark:bg-slate-900'
            }}
            onStart={handleStartGame}
            onRestart={handleStartGame}
            showLevel={true}
            showLives={true}
        >
            <div className="h-full bg-sky-200 dark:bg-slate-900 flex flex-col items-center p-1 sm:p-2 md:p-4 overflow-y-auto relative transition-colors duration-300">
                <div className="h-14 sm:h-16 shrink-0" />

                <ArcadeFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,#000_20px,#000_40px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(255,255,255,0.05)_20px,rgba(255,255,255,0.05)_40px)] z-0" />

                <main className="w-full flex-1 flex flex-col items-center justify-start relative z-10 max-w-5xl mx-auto">
                    <BalloonBoard
                        balloons={balloons}
                        phase={phase}
                        questionType={questionType}
                        poppedIndices={poppedIndices}
                        userGuesses={userGuesses}
                        shouldHideRemaining={shouldHideRemaining}
                    />
                    <div className="flex flex-col items-center w-full">
                        <AnimatePresence mode="wait">
                            {(phase === 'watching' || phase === 'popping') && (
                                <PhaseStatusPanel
                                    phase={phase}
                                    watchDurationMs={watchDurationMs}
                                />
                            )}

                            {phase === 'guessing' && (
                                <GuessPanel
                                    balloons={balloons}
                                    questionType={questionType}
                                    questionText={questionText}
                                    answerOptions={answerOptions}
                                    userGuesses={userGuesses}
                                    poppedCount={poppedIndices.length}
                                    onGuess={handleGuess}
                                    onSubmit={submitGuesses}
                                />
                            )}

                            {phase === 'result' && (
                                <ResultPanel
                                    balloons={balloons}
                                    poppedIndices={poppedIndices}
                                    popOrder={popOrder}
                                    questionType={questionType}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </ArcadeGameShell>
    );
};

export default NeseliBalonlar;
