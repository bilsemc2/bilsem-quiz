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
            // Get auth session for Edge Function call
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error('Oturum bulunamadı');
            }

            // Call secure Edge Function for atomic XP deduction
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/xp-transaction`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ action: 'deduct', amount, reason }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.error === 'Insufficient XP') {
                    showXPError('Yetersiz XP!');
                    return { success: false, error: 'Insufficient funds' };
                }
                throw new Error(errorData.error || 'XP düşülemedi');
            }

            const result = await response.json();

            // Update global state
            if (refreshProfile) {
                await refreshProfile();
            }

            // Show feedback (only if XP was actually deducted)
            if (result.change !== 0) {
                showXPDeduct(amount, reason);
            }

            return { success: true, newBalance: result.newXP };

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Bir hata oluştu';
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
