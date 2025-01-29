import React from 'react';
import { Question } from '../types/quiz';

interface QuizQuestionProps {
  question: Question;
  questionNumber: number;
}

/**
 * Basit bir soru bileşeni:
 * - Sorunun resmini gösterir
 * - Metin varsa ekleyeceğiniz yeri genişletmek mümkün.
 */
const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  questionNumber
}) => {
  return (
    <div className="mb-6">
      {question.questionImageUrl && (
        <img
          src={question.questionImageUrl}
          alt={`Soru ${questionNumber}`}
          className="w-full max-h-[400px] object-contain rounded-lg mb-4"
        />
      )}
    </div>
  );
};

export default QuizQuestion;