import React from 'react';

import type { BalloonState, GamePhase } from '../types';
import { QuestionType } from '../types';
import Balloon from './Balloon';

interface BalloonBoardProps {
    balloons: BalloonState[];
    phase: GamePhase;
    questionType: QuestionType;
    poppedIndices: number[];
    userGuesses: number[];
    shouldHideRemaining: boolean;
}

const BalloonBoard: React.FC<BalloonBoardProps> = ({
    balloons,
    phase,
    questionType,
    poppedIndices,
    userGuesses,
    shouldHideRemaining
}) => {
    const isPositionMask = phase === 'guessing' && questionType === QuestionType.POSITION;

    return (
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 md:gap-6 min-h-[100px] sm:min-h-[160px] md:min-h-[200px] items-start mb-3 sm:mb-6">
            {balloons.map((balloon) => {
                const isHidden = shouldHideRemaining && phase === 'guessing' && !balloon.isPopped;
                const isSelected = userGuesses.includes(balloon.id);

                return (
                    <div key={balloon.id} className="relative group">
                        <Balloon
                            color={balloon.color}
                            isPopped={(balloon.isPopped && phase !== 'result') || isHidden || isPositionMask}
                            isVisible={
                                (balloon.isVisible && !isHidden && !isPositionMask) ||
                                (phase === 'result' && poppedIndices.includes(balloon.id))
                            }
                            displayLabel={
                                phase === 'watching' || phase === 'idle'
                                    ? balloon.displayValue
                                    : undefined
                            }
                        />
                        {isPositionMask && (
                            <div
                                className={`absolute top-0 left-1/2 -translate-x-1/2 w-16 h-20 sm:w-20 sm:h-24 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] border-2 border-black/10 dark:border-slate-950 flex items-center justify-center transition-all ${
                                    isSelected
                                        ? 'bg-yellow-400 scale-110 shadow-none -translate-y-1'
                                        : 'bg-gray-200 dark:bg-slate-700 shadow-inner opacity-90'
                                }`}
                            >
                                <span
                                    className={`text-2xl sm:text-4xl font-black ${
                                        isSelected
                                            ? 'text-black'
                                            : 'text-black/50 dark:text-white/50'
                                    }`}
                                >
                                    ?
                                </span>
                            </div>
                        )}
                        {phase === 'guessing' && !isPositionMask && !balloon.isVisible && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-20 sm:w-20 sm:h-24 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] border-2 border-black/10 dark:border-slate-950 flex items-center justify-center bg-white dark:bg-slate-700 shadow-neo-sm">
                                <span className="text-2xl sm:text-4xl font-black text-black dark:text-white">
                                    ?
                                </span>
                            </div>
                        )}
                        {phase === 'guessing' && !isPositionMask && isHidden && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-20 sm:w-20 sm:h-24 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] border-2 border-black/10 dark:border-slate-950 border-dashed flex items-center justify-center bg-gray-100 dark:bg-slate-800 opacity-60">
                                <span className="text-xl sm:text-3xl font-black text-black/50 dark:text-white/50">
                                    ?
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default BalloonBoard;
