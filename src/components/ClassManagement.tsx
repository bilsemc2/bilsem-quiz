import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  Avatar,

  Checkbox
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SchoolIcon from '@mui/icons-material/School';
import ScienceIcon from '@mui/icons-material/Science';
import CodeIcon from '@mui/icons-material/Code';
import BrushIcon from '@mui/icons-material/Brush';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import CalculateIcon from '@mui/icons-material/Calculate';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PsychologyIcon from '@mui/icons-material/Psychology';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Class {
  id: string;
  name: string;
  grade: number;
  icon: string;
  created_by: string;
  teacher_id: string;
  student_count?: number;
}

interface Student {
  id: string;
  name: string;
  email: string;
  grade: number;
}

const AVAILABLE_ICONS = [
  { name: 'school', component: SchoolIcon, label: 'Okul' },
  { name: 'science', component: ScienceIcon, label: 'Bilim' },
  { name: 'code', component: CodeIcon, label: 'Kodlama' },
  { name: 'brush', component: BrushIcon, label: 'Sanat' },
  { name: 'music_note', component: MusicNoteIcon, label: 'Müzik' },
  { name: 'sports_soccer', component: SportsSoccerIcon, label: 'Spor' },
  { name: 'calculate', component: CalculateIcon, label: 'Matematik' },
  { name: 'menu_book', component: MenuBookIcon, label: 'Edebiyat' },
  { name: 'psychology', component: PsychologyIcon, label: 'Psikoloji' },
  { name: 'emoji_objects', component: EmojiObjectsIcon, label: 'Fikir' }
];

export const ClassManagement: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [className, setClassName] = useState('');
  const [classGrade, setClassGrade] = useState<number>(1);
  const [classIcon, setClassIcon] = useState(AVAILABLE_ICONS[0].name);
  const [openStudentDialog, setOpenStudentDialog] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<number | 'all'>('all');

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('classes')
        .select('*, class_students(student_id)');

      if (error) throw error;

      const classesWithCount = data?.map(cls => ({
        ...cls,
        student_count: cls.class_students?.length || 0
      })) || [];

      setClasses(classesWithCount);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sınıflar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    checkAdminStatus();
  }, []);
  
  // Kullanıcının admin durumunu kontrol eden fonksiyon
  const checkAdminStatus = async () => {
    if (user?.id) {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      setIsAdmin(data?.is_admin || false);
    }
  };

  const handleOpenDialog = (cls?: Class) => {
    if (cls) {
      setSelectedClass(cls);
      setClassName(cls.name);
      setClassGrade(cls.grade);
      setClassIcon(cls.icon);
    } else {
      setSelectedClass(null);
      setClassName('');
      setClassGrade(1);
      setClassIcon(AVAILABLE_ICONS[0].name);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClass(null);
  };

  const handleSaveClass = async () => {
    try {
      if (selectedClass) {
        // Sınıfı güncelle
        const { error } = await supabase
          .from('classes')
          .update({
            name: className,
            grade: classGrade,
            icon: classIcon
          })
          .eq('id', selectedClass.id);

        if (error) throw error;
      } else {
        // Yeni sınıf oluştur
        const { error } = await supabase
          .from('classes')
          .insert([{
            name: className,
            grade: classGrade,
            icon: classIcon,
            created_by: user?.id,
            teacher_id: user?.id
          }]);

        if (error) throw error;
      }

      handleCloseDialog();
      fetchClasses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sınıf kaydedilirken bir hata oluştu');
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm('Bu sınıfı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;

      fetchClasses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sınıf silinirken bir hata oluştu');
    }
  };

  const handleOpenStudentDialog = async (classId: string) => {
    try {
      const selectedClass = classes.find(c => c.id === classId);
      
      // Yetki kontrolü: Sadece sınıfı oluşturan kişi veya admin öğrenci ekleyebilir
      if (!selectedClass) return;
      
      // isAdmin değişkeni bileşen seviyesinde tanımlandı
      
      if (selectedClass.created_by !== user?.id && !isAdmin) {
        setError('Bu sınıfa öğrenci ekleme yetkiniz yok');
        return;
      }

      // Önce sınıftaki mevcut öğrenci ID'lerini al
      const { data: existingStudents, error: existingError } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classId);

      if (existingError) throw existingError;

      // Mevcut öğrenci ID'lerini bir diziye dönüştür
      const existingStudentIds = existingStudents?.map(s => s.student_id) || [];

      console.log('Mevcut öğrenciler:', existingStudentIds);

      // Tüm öğrencileri getir ve client-side filtrele
      const { data: allStudents, error } = await supabase
        .from('profiles')
        .select('id, name, email, grade');

      if (error) {
        console.error('Öğrenci getirme hatası:', error);
        throw error;
      }

      // Client-side filtreleme
      const availableStudents = allStudents?.filter(
        student => !existingStudentIds.includes(student.id)
      ) || [];

      console.log('Kullanılabilir öğrenciler:', availableStudents);
      setAvailableStudents(availableStudents);
      setSelectedClass(selectedClass);
      setOpenStudentDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Öğrenciler yüklenirken bir hata oluştu');
    }
  };

  const handleAddStudents = async () => {
    if (!selectedClass || selectedStudents.length === 0) return;

    try {
      const { error } = await supabase
        .from('class_students')
        .insert(
          selectedStudents.map(studentId => ({
            class_id: selectedClass.id,
            student_id: studentId
          }))
        );

      if (error) throw error;

      setOpenStudentDialog(false);
      setSelectedStudents([]);
      fetchClasses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Öğrenciler eklenirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">
          Sınıf Yönetimi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Yeni Sınıf
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {classes.map((cls) => (
          <Grid item xs={12} sm={6} md={4} key={cls.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {React.createElement(
                    AVAILABLE_ICONS.find(icon => icon.name === cls.icon)?.component || SchoolIcon,
                    { fontSize: 'large', color: 'primary' }
                  )}
                  <Typography variant="h6">
                    {cls.name}
                  </Typography>
                </Box>
                <Typography color="text.secondary" gutterBottom>
                  {cls.grade}. Sınıf
                </Typography>
                <Typography color="text.secondary">
                  {cls.student_count} Öğrenci
                </Typography>
              </CardContent>
              <CardActions>
                {(cls.created_by === user?.id || isAdmin) && (
                  <>
                    <Button
                      size="small"
                      startIcon={<PersonAddIcon />}
                      onClick={() => handleOpenStudentDialog(cls.id)}
                    >
                      Öğrenci Ekle
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(cls)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClass(cls.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Sınıf Ekleme/Düzenleme Dialog'u */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedClass ? 'Sınıfı Düzenle' : 'Yeni Sınıf'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Sınıf Adı"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>Sınıf Seviyesi</InputLabel>
              <Select
                value={classGrade}
                label="Sınıf Seviyesi"
                onChange={(e: SelectChangeEvent<number>) => 
                  setClassGrade(Number(e.target.value))
                }
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((grade) => (
                  <MenuItem key={grade} value={grade}>
                    {grade}. Sınıf
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Sınıf İkonu</InputLabel>
              <Select
                value={classIcon}
                label="Sınıf İkonu"
                onChange={(e) => setClassIcon(e.target.value)}
              >
                {AVAILABLE_ICONS.map((icon) => (
                  <MenuItem key={icon.name} value={icon.name}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {React.createElement(icon.component, { fontSize: 'small' })}
                      {icon.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button
            onClick={handleSaveClass}
            variant="contained"
            disabled={!className || !classGrade}
          >
            {selectedClass ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Öğrenci Ekleme Dialog'u */}
      <Dialog
        open={openStudentDialog}
        onClose={() => setOpenStudentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Öğrenci Ekle - {selectedClass?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  size="small"
                  label="Öğrenci Ara"
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  placeholder="İsim veya email ile ara..."
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sınıf</InputLabel>
                  <Select
                    value={gradeFilter}
                    label="Sınıf"
                    onChange={(e) => setGradeFilter(e.target.value as number | 'all')}
                  >
                    <MenuItem value="all">Tümü</MenuItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((grade) => (
                      <MenuItem key={grade} value={grade}>
                        {grade}. Sınıf
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
          <List>
            {availableStudents
              .filter(student => {
                const matchesSearch = 
                  !studentSearchTerm ||
                  student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                  student.email.toLowerCase().includes(studentSearchTerm.toLowerCase());
                
                const matchesGrade = 
                  gradeFilter === 'all' || 
                  student.grade === gradeFilter;

                return matchesSearch && matchesGrade;
              })
              .map((student) => (
                <ListItem key={student.id}>
                  <ListItemIcon>
                    <Avatar>
                      {student.name ? student.name.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={student.name || 'İsimsiz Kullanıcı'}
                    secondary={`${student.email} - ${student.grade}. Sınıf`}
                  />
                  <ListItemSecondaryAction>
                    <Checkbox
                      edge="end"
                      checked={selectedStudents.includes(student.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents([...selectedStudents, student.id]);
                        } else {
                          setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                        }
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            {availableStudents.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="Eklenebilecek öğrenci bulunamadı"
                  secondary="Tüm öğrenciler bu sınıfa zaten eklenmiş olabilir"
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenStudentDialog(false);
            setStudentSearchTerm('');
            setGradeFilter('all');
            setSelectedStudents([]);
          }}>
            İptal
          </Button>
          <Button
            onClick={handleAddStudents}
            variant="contained"
            disabled={selectedStudents.length === 0}
          >
            Öğrencileri Ekle ({selectedStudents.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClassManagement;
