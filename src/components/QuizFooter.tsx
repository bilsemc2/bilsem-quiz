interface QuizFooterProps {
    isAnswered: boolean;
    isLastQuestion: boolean;
    onComplete: () => void;
}

export default function QuizFooter({ isAnswered, isLastQuestion, onComplete }: QuizFooterProps) {
    return (
        <div className="mt-4 sm:mt-8 flex justify-end space-x-4">
            {isAnswered && isLastQuestion && (
                <button
                    onClick={onComplete}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg font-semibold
                             hover:bg-green-700 transition-all duration-200
                             transform hover:scale-105 shadow-md hover:shadow-lg
                             flex items-center justify-center space-x-2"
                >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Testi Bitir</span>
                </button>
            )}
        </div>
    );
}