import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { authRepository } from '@/server/repositories/authRepository';
import { quizizzRepository } from '@/server/repositories/quizizzRepository';
import { loadQuizizzDashboardData, toggleQuizizzCompletion } from '@/features/content/model/quizizzUseCases';

export interface QuizizzCode {
    id: string;
    code: string;
    subject: string;
    grade: string;
    scheduled_time: string;
    is_active: boolean;
}

export const useQuizizzCodes = () => {
    const { user } = useAuth();
    const [codes, setCodes] = useState<QuizizzCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [userGrade, setUserGrade] = useState<string | null>(null);
    const [isVip, setIsVip] = useState(false);
    const [completedCodes, setCompletedCodes] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchUserAndCodes = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const dashboardData = await loadQuizizzDashboardData(user.id, {
                    getProfileByUserId: authRepository.getProfileByUserId,
                    listActiveCodesByGrade: quizizzRepository.listActiveCodesByGrade,
                    listCompletedCodeIds: quizizzRepository.listCompletedCodeIds,
                    markCodeCompleted: quizizzRepository.markCodeCompleted,
                    unmarkCodeCompleted: quizizzRepository.unmarkCodeCompleted
                });

                setUserGrade(dashboardData.userGrade);
                setIsVip(dashboardData.isVip);
                setCodes(dashboardData.codes);
                setCompletedCodes(new Set(dashboardData.completedCodeIds));
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Veriler yüklenirken bir hata oluştu.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndCodes();
    }, [user]);

    const toggleCompletion = useCallback(async (codeId: string) => {
        if (!user?.id || !isVip) return;

        const isCompleted = completedCodes.has(codeId);

        try {
            const result = await toggleQuizizzCompletion(
                {
                    userId: user.id,
                    codeId,
                    isVip,
                    isCompleted
                },
                {
                    markCodeCompleted: quizizzRepository.markCodeCompleted,
                    unmarkCodeCompleted: quizizzRepository.unmarkCodeCompleted
                }
            );

            if (!result.changed) {
                return;
            }

            if (result.isCompleted) {
                setCompletedCodes(prev => new Set([...prev, codeId]));
                toast.success('Tamamlandı olarak işaretlendi! ✅');
            } else {
                setCompletedCodes(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(codeId);
                    return newSet;
                });
                toast.success('İşaret kaldırıldı');
            }
        } catch (error) {
            console.error('Error toggling completion:', error);
            toast.error('Bir hata oluştu');
        }
    }, [user, isVip, completedCodes]);

    return {
        codes,
        loading,
        userGrade,
        isVip,
        completedCodes,
        toggleCompletion,
    };
};
