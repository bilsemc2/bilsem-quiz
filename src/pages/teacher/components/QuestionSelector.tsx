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
  availableQuestionCount?: number;
}

const QuestionSelector: React.FC<QuestionSelectorProps> = ({
  selectedQuestions,
  onQuestionsSelected,
  availableQuestionCount = 1000,
}) => {
  const { user } = useAuth();
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalQuestions, setTotalQuestions] = React.useState(0);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [totalPages, setTotalPages] = React.useState(1);
  
  const pageSize = availableQuestionCount > 100 ? 100 : availableQuestionCount;

  const fetchQuestionCount = async (searchTerm: string = '') => {
    try {
      if (!user) return 0;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_admin, role')
        .eq('id', user.id)
        .single();
      
      const isAdmin = profileData?.is_admin;
      const isTeacher = profileData?.role === 'teacher';
      
      let query = supabase
        .from('questions')
        .select('id', { count: 'exact' });
      
      if (isTeacher && !isAdmin) {
        query = query.eq('is_active', true);
      } else if (!isAdmin) {
        query = query.eq('created_by', user.id);
      }

      if (searchTerm) {
        query = query.ilike('image_url', `%${searchTerm}%`);
      }
      
      const { count, error } = await query;
      
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Error fetching question count:', error);
      return 0;
    }
  };

  const fetchQuestions = async (page: number = 1, searchTerm: string = '') => {
    try {
      setLoading(true);

      if (!user) {
        setLoading(false);
        return;
      }

      const count = await fetchQuestionCount(searchTerm);
      setTotalQuestions(count);
      
      const calculatedTotalPages = Math.ceil(count / pageSize);
      setTotalPages(calculatedTotalPages);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_admin, role')
        .eq('id', user.id)
        .single();
      
      const isAdmin = profileData?.is_admin;
      const isTeacher = profileData?.role === 'teacher';
      
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      
      let query = supabase
        .from('questions')
        .select('*')
        .order('question_number', { ascending: true })
        .range(start, end);
      
      if (isTeacher && !isAdmin) {
        query = query.eq('is_active', true);
      } else if (!isAdmin) {
        query = query.eq('created_by', user.id);
      }

      if (searchTerm) {
        query = query.ilike('image_url', `%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      
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
    if (user) {
      fetchQuestions(currentPage, searchTerm);
    }
  }, [user, currentPage, searchTerm]);

  const handleQuestionToggle = (questionId: string) => {
    const newSelected = selectedQuestions.includes(questionId)
      ? selectedQuestions.filter(id => id !== questionId)
      : [...selectedQuestions, questionId];
    onQuestionsSelected(newSelected);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); 
    fetchQuestions(1, searchTerm);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading && questions.length === 0) {
    return <div className="text-center py-4">Sorular yükleniyor...</div>;
  }

  if (questions.length === 0 && !loading) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p className="font-medium">Henüz hiç soru bulunamadı</p>
        <p className="text-sm mt-1">
          {loading ? 'Sorular yükleniyor...' : 'Ödev için kullanılabilecek soru bulunamadı. Lütfen önce soru ekleyin veya sistem yöneticisiyle iletişime geçin.'}
        </p>
      </div>
    );
  }

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5; 
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    pages.push(
      <button
        key="prev"
        className={`px-3 py-1 rounded-md mx-1 ${
          currentPage === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &laquo;
      </button>
    );
    
    if (startPage > 1) {
      pages.push(
        <button
          key="first"
          className="px-3 py-1 rounded-md mx-1 bg-gray-200 hover:bg-gray-300 text-gray-700"
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="px-3 py-1">
            ...
          </span>
        );
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`px-3 py-1 rounded-md mx-1 ${
            currentPage === i
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="px-3 py-1">
            ...
          </span>
        );
      }
      
      pages.push(
        <button
          key="last"
          className="px-3 py-1 rounded-md mx-1 bg-gray-200 hover:bg-gray-300 text-gray-700"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }
    
    pages.push(
      <button
        key="next"
        className={`px-3 py-1 rounded-md mx-1 ${
          currentPage === totalPages
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        &raquo;
      </button>
    );
    
    return (
      <div className="flex justify-center my-4">
        <div className="flex flex-wrap">{pages}</div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Soru ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-md px-3 py-2 flex-grow"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Ara
        </button>
      </form>
      
      <div className="text-sm text-gray-600 mb-2">
        Toplam {totalQuestions} soru bulundu ({selectedQuestions.length} seçili)
      </div>

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
      
      {totalPages > 1 && renderPagination()}
      
      {loading && questions.length > 0 && (
        <div className="py-2 text-center text-gray-600">
          <div className="inline-block w-4 h-4 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin mr-2"></div>
          Veriler yükleniyor...
        </div>
      )}
    </div>
  );
};

export default QuestionSelector;