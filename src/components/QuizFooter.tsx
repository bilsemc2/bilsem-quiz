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
    return (
        <div className="flex justify-center mt-6">
            {isLastQuestion && isAnswered && (
                <button
                    onClick={onFinishQuiz}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                    Testi Bitir
                </button>
            )}
        </div>
    );
}