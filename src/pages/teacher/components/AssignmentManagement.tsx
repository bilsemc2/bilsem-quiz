import React, { useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import QuestionSelector from './QuestionSelector'; 
interface QuestionStats {
  total_questions: number;
  available_questions: number;
  question_limit?: number;
  student_count?: number;
}

interface Assignment {
  id: string;
  title: string;
  class: string;
  class_name: string;
  completion_count: number;
  total_students: number;
  created_at: string;
}

const AssignmentManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [classes, setClasses] = React.useState<{ id: string; name: string }[]>([]);
  const [newAssignment, setNewAssignment] = React.useState({
    title: '',
    class: '',
    questions: [] as string[],
    description: '',
    grade: '',
    subject: ''
  });
  const [showQuestionSelector, setShowQuestionSelector] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [questionStats, setQuestionStats] = React.useState<QuestionStats | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isTeacher, setIsTeacher] = React.useState(false);
  const [isVip, setIsVip] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'list' | 'create' | 'stats'>('list');
  
  // Sayfalama için state'ler
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalAssignments, setTotalAssignments] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const pageSize = 10; // Sabit sayfa boyutu
  const [searchTerm, setSearchTerm] = React.useState('');

  const fetchUserProfile = async () => {
    if (!user) return;
  
    // is_admin, role ve is_vip bilgilerini çekiyoruz
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin, role, is_vip')
      .eq('id', user.id)
      .single();
  
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
  
    // is_admin, isTeacher ve isVip durumlarını ayrı değişkenlerde tut
    setIsAdmin(profile?.is_admin === true);
    setIsTeacher(profile?.role === 'teacher');
    setIsVip(profile?.is_vip === true);
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchQuestionStats = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .rpc('get_teacher_question_stats', { teacher_id: user.id });

    if (error) {
      toast.error('Soru istatistikleri alınırken bir hata oluştu');
      return;
    }

    setQuestionStats(data);
  };

  const fetchAssignments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Toplam ödev sayısını al
      const { count, error: countError } = await supabase
        .from('assignments')
        .select('id', { count: 'exact' })
        .eq('created_by', user.id)
        .ilike('title', `%${searchTerm}%`);
      
      if (countError) throw countError;
      
      setTotalAssignments(count || 0);
      setTotalPages(Math.ceil((count || 0) / pageSize));
      
      // Sayfa için başlangıç ve bitiş indekslerini hesapla
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize - 1;

      // Ödevleri ve ilişkili bilgileri al
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id, 
          title,
          created_at,
          quiz_class_assignments (class_id)
        `)
        .eq('created_by', user.id)
        .ilike('title', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .range(startIndex, endIndex);

      if (assignmentsError) throw assignmentsError;

      // Her ödev için detaylı bilgileri al
      const assignmentsWithStats = await Promise.all(
        (assignmentsData || []).map(async (assignment: any) => {
          const classId = assignment.quiz_class_assignments?.[0]?.class_id;
          
          // Sınıf bilgilerini al
          const { data: classData } = await supabase
            .from('classes')
            .select('id, name')
            .eq('id', classId)
            .single();
          
          // Tamamlama sayısını al
          const { count: completionCount } = await supabase
            .from('assignment_results')
            .select('*', { count: 'exact' })
            .eq('assignment_id', assignment.id);

          // Sınıftaki toplam öğrenci sayısını al
          const { count: totalStudents } = classId ? await supabase
            .from('class_students')
            .select('*', { count: 'exact' })
            .eq('class_id', classId) : { count: 0 };
          
          return {
            id: assignment.id,
            title: assignment.title,
            class: classData?.id || '',
            class_name: classData?.name || 'Bilinmeyen Sınıf',
            completion_count: completionCount || 0,
            total_students: totalStudents || 0,
            created_at: new Date(assignment.created_at).toLocaleDateString('tr-TR')
          };
        })
      );

      setAssignments(assignmentsWithStats);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Ödevler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('classes')
      .select('id, name')
      .eq('teacher_id', user.id);

    if (error) {
      toast.error('Sınıflar yüklenirken bir hata oluştu');
      return;
    }

    setClasses(data);
  };

  React.useEffect(() => {
    fetchAssignments();
    fetchClasses();
    fetchQuestionStats();
    fetchUserProfile();
  }, [user, currentPage, searchTerm]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !user.id) {
      toast.error('Oturum bilgileriniz bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    if (!newAssignment.class) {
      toast.error('Lütfen bir sınıf seçin');
      return;
    }

    // Validasyonlar
    if (!newAssignment.title.trim()) {
      toast.error('Ödev başlığı zorunludur');
      return;
    }
    if (!newAssignment.class) {
      toast.error('Sınıf seçimi zorunludur');
      return;
    }
    if (newAssignment.questions.length === 0) {
      toast.error('En az bir soru seçmelisiniz');
      return;
    }

    setLoading(true);
    try {
      // Grade'i smallint'e çevir veya null olarak bırak
      const gradeValue = newAssignment.grade ? parseInt(newAssignment.grade) : null;

      // Transaction başlat
      const { data: result, error: transactionError } = await supabase.rpc('create_assignment_transaction', {
        p_title: newAssignment.title,
        p_description: newAssignment.description || '',
        p_grade: gradeValue,
        p_subject: newAssignment.subject || '',
        p_created_by: user.id,
        p_is_active: true,
        p_class_id: newAssignment.class,
        p_question_ids: newAssignment.questions
      });

      if (transactionError) {
        console.error('Ödev oluşturma hatası:', transactionError);
        toast.error(`Ödev oluşturulamadı: ${transactionError.message}`);
        return;
      }

      console.log('Transaction sonucu:', result);

      if (!result?.success) {
        const errorMessage = result?.error || 'Ödev oluşturma işlemi başarısız oldu';
        console.error('Transaction başarısız:', errorMessage);
        throw new Error(errorMessage);
      }

      toast.success('Ödev başarıyla oluşturuldu');
      setNewAssignment({
        title: '',
        class: '',
        questions: [],
        description: '',
        grade: '',
        subject: ''
      });
      setShowQuestionSelector(false);
      fetchAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Ödev oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Sayfalama kontrollerini oluştur
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5; // Maksimum görünür sayfa sayısı
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Sayfa sayısını ayarla
    if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Önceki sayfa butonu
    pages.push(
      <button
        key="prev"
        className={`px-3 py-1 rounded-md mx-1 ${
          currentPage === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &laquo;
      </button>
    );
    
    // İlk sayfa butonu (gerekirse)
    if (startPage > 1) {
      pages.push(
        <button
          key="first"
          className="px-3 py-1 rounded-md mx-1 bg-gray-200 hover:bg-gray-300 text-gray-700"
          onClick={() => setCurrentPage(1)}
        >
          1
        </button>
      );
      
      // Ellipsis (...)
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="px-3 py-1">
            ...
          </span>
        );
      }
    }
    
    // Sayfa numaraları
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`px-3 py-1 rounded-md mx-1 ${
            currentPage === i
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </button>
      );
    }
    
    // Son sayfa butonu (gerekirse)
    if (endPage < totalPages) {
      // Ellipsis (...)
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
          onClick={() => setCurrentPage(totalPages)}
        >
          {totalPages}
        </button>
      );
    }
    
    // Sonraki sayfa butonu
    pages.push(
      <button
        key="next"
        className={`px-3 py-1 rounded-md mx-1 ${
          currentPage === totalPages
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Aramada ilk sayfaya dön
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Ödev Yönetimi</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded ${activeTab === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Ödev Listesi
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded ${activeTab === 'create' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Yeni Ödev
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded ${activeTab === 'stats' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            İstatistikler
          </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded">
            {questionStats && !isAdmin && !isVip && (
              <div className="text-sm text-blue-800">
                <p>Seçebildiğiniz: {questionStats.available_questions} soru</p>
                <p className="text-xs font-bold text-blue-700">
                  Her ödevde en fazla 10 soru seçebilirsiniz.
                </p>
              </div>
            )}
            {isAdmin && (
              <div className="text-sm text-blue-800">
                <p className="font-medium">Admin: Tüm sorulara erişebilirsiniz</p>
              </div>
            )}
            {!isAdmin && isVip && (
              <div className="text-sm text-purple-800">
                <p className="font-medium">VIP Kullanıcı: Tüm sorulara erişebilirsiniz</p>
                <p className="text-xs mt-1">Seçebileceğiniz soru sayısı: Sınırsız</p>
              </div>
            )}
            {!isAdmin && !isVip && isTeacher && (
              <div className="text-sm text-green-700">
                <p className="font-medium">
                  Öğretmen: {questionStats 
                    ? `${questionStats.available_questions}/${questionStats.total_questions} soruya erişebilirsiniz` 
                    : 'Aktif sorulara erişebilirsiniz'}
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ödev Başlığı
              </label>
              <input
                type="text"
                placeholder="Ödev başlığı"
                value={newAssignment.title}
                onChange={(e) =>
                  setNewAssignment((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full border p-2 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sınıf
              </label>
              <select
                value={newAssignment.class}
                onChange={(e) =>
                  setNewAssignment((prev) => ({ ...prev, class: e.target.value }))
                }
                className="w-full border p-2 rounded"
                required
              >
                <option value="">Sınıf Seçin</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sorular ({newAssignment.questions.length} soru seçildi)
              </label>
              <button
                type="button"
                onClick={() => setShowQuestionSelector(!showQuestionSelector)}
                className="w-full border-2 border-dashed border-gray-300 p-4 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                {showQuestionSelector ? 'Soru Seçiciyi Gizle' : 'Soru Seç'}
              </button>
            </div>

            {showQuestionSelector && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <QuestionSelector
                  selectedQuestions={newAssignment.questions}
                  onQuestionsSelected={(questions) =>
                    setNewAssignment((prev) => ({ ...prev, questions }))
                  }
                  availableQuestionCount={
                    isAdmin || isVip 
                      ? 999999 
                      : 10 // Normal öğretmenler için sabit 10 soru seçebilirler
                  }
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading ? 'Oluşturuluyor...' : 'Ödev Oluştur'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Arama formu */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Ödev ara..."
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
          
          {/* Toplam sonuç bilgisi */}
          <div className="text-sm text-gray-600 mb-2">
            Toplam {totalAssignments} ödev bulundu
          </div>
          
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{assignment.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Sınıf: {assignment.class_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {assignment.completion_count} / {assignment.total_students} Öğrenci Tamamladı
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Oluşturulma: {assignment.created_at}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/teacher/assignments/${assignment.id}/students`)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  >
                    Öğrenci İlerlemeleri
                  </button>
                  <button
                    onClick={() => navigate(`/teacher/assignments/${assignment.id}/questions`)}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
                  >
                    Soruları Görüntüle
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="h-2 bg-gray-200 rounded-full w-24">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{
                        width: `${Math.min((assignment.completion_count / Math.max(1, assignment.total_students)) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {Math.min(Math.round((assignment.completion_count / Math.max(1, assignment.total_students)) * 100), 100)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {/* Sayfalama kontrolleri */}
          {renderPagination()}
          
          {/* Yükleniyor göstergesi */}
          {loading && (
            <div className="py-2 text-center text-gray-600">
              <div className="inline-block w-4 h-4 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin mr-2"></div>
              Veriler yükleniyor...
            </div>
          )}
          
          {!loading && assignments.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">Henüz ödev oluşturmadınız</p>
              <button
                onClick={() => setActiveTab('create')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Yeni Ödev Oluştur
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Toplam Ödev</h3>
              <p className="text-3xl font-bold text-blue-900">{assignments.length}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-2">Ortalama Tamamlama</h3>
              <p className="text-3xl font-bold text-green-900">
                {assignments.length > 0
                  ? `${(
                      Math.min(
                        (assignments.reduce(
                          (acc, curr) => acc + Math.min((curr.completion_count / Math.max(1, curr.total_students)) * 100, 100),
                          0
                        ) /
                          assignments.length) ||
                        0,
                        100
                      )
                    ).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800 mb-2">Soru Havuzu</h3>
              <p className="text-3xl font-bold text-purple-900">
                {questionStats
                  ? `${questionStats.available_questions}/${questionStats.total_questions}`
                  : '-'}
              </p>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Son Ödevler</h3>
              <div className="space-y-3">
                {assignments.slice(0, 5).map((assignment) => (
                  <div key={assignment.id} className="flex justify-between items-center py-2">
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-sm text-gray-500">{assignment.class_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {Math.min(Math.round((assignment.completion_count / Math.max(1, assignment.total_students)) * 100), 100)}% Tamamlandı
                      </p>
                      <p className="text-xs text-gray-500">{assignment.created_at}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManagement;