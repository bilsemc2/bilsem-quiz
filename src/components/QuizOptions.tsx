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
        <div className="grid grid-cols-5 gap-4">
            {options.map((option, index) => (
                <button
                    key={`${option.id}-${index}`}
                    onClick={() => onOptionSelect(option.id)}
                    disabled={isAnswered}
                    className={`
                        relative p-2 rounded-lg transition-all duration-200
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
                        <img 
                            src={option.imageUrl} 
                            alt={option.text} 
                            className="w-full h-auto"
                        />
                    ) : (
                        <span>{option.text}</span>
                    )}
                </button>
            ))}
        </div>
    );
};

export default QuizOptions;
