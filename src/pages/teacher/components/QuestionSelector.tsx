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
  
  // VIP veya admin kullanıcılar için soru görüntüleme sınırı yok
  const [isVip, setIsVip] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [teacherQuestionLimit, setTeacherQuestionLimit] = React.useState(100); // Varsayılan değer olarak 100
  
  // Tüm kullanıcılar için sayfa başına makul sayıda soru gösteriyoruz
  // Limit sadece seçebilecekleri soru sayısı için geçerli
  const pageSize = 50; // Sabit bir değer kullanıyoruz, performans için

  const fetchQuestionCount = async (searchTerm: string = '') => {
    try {
      if (!user) return 0;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_admin, role, is_vip')
        .eq('id', user.id)
        .single();
      
      const isAdmin = profileData?.is_admin;
      const isTeacher = profileData?.role === 'teacher';
      const isVip = profileData?.is_vip;
      
      let query = supabase
        .from('questions')
        .select('id', { count: 'exact' });
      
      if (isTeacher && !isAdmin && !isVip) {
        query = query.eq('is_active', true);
      } else if (!isAdmin && !isVip) {
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

      // Profil bilgisini önce çekelim
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_admin, role, is_vip')
        .eq('id', user.id)
        .single();
      
      const isAdmin = profileData?.is_admin;
      const isTeacher = profileData?.role === 'teacher';
      const isVip = profileData?.is_vip;
      
      // State'i güncelle
      setIsAdmin(isAdmin || false);
      setIsVip(isVip || false);
      
      // Öğretmen için görüntüleyebileceği soru limitini hesapla
      if (isTeacher && !isAdmin && !isVip) {
        try {
          const { data: limitData, error: limitError } = await supabase
            .rpc('calculate_teacher_question_limit', { 
              teacher_id: user.id 
            });
          
          if (limitError) throw limitError;
          
          setTeacherQuestionLimit(limitData || 100);
          console.log('Hesaplanan soru görüntüleme limiti:', limitData);
        } catch (limitError) {
          console.error('Soru limiti hesaplanırken hata oluştu:', limitError);
          // Hata durumunda varsayılan 100 limitini kullan
          setTeacherQuestionLimit(100);
        }
      }
      
      // Soru sayısını hesapla - tüm aktif soruları sayalım
      const count = await fetchQuestionCount(searchTerm);
      setTotalQuestions(count);
      
      const calculatedTotalPages = Math.ceil(count / pageSize);
      setTotalPages(calculatedTotalPages);
      
      // Sayfalama için başlangıç ve bitiş indeksleri
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      
      // ÖNEMLİ: Tüm sorular görüntülenebilir, ancak seçim sınırı farklı uygulanır
      // 1. Admin veya VIP kullanıcılar: Tüm sorulara erişebilir ve sınırsız seçebilir
      // 2. Öğretmenler: Tüm aktif soruları görebilir ama sadece 10 soru seçebilir (availableQuestionCount)
      // 3. Diğer kullanıcılar: Sadece kendi sorularını görebilir
      let query = supabase
        .from('questions')
        .select('*')
        .order('question_number', { ascending: true });
      
      // Normal öğretmenler için filtreleme - sadece aktif soruları göster
      if (isTeacher && !isAdmin && !isVip) {
        query = query.eq('is_active', true);
      } 
      // Admin/VIP olmayan diğer kullanıcılar - sadece kendi sorularını göster
      else if (!isAdmin && !isVip) {
        query = query.eq('created_by', user.id);
      }
      // Admin ve VIP kullanıcılar - tüm soruları göster
      
      // Sayfalama uygula
      query = query.range(start, end);

      // Arama filtresi uygula
      if (searchTerm) {
        query = query.ilike('image_url', `%${searchTerm}%`);
      }
      
      // Sorguyu çalıştır
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

  // Her öğretmen için görüntüleyebileceği maksimum soru sayısını hesapla
  // Backend'den gelen calculate_teacher_question_limit fonksiyonu kullanılıyor
  // Bu fonksiyon temel 100 + (öğrenci sayısı * 50) şeklinde hesaplıyor
  const maxViewableQuestions = isAdmin || isVip ? totalQuestions : teacherQuestionLimit;
  
  // Geçerli sayfadaki soruların seçilebilir olup olmadığını kontrol et
  const isCurrentPageSelectable = () => {
    // Admin veya VIP kullanıcılar her sayfadan seçim yapabilir
    if (isAdmin || isVip) return true;
    
    // Diğer kullanıcılar için sınır kontrolü
    // Sayfa boyutu 50 ise ve maksimum 150 soru görüntülenebiliyorsa, ilk 3 sayfa (1, 2, 3) seçilebilir
    const maxSelectablePage = Math.ceil(maxViewableQuestions / pageSize);
    return currentPage <= maxSelectablePage;
  };
  
  const handleQuestionToggle = (questionId: string) => {
    // Eğer soru zaten seçiliyse, seçimi kaldırmaya her zaman izin ver
    if (selectedQuestions.includes(questionId)) {
      const newSelected = selectedQuestions.filter(id => id !== questionId);
      onQuestionsSelected(newSelected);
      return;
    }
    
    // Görüntüleme sınırı kontrolü
    if (!isCurrentPageSelectable() && !isAdmin && !isVip) {
      toast.error(`Sadece ilk ${Math.ceil(maxViewableQuestions / pageSize)} sayfadaki soruları seçebilirsiniz!`);
      return;
    }
    
    // Seçim sınırı kontrolü
    if (selectedQuestions.length < availableQuestionCount) {
      const newSelected = [...selectedQuestions, questionId];
      onQuestionsSelected(newSelected);
    } else {
      toast.error(`En fazla ${availableQuestionCount} soru seçebilirsiniz!`);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); 
    fetchQuestions(1, searchTerm);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    
    // Sayfa değiştiğinde, eğer sınırı geçen bir sayfaya geçildiyse kullanıcıyı bilgilendir
    if (page > Math.ceil(maxViewableQuestions / pageSize) && !isAdmin && !isVip) {
      toast(`Bu sayfadaki soruları görüntüleyebilirsiniz, ancak seçemezsiniz. Görüntüleyebildiğiniz ${maxViewableQuestions} sorunun dışına çıktınız.`);
    }
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
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Soru ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-md px-3 py-2 flex-grow"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <button
          type="button"
          onClick={handleSearch}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Ara
        </button>
      </div>
      
      <div className="text-sm text-gray-600 mb-2">
        Toplam {totalQuestions} soru bulundu
        {(isAdmin || isVip) ? (
          <span className="text-blue-600 font-medium">({selectedQuestions.length} seçili, sınırsız erişim)</span>
        ) : (
          <span>({selectedQuestions.length}/{availableQuestionCount} seçili)</span>
        )}
        
        {/* Görüntüleme ve seçim sınırlamaları için notlar */}
        {!isAdmin && !isVip && (
          <div className="text-xs text-gray-500 mt-1">
            Not: Tüm aktif soruları görüntüleyebilirsiniz, ancak sadece ilk {Math.ceil(maxViewableQuestions / pageSize)} sayfadaki soruları ({maxViewableQuestions} soru) seçebilirsiniz.
            <br />
            <span className="font-medium text-blue-600">Seçim sınırı: {availableQuestionCount} soru/ödev</span>
            <br />
            <span className="text-orange-500">
              {currentPage > Math.ceil(maxViewableQuestions / pageSize) && 
                `Şu an ${currentPage}. sayfadasınız ve bu sayfadaki soruları seçemezsiniz.`
              }
            </span>
          </div>
        )}
        
        {selectedQuestions.length > 0 && availableQuestionCount > 0 && !(isAdmin || isVip) && (
          <div className="h-1 bg-gray-200 rounded-full w-full mt-1">
            <div 
              className={`h-1 rounded-full ${selectedQuestions.length >= availableQuestionCount ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min((selectedQuestions.length / availableQuestionCount) * 100, 100)}%` }}
            ></div>
          </div>
        )}
        
        {(isAdmin || isVip) && selectedQuestions.length > 0 && (
          <div className="h-1 bg-gray-200 rounded-full w-full mt-1">
            <div 
              className="h-1 rounded-full bg-blue-500"
              style={{ width: '100%' }}
            ></div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[500px] overflow-y-auto p-2">
        {questions.map((question) => {
          // Geçerli sorunun seçilebilir olup olmadığını kontrol et
          const isQuestionSelectable = isAdmin || isVip || isCurrentPageSelectable();
          
          return (
          <div
            key={question.id}
            className={`border rounded-lg p-1 ${isQuestionSelectable ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} transition-colors ${
              selectedQuestions.includes(question.id)
                ? 'bg-blue-50 border-blue-300'
                : isQuestionSelectable ? 'hover:bg-gray-50' : 'bg-gray-100'
            }`}
            onClick={() => isQuestionSelectable && handleQuestionToggle(question.id)}
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
                  onChange={() => isAdmin || isVip || isCurrentPageSelectable() ? handleQuestionToggle(question.id) : null}
                  disabled={!(isAdmin || isVip || isCurrentPageSelectable())}
                  className={`w-3 h-3 ${isAdmin || isVip || isCurrentPageSelectable() ? 'text-blue-600' : 'text-gray-400'}`}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
        )})}
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