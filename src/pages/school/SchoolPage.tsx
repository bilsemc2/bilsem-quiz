import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Users, GraduationCap, BookOpen, FileCheck, ChartBar, Settings } from 'lucide-react';
import {
    Card,
    CardContent,
    Grid,
    Typography,
    Box,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Divider,
    Avatar,
    Badge,
    Chip
} from '@mui/material';

interface MenuItem {
    title: string;
    icon: React.ReactNode;
    path: string;
    description: string;
    color: string;
}

export default function SchoolPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isTeacher, setIsTeacher] = useState(false);
    const [activeStudents, setActiveStudents] = useState(0);
    const [totalAssignments, setTotalAssignments] = useState(0);

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
                
                setIsTeacher(data?.role === 'teacher');
            } catch (error) {
                console.error('Öğretmen kontrolü yapılırken hata:', error);
                setIsTeacher(false);
            }
        };

        const fetchStats = async () => {
            // Aktif öğrenci sayısı
            const { count: studentsCount } = await supabase
                .from('class_students')
                .select('*', { count: 'exact' });
            
            setActiveStudents(studentsCount || 0);

            // Toplam ödev sayısı
            const { count: assignmentsCount } = await supabase
                .from('quiz_class_assignments')
                .select('*', { count: 'exact' });
            
            setTotalAssignments(assignmentsCount || 0);
        };

        checkTeacherStatus();
        fetchStats();
    }, [user]);

    const menuItems: MenuItem[] = [
        {
            title: 'Öğrencilerim',
            icon: <Users className="w-6 h-6" />,
            path: '/school/students',
            description: 'Öğrenci listesi ve performans takibi',
            color: 'rgb(99, 102, 241)' // Indigo
        },
        {
            title: 'Sınıflarım',
            icon: <GraduationCap className="w-6 h-6" />,
            path: '/school/classes',
            description: 'Sınıf yönetimi ve düzenleme',
            color: 'rgb(168, 85, 247)' // Purple
        },
        {
            title: 'Ödevler',
            icon: <BookOpen className="w-6 h-6" />,
            path: '/school/assignments',
            description: 'Ödev oluşturma ve takibi',
            color: 'rgb(236, 72, 153)' // Pink
        },
        {
            title: 'Sınavlar',
            icon: <FileCheck className="w-6 h-6" />,
            path: '/school/quizzes',
            description: 'Sınav oluşturma ve değerlendirme',
            color: 'rgb(14, 165, 233)' // Sky
        },
        {
            title: 'İstatistikler',
            icon: <ChartBar className="w-6 h-6" />,
            path: '/school/stats',
            description: 'Detaylı performans analizleri',
            color: 'rgb(34, 197, 94)' // Green
        }
    ];

    if (!isTeacher) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h5">
                    Bu sayfaya erişim yetkiniz bulunmamaktadır.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Üst Bilgi Kartları */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                badgeContent={
                                    <Box
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            bgcolor: 'success.main',
                                            borderRadius: '50%',
                                            border: '2px solid white'
                                        }}
                                    />
                                }
                            >
                                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                                    <Users />
                                </Avatar>
                            </Badge>
                            <Box sx={{ ml: 2 }}>
                                <Typography variant="h4" fontWeight="bold">
                                    {activeStudents}
                                </Typography>
                                <Typography variant="subtitle1" color="text.secondary">
                                    Aktif Öğrenci
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}>
                                <BookOpen />
                            </Avatar>
                            <Box sx={{ ml: 2 }}>
                                <Typography variant="h4" fontWeight="bold">
                                    {totalAssignments}
                                </Typography>
                                <Typography variant="subtitle1" color="text.secondary">
                                    Toplam Ödev
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Ana Menü */}
            <Grid container spacing={3}>
                {menuItems.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.path}>
                        <Card 
                            sx={{ 
                                cursor: 'pointer',
                                height: '100%',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)'
                                }
                            }}
                            onClick={() => navigate(item.path)}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Avatar sx={{ bgcolor: item.color }}>
                                        {item.icon}
                                    </Avatar>
                                    <Typography 
                                        variant="h6" 
                                        sx={{ 
                                            ml: 2,
                                            fontWeight: 'bold',
                                            background: `linear-gradient(45deg, ${item.color}, ${item.color}88)`,
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            color: 'transparent'
                                        }}
                                    >
                                        {item.title}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    {item.description}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
