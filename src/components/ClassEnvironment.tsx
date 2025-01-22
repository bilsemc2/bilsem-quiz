import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, Typography, Grid, Button } from '@mui/material';
import { toast } from 'react-toastify';
import QuizIcon from '@mui/icons-material/Quiz';

interface Quiz {
    id: string;
    title: string;
    description: string;
    created_at: string;
    questions: any[];
    difficulty: string;
}

interface ClassQuiz extends Quiz {
    assigned_at: string;
    assigned_by: string;
    completed: boolean;
    score?: number;
}

const ClassEnvironment: React.FC = () => {
    const { grade } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [classQuizzes, setClassQuizzes] = useState<ClassQuiz[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClassQuizzes();
    }, [grade, user]);

    const fetchClassQuizzes = async () => {
        if (!user || !grade) return;

        try {
            setLoading(true);

            // Önce öğrencinin sınıf ID'sini al
            const { data: classData, error: classError } = await supabase
                .from('class_students')
                .select('class_id')
                .eq('student_id', user.id)
                .single();

            if (classError) throw classError;

            // Sınıfa atanmış quizleri getir
            const { data: quizzes, error: quizError } = await supabase
                .from('quiz_class_assignments')
                .select(`
                    quiz_id,
                    assigned_at,
                    assigned_by,
                    quiz:quizzes (
                        id,
                        title,
                        description,
                        created_at,
                        questions,
                        difficulty
                    )
                `)
                .eq('class_id', classData.class_id);

            if (quizError) throw quizError;

            // Quiz sonuçlarını getir
            const { data: results, error: resultError } = await supabase
                .from('quiz_results')
                .select('quiz_id, score')
                .eq('user_id', user.id);

            if (resultError) throw resultError;

            // Quizleri ve sonuçları birleştir
            const formattedQuizzes = quizzes.map(qa => {
                const result = results?.find(r => r.quiz_id === qa.quiz.id);
                return {
                    ...qa.quiz,
                    assigned_at: qa.assigned_at,
                    assigned_by: qa.assigned_by,
                    completed: !!result,
                    score: result?.score
                };
            });

            setClassQuizzes(formattedQuizzes);
        } catch (error) {
            console.error('Sınıf quizleri yüklenirken hata:', error);
            toast.error('Quizler yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const startQuiz = (quizId: string) => {
        navigate(`/quiz/${quizId}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Typography variant="h4" component="h1" gutterBottom>
                {grade}. Sınıf Quizleri
            </Typography>

            {classQuizzes.length === 0 ? (
                <Typography variant="body1" color="textSecondary">
                    Henüz bu sınıfa atanmış quiz bulunmuyor.
                </Typography>
            ) : (
                <Grid container spacing={3}>
                    {classQuizzes.map((quiz) => (
                        <Grid item xs={12} sm={6} md={4} key={quiz.id}>
                            <Card className="h-full">
                                <CardContent>
                                    <div className="flex items-center mb-4">
                                        <QuizIcon className="text-blue-500 mr-2" />
                                        <Typography variant="h6" component="h2">
                                            {quiz.title}
                                        </Typography>
                                    </div>
                                    
                                    <Typography variant="body2" color="textSecondary" paragraph>
                                        {quiz.description}
                                    </Typography>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                            {quiz.questions.length} Soru
                                        </span>
                                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                                            {quiz.difficulty}
                                        </span>
                                        {quiz.completed && (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                                Skor: {quiz.score}%
                                            </span>
                                        )}
                                    </div>

                                    <Button
                                        variant="contained"
                                        color={quiz.completed ? "secondary" : "primary"}
                                        fullWidth
                                        onClick={() => startQuiz(quiz.id)}
                                    >
                                        {quiz.completed ? "Tekrar Çöz" : "Quizi Başlat"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </div>
    );
};

export default ClassEnvironment;
