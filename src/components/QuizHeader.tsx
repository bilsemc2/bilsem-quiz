import React from 'react';

interface QuizHeaderProps {
    currentQuestionIndex: number;
    totalQuestions: number;
    timeLeft: number;
}

export default function QuizHeader({ currentQuestionIndex, totalQuestions, timeLeft }: QuizHeaderProps) {
    return (
        <div className="mb-4 sm:mb-8">
            <div className="flex justify-between items-center mb-2">
                <div className="text-base sm:text-lg font-semibold text-gray-700">
                    Soru {currentQuestionIndex + 1}/{totalQuestions}
                </div>
                <div className="flex items-center space-x-4">
                    <div className={`
                        relative w-12 h-12 sm:w-14 sm:h-14
                        flex items-center justify-center
                        rounded-full border-4
                        ${timeLeft <= 10 ? 'border-red-500 text-red-500 animate-pulse' : 'border-gray-300 text-gray-700'}
                        transition-colors duration-300
                    `}>
                        <span className="text-lg sm:text-xl font-bold">
                            {timeLeft}
                        </span>
                    </div>
                </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                ></div>
            </div>
        </div>
    );
}
