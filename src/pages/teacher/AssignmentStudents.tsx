import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Student {
  id: string;
  name: string;
  completed: boolean;
  score: number;
  completed_at: string | null;
}

const AssignmentStudents: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [assignment, setAssignment] = React.useState<any>(null);
  const [students, setStudents] = React.useState<Student[]>([]);

  const fetchAssignmentDetails = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          quiz_class_assignments!inner (
            class_id,
            classes!inner (
              id,
              name
            )
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Ödev bulunamadı veya erişim izniniz yok');
        console.error('Assignment not found:', id);
        navigate('/teacher');
        return;
      }
      setAssignment(data);

      // Sınıftaki öğrencileri getir
      if (!data.quiz_class_assignments || data.quiz_class_assignments.length === 0) {
        toast.error('Bu ödev herhangi bir sınıfa atanmamış');
        console.error('No class assignments found for assignment:', id);
        navigate('/teacher');
        return;
      }
      const classId = data.quiz_class_assignments[0].class_id;
      const { data: studentsData, error: studentsError } = await supabase
        .from('class_students')
        .select(`
          student:profiles!inner (
            id,
            name
          )
        `)
        .eq('class_id', classId);

      if (studentsError) throw studentsError;
      
      if (!studentsData || studentsData.length === 0) {
        toast.success('Bu sınıfta kayıtlı öğrenci bulunmuyor');
        setStudents([]);
        setLoading(false);
        return;
      }

      // Öğrenci sonuçlarını getir
      const { data: resultsData, error: resultsError } = await supabase
        .from('assignment_results')
        .select('*')
        .eq('assignment_id', id);

      if (resultsError) throw resultsError;
      
      // Öğrenci sonuçları bulunamasa bile devam edebiliriz, sadece sonuç 0 gösterilir
      const safeResultsData = resultsData || [];

      // Öğrenci listesini hazırla
      const studentList = studentsData.map((s: any) => {
        const result = safeResultsData.find((r: any) => r.student_id === s.student.id);
        return {
          id: s.student.id,
          name: s.student.name,
          completed: !!result,
          score: result?.score || 0,
          completed_at: result?.completed_at
        };
      });

      setStudents(studentList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Veriler yüklenirken bir hata oluştu');
      navigate('/teacher');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAssignmentDetails();
  }, [user, id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const completedCount = students.filter(s => s.completed).length;
  const averageScore = students.reduce((acc, s) => acc + (s.completed ? s.score : 0), 0) / (completedCount || 1);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{assignment?.title}</h1>
          <p className="text-gray-600">
            {assignment?.quiz_class_assignments[0]?.classes?.name}
          </p>
        </div>
        <button
          onClick={() => navigate('/teacher')}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Geri Dön
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-2">Genel İstatistikler</h3>
          <div className="space-y-2">
            <p>Toplam Öğrenci: {students.length}</p>
            <p>Tamamlayan: {completedCount}</p>
            <p>Ortalama Puan: {averageScore.toFixed(1)}</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-2">Tamamlama Oranı</h3>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                  İlerleme
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {((completedCount / students.length) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div
                style={{ width: `${(completedCount / students.length) * 100}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Öğrenci
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Puan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tamamlama Tarihi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {student.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      student.completed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {student.completed ? 'Tamamlandı' : 'Bekliyor'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {student.completed ? student.score : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {student.completed_at
                      ? new Date(student.completed_at).toLocaleDateString('tr-TR')
                      : '-'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {students.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Bu sınıfta henüz öğrenci bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentStudents;
