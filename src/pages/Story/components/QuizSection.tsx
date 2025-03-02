import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  feedback: {
    correct: string;
    incorrect: string;
  }
}

export interface QuizSectionProps {
  questions: Question[];
  onComplete?: (score: number) => void;
  onBackToStory?: () => void;
}

export function QuizSection({ questions, onComplete, onBackToStory }: QuizSectionProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowFeedback(true);
    
    if (answerIndex === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      if (onComplete) {
        onComplete(score);
      }
      // onBackToStory için bir buton gösterilecek - buton nextQuestion sonrasında gösterilecek
    }
  };

  const question = questions[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <span className="text-lg font-medium">Soru {currentQuestion + 1}/{questions.length}</span>
        <span className="text-lg font-medium">Puan: {score}</span>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-6">{question.text}</h2>

        <div className="space-y-4">
          {question.options.map((option: string, index: number) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={showFeedback}
              className={`w-full p-4 rounded-lg text-left transition-colors ${
                showFeedback
                  ? index === question.correctAnswer
                    ? 'bg-green-100 border-green-500'
                    : index === selectedAnswer
                    ? 'bg-red-100 border-red-500'
                    : 'bg-gray-100'
                  : 'bg-gray-100 hover:bg-gray-200'
              } border-2`}
            >
              {option}
            </button>
          ))}
        </div>

        {showFeedback && (
          <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${
            selectedAnswer === question.correctAnswer ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {selectedAnswer === question.correctAnswer ? (
              <CheckCircle2 className="text-green-600" />
            ) : (
              <XCircle className="text-red-600" />
            )}
            <p className="text-lg">
              {selectedAnswer === question.correctAnswer
                ? question.feedback.correct
                : question.feedback.incorrect}
            </p>
          </div>
        )}

        {showFeedback && (
          <button
            onClick={nextQuestion}
            className="mt-6 w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            {currentQuestion < questions.length - 1 ? 'Sonraki Soru' : 'Sonuçları Gör'}
          </button>
        )}
        
        {currentQuestion === questions.length - 1 && showFeedback && onBackToStory && (
          <button
            onClick={onBackToStory}
            className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Hikayeye Dön
          </button>
        )}
      </div>
    </div>
  );
}