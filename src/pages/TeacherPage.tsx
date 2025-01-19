import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import XPWarning from '../components/XPWarning';
import LoadingSpinner from '../components/LoadingSpinner';
import QuestionHeader from '../components/QuestionHeader';
import QuestionImage from '../components/QuestionImage';
import QuestionOptions from '../components/QuestionOptions';

interface WrongAnswer {
    questionNumber: number;
    questionImage: string;
    selectedOption: string | null;
    correctOption: string;
    options: Array<{
        id: string;
        imageUrl: string;
        isSelected: boolean;
        isCorrect: boolean;
    }>;
}

interface LocationState {
    wrongAnswer: WrongAnswer;
    quizId: string;
}

export const TeacherPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const state = location.state as LocationState;
    const [userXP, setUserXP] = useState<number>(0);
    const [showXPWarning, setShowXPWarning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [xpChecked, setXPChecked] = useState(false);
    const requiredXP = 10;

    useEffect(() => {
        if (!state?.wrongAnswer) {
            navigate('/');
            return;
        }

        const checkAndUpdateXP = async () => {
            if (!user?.id) return;

            try {
                // Önce kullanıcının XP'sini kontrol et
                const { data: profile, error: fetchError } = await supabase
                    .from('profiles')
                    .select('experience')
                    .eq('id', user.id)
                    .single();

                if (fetchError) throw fetchError;

                // XP yetersizse uyarı göster
                if (!profile || profile.experience < requiredXP) {
                    setShowXPWarning(true);
                    return;
                }

                // XP yeterliyse düş
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ experience: profile.experience - requiredXP })
                    .eq('id', user.id);

                if (updateError) throw updateError;

                // Sadece başarılı güncelleme sonrası toast göster
                toast.success(`${requiredXP} XP harcandı!`, {
                    position: "top-right",
                    autoClose: 2000
                });

                setShowXPWarning(false);
                setXPChecked(true);
            } catch (error) {
                console.error('XP kontrolü veya güncelleme hatası:', error);
                toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
            }
        };

        checkAndUpdateXP();
    }, [user, state, navigate]);

    const generateExplanation = (wrongAnswer: WrongAnswer): string => {
        const questionNumber = wrongAnswer.questionImage.match(/Soru-(\d+)\.webp/)?.[1] || wrongAnswer.questionNumber;
        const correctOption = wrongAnswer.options.find(opt => opt.isCorrect)?.id || 'A';
        const selectedOption = wrongAnswer.selectedOption || 'hiçbir şey';

        return `
            Merhaba! ${questionNumber} numaralı soruyu birlikte çözelim.
            Bu soruda ${selectedOption} şıkkını seçmişsin, ancak doğru cevap ${correctOption} şıkkı.
            Hadi neden ${correctOption} şıkkının doğru olduğunu açıklayayım...
            [Burada soruya özel açıklama gelecek]
        `;
    };

    if (!state?.wrongAnswer) {
        navigate('/');
        return null;
    }

    if (loading) {
        return <LoadingSpinner />;
    }

    if (showXPWarning) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-full max-w-lg px-4">
                    <XPWarning
                        requiredXP={requiredXP}
                        currentXP={userXP}
                        title="Ersan Öğretmene Soru Sorma"
                    />
                </div>
            </div>
        );
    }

    const { wrongAnswer } = state;

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-8">
            <div className="max-w-7xl mx-auto px-4">
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                    className="mb-6 text-gray-700 hover:text-gray-900"
                    size="large"
                >
                    Geri Dön
                </Button>

                <Paper className="p-6 rounded-xl shadow-lg">
                    <Typography variant="h4" gutterBottom>
                        Ersan Öğretmen ile Çözüm
                    </Typography>

                    <QuestionHeader
                        questionNumber={wrongAnswer.questionImage.match(/Soru-(\d+)\.webp/)?.[1] || wrongAnswer.questionNumber}
                    />

                    <QuestionImage
                        imageUrl={wrongAnswer.questionImage}
                        alt={`Soru ${wrongAnswer.questionNumber}`}
                    />

                    <QuestionOptions
                        options={wrongAnswer.options}
                    />

                    <div className="mt-6 flex justify-center">
                        <Button
                            variant="contained"
                            color="primary"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg
                                     hover:from-blue-700 hover:to-indigo-700 transition-all duration-200
                                     flex items-center space-x-2"
                        >
                            <span>Ersan Öğretmenden Açıklama İste</span>
                        </Button>
                    </div>
                </Paper>
            </div>
        </div>
    );
};

export default TeacherPage;