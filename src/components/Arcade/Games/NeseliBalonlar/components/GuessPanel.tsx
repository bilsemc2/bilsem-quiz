import React from 'react';
import { motion } from 'framer-motion';

import type { AnswerOption, BalloonState, QuestionText } from '../types';
import { QuestionType } from '../types';

interface GuessPanelProps {
    balloons: BalloonState[];
    questionType: QuestionType;
    questionText: QuestionText;
    answerOptions: AnswerOption[];
    userGuesses: number[];
    poppedCount: number;
    onGuess: (optionId: number) => void;
    onSubmit: () => void;
}

const getGridClassName = (questionType: QuestionType): string => {
    if (questionType === QuestionType.NUMBER) {
        return 'grid grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 bg-gray-100 dark:bg-slate-800 p-3 sm:p-5 rounded-2xl border-2 border-black/10 dark:border-slate-700 shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)]';
    }

    if (questionType === QuestionType.COLOR) {
        return 'grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 bg-gray-100 dark:bg-slate-800 p-3 sm:p-5 rounded-2xl border-2 border-black/10 dark:border-slate-700 shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)]';
    }

    if (questionType === QuestionType.POSITION) {
        return 'grid grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3 bg-gray-100 dark:bg-slate-800 p-3 sm:p-5 rounded-2xl border-2 border-black/10 dark:border-slate-700 shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)]';
    }

    return 'grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 bg-gray-100 dark:bg-slate-800 p-3 sm:p-5 rounded-2xl border-2 border-black/10 dark:border-slate-700 shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)] w-full';
};

const getButtonClassName = (
    isSelected: boolean,
    baseClassName: string
): string => {
    const stateClassName = isSelected
        ? 'bg-yellow-400 text-black shadow-none translate-x-0.5 translate-y-0.5'
        : 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-neo-sm hover:-translate-y-1 active:translate-y-1 active:shadow-none';

    return `${baseClassName} ${stateClassName}`;
};

const GuessPanel: React.FC<GuessPanelProps> = ({
    balloons,
    questionType,
    questionText,
    answerOptions,
    userGuesses,
    poppedCount,
    onGuess,
    onSubmit
}) => {
    return (
        <motion.div
            key="guessing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-3xl space-y-3 sm:space-y-5"
        >
            <div className="text-center">
                <h2 className="text-base sm:text-xl md:text-2xl font-black text-black dark:text-white mb-2 bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-slate-700 py-3 sm:py-4 px-3 rounded-2xl shadow-neo-sm rotate-1 transition-colors duration-300">
                    {questionType === QuestionType.ORDER ? (
                        <>
                            Balonlar hangi <span className="text-rose-500 underline decoration-4 decoration-yellow-400 underline-offset-4">SIRADA</span> patladi?
                        </>
                    ) : (
                        <>
                            {questionText.main}{' '}
                            <span className="text-rose-500 underline decoration-4 decoration-yellow-400 underline-offset-4">
                                {questionText.highlight}
                            </span>{' '}
                            {questionText.rest}
                        </>
                    )}
                </h2>
                {questionType === QuestionType.ORDER && (
                    <p className="text-sm font-bold text-black bg-yellow-400 inline-block px-3 py-1 border-2 border-black/10 rounded-xl shadow-neo-sm -rotate-2">
                        Once patlayani en basa koy! 1, 2, 3...
                    </p>
                )}
            </div>

            <div className="flex justify-center w-full">
                <div className={getGridClassName(questionType)}>
                    {answerOptions.map((option) => {
                        const isSelected = userGuesses.includes(option.id);
                        const orderIndex = userGuesses.indexOf(option.id);

                        return (
                            <button
                                key={option.id}
                                onClick={() => onGuess(option.id)}
                                className={getButtonClassName(
                                    isSelected,
                                    questionType === QuestionType.NUMBER
                                        ? 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl font-black text-xl sm:text-2xl transition-all border-2 border-black/10 dark:border-slate-950'
                                        : questionType === QuestionType.POSITION
                                            ? 'w-12 h-12 sm:w-16 sm:h-16 rounded-xl font-black text-xs sm:text-sm transition-all border-2 border-black/10 dark:border-slate-950'
                                            : 'px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-black text-sm sm:text-base transition-all border-2 border-black/10 dark:border-slate-950 flex items-center justify-center gap-2 relative'
                                )}
                            >
                                {option.colorDot && (
                                    <div
                                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-3 border-black/10 shadow-neo-sm shrink-0"
                                        style={{ backgroundColor: option.colorDot }}
                                    />
                                )}
                                {option.label}
                                {questionType === QuestionType.ORDER && orderIndex >= 0 && (
                                    <span className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-cyan-400 border-3 border-black/10 rounded-full flex items-center justify-center text-black text-xs sm:text-sm font-black shadow-neo-sm">
                                        {orderIndex + 1}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {questionType === QuestionType.ORDER && userGuesses.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-slate-700 p-2 sm:p-3 rounded-xl shadow-neo-sm transition-colors duration-300">
                    <span className="font-black text-black dark:text-white text-xs sm:text-sm mr-1">
                        SIRA:
                    </span>
                    {userGuesses.map((guess, index) => {
                        const balloon = balloons.find((item) => item.id === guess);

                        return (
                            <span
                                key={`${guess}-${index}`}
                                className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 border-2 border-black/10 dark:border-slate-600 px-2 py-1 rounded-lg"
                            >
                                <span className="text-black dark:text-white font-black text-xs">
                                    {index + 1}.
                                </span>
                                <div
                                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-black/10"
                                    style={{ backgroundColor: balloon?.color.primary }}
                                />
                            </span>
                        );
                    })}
                </div>
            )}

            <div className="flex flex-col items-center gap-2 sm:gap-3">
                <div className="text-sm sm:text-lg font-black text-black dark:text-white bg-yellow-400 px-4 py-1.5 rounded-xl border-2 border-black/10 shadow-neo-sm rotate-2">
                    Secilen: {userGuesses.length} / {poppedCount}
                </div>
                <button
                    onClick={onSubmit}
                    disabled={userGuesses.length !== poppedCount}
                    className={`px-8 sm:px-14 py-3 sm:py-4 rounded-2xl font-black text-lg sm:text-2xl transition-all border-2 border-black/10 dark:border-slate-950 uppercase ${
                        userGuesses.length === poppedCount
                            ? 'bg-emerald-400 text-black shadow-neo-sm hover:-translate-y-1 active:translate-y-2 active:shadow-none'
                            : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 shadow-neo-sm cursor-not-allowed'
                    }`}
                >
                    TAMAMDIR! ✅
                </button>
            </div>
        </motion.div>
    );
};

export default GuessPanel;
