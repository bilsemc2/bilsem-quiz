import React from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface ClassDetails {
  id: string;
  name: string;
  grade: number;
  students: Student[];
}

interface Props {
  classId: string;
  onClose: () => void;
}

const ClassDetail: React.FC<Props> = ({ classId, onClose }) => {
  const { user } = useAuth();
  const [classDetails, setClassDetails] = React.useState<ClassDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState('');
  const [editedGrade, setEditedGrade] = React.useState('');
  const [newStudentEmail, setNewStudentEmail] = React.useState('');
  const [addingStudent, setAddingStudent] = React.useState(false);

  const fetchClassDetails = async () => {
    if (!user) return;

    setLoading(true);
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        grade,
        class_students (
          profiles (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('id', classId)
      .eq('teacher_id', user.id)
      .single();

    if (classError) {
      toast.error('Sınıf detayları yüklenirken bir hata oluştu');
      onClose();
      return;
    }

    const students = classData.class_students.map((cs: any) => cs.profiles);

    setClassDetails({
      id: classData.id,
      name: classData.name,
      grade: classData.grade,
      students,
    });

    setEditedName(classData.name);
    setEditedGrade(classData.grade.toString());
    setLoading(false);
  };

  React.useEffect(() => {
    fetchClassDetails();
  }, [classId, user]);

  const handleUpdateClass = async () => {
    if (!user || !classDetails) return;

    const { error } = await supabase
      .from('classes')
      .update({
        name: editedName,
        grade: parseInt(editedGrade),
      })
      .eq('id', classId)
      .eq('teacher_id', user.id);

    if (error) {
      toast.error('Sınıf güncellenirken bir hata oluştu');
      return;
    }

    toast.success('Sınıf başarıyla güncellendi');
    setEditing(false);
    fetchClassDetails();
  };

  const handleDeleteClass = async () => {
    if (!user || !classDetails) return;

    if (!window.confirm('Bu sınıfı silmek istediğinizden emin misiniz?')) {
      return;
    }

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId)
      .eq('teacher_id', user.id);

    if (error) {
      toast.error('Sınıf silinirken bir hata oluştu');
      return;
    }

    toast.success('Sınıf başarıyla silindi');
    onClose();
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !classDetails) return;

    setAddingStudent(true);

    // Önce öğrenciyi bul
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', newStudentEmail)
      .single();

    if (studentError) {
      toast.error('Öğrenci bulunamadı');
      setAddingStudent(false);
      return;
    }

    // Öğrenciyi sınıfa ekle
    const { error: assignError } = await supabase
      .from('class_students')
      .insert({
        class_id: classId,
        student_id: student.id,
      });

    if (assignError) {
      if (assignError.code === '23505') {
        toast.error('Bu öğrenci zaten sınıfta kayıtlı');
      } else {
        toast.error('Öğrenci eklenirken bir hata oluştu');
      }
      setAddingStudent(false);
      return;
    }

    toast.success('Öğrenci başarıyla eklendi');
    setNewStudentEmail('');
    setAddingStudent(false);
    fetchClassDetails();
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!user || !classDetails) return;

    if (!window.confirm('Bu öğrenciyi sınıftan çıkarmak istediğinizden emin misiniz?')) {
      return;
    }

    const { error } = await supabase
      .from('class_students')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', studentId);

    if (error) {
      toast.error('Öğrenci çıkarılırken bir hata oluştu');
      return;
    }

    toast.success('Öğrenci başarıyla çıkarıldı');
    fetchClassDetails();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!classDetails) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Sınıf Detayları</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {editing ? (
          <div className="mb-6 space-y-4">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="Sınıf Adı"
            />
            <input
              type="number"
              value={editedGrade}
              onChange={(e) => setEditedGrade(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="Sınıf Seviyesi"
              min="1"
              max="12"
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpdateClass}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Kaydet
              </button>
              <button
                onClick={() => setEditing(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                İptal
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <h3 className="font-semibold text-lg">{classDetails.name}</h3>
            <p className="text-gray-500">{classDetails.grade}. Sınıf</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="text-blue-500 hover:text-blue-600"
              >
                Düzenle
              </button>
              <button
                onClick={handleDeleteClass}
                className="text-red-500 hover:text-red-600"
              >
                Sınıfı Sil
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Öğrenci Ekle</h3>
          <form onSubmit={handleAddStudent} className="flex gap-2">
            <input
              type="email"
              value={newStudentEmail}
              onChange={(e) => setNewStudentEmail(e.target.value)}
              className="border p-2 rounded flex-1"
              placeholder="Öğrenci E-posta"
              required
            />
            <button
              type="submit"
              disabled={addingStudent}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-300"
            >
              {addingStudent ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </form>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Öğrenciler ({classDetails.students.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {classDetails.students.map((student) => (
              <div
                key={student.id}
                className="flex justify-between items-center border p-2 rounded"
              >
                <div>
                  <p className="font-medium">{student.full_name}</p>
                  <p className="text-sm text-gray-500">{student.email}</p>
                </div>
                <button
                  onClick={() => handleRemoveStudent(student.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  Çıkar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDetail;
