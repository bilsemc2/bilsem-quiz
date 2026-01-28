import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { showXPDeduct, showXPError } from '../components/XPToast';

interface XPTransactionResult {
    success: boolean;
    newBalance?: number;
    error?: string;
}

export const useXPEconomy = () => {
    const { user, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);

    const checkBalance = useCallback(async (requiredAmount: number): Promise<boolean> => {
        if (!user) return false;

        const { data, error } = await supabase
            .from('profiles')
            .select('experience')
            .eq('id', user.id)
            .single();

        if (error || !data) return false;

        return (data.experience || 0) >= requiredAmount;
    }, [user]);

    const deductXP = useCallback(async (amount: number, reason: string): Promise<XPTransactionResult> => {
        if (!user) return { success: false, error: 'User not found' };

        setLoading(true);
        try {
            // 1. Get current balance
            const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('experience')
                .eq('id', user.id)
                .single();

            if (fetchError || !profile) {
                throw new Error('Bakiye kontrol edilemedi');
            }

            const currentXP = profile.experience || 0;

            if (currentXP < amount) {
                showXPError('Yetersiz XP!');
                return { success: false, error: 'Insufficient funds' };
            }

            // 2. Deduct XP
            const newExperience = currentXP - amount;
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ experience: newExperience })
                .eq('id', user.id);

            if (updateError) {
                throw new Error('XP düşülemedi');
            }

            // 3. Log transaction
            await supabase.from('experience_log').insert({
                user_id: user.id,
                change_amount: -amount,
                old_experience: currentXP,
                new_experience: newExperience,
                change_reason: reason
            });

            // 4. Update Global State
            if (refreshProfile) {
                await refreshProfile();
            }

            // 5. Show Feedback
            showXPDeduct(amount, reason);

            return { success: true, newBalance: newExperience };

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Bir hata oluştu';
            console.error('XP Transaction Error:', error);
            showXPError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    }, [user, refreshProfile]);

    return {
        checkBalance,
        deductXP,
        loading
    };
};
