import React from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Question {
  id: string;
  image_url: string;
  correct_option_id: string;
  created_at: string;
  question_number: number;
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

  const fetchQuestions = async (searchTerm: string = '', tag: string = '') => {
    try {
      setLoading(true);

      // Kullanıcı kontrolü
      if (!user) {
        setLoading(false);
        return;
      }

      // Profil bilgisini al - admin mi kontrol et
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_admin, role')
        .eq('id', user.id)
        .single();
      
      const isAdmin = profileData?.is_admin;
      const isTeacher = profileData?.role === 'teacher';
      
      // Supabase sorgusu hazırla
      let query = supabase
        .from('questions')
        .select('*')
        .order('question_number', { ascending: true }); // Veritabanındaki question_number alanına göre sırala
      
      // Sadece admin tüm soruları görebilir, öğretmenler sadece is_active=true veya kendi soruları olanları görür
      if (isTeacher && !isAdmin) {
        query = query.eq('is_active', true);
      } else if (!isAdmin) {
        // Admin veya öğretmen değilse sadece kendi sorularını görsün
        query = query.eq('created_by', user.id);
      }

      // Arama filtresi
      if (searchTerm) {
        query = query.ilike('image_url', `%${searchTerm}%`);
      }

      // Etiket filtresi
      if (tag) {
        query = query.eq('tag', tag);
      }
      
      const { data, error } = await query.range(0, availableQuestionCount - 1);
      
      if (error) throw error;
      
      setQuestions(data || []);
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
        <p className="font-medium">Henüz hiç soru bulunamadı</p>
        <p className="text-sm mt-1">
          {loading ? 'Sorular yükleniyor...' : 'Ödev için kullanılabilecek soru bulunamadı. Lütfen önce soru ekleyin veya sistem yöneticisiyle iletişime geçin.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[500px] overflow-y-auto p-2">
      {questions.map((question) => (
        <div
          key={question.id}
          className={`border rounded-lg p-1 cursor-pointer transition-colors ${
            selectedQuestions.includes(question.id)
              ? 'bg-blue-50 border-blue-300'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => handleQuestionToggle(question.id)}
        >
          <div className="h-16 bg-gray-100 rounded-md mb-1 overflow-hidden">
            {question.image_url && (
              <img
                src={question.image_url}
                alt="Soru görseli"
                className="w-full h-full object-contain"
              />
            )}
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs font-medium">
              {question.question_number 
                ? `Soru #${question.question_number}` 
                : 'Soru #?'}
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedQuestions.includes(question.id)}
                onChange={() => handleQuestionToggle(question.id)}
                className="w-3 h-3 text-blue-600"
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