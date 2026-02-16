import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

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
                // Get user profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('grade, is_vip')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setUserGrade(profile.grade);
                    setIsVip(profile.is_vip || false);
                }

                // Get quizizz codes for user's grade
                if (profile?.grade) {
                    const { data: quizizzCodes } = await supabase
                        .from('quizizz_codes')
                        .select('id, code, subject, grade, scheduled_time, is_active')
                        .eq('grade', profile.grade)
                        .eq('is_active', true)
                        .order('subject', { ascending: true });

                    if (quizizzCodes) {
                        setCodes(quizizzCodes);
                    }
                }

                // Get user's completed codes
                const { data: completions } = await supabase
                    .from('user_quizizz_completions')
                    .select('quizizz_code_id')
                    .eq('user_id', user.id);

                if (completions) {
                    setCompletedCodes(new Set(completions.map(c => c.quizizz_code_id)));
                }
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
            if (isCompleted) {
                // Remove completion
                await supabase
                    .from('user_quizizz_completions')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('quizizz_code_id', codeId);

                setCompletedCodes(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(codeId);
                    return newSet;
                });
                toast.success('İşaret kaldırıldı');
            } else {
                // Add completion
                await supabase
                    .from('user_quizizz_completions')
                    .insert({
                        user_id: user.id,
                        quizizz_code_id: codeId
                    });

                setCompletedCodes(prev => new Set([...prev, codeId]));
                toast.success('Tamamlandı olarak işaretlendi! ✅');
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
