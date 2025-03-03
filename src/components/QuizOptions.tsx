import React from 'react';
import { QuizOption } from '../types/quiz';

interface QuizOptionsProps {
    options: QuizOption[];
    selectedOption: string | null;
    isAnswered: boolean;
    onOptionSelect: (optionId: string) => void;
    onImageLoad?: () => void; // Görsel yüklenme olayı için callback
}

const QuizOptions: React.FC<QuizOptionsProps> = ({
    options,
    selectedOption,
    isAnswered,
    onOptionSelect,
    onImageLoad
}) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
                Seçenekler
            </h3>
            <div className="grid grid-cols-5 gap-4">
                {options.map((option, index) => (
                    <button
                        key={`${option.id}-${index}`}
                        onClick={() => onOptionSelect(option.id)}
                        disabled={isAnswered}
                        className={`
                            relative p-4 rounded-lg transition-all duration-200 aspect-square
                            ${isAnswered
                                ? option.isCorrect
                                    ? 'border-2 border-emerald-500 bg-emerald-50 shadow-lg'
                                    : option.id === selectedOption
                                        ? 'border-2 border-red-500 bg-red-50 shadow-lg'
                                        : 'border-2 border-gray-200 bg-white'
                                : option.id === selectedOption
                                    ? 'border-2 border-blue-500 bg-blue-50 shadow-lg'
                                    : 'border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-md'
                            }
                        `}
                    >
                        <div className="w-full h-full flex items-center justify-center">
                            {option.imageUrl ? (
                                <img 
                                    src={option.imageUrl} 
                                    alt={option.text} 
                                    className="w-full h-full object-contain"
                                    onLoad={() => onImageLoad && onImageLoad()}
                                />
                            ) : (
                                <span>{option.text}</span>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuizOptions;
