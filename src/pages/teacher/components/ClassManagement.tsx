import React from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import ClassDetail from './ClassDetail';

interface Class {
  id: string;
  name: string;
  grade: number;
  student_count: number;
  meeting_link?: string;
}

const ClassManagement: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [newClass, setNewClass] = React.useState({ name: '', grade: '', meeting_link: '' });
  const [loading, setLoading] = React.useState(false);
  const [selectedClassId, setSelectedClassId] = React.useState<string | null>(null);

  const fetchClasses = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        grade,
        meeting_link,
        class_students (count)
      `)
      .eq('teacher_id', user.id);

    if (error) {
      toast.error('Sınıflar yüklenirken bir hata oluştu');
      return;
    }

    setClasses(
      data.map((c) => ({
        ...c,
        student_count: c.class_students[0].count,
      }))
    );
  };

  React.useEffect(() => {
    fetchClasses();
  }, [user]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { error } = await supabase.from('classes').insert({
      name: newClass.name,
      grade: parseInt(newClass.grade),
      meeting_link: newClass.meeting_link,
      teacher_id: user.id,
    });

    setLoading(false);

    if (error) {
      toast.error('Sınıf oluşturulurken bir hata oluştu');
      return;
    }

    toast.success('Sınıf başarıyla oluşturuldu');
    setNewClass({ name: '', grade: '', meeting_link: '' });
    fetchClasses();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Sınıf Yönetimi</h2>
      
      <form onSubmit={handleCreateClass} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Sınıf Adı"
            value={newClass.name}
            onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            placeholder="Sınıf Seviyesi"
            value={newClass.grade}
            onChange={(e) => setNewClass(prev => ({ ...prev, grade: e.target.value }))}
            className="border p-2 rounded"
            required
            min="1"
            max="12"
          />
          <div className="md:col-span-2">
            <input
              type="url"
              placeholder="Google Meet veya Zoom Bağlantısı (isteğe bağlı)"
              value={newClass.meeting_link}
              onChange={(e) => setNewClass(prev => ({ ...prev, meeting_link: e.target.value }))}
              className="border p-2 rounded w-full"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? 'Oluşturuluyor...' : 'Sınıf Oluştur'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="border p-4 rounded flex justify-between items-center"
          >
            <div>
              <h3 className="font-semibold">{cls.name}</h3>
              <p className="text-sm text-gray-500">
                {cls.grade}. Sınıf • {cls.student_count} Öğrenci
              </p>
              {cls.meeting_link && (
                <a 
                  href={cls.meeting_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Toplantı Bağlantısı
                </a>
              )}
            </div>
            <button
              onClick={() => setSelectedClassId(cls.id)}
              className="text-blue-500 hover:text-blue-600"
            >
              Detaylar
            </button>
          </div>
        ))}
      </div>

      {selectedClassId && (
        <ClassDetail
          classId={selectedClassId}
          onClose={() => {
            setSelectedClassId(null);
            fetchClasses();
          }}
        />
      )}
    </div>
  );
};

export default ClassManagement;