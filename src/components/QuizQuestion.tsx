import React from 'react';

interface QuizQuestionProps {
    question: {
        questionImageUrl: string;
    };
    isAnswered: boolean;
    isTimeout: boolean;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
    question,
    isAnswered,
    isTimeout
}) => {
    return (
        <div className="w-full bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-8">
            <div className="mb-4 sm:mb-8">
                <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
                    {question.questionImageUrl && (
                        <div className="flex justify-center">
                            <img
                                src={question.questionImageUrl}
                                alt="Soru"
                                className="max-h-[200px] sm:max-h-[300px] w-full object-contain rounded-lg transition-transform duration-300 hover:scale-105"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizQuestion;
