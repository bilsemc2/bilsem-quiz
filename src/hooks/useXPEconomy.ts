import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { showXPDeduct, showXPError } from '../components/XPToast';
import { checkXPBalance, performXPTransaction } from '@/features/xp/model/xpUseCases';

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

        return checkXPBalance({
            userId: user.id,
            requiredAmount
        });
    }, [user]);

    const deductXP = useCallback(async (amount: number, reason: string): Promise<XPTransactionResult> => {
        if (!user) return { success: false, error: 'User not found' };

        setLoading(true);
        try {
            const result = await performXPTransaction({
                action: 'deduct',
                amount,
                reason
            });

            if (!result.success) {
                if (result.error === 'Insufficient XP') {
                    showXPError('Yetersiz XP!');
                    return { success: false, error: 'Insufficient funds' };
                }
                throw new Error(result.error || 'XP düşülemedi');
            }

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
