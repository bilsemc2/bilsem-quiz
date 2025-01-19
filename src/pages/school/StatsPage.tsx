import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Grid, Card, CardContent } from '@mui/material';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface StudentStats {
    totalAssignments: number;
    completedAssignments: number;
    averageScore: number;
    totalQuestions: number;
    correctAnswers: number;
    subjectPerformance: {
        [key: string]: {
            total: number;
            correct: number;
            count: number;
        };
    };
    recentScores: {
        title: string;
        score: number;
        total: number;
    }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const StatsPage = () => {
    const { studentId } = useParams();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<StudentStats>({
        totalAssignments: 0,
        completedAssignments: 0,
        averageScore: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        subjectPerformance: {},
        recentScores: []
    });
    const [studentName, setStudentName] = useState('');

    useEffect(() => {
        if (studentId) {
            fetchStudentInfo();
            fetchStats();
        }
    }, [studentId]);

    const fetchStudentInfo = async () => {
        if (!studentId) return;

        try {
            const { data: student, error } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', studentId)
                .single();

            if (error) throw error;
            setStudentName(student.name);
        } catch (error) {
            console.error('Öğrenci bilgisi alınırken hata:', error);
            toast.error('Öğrenci bilgisi alınamadı');
        }
    };

    const fetchStats = async () => {
        if (!studentId) return;

        try {
            // Tüm ödev sonuçlarını alalım
            const { data: results, error: resultsError } = await supabase
                .from('assignment_results')
                .select(`
                    *,
                    assignments (
                        title,
                        subject,
                        questions
                    )
                `)
                .eq('student_id', studentId)
                .order('completed_at', { ascending: false });

            if (resultsError) throw resultsError;

            // İstatistikleri hesaplayalım
            const subjectPerf: { [key: string]: { total: number; correct: number; count: number } } = {};
            let totalCorrect = 0;
            let totalQuestions = 0;

            results?.forEach(result => {
                const subject = result.assignments.subject || 'Diğer';
                if (!subjectPerf[subject]) {
                    subjectPerf[subject] = { total: 0, correct: 0, count: 0 };
                }
                
                subjectPerf[subject].total += result.total_questions;
                subjectPerf[subject].correct += result.score;
                subjectPerf[subject].count += 1;
                
                totalCorrect += result.score;
                totalQuestions += result.total_questions;
            });

            const recentScores = results?.slice(0, 5).map(result => ({
                title: result.assignments.title,
                score: result.score,
                total: result.total_questions
            })) || [];

            setStats({
                totalAssignments: results?.length || 0,
                completedAssignments: results?.filter(r => r.status === 'completed').length || 0,
                averageScore: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
                totalQuestions,
                correctAnswers: totalCorrect,
                subjectPerformance: subjectPerf,
                recentScores
            });

        } catch (error) {
            console.error('İstatistikler alınırken hata:', error);
            toast.error('İstatistikler alınırken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const prepareSubjectData = () => {
        return Object.entries(stats.subjectPerformance).map(([subject, data]) => ({
            subject,
            başarı: ((data.correct / data.total) * 100).toFixed(1),
            quiz: data.count
        }));
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
                <Typography variant="h4" gutterBottom>
                    {studentName} - İstatistikler
                </Typography>

                <Grid container spacing={3}>
                    {/* Genel İstatistikler */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Genel Durum
                                </Typography>
                                <Typography variant="body1">
                                    Toplam Quiz: {stats.totalAssignments}
                                </Typography>
                                <Typography variant="body1">
                                    Tamamlanan: {stats.completedAssignments}
                                </Typography>
                                <Typography variant="body1">
                                    Ortalama Başarı: %{stats.averageScore.toFixed(1)}
                                </Typography>
                                <Typography variant="body1">
                                    Toplam Soru: {stats.totalQuestions}
                                </Typography>
                                <Typography variant="body1">
                                    Doğru Cevap: {stats.correctAnswers}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Konu Bazlı Performans */}
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Konu Bazlı Performans
                                </Typography>
                                <Box sx={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={prepareSubjectData()}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="subject" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="başarı" fill="#8884d8" name="Başarı %" />
                                            <Bar dataKey="quiz" fill="#82ca9d" name="Quiz Sayısı" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Son Quiz Sonuçları */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Son Quiz Sonuçları
                                </Typography>
                                <Box sx={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.recentScores}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="title" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="score" fill="#8884d8" name="Alınan Puan" />
                                            <Bar dataKey="total" fill="#82ca9d" name="Toplam Puan" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default StatsPage;
