import { useState, useEffect, useRef } from 'react';
import { QuizQuestion } from '../types/quiz'; // Assuming this type definition exists and is correct
import { useSound } from '../hooks/useSound'; // Assuming this hook exists and works as expected

// ----- Configuration -----
const INITIAL_TIME_SECONDS = 60; // Define initial time as a constant
const RESULT_DISPLAY_DELAY_MS = 1500; // Delay before moving to the next question or showing results
const TIME_WARNING_THRESHOLD = 10; // Seconds left to trigger warning sound/style
const TICK_SOUND_THRESHOLD = 5; // Seconds left to start playing tick sound

// ----- Timer Component -----
interface TimerProps {
    timeLeft: number;
    initialTime: number; // Add initialTime prop for accurate percentage calculation
}

const Timer = ({ timeLeft, initialTime }: TimerProps) => {
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    const percentageLeft = initialTime > 0 ? (timeLeft / initialTime) * 100 : 0;
    const isWarning = timeLeft <= TIME_WARNING_THRESHOLD;

    return (
        <div className="flex justify-end items-center mb-6"> {/* Adjusted alignment */}
            <div className="flex flex-col items-end">
                <div className="w-[150px]">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-600">Kalan Süre</span>
                        <span className={`text-sm font-bold ${isWarning ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"> {/* Added overflow-hidden */}
                        <div
                            className={`h-2 rounded-full transition-all duration-1000 ease-linear ${ // Use ease-linear for smoother timer decrease
                                isWarning
                                    ? 'bg-red-500'
                                    : timeLeft <= initialTime / 2 // Yellow at half time
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                            }`}
                            style={{
                                width: `${percentageLeft}%`,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ----- Option Component -----
interface OptionProps {
    option: { id: string; imageUrl: string; text?: string };
    isSelected: boolean;
    isCorrect: boolean;
    showResult: boolean;
    disabled: boolean; // Add disabled prop
    onClick: () => void;
}

const Option = ({ option, isSelected, isCorrect, showResult, disabled, onClick }: OptionProps) => {
    const getBorderStyle = () => {
        if (showResult) {
            if (isCorrect) return 'ring-2 ring-green-500 bg-green-50';
            if (isSelected) return 'ring-2 ring-red-500 bg-red-50';
        } else if (isSelected) {
            return 'ring-2 ring-primary-500 bg-primary-50'; // Use your primary color
        }
        return 'border border-gray-200 hover:bg-gray-50';
    };

    return (
        <button // Changed div to button for better accessibility
            type="button" // Explicitly set type
            onClick={onClick}
            disabled={disabled || showResult} // Disable button when showing result or explicitly disabled
            className={`relative p-4 rounded-xl transition-all duration-300 flex-1 max-w-[300px] text-left ${ // Added text-left
                getBorderStyle()
            } ${disabled || showResult ? 'cursor-not-allowed' : 'transform hover:-translate-y-1 hover:shadow-lg cursor-pointer'}`}
        >
            <img
                src={option.imageUrl || '/placeholder-image.png'} // Provide a fallback image path
                alt={option.text || `Seçenek ${option.id}`} // Improved alt text
                className="w-full h-[160px] object-contain rounded-lg mb-2"
                loading="lazy" // Add lazy loading for images
            />
            {option.text && ( // Conditionally render text if available
                 <p className="text-center text-sm font-medium text-gray-700 mt-2">{option.text}</p>
            )}
            {showResult && (
                <div className="absolute top-2 right-2 z-10"> {/* Ensure indicator is above image */}
                    {isCorrect ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Doğru
                        </span>
                    ) : isSelected && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ✕ Yanlış
                        </span>
                    )}
                </div>
            )}
        </button>
    );
};

// ----- EnlargedImageModal Component -----
interface EnlargedImageModalProps {
    imageUrl: string;
    altText?: string; // Add alt text prop
    onClose: () => void;
}

const EnlargedImageModal = ({ imageUrl, altText = "Büyütülmüş Görüntü", onClose }: EnlargedImageModalProps) => {
    // Close modal on Escape key press
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" // Changed background to semi-transparent black
            onClick={onClose} // Close on overlay click
            aria-modal="true" // Accessibility
            role="dialog"
        >
            <div
                className="relative w-auto h-auto max-w-[90vw] max-h-[90vh] bg-white p-2 rounded-lg shadow-xl" // Contained image within a padded box
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the content area
            >
                <img
                    src={imageUrl}
                    alt={altText}
                    className="block max-w-full max-h-[calc(90vh-2rem)] object-contain" // Adjusted max-height calculation
                    // Removed the fixed scale transform - object-contain is usually sufficient
                />
                <button
                    type="button"
                    title="Kapat (Esc)" // Tooltip for accessibility
                    className="absolute -top-3 -right-3 p-2 bg-white rounded-full hover:bg-gray-200 text-gray-600 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" // Improved styling and positioning
                    onClick={onClose}
                    aria-label="Kapat" // Accessibility
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// ----- QuizCard Component -----
interface QuizCardProps {
    question: QuizQuestion;
    questionNumber: number; // Add question number for context
    totalQuestions: number; // Add total questions for context
    onAnswer: (isCorrect: boolean, timeLeft: number, selectedOptionId: string | null) => void; // Allow null for timeout
}

export const QuizCard = ({ question, questionNumber, totalQuestions, onAnswer }: QuizCardProps) => {
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [timeLeft, setTimeLeft] = useState(INITIAL_TIME_SECONDS);
    const [showEnlargedImage, setShowEnlargedImage] = useState(false);
    const { playSound } = useSound();

    // Use useRef for the timer interval ID to ensure it's correctly cleared
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    // Use ref to prevent state update on unmounted component after timeout/submit delay
    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);


    // Effect for the timer
    useEffect(() => {
        // Clear any existing timer when question changes or component mounts
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        // Don't start timer if result is already shown (e.g., navigating back)
        if (showResult) return;

        // Reset time for the new question
        setTimeLeft(INITIAL_TIME_SECONDS);
        setSelectedOptionId(null); // Ensure selection is reset
        setShowResult(false); // Ensure results are hidden

        // Start the timer
        timerRef.current = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 1) { // Check for <= 1 to handle the last second correctly
                    if (timerRef.current) clearInterval(timerRef.current);
                    handleTimeOut();
                    return 0;
                }

                const newTime = prevTime - 1;
                // Play sounds based on the *new* time remaining
                if (newTime <= TICK_SOUND_THRESHOLD) playSound('tick');
                if (newTime === TIME_WARNING_THRESHOLD) playSound('timeWarning');

                return newTime;
            });
        }, 1000);

        // Cleanup function: clear interval when component unmounts or dependencies change
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
        // Rerun effect only when the question changes
    }, [question, playSound]); // Removed showResult from dependencies, timer controlled by clearing/starting

    const handleTimeOut = () => {
        if (!isMounted.current || showResult) return; // Prevent multiple triggers or updates on unmounted component

        setShowResult(true); // Show result immediately for timeout feedback
        playSound('incorrect'); // Play incorrect sound for timeout

        // Use timeout to delay calling onAnswer and allow user to see they ran out of time
        setTimeout(() => {
            if (isMounted.current) {
                onAnswer(false, 0, null); // Pass false, 0 time, and null for selectedOptionId
                // Resetting is now handled by the useEffect when the question prop changes
            }
        }, RESULT_DISPLAY_DELAY_MS); // Use the defined delay
    };

    const handleOptionClick = (optionId: string) => {
        if (!showResult) {
            setSelectedOptionId(optionId);
            // Optional: Play a selection sound
             playSound('select'); // Assuming you have a 'select' sound
        }
    };

    const handleSubmit = () => {
        if (showResult || !selectedOptionId) return; // Exit if already showing result or no option selected

        // Clear the timer immediately on submission
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        setShowResult(true);
        const isCorrect = selectedOptionId === question.correctOptionId;
        playSound(isCorrect ? 'correct' : 'incorrect');

        // Delay calling onAnswer to allow the user to see the result feedback
        setTimeout(() => {
            if (isMounted.current) {
                onAnswer(isCorrect, timeLeft, selectedOptionId);
                // Resetting is handled by the useEffect when the question prop changes
            }
        }, RESULT_DISPLAY_DELAY_MS); // Use the defined delay
    };

    const handleEnlargeImage = () => {
        setShowEnlargedImage(true);
    };

    const handleCloseModal = () => {
        setShowEnlargedImage(false);
    };


    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-4xl mx-auto"> {/* Enhanced styling */}
            {/* Header with Question Number and Timer */}
            <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                    Soru {questionNumber} / {totalQuestions}
                </h2>
                <Timer timeLeft={timeLeft} initialTime={INITIAL_TIME_SECONDS} />
            </div>

            {/* Question Image Area */}
            <div className="mb-6 md:mb-8">
                <div className="relative group aspect-w-16 aspect-h-9"> {/* Maintain aspect ratio */}
                    <img
                        src={question.questionImageUrl || '/placeholder-image.png'} // Fallback image
                        alt={`Soru ${questionNumber}`}
                        className="w-full h-full object-contain rounded-lg shadow-md cursor-zoom-in"
                        onClick={handleEnlargeImage}
                        loading="lazy"
                    />
                    <button
                        type="button"
                        title="Görseli Büyüt"
                        className="absolute top-2 right-2 p-2 bg-white bg-opacity-75 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        onClick={handleEnlargeImage}
                        aria-label="Görseli Büyüt"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Enlarged Image Modal */}
            {showEnlargedImage && (
                <EnlargedImageModal
                    imageUrl={question.questionImageUrl || '/placeholder-image.png'}
                    altText={`Soru ${questionNumber} - Büyütülmüş Görsel`}
                    onClose={handleCloseModal}
                />
            )}

            {/* Options Grid */}
            {/* Responsive grid: 1 column on small screens, 2 on medium and up */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 justify-items-center px-2 md:px-4">
                {question.options.map((option) => (
                    <Option
                        key={option.id} // React key for list items
                        option={{
                            id: option.id,
                            imageUrl: option.imageUrl || '/placeholder-image.png', // Fallback
                            text: option.text
                        }}
                        isSelected={selectedOptionId === option.id}
                        isCorrect={option.id === question.correctOptionId}
                        showResult={showResult}
                        disabled={showResult} // Disable options when result is shown
                        onClick={() => handleOptionClick(option.id)}
                    />
                ))}
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-center">
                <button
                    type="button" // Explicitly set type
                    onClick={handleSubmit}
                    disabled={!selectedOptionId || showResult} // Disable if no selection or result is shown
                    className={`px-8 py-3 rounded-full text-white font-semibold text-lg transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                        !selectedOptionId || showResult
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-primary-500 hover:bg-primary-600 hover:shadow-lg hover:scale-105 active:scale-100' // Added primary colors (replace with your theme)
                    }`}
                >
                    {showResult ? (isMounted.current ? 'Sonraki Soru' : 'Yükleniyor...') : 'Cevabı Onayla'} {/* Change text based on state */}
                </button>
            </div>
        </div>
    );
};

// Helper Types (Make sure these align with your actual types)
// Example: ../types/quiz.ts
/*
export interface QuizQuestion {
    id: string;
    questionImageUrl: string;
    options: Array<{
        id: string;
        imageUrl: string;
        text?: string;
    }>;
    correctOptionId: string;
}
*/

// Example: ../hooks/useSound.ts
/*
import { useCallback } from 'react';

export const useSound = () => {
    // Basic implementation - replace with your actual sound logic (e.g., using Howler.js)
    const playSound = useCallback((soundName: 'correct' | 'incorrect' | 'tick' | 'timeWarning' | 'select') => {
        console.log(`Playing sound: ${soundName}`);
        // Add actual sound playing code here
        // const sound = new Audio(`/sounds/${soundName}.mp3`);
        // sound.play().catch(e => console.error("Error playing sound", e));
    }, []);

    return { playSound };
};
*/