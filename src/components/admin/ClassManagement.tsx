import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Users, X, Loader2, GraduationCap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface Class {
  id: string;
  name: string;
  grade: number;
  created_at: string;
  student_count?: number;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

const ClassManagement = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [formData, setFormData] = useState({ name: '', grade: '' });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('classes')
        .select('*, class_students(count)')
        .order('grade', { ascending: true });

      if (error) throw error;

      const classesWithCount = data?.map(cls => ({
        ...cls,
        student_count: cls.class_students?.[0]?.count || 0
      })) || [];

      setClasses(classesWithCount);
      setError(null);
    } catch (err) {
      console.error('Sınıflar yüklenirken hata:', err);
      setError('Sınıflar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.grade) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('classes')
        .insert([{ name: formData.name, grade: parseInt(formData.grade) }])
        .select();

      if (error) throw error;

      setClasses([...(data || []), ...classes]);
      setDialogOpen(false);
      setFormData({ name: '', grade: '' });
      toast.success('Sınıf başarıyla oluşturuldu');
    } catch (err) {
      console.error('Sınıf oluşturulurken hata:', err);
      toast.error('Sınıf oluşturulurken bir hata oluştu');
    }
  };

  const handleEdit = async () => {
    if (!selectedClass || !formData.name || !formData.grade) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      const { error } = await supabase
        .from('classes')
        .update({ name: formData.name, grade: parseInt(formData.grade) })
        .eq('id', selectedClass.id);

      if (error) throw error;

      setClasses(classes.map((cls) =>
        cls.id === selectedClass.id
          ? { ...cls, name: formData.name, grade: parseInt(formData.grade) }
          : cls
      ));
      setDialogOpen(false);
      setSelectedClass(null);
      setFormData({ name: '', grade: '' });
      toast.success('Sınıf başarıyla güncellendi');
    } catch (err) {
      console.error('Sınıf güncellenirken hata:', err);
      toast.error('Sınıf güncellenirken bir hata oluştu');
    }
  };

  const handleDelete = async (classId: string) => {
    if (!window.confirm('Bu sınıfı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase.from('classes').delete().eq('id', classId);
      if (error) throw error;
      setClasses(classes.filter((cls) => cls.id !== classId));
      toast.success('Sınıf başarıyla silindi');
    } catch (err) {
      console.error('Sınıf silinirken hata:', err);
      toast.error('Sınıf silinirken bir hata oluştu');
    }
  };

  const handleOpenStudents = async (cls: Class) => {
    try {
      const { data, error } = await supabase
        .from('class_students')
        .select('profiles(id, name, email)')
        .eq('class_id', cls.id);

      if (error) throw error;

      setStudents(data?.map((item: any) => item.profiles) || []);
      setSelectedClass(cls);
      setStudentsDialogOpen(true);
    } catch (err) {
      console.error('Öğrenciler yüklenirken hata:', err);
      toast.error('Öğrenciler yüklenirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-indigo-500" />
          Sınıf Yönetimi
        </h1>
        <button
          onClick={() => {
            setSelectedClass(null);
            setFormData({ name: '', grade: '' });
            setDialogOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Sınıf
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">Sınıf Adı</th>
                <th className="text-right py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">Sınıf Seviyesi</th>
                <th className="text-right py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">Öğrenci Sayısı</th>
                <th className="text-center py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map((cls, idx) => (
                <motion.tr
                  key={cls.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-4 px-6 font-medium text-slate-800">{cls.name}</td>
                  <td className="py-4 px-6 text-right text-slate-600">{cls.grade}. Sınıf</td>
                  <td className="py-4 px-6 text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${cls.student_count && cls.student_count > 0
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-600'
                      }`}>
                      {cls.student_count ?? 0} öğrenci
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => handleOpenStudents(cls)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Öğrencileri Görüntüle"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClass(cls);
                          setFormData({ name: cls.name, grade: cls.grade.toString() });
                          setDialogOpen(true);
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cls.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-50">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold text-slate-800">
                {selectedClass ? 'Sınıf Düzenle' : 'Yeni Sınıf'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
              </Dialog.Close>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sınıf Adı</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sınıf Seviyesi</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={formData.grade}
                  onChange={(e) => setFormData((prev) => ({ ...prev, grade: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <button className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl">İptal</button>
              </Dialog.Close>
              <button
                onClick={selectedClass ? handleEdit : handleCreate}
                className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600"
              >
                {selectedClass ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Students Dialog */}
      <Dialog.Root open={studentsDialogOpen} onOpenChange={setStudentsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold text-slate-800">
                {selectedClass?.name} - Öğrenci Listesi
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
              </Dialog.Close>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Ad Soyad</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">E-posta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-800">{student.name || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{student.email}</td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-slate-500">
                        Bu sınıfta henüz öğrenci bulunmuyor
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-6">
              <Dialog.Close asChild>
                <button className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">Kapat</button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default ClassManagement;
