interface QuizFooterProps {
    isLastQuestion: boolean;
    isAnswered: boolean;
    onFinishQuiz: () => void;
}

export default function QuizFooter({ 
    isLastQuestion, 
    isAnswered,
    onFinishQuiz
}: QuizFooterProps) {
    // Dokunmatik geri bildirim fonksiyonu
    const handleTouchFeedback = () => {
        if (navigator.vibrate) {
            navigator.vibrate(50); // 50ms titreşim
        }
    };

    return (
        <div className="flex justify-center mt-6">
            {/* Bitir Düğmesi - Son soruysa ve cevaplandıysa göster */}
            {isLastQuestion && isAnswered && (
                <button
                    onClick={() => {
                        handleTouchFeedback();
                        onFinishQuiz();
                    }}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center"
                    aria-label="Testi bitir"
                >
                    <span>Testi Bitir</span>
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </button>
            )}
        </div>
    );
}