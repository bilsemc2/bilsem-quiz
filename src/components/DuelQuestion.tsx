import React, { useState, useRef, useEffect } from 'react';
import { Question } from '../types/question';

interface DuelQuestionProps {
  question: Question;
  duelId: string;
  isChallenger: boolean;
  onSubmitAnswer: (duelId: string, answer: string, isChallenger: boolean) => Promise<void>;
  onClose: () => void;
}

const DuelQuestion: React.FC<DuelQuestionProps> = ({
  question,
  duelId,
  isChallenger,
  onSubmitAnswer,
  onClose
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Modal dışına tıklandığında kapatma
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSubmit = async () => {
    if (!selectedOption) return;
    
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onSubmitAnswer(duelId, selectedOption, isChallenger);
      setFeedback({
        type: 'success',
        message: 'Cevabınız başarıyla gönderildi!'
      });
      // Başarılı mesajını 1.5 saniye göster, sonra kapat
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error submitting answer:', error);
      setFeedback({
        type: 'error',
        message: 'Cevap gönderilirken bir hata oluştu. Lütfen tekrar deneyin.'
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div ref={modalRef} className="bg-white rounded-lg p-4 w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">{question.text}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Kapat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {question.questionImageUrl && (
          <div className="mb-3">
            <img
              src={question.questionImageUrl}
              alt="Soru"
              className="w-full h-auto max-h-[300px] object-contain rounded-lg"
            />
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-4">
          {question.options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`p-2 rounded-lg border transition-all ${
                selectedOption === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
              disabled={isSubmitting}
            >
              <div className="text-center">
                <div className="text-sm font-medium mb-1">{option.text}</div>
                {option.imageUrl && (
                  <img
                    src={option.imageUrl}
                    alt={option.text}
                    className="w-full h-auto max-h-[150px] object-contain rounded"
                  />
                )}
              </div>
            </button>
          ))}
        </div>

        {feedback && (
          <div className={`p-3 mb-4 rounded-lg ${
            feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {feedback.message}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-100 transition-colors"
            disabled={isSubmitting}
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedOption || isSubmitting}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              !selectedOption || isSubmitting
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isSubmitting ? 'Gönderiliyor...' : 'Cevabı Gönder'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuelQuestion;
