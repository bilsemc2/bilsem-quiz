import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Grid, Card, CardContent, Chip } from '@mui/material';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-toastify';

interface Quiz {
    id: string;
    title: string;
    description: string;
    subject: string;
    score: number;
    total_questions: number;
    completed_at: string;
    created_at: string;
}

const QuizzesPage = () => {
    const { studentId } = useParams();
    const [loading, setLoading] = useState(true);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [studentName, setStudentName] = useState('');

    useEffect(() => {
        if (studentId) {
            fetchStudentInfo();
            fetchQuizzes();
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

    const fetchQuizzes = async () => {
        if (!studentId) return;

        try {
            // Öğrencinin sınıf bilgisini alalım
            const { data: student, error: studentError } = await supabase
                .from('profiles')
                .select('grade')
                .eq('id', studentId)
                .single();

            if (studentError) throw studentError;

            // Tamamlanmış quizleri alalım
            const { data: results, error: resultsError } = await supabase
                .from('assignment_results')
                .select('*, assignments(*)')
                .eq('student_id', studentId)
                .order('completed_at', { ascending: false });

            if (resultsError) throw resultsError;

            // Sonuçları formatlayalım
            const formattedQuizzes = results?.map(result => ({
                id: result.id, 
                title: result.assignments.title,
                description: result.assignments.description,
                subject: result.assignments.subject,
                score: result.score,
                total_questions: result.total_questions,
                completed_at: result.completed_at,
                created_at: result.assignments.created_at
            }));

            setQuizzes(formattedQuizzes || []);
        } catch (error) {
            console.error('Quizler alınırken hata:', error);
            toast.error('Quizler alınırken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
                <Typography variant="h4" gutterBottom>
                    {studentName} - Quiz Sonuçları
                </Typography>

                <Grid container spacing={3}>
                    {quizzes.map((quiz, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        {quiz.title}
                                    </Typography>
                                    <Typography color="textSecondary" paragraph>
                                        {quiz.description}
                                    </Typography>
                                    <Box sx={{ mb: 2 }}>
                                        <Chip 
                                            label={quiz.subject}
                                            color="primary"
                                            size="small"
                                            sx={{ mr: 1 }}
                                        />
                                        <Chip 
                                            label={`${quiz.score}/${quiz.total_questions} Puan`}
                                            color={quiz.score === quiz.total_questions ? "success" : "warning"}
                                            size="small"
                                        />
                                    </Box>
                                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                        Tamamlanma: {new Date(quiz.completed_at).toLocaleDateString('tr-TR')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {quizzes.length === 0 && (
                    <Typography variant="body1" color="textSecondary" align="center" sx={{ mt: 3 }}>
                        Henüz tamamlanmış quiz bulunmuyor.
                    </Typography>
                )}
            </Paper>
        </Box>
    );
};

export default QuizzesPage;
