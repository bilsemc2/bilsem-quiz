import React from 'react';

interface Option {
    id: string;
    imageUrl: string;
}

interface QuizOptionsProps {
    options: Option[];
    isAnswered: boolean;
    isTimeout: boolean;
    correctOptionId: string;
    selectedOption: string | null;
    onOptionSelect: (optionId: string) => void;
}

const QuizOptions: React.FC<QuizOptionsProps> = ({
    options,
    isAnswered,
    isTimeout,
    correctOptionId,
    selectedOption,
    onOptionSelect
}) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
            {options.map((option, index) => (
                <button
                    key={index}
                    onClick={() => onOptionSelect(option.id)}
                    disabled={isAnswered}
                    className={`
                        w-full p-2 sm:p-4 text-center rounded-lg transition-all duration-200 relative
                        ${isAnswered && !isTimeout
                            ? option.id === correctOptionId
                                ? 'border-4 border-emerald-500 bg-emerald-50 shadow-emerald-100 scale-105'
                                : option.id === selectedOption
                                    ? 'border-4 border-red-500 bg-red-50 shadow-red-100'
                                    : 'border border-gray-100 bg-white opacity-50'
                            : isTimeout && option.id === correctOptionId
                                ? 'border-4 border-yellow-500 bg-yellow-50 shadow-yellow-100'
                                : 'border border-gray-100 hover:border-indigo-400 bg-white hover:shadow-lg'
                        }
                        ${!isAnswered && 'hover:scale-[1.02] hover:-translate-y-1'}
                        transform transition-all duration-300 shadow-md hover:shadow-xl
                    `}
                >
                    <img
                        src={option.imageUrl}
                        alt={`Seçenek ${index + 1}`}
                        className="w-full h-auto rounded transition-transform duration-300"
                    />
                </button>
            ))}
        </div>
    );
};

export default QuizOptions;
