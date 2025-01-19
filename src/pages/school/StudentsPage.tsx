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
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Avatar,
} from '@mui/material';
import { Users, GraduationCap, BookOpen, FileCheck, ChartBar, Copy } from 'lucide-react';

interface Student {
    id: string;
    name: string;
    email: string;
    grade: string;
    experience: number;
    points: number;
    created_at: string;
    last_seen: string;
}

export default function StudentsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [referralCode, setReferralCode] = useState<string>('');
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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
                
                fetchTeacherInfo();
                fetchStudents();
            } catch (error) {
                console.error('Öğretmen kontrolü yapılırken hata:', error);
                navigate('/');
            }
        };

        checkTeacherStatus();
    }, [user, navigate]);

    const fetchTeacherInfo = async () => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('referral_code')
                .eq('id', user?.id)
                .single();

            if (error) throw error;

            if (!profile.referral_code) {
                const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                await supabase
                    .from('profiles')
                    .update({ referral_code: newCode })
                    .eq('id', user?.id);
                setReferralCode(newCode);
            } else {
                setReferralCode(profile.referral_code);
            }
        } catch (error) {
            console.error('Öğretmen bilgileri alınırken hata:', error);
            toast.error('Bilgiler alınırken bir hata oluştu');
        }
    };

    const fetchStudents = async () => {
        try {
            const { data: teacherProfile } = await supabase
                .from('profiles')
                .select('referral_code')
                .eq('id', user?.id)
                .single();

            const { data: studentsList } = await supabase
                .from('profiles')
                .select('*')
                .eq('referred_by', teacherProfile?.referral_code)
                .order('name');

            setStudents(studentsList || []);
        } catch (error) {
            console.error('Öğrenciler alınırken hata:', error);
            toast.error('Öğrenciler alınırken bir hata oluştu');
        }
    };

    const copyReferralCode = () => {
        navigator.clipboard.writeText(referralCode);
        toast.success('Referans kodu kopyalandı!');
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                {/* Başlık ve Butonlar */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" fontWeight="bold">
                        Öğrencilerim
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Users />}
                        onClick={() => setShowInviteDialog(true)}
                        sx={{
                            background: 'linear-gradient(45deg, #4F46E5, #7C3AED)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #4338CA, #6D28D9)'
                            }
                        }}
                    >
                        Öğrenci Davet Et
                    </Button>
                </Box>

                {/* Arama */}
                <TextField
                    fullWidth
                    variant="outlined"
                    label="Öğrenci Ara"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ mb: 3 }}
                />

                {/* Öğrenci Listesi */}
                <Grid container spacing={3}>
                    {filteredStudents.map((student) => (
                        <Grid item xs={12} sm={6} md={4} key={student.id}>
                            <Card sx={{ 
                                height: '100%',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)'
                                }
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                                            {student.name.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold">
                                                {student.name}
                                            </Typography>
                                            <Typography color="text.secondary" variant="body2">
                                                {student.email}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Chip
                                            label={`${student.grade}. Sınıf`}
                                            color="primary"
                                            size="small"
                                        />
                                        <Chip
                                            label={`${student.experience} XP`}
                                            color="secondary"
                                            size="small"
                                        />
                                    </Box>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                                    <Button
                                        size="small"
                                        startIcon={<BookOpen className="w-4 h-4" />}
                                        onClick={() => navigate(`/school/assignments/${student.id}`)}
                                    >
                                        Ödevler
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<FileCheck className="w-4 h-4" />}
                                        onClick={() => navigate(`/school/quizzes/${student.id}`)}
                                    >
                                        Sınavlar
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<ChartBar className="w-4 h-4" />}
                                        onClick={() => navigate(`/school/stats/${student.id}`)}
                                    >
                                        İstatistik
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {filteredStudents.length === 0 && (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <Users size={48} className="text-gray-400 mx-auto mb-2" />
                        <Typography variant="h6" color="text.secondary">
                            Henüz öğrenciniz bulunmuyor
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Öğrencilerinizi davet etmek için "Öğrenci Davet Et" butonunu kullanın
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Davet Dialog */}
            <Dialog 
                open={showInviteDialog} 
                onClose={() => setShowInviteDialog(false)}
                PaperProps={{
                    sx: { borderRadius: 2 }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Users className="w-6 h-6" />
                        <Typography variant="h6">Öğrenci Davet Et</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        Öğrencilerinize bu referans kodunu verin. Kayıt olurken bu kodu kullanarak sizin sınıfınıza katılabilirler.
                    </Typography>
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            mt: 2,
                            p: 3,
                            bgcolor: 'grey.50',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2
                        }}
                    >
                        <Typography variant="h5" fontWeight="bold">
                            {referralCode}
                        </Typography>
                        <IconButton 
                            onClick={copyReferralCode}
                            sx={{ 
                                color: 'primary.main',
                                '&:hover': {
                                    color: 'primary.dark'
                                }
                            }}
                        >
                            <Copy className="w-5 h-5" />
                        </IconButton>
                    </Paper>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowInviteDialog(false)}>Kapat</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
