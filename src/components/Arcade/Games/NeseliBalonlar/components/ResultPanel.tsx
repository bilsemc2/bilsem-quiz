import React from 'react';
import { motion } from 'framer-motion';

import type { BalloonState } from '../types';
import { QuestionType } from '../types';

interface ResultPanelProps {
    balloons: BalloonState[];
    poppedIndices: number[];
    popOrder: number[];
    questionType: QuestionType;
}

const ResultPanel: React.FC<ResultPanelProps> = ({
    balloons,
    poppedIndices,
    popOrder,
    questionType
}) => {
    const resultIds = questionType === QuestionType.ORDER ? popOrder : poppedIndices;

    return (
        <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-3 sm:space-y-4"
        >
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border-2 border-black/10 dark:border-slate-700 shadow-neo-sm inline-block transition-colors duration-300">
                <p className="text-base sm:text-xl font-black text-black dark:text-white mb-3 uppercase transition-colors duration-300">
                    {questionType === QuestionType.ORDER
                        ? 'Dogru Patlama Sirasi'
                        : 'Patlayan Balonlar'}
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                    {resultIds.map((id, index) => {
                        const balloon = balloons.find((item) => item.id === id);

                        if (!balloon) {
                            return null;
                        }

                        return (
                            <div
                                key={id}
                                className="flex flex-col items-center bg-gray-100 dark:bg-slate-700 p-2 sm:p-3 rounded-xl border-2 border-black/10 dark:border-slate-600 shadow-neo-sm"
                            >
                                {questionType === QuestionType.ORDER && (
                                    <div className="text-xs font-black text-black bg-yellow-400 px-2 py-0.5 rounded-full border-2 border-black/10 mb-1">
                                        {index + 1}. sira
                                    </div>
                                )}
                                <div
                                    className="w-10 h-14 sm:w-12 sm:h-16 rounded-full mb-1 border-2 border-black/10 shadow-[inset_-4px_-4px_0_rgba(0,0,0,0.2)]"
                                    style={{ backgroundColor: balloon.color.primary }}
                                />
                                <div className="text-lg sm:text-xl font-black text-black dark:text-white">
                                    {balloon.displayValue}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

export default ResultPanel;
