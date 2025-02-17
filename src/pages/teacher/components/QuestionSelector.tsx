import React from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Question {
  id: string;
  image_url: string;
  correct_option_id: string;
  created_at: string;
}

interface QuestionSelectorProps {
  selectedQuestions: string[];
  onQuestionsSelected: (questions: string[]) => void;
  availableQuestionCount: number;
}

const QuestionSelector: React.FC<QuestionSelectorProps> = ({
  selectedQuestions,
  onQuestionsSelected,
  availableQuestionCount,
}) => {
  const { user } = useAuth();
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchQuestions = async () => {
    if (!user) return;

    try {
      // Önce soru numaralarını al
      const { data, error } = await supabase
        .from('questions')
        .select('id, image_url, correct_option_id, created_at')
        .eq('created_by', user.id)
        .order('image_url', { ascending: true })
        .limit(availableQuestionCount);

      // Soruları numaralarına göre sırala
      const sortedData = data?.sort((a, b) => {
        const aNumber = parseInt(a.image_url?.match(/\d+/)?.[0] || '0');
        const bNumber = parseInt(b.image_url?.match(/\d+/)?.[0] || '0');
        return aNumber - bNumber;
      });

      if (error) throw error;
      setQuestions(sortedData || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Sorular yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchQuestions();
  }, [user]);

  const handleQuestionToggle = (questionId: string) => {
    const newSelected = selectedQuestions.includes(questionId)
      ? selectedQuestions.filter(id => id !== questionId)
      : [...selectedQuestions, questionId];
    onQuestionsSelected(newSelected);
  };

  if (loading) {
    return <div className="text-center py-4">Sorular yükleniyor...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        Henüz hiç soru eklenmemiş
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto p-2">
      {questions.map((question) => (
        <div
          key={question.id}
          className={`border rounded-lg p-2 cursor-pointer transition-colors ${
            selectedQuestions.includes(question.id)
              ? 'bg-blue-50 border-blue-300'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => handleQuestionToggle(question.id)}
        >
          <div className="h-24 bg-gray-100 rounded-md mb-2 overflow-hidden">
            {question.image_url && (
              <img
                src={question.image_url}
                alt="Soru görseli"
                className="w-full h-full object-contain"
              />
            )}
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium">
              {question.image_url
                ? `Soru #${question.image_url.match(/\d+/)?.[0] || '?'}`
                : 'Soru #?'}
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedQuestions.includes(question.id)}
                onChange={() => handleQuestionToggle(question.id)}
                className="w-4 h-4 text-blue-600"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuestionSelector;