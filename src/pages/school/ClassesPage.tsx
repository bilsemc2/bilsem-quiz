import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Avatar,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
    CircularProgress
} from '@mui/material';
import { Users, GraduationCap, Plus, Edit2, Trash2 } from 'lucide-react';
import PersonIcon from '@mui/icons-material/Person';

interface Class {
    id: string;
    name: string;
    teacher_id: string;
    description: string;
    created_at: string;
    grade: string;
    student_count: {
        count: number;
    } | null;
}

interface Student {
    id: string;
    name: string;
    email: string;
}

export default function ClassesPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [classes, setClasses] = useState<Class[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showStudentsDialog, setShowStudentsDialog] = useState(false);
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [newClassName, setNewClassName] = useState('');
    const [newClassDescription, setNewClassDescription] = useState('');
    const [newClassGrade, setNewClassGrade] = useState('');
    const [editClassName, setEditClassName] = useState('');
    const [editClassDescription, setEditClassDescription] = useState('');
    const [editClassGrade, setEditClassGrade] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkTeacherStatus = async () => {
            if (!user) return;
            
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .limit(1)
                    .single();

                if (error) throw error;
                
                if (data?.role !== 'teacher') {
                    navigate('/');
                    return;
                }
                
                fetchClasses();
            } catch (error) {
                console.error('Öğretmen kontrolü yapılırken hata:', error);
                navigate('/');
            }
        };

        checkTeacherStatus();
    }, [user, navigate]);

    const fetchClasses = async () => {
        try {
            const { data, error } = await supabase
                .from('classes')
                .select(`
                    *,
                    student_count: class_students (count)
                `)
                .eq('teacher_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Öğrenci sayısını düzelt
            const classesWithCount = data?.map(cls => ({
                ...cls,
                student_count: {
                    count: cls.student_count?.[0]?.count || 0
                }
            })) || [];

            setClasses(classesWithCount);
        } catch (error) {
            console.error('Sınıfları getirirken hata:', error);
            toast.error('Sınıflar yüklenirken bir hata oluştu');
        }
    };

    const addClass = async () => {
        try {
            const { data, error } = await supabase
                .from('classes')
                .insert([
                    {
                        name: newClassName,
                        description: newClassDescription,
                        grade: newClassGrade,
                        teacher_id: user?.id
                    }
                ]);

            if (error) throw error;

            toast.success('Sınıf başarıyla oluşturuldu');
            setShowAddDialog(false);
            setNewClassName('');
            setNewClassDescription('');
            setNewClassGrade('');
            fetchClasses();
        } catch (error) {
            console.error('Sınıf oluşturulurken hata:', error);
            toast.error('Sınıf oluşturulurken bir hata oluştu');
        }
    };

    const deleteClass = async (classId: string) => {
        if (!window.confirm('Bu sınıfı silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('classes')
                .delete()
                .eq('id', classId);

            if (error) throw error;

            toast.success('Sınıf başarıyla silindi');
            fetchClasses();
        } catch (error) {
            console.error('Sınıf silinirken hata:', error);
            toast.error('Sınıf silinirken bir hata oluştu');
        }
    };

    const handleGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Sadece rakamları kabul et
        if (value === '' || /^[0-9]+$/.test(value)) {
            setNewClassGrade(value);
        }
    };

    const handleOpenStudentsDialog = async (cls: Class) => {
        setSelectedClass(cls);
        setShowStudentsDialog(true);
        await fetchAvailableStudents();
        await fetchClassStudents(cls.id);
    };

    const handleCloseStudentsDialog = () => {
        setShowStudentsDialog(false);
        setStudentSearchTerm('');
    };

    const fetchAvailableStudents = async () => {
        try {
            const { data: teacherProfile } = await supabase
                .from('profiles')
                .select('referral_code')
                .eq('id', user?.id)
                .single();

            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, email')
                .eq('role', 'student')
                .eq('referred_by', teacherProfile?.referral_code)
                .order('name');

            if (error) throw error;
            setStudents(data || []);
        } catch (error) {
            console.error('Öğrenciler alınırken hata:', error);
            toast.error('Öğrenciler yüklenirken bir hata oluştu');
        }
    };

    const fetchClassStudents = async (classId: string) => {
        try {
            const { data, error } = await supabase
                .from('class_students')
                .select('student_id')
                .eq('class_id', classId);

            if (error) throw error;
            setSelectedStudents(data?.map(item => item.student_id) || []);
        } catch (error) {
            console.error('Sınıf öğrencileri alınırken hata:', error);
        }
    };

    const handleAddStudents = async () => {
        if (!selectedClass) return;
        
        setLoading(true);
        try {
            // Önce mevcut öğrencileri kaldır
            const { error: deleteError } = await supabase
                .from('class_students')
                .delete()
                .eq('class_id', selectedClass.id);

            if (deleteError) throw deleteError;

            // Yeni öğrencileri ekle
            if (selectedStudents.length > 0) {
                const { error: insertError } = await supabase
                    .from('class_students')
                    .insert(
                        selectedStudents.map(studentId => ({
                            class_id: selectedClass.id,
                            student_id: studentId
                        }))
                    );

                if (insertError) throw insertError;
            }

            toast.success('Öğrenciler başarıyla güncellendi');
            setShowStudentsDialog(false);
            fetchClasses();
        } catch (error) {
            console.error('Öğrenciler eklenirken hata:', error);
            toast.error('Öğrenciler eklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEditDialog = (cls: Class) => {
        setSelectedClass(cls);
        setEditClassName(cls.name);
        setEditClassDescription(cls.description);
        setEditClassGrade(cls.grade);
        setShowEditDialog(true);
    };

    const handleCloseEditDialog = () => {
        setShowEditDialog(false);
        setSelectedClass(null);
        setEditClassName('');
        setEditClassDescription('');
        setEditClassGrade('');
    };

    const updateClass = async () => {
        if (!selectedClass) return;
        
        setLoading(true);
        try {
            const { error } = await supabase
                .from('classes')
                .update({
                    name: editClassName,
                    description: editClassDescription,
                    grade: editClassGrade
                })
                .eq('id', selectedClass.id);

            if (error) throw error;

            toast.success('Sınıf başarıyla güncellendi');
            handleCloseEditDialog();
            fetchClasses();
        } catch (error) {
            console.error('Sınıf güncellenirken hata:', error);
            toast.error('Sınıf güncellenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const filteredClasses = classes.filter(cls =>
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                {/* Başlık ve Butonlar */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" fontWeight="bold">
                        Sınıflarım
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Plus />}
                        onClick={() => setShowAddDialog(true)}
                        sx={{
                            background: 'linear-gradient(45deg, #4F46E5, #7C3AED)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #4338CA, #6D28D9)'
                            }
                        }}
                    >
                        Yeni Sınıf
                    </Button>
                </Box>

                {/* Arama */}
                <TextField
                    fullWidth
                    variant="outlined"
                    label="Sınıf Ara"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ mb: 3 }}
                />

                {/* Sınıf Listesi */}
                <Grid container spacing={3}>
                    {filteredClasses.map((cls) => (
                        <Grid item xs={12} sm={6} md={4} key={cls.id}>
                            <Card sx={{ 
                                height: '100%',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)'
                                }
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                                            <GraduationCap />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold">
                                                {cls.name}
                                            </Typography>
                                            <Typography color="text.secondary" variant="body2">
                                                {cls.description}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                        <Chip
                                            icon={<PersonIcon />}
                                            label={`${cls.student_count?.count ?? 0} Öğrenci`}
                                            color="primary"
                                            size="small"
                                        />
                                        <Chip
                                            label={`${cls.grade}. Sınıf`}
                                            color="secondary"
                                            size="small"
                                        />
                                    </Box>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                                    <Button
                                        size="small"
                                        startIcon={<Users />}
                                        onClick={() => handleOpenStudentsDialog(cls)}
                                    >
                                        Öğrenciler
                                    </Button>
                                    <Box>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleOpenEditDialog(cls)}
                                            sx={{ mr: 1 }}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => deleteClass(cls.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </IconButton>
                                    </Box>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {filteredClasses.length === 0 && (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <GraduationCap size={48} className="text-gray-400 mx-auto mb-2" />
                        <Typography variant="h6" color="text.secondary">
                            Henüz sınıfınız bulunmuyor
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Yeni bir sınıf oluşturmak için "Yeni Sınıf" butonunu kullanın
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Yeni Sınıf Dialog */}
            <Dialog 
                open={showAddDialog} 
                onClose={() => setShowAddDialog(false)}
                PaperProps={{
                    sx: { borderRadius: 2 }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GraduationCap className="w-6 h-6" />
                        <Typography variant="h6">Yeni Sınıf Oluştur</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Sınıf Adı"
                        fullWidth
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Sınıf Seviyesi"
                        fullWidth
                        type="text"
                        inputProps={{ 
                            inputMode: 'numeric',
                            pattern: '[0-9]*',
                            maxLength: 2
                        }}
                        value={newClassGrade}
                        onChange={handleGradeChange}
                        helperText="Sadece rakam giriniz (1-12)"
                        error={newClassGrade !== '' && (parseInt(newClassGrade) < 1 || parseInt(newClassGrade) > 12)}
                    />
                    <TextField
                        margin="dense"
                        label="Açıklama"
                        fullWidth
                        multiline
                        rows={3}
                        value={newClassDescription}
                        onChange={(e) => setNewClassDescription(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAddDialog(false)}>İptal</Button>
                    <Button 
                        onClick={addClass}
                        variant="contained"
                        disabled={
                            !newClassName.trim() || 
                            !newClassGrade.trim() || 
                            parseInt(newClassGrade) < 1 || 
                            parseInt(newClassGrade) > 12
                        }
                    >
                        Oluştur
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Sınıf Düzenleme Dialog'u */}
            <Dialog 
                open={showEditDialog} 
                onClose={handleCloseEditDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Sınıfı Düzenle</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Sınıf Adı"
                            fullWidth
                            value={editClassName}
                            onChange={(e) => setEditClassName(e.target.value)}
                        />
                        <TextField
                            label="Açıklama"
                            fullWidth
                            multiline
                            rows={3}
                            value={editClassDescription}
                            onChange={(e) => setEditClassDescription(e.target.value)}
                        />
                        <TextField
                            label="Sınıf Seviyesi"
                            fullWidth
                            value={editClassGrade}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^[0-9]+$/.test(value)) {
                                    setEditClassGrade(value);
                                }
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditDialog}>
                        İptal
                    </Button>
                    <Button
                        onClick={updateClass}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'Güncelleniyor...' : 'Güncelle'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Öğrenci Ekleme Dialog'u */}
            <Dialog 
                open={showStudentsDialog} 
                onClose={handleCloseStudentsDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedClass?.name} - Öğrenciler
                </DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense"
                        label="Öğrenci Ara"
                        fullWidth
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {students
                            .filter(student => 
                                (student.name?.toLowerCase() || '').includes(studentSearchTerm.toLowerCase()) ||
                                (student.email?.toLowerCase() || '').includes(studentSearchTerm.toLowerCase())
                            )
                            .map((student) => (
                            <ListItem key={student.id}>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        checked={selectedStudents.includes(student.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedStudents([...selectedStudents, student.id]);
                                            } else {
                                                setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                            }
                                        }}
                                    />
                                </ListItemIcon>
                                <ListItemText
                                    primary={student.name}
                                    secondary={student.email || 'E-posta yok'}
                                />
                            </ListItem>
                        ))}
                        {students.length === 0 && (
                            <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                                Henüz öğrenci bulunmuyor
                            </Typography>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseStudentsDialog}>
                        İptal
                    </Button>
                    <Button
                        onClick={handleAddStudents}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
