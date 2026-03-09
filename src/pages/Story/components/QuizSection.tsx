import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, Star } from 'lucide-react';

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
  const [completed, setCompleted] = useState(false);

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
      setCompleted(true);
      if (onComplete) {
        onComplete(score);
      }
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setCompleted(false);
  };

  // Sonuç ekranı
  if (completed) {
    const percentage = Math.round((score / questions.length) * 100);
    const emoji = percentage >= 80 ? '🏆' : percentage >= 60 ? '⭐' : percentage >= 40 ? '👍' : '💪';
    const message = percentage >= 80 ? 'Harika! Mükemmel bir performans!'
      : percentage >= 60 ? 'Çok iyi! Güzel bir sonuç!'
        : percentage >= 40 ? 'İyi gidiyorsun! Biraz daha çalışarak daha iyisini yapabilirsin.'
          : 'Devam et! Her denemede daha iyi olacaksın.';

    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-lg text-center p-8">
          <div className="text-6xl mb-4">{emoji}</div>
          <h2 className="text-2xl font-black font-nunito text-slate-800 dark:text-white mb-2">
            Quiz Tamamlandı!
          </h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-amber-500" />
            <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
              {score}/{questions.length}
            </span>
            <Star className="w-6 h-6 text-amber-500" />
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-blue-500' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-400'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-6">
            {message}
          </p>

          <div className="space-y-3">
            <button
              onClick={handleRestart}
              className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-2xl font-black font-nunito transition-all hover:shadow-lg text-sm uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Tekrar Dene
            </button>
            {onBackToStory && (
              <button
                onClick={onBackToStory}
                className="w-full py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-600 text-sm flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" /> Hikayeye Dön
              </button>
            )}
            <Link
              to="/stories"
              className="w-full py-3.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl font-bold transition-all hover:bg-purple-100 dark:hover:bg-purple-900/30 text-sm flex items-center justify-center gap-2 border-2 border-purple-200 dark:border-purple-800"
            >
              📚 Hikayelere Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + (showFeedback ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-slate-200 dark:border-slate-700 shadow-md">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
            Soru {currentQuestion + 1}/{questions.length}
          </span>
          <span className="text-sm font-black text-purple-600 dark:text-purple-400">
            ⭐ {score} puan
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-500">
          <h2 className="text-lg sm:text-xl font-black font-nunito text-white">{question.text}</h2>
        </div>

        <div className="p-5 space-y-3">
          {question.options.map((option: string, index: number) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={showFeedback}
              className={`w-full p-4 rounded-2xl text-left transition-all duration-200 border-2 flex items-center gap-3 ${showFeedback
                ? index === question.correctAnswer
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200'
                  : index === selectedAnswer
                    ? 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-800 dark:text-red-200'
                    : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400'
                : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600 text-slate-700 dark:text-slate-300'
                }`}
            >
              <span className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-sm font-black flex-shrink-0">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="font-medium text-sm sm:text-base flex-1">{option}</span>
              {showFeedback && index === question.correctAnswer && (
                <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 w-5 h-5 flex-shrink-0" />
              )}
              {showFeedback && index === selectedAnswer && index !== question.correctAnswer && (
                <XCircle className="text-red-600 dark:text-red-400 w-5 h-5 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className={`mx-5 mb-5 p-4 rounded-2xl flex items-start gap-3 ${selectedAnswer === question.correctAnswer
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'
            }`}>
            {selectedAnswer === question.correctAnswer ? (
              <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="text-red-600 dark:text-red-400 w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {selectedAnswer === question.correctAnswer
                ? question.feedback.correct
                : question.feedback.incorrect}
            </p>
          </div>
        )}

        {/* Next Button */}
        {showFeedback && (
          <div className="px-5 pb-5">
            <button
              onClick={nextQuestion}
              className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-2xl font-black font-nunito transition-all hover:shadow-lg text-sm uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {currentQuestion < questions.length - 1 ? (
                <>Sonraki Soru <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Sonuçları Gör ⭐</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}