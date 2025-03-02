import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

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

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
  });

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
    try {
      if (!formData.name || !formData.grade) {
        toast.error('Lütfen tüm alanları doldurun');
        return;
      }

      const { data, error } = await supabase
        .from('classes')
        .insert([
          {
            name: formData.name,
            grade: parseInt(formData.grade),
          },
        ])
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
    try {
      if (!selectedClass || !formData.name || !formData.grade) {
        toast.error('Lütfen tüm alanları doldurun');
        return;
      }

      const { error } = await supabase
        .from('classes')
        .update({
          name: formData.name,
          grade: parseInt(formData.grade),
        })
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
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">
          Sınıf Yönetimi
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedClass(null);
            setFormData({ name: '', grade: '' });
            setDialogOpen(true);
          }}
        >
          Yeni Sınıf
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sınıf Adı</TableCell>
              <TableCell align="right">Sınıf Seviyesi</TableCell>
              <TableCell align="right">Öğrenci Sayısı</TableCell>
              <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classes.map((cls) => (
              <TableRow key={cls.id}>
                <TableCell>{cls.name}</TableCell>
                <TableCell align="right">{cls.grade}. Sınıf</TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${cls.student_count ?? 0} öğrenci`}
                    color={cls.student_count && cls.student_count > 0 ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Öğrencileri Görüntüle">
                    <IconButton onClick={() => handleOpenStudents(cls)} size="small">
                      <GroupIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Düzenle">
                    <IconButton
                      onClick={() => {
                        setSelectedClass(cls);
                        setFormData({
                          name: cls.name,
                          grade: cls.grade.toString(),
                        });
                        setDialogOpen(true);
                      }}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sil">
                    <IconButton
                      onClick={() => handleDelete(cls.id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Sınıf Ekleme/Düzenleme Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedClass ? 'Sınıf Düzenle' : 'Yeni Sınıf'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Sınıf Adı"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              label="Sınıf Seviyesi"
              type="number"
              fullWidth
              value={formData.grade}
              onChange={(e) => setFormData((prev) => ({ ...prev, grade: e.target.value }))}
              inputProps={{ min: 1, max: 12 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button
            onClick={selectedClass ? handleEdit : handleCreate}
            variant="contained"
            color="primary"
          >
            {selectedClass ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Öğrenci Listesi Dialog */}
      <Dialog
        open={studentsDialogOpen}
        onClose={() => setStudentsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedClass?.name} - Öğrenci Listesi
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ad Soyad</TableCell>
                  <TableCell>E-posta</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.name || '-'}</TableCell>
                    <TableCell>{student.email}</TableCell>
                  </TableRow>
                ))}
                {students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      Bu sınıfta henüz öğrenci bulunmuyor
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentsDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClassManagement;
