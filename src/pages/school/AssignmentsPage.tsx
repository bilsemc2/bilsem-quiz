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
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent
} from '@mui/material';
import { Plus, Edit2, Trash2, Users, FileText } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Assignment {
    id: string;
    title: string;
    description: string;
    subject: string;
    grade: string;
    questions: Question[];
    created_at: string;
    is_active: boolean;
    quiz_class_assignments: {
        class_id: string;
        classes: {
            name: string;
            grade: string;
        };
    }[];
    completed_count: number;
    total_students: number;
}

interface Question {
    id: string;
    imageUrl: string;
    options: {
        id: string;
        imageUrl: string;
        isCorrect: boolean;
    }[];
    correctOption: string;
    solutionVideo?: string;
}

interface Class {
    id: string;
    name: string;
    grade: string;
    student_count: {
        count: number;
    };
}

export default function TeacherAssignmentsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newSubject, setNewSubject] = useState('');
    const [newGrade, setNewGrade] = useState('');
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

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
                
                fetchAssignments();
                fetchClasses();
            } catch (error) {
                console.error('Öğretmen kontrolü yapılırken hata:', error);
                navigate('/');
            }
        };

        checkTeacherStatus();
    }, [user, navigate]);

    const fetchAssignments = async () => {
        try {
            const { data, error } = await supabase
                .from('assignments')
                .select(`
                    *,
                    quiz_class_assignments (
                        class_id,
                        classes (
                            name,
                            grade
                        )
                    )
                `)
                .eq('created_by', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Her ödev için tamamlama sayılarını al
            const assignmentsWithStats = await Promise.all(data.map(async (assignment) => {
                // Sınıflardaki toplam öğrenci sayısı
                const { data: totalStudents } = await supabase
                    .from('class_students')
                    .select('student_id', { count: 'exact' })
                    .in('class_id', assignment.quiz_class_assignments.map(qca => qca.class_id));

                // Ödevi tamamlayan öğrenci sayısı
                const { data: completedCount } = await supabase
                    .from('assignment_results')
                    .select('id', { count: 'exact' })
                    .eq('assignment_id', assignment.id);

                return {
                    ...assignment,
                    completed_count: completedCount || 0,
                    total_students: totalStudents || 0
                };
            }));

            setAssignments(assignmentsWithStats);
        } catch (error) {
            console.error('Ödevler alınırken hata:', error);
            toast.error('Ödevler yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

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

            const classesWithCount = data?.map(cls => ({
                ...cls,
                student_count: {
                    count: cls.student_count?.[0]?.count || 0
                }
            })) || [];

            setClasses(classesWithCount);
        } catch (error) {
            console.error('Sınıflar alınırken hata:', error);
            toast.error('Sınıflar yüklenirken bir hata oluştu');
        }
    };

    const handleClassSelect = (event: SelectChangeEvent<string[]>) => {
        setSelectedClasses(typeof event.target.value === 'string' ? [event.target.value] : event.target.value);
    };

    const handleAddAssignment = async () => {
        if (!newTitle || !newDescription || !newSubject || !newGrade || selectedClasses.length === 0) {
            toast.error('Lütfen tüm alanları doldurun');
            return;
        }

        try {
            // Önce ödevi oluştur
            const { data: assignment, error: assignmentError } = await supabase
                .from('assignments')
                .insert([{
                    title: newTitle,
                    description: newDescription,
                    subject: newSubject,
                    grade: newGrade,
                    created_by: user?.id,
                    is_active: true
                }])
                .select()
                .single();

            if (assignmentError) throw assignmentError;

            // Sonra sınıf atamalarını yap
            const { error: classAssignmentError } = await supabase
                .from('quiz_class_assignments')
                .insert(
                    selectedClasses.map(classId => ({
                        assignment_id: assignment.id,
                        class_id: classId
                    }))
                );

            if (classAssignmentError) throw classAssignmentError;

            toast.success('Ödev başarıyla oluşturuldu');
            setShowAddDialog(false);
            resetForm();
            fetchAssignments();
        } catch (error) {
            console.error('Ödev oluşturulurken hata:', error);
            toast.error('Ödev oluşturulurken bir hata oluştu');
        }
    };

    const handleDeleteAssignment = async (assignmentId: string) => {
        if (!window.confirm('Bu ödevi silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('assignments')
                .delete()
                .eq('id', assignmentId);

            if (error) throw error;

            toast.success('Ödev başarıyla silindi');
            fetchAssignments();
        } catch (error) {
            console.error('Ödev silinirken hata:', error);
            toast.error('Ödev silinirken bir hata oluştu');
        }
    };

    const resetForm = () => {
        setNewTitle('');
        setNewDescription('');
        setNewSubject('');
        setNewGrade('');
        setSelectedClasses([]);
    };

    const filteredAssignments = assignments.filter(assignment =>
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                {/* Başlık ve Butonlar */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" fontWeight="bold">
                        Ödevler
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
                        Yeni Ödev
                    </Button>
                </Box>

                {/* Arama */}
                <TextField
                    fullWidth
                    variant="outlined"
                    label="Ödev Ara"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ mb: 3 }}
                />

                {/* Ödev Listesi */}
                <Grid container spacing={3}>
                    {filteredAssignments.map((assignment) => (
                        <Grid item xs={12} sm={6} md={4} key={assignment.id}>
                            <Card sx={{ 
                                height: '100%',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)'
                                }
                            }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        {assignment.title}
                                    </Typography>
                                    <Typography color="text.secondary" paragraph>
                                        {assignment.description}
                                    </Typography>
                                    
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                        <Chip
                                            label={assignment.subject}
                                            color="primary"
                                            size="small"
                                        />
                                        <Chip
                                            label={`${assignment.grade}. Sınıf`}
                                            color="secondary"
                                            size="small"
                                        />
                                        {assignment.quiz_class_assignments.map((qca) => (
                                            <Chip
                                                key={qca.class_id}
                                                label={qca.classes.name}
                                                size="small"
                                            />
                                        ))}
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2">
                                            Tamamlayan: {assignment.completed_count}/{assignment.total_students}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(assignment.created_at).toLocaleDateString('tr-TR')}
                                        </Typography>
                                    </Box>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                                    <Button
                                        size="small"
                                        startIcon={<FileText />}
                                        onClick={() => navigate(`/school/assignments/${assignment.id}/results`)}
                                    >
                                        Sonuçlar
                                    </Button>
                                    <Box>
                                        <IconButton
                                            size="small"
                                            onClick={() => navigate(`/school/assignments/${assignment.id}/edit`)}
                                            sx={{ mr: 1 }}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteAssignment(assignment.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </IconButton>
                                    </Box>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {filteredAssignments.length === 0 && (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <FileText size={48} className="text-gray-400 mx-auto mb-2" />
                        <Typography variant="h6" color="text.secondary">
                            Henüz ödev bulunmuyor
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Yeni bir ödev oluşturmak için "Yeni Ödev" butonunu kullanın
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Yeni Ödev Dialog'u */}
            <Dialog 
                open={showAddDialog} 
                onClose={() => {
                    setShowAddDialog(false);
                    resetForm();
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Yeni Ödev Oluştur</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Ödev Başlığı"
                            fullWidth
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                        <TextField
                            label="Açıklama"
                            fullWidth
                            multiline
                            rows={3}
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                        />
                        <TextField
                            label="Ders"
                            fullWidth
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                        />
                        <TextField
                            label="Sınıf Seviyesi"
                            fullWidth
                            value={newGrade}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^[0-9]+$/.test(value)) {
                                    setNewGrade(value);
                                }
                            }}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Sınıflar</InputLabel>
                            <Select
                                multiple
                                value={selectedClasses}
                                onChange={handleClassSelect}
                                label="Sınıflar"
                            >
                                {classes.map((cls) => (
                                    <MenuItem key={cls.id} value={cls.id}>
                                        {cls.name} ({cls.student_count.count} Öğrenci)
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => {
                            setShowAddDialog(false);
                            resetForm();
                        }}
                    >
                        İptal
                    </Button>
                    <Button 
                        onClick={handleAddAssignment}
                        variant="contained"
                    >
                        Oluştur
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
