import React from 'react';
import { QuizOption } from '../types/quiz';

interface QuizOptionsProps {
    options: QuizOption[];
    selectedOption: string | null;
    isAnswered: boolean;
    onOptionSelect: (optionId: string) => void;
}

const QuizOptions: React.FC<QuizOptionsProps> = ({
    options,
    selectedOption,
    isAnswered,
    onOptionSelect
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {options.map((option, index) => (
                <button
                    key={`${option.id}-${index}`}
                    onClick={() => onOptionSelect(option.id)}
                    disabled={isAnswered}
                    className={`
                        h-[120px] p-3 rounded-xl transition-all duration-200
                        shadow-sm hover:shadow-md flex items-center justify-center
                        ${isAnswered
                            ? option.isCorrect
                                ? 'border-2 border-emerald-500 bg-emerald-50'
                                : option.id === selectedOption
                                    ? 'border-2 border-red-500 bg-red-50'
                                    : 'border-2 border-gray-200 bg-white'
                            : option.id === selectedOption
                                ? 'border-2 border-blue-500 bg-blue-50'
                                : 'border-2 border-gray-200 bg-white hover:border-blue-500'
                        }
                    `}
                >
                    {option.imageUrl ? (
                        <div className="h-full w-full flex items-center justify-center">
                            <img 
                                src={option.imageUrl} 
                                alt={option.text} 
                                className="max-h-full max-w-full object-contain"
                            />
                        </div>
                    ) : (
                        <span className="text-base text-center px-2">{option.text}</span>
                    )}
                </button>
            ))}
        </div>
    );
};

export default QuizOptions;
