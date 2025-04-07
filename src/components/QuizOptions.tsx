import React, { useState, useEffect } from 'react';
import { QuizOption } from '../types/quiz';
import { motion } from 'framer-motion';

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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // Ekran boyutu değişikliklerini izleme
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return (
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
                Seçenekler
            </h3>
            <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-5'} gap-3 md:gap-4`}>
                {options.map((option, index) => (
                    <motion.button
                        key={`${option.id}-${index}`}
                        onClick={() => onOptionSelect(option.id)}
                        disabled={isAnswered}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                        className={`
                            relative p-3 md:p-4 rounded-lg transition-all duration-200 aspect-square
                            ${isMobile ? 'min-h-[80px]' : ''}
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
                            active:bg-gray-100
                        `}
                    >
                        <div className="w-full h-full flex items-center justify-center">
                            {option.imageUrl ? (
                                <img 
                                    src={option.imageUrl} 
                                    alt={option.text} 
                                    className="w-full h-full object-contain"
                                    onLoad={() => onImageLoad && onImageLoad()}
                                    loading="lazy"
                                />
                            ) : (
                                <span className="text-center text-sm md:text-base">{option.text}</span>
                            )}
                            
                            {/* Doğru/yanlış göstergesi */}
                            {isAnswered && (
                                <div className="absolute top-1 right-1">
                                    {option.isCorrect ? (
                                        <div className="bg-emerald-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    ) : option.id === selectedOption ? (
                                        <div className="bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default QuizOptions;
