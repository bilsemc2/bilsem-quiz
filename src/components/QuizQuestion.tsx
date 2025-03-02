import React from 'react';
import { Question } from '../types/quiz';

interface QuizQuestionProps {
  question: Question;
  questionNumber: number;
  // totalQuestions artık kullanılmıyor
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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Soru başlığını kaldırdık */}
      
      <div className="flex justify-center">
        <div className="relative max-w-lg">
          {question.questionImageUrl && (
            <img
              src={question.questionImageUrl}
              alt={`Soru ${questionNumber}`}
              className="w-full max-h-[400px] object-contain rounded-lg"
            />
          )}
          {/* Soru numarası etiketini kaldırdık */}
        </div>
      </div>
    </div>
  );
};

export default QuizQuestion;