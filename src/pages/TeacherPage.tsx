import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import XPWarning from '../components/XPWarning';

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
    const requiredXP = 10;

    useEffect(() => {
        if (!state?.wrongAnswer) {
            navigate('/');
            return;
        }

        const checkAndUpdateXP = async () => {
            setLoading(true);
            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                // Kullanıcının XP'sini al
                const { data: userData, error: fetchError } = await supabase
                    .from('profiles')
                    .select('experience')
                    .eq('id', user.id)
                    .single();

                if (fetchError) throw fetchError;

                const currentXP = userData?.experience || 0;
                setUserXP(currentXP);

                if (currentXP < requiredXP) {
                    setShowXPWarning(true);
                    setLoading(false);
                    return;
                }

                // XP'yi azalt
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        experience: currentXP - requiredXP
                    })
                    .eq('id', user.id);

                if (updateError) throw updateError;

                toast.success(`${requiredXP} XP harcandı!`);
                setUserXP(currentXP - requiredXP);

            } catch (error) {
                console.error('XP kontrolü sırasında hata:', error);
                toast.error('Bir hata oluştu!');
            } finally {
                setLoading(false);
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
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
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

                    {/* Soru Numarası */}
                    <div className="mb-4">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium">
                            {wrongAnswer.questionImage.match(/Soru-(\d+)\.webp/)?.[1] || wrongAnswer.questionNumber}
                        </span>
                    </div>

                    {/* Soru Görseli */}
                    <div className="flex justify-center my-6">
                        <img
                            src={wrongAnswer.questionImage}
                            alt={`Soru ${wrongAnswer.questionNumber}`}
                            className="max-h-[300px] object-contain rounded-lg"
                        />
                    </div>

                    {/* Seçenekler */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
                        {wrongAnswer.options.map((option, index) => (
                            <div
                                key={index}
                                className={`
                                    relative rounded-lg overflow-hidden border-2
                                    ${option.isCorrect ? 'border-emerald-500' : 
                                      option.isSelected ? 'border-red-500' : 'border-gray-200'}
                                `}
                            >
                                <img
                                    src={option.imageUrl}
                                    alt={`Seçenek ${index + 1}`}
                                    className="w-full h-auto"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Ersan Öğretmen Açıklama Butonu */}
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
