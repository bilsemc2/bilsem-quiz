import React from 'react';
import { Question } from '../types/quiz';

interface QuizQuestionProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

/**
 * Basit bir soru bileşeni:
 * - Sorunun resmini gösterir
 * - Metin varsa ekleyeceğiniz yeri genişletmek mümkün.
 */
const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  questionNumber,
  totalQuestions
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Soru {questionNumber} / {totalQuestions}
        </h2>
      </div>
      
      <div className="flex justify-center">
        <div className="relative max-w-lg">
          {question.questionImageUrl && (
            <img
              src={question.questionImageUrl}
              alt={`Soru ${questionNumber}`}
              className="w-full max-h-[400px] object-contain rounded-lg"
            />
          )}
          <div className="absolute bottom-2 right-2">
            <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
              Soru {questionNumber}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestion;