import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const useXPCheck = (userId: string | undefined, pagePath: string) => {
    const [hasEnoughXP, setHasEnoughXP] = useState(false);
    const [userXP, setUserXP] = useState<number | null>(null);
    const [requiredXP, setRequiredXP] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const checkXPRequirement = async () => {
            try {
                if (isMounted) setLoading(true);
                if (isMounted) setError(null);

                console.log('=== useXPCheck Debug Logs ===');
                console.log('1. Başlangıç parametreleri:');
                console.log('userId:', userId);
                console.log('pagePath:', pagePath);

                if (!userId) {
                    console.log('userId bekleniyor...');
                    if (isMounted) {
                        setUserXP(0);
                        setRequiredXP(0);
                        setHasEnoughXP(false);
                        setLoading(false);
                    }
                    return;
                }

                // Kullanıcı profilini al
                console.log('2. Profil sorgusu yapılıyor...');
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                console.log('3. Profil sorgu sonuçları:');
                console.log('Profil:', profile);
                console.log('Profil hatası:', profileError);

                if (profileError) {
                    console.error('Profil getirme hatası:', profileError);
                    if (isMounted) {
                        setError('Profil bilgileri alınamadı');
                        setLoading(false);
                    }
                    return;
                }

                if (!profile) {
                    console.error('Profil bulunamadı');
                    if (isMounted) {
                        setError('Profil bulunamadı');
                        setLoading(false);
                    }
                    return;
                }

                // XP gereksinimini al
                console.log('4. XP gereksinimi sorgusu yapılıyor...');
                const { data: xpRequirement, error: xpError } = await supabase
                    .from('xp_requirements')
                    .select('required_xp')
                    .eq('page_path', pagePath)
                    .single();

                console.log('5. XP gereksinimi sorgu sonuçları:');
                console.log('XP gereksinimi:', xpRequirement);
                console.log('XP hatası:', xpError);

                if (xpError && xpError.code !== 'PGRST116') {
                    console.error('XP gereksinimi hatası:', xpError);
                    if (isMounted) {
                        setError('XP gereksinimi alınamadı');
                        setLoading(false);
                    }
                    return;
                }

                const currentXP = profile.experience || 0;
                const requiredAmount = xpRequirement?.required_xp || 0;
                const hasEnough = currentXP >= requiredAmount;

                console.log('6. Hesaplanan değerler:');
                console.log('Mevcut XP:', currentXP, 'typeof:', typeof currentXP);
                console.log('Gereken XP:', requiredAmount, 'typeof:', typeof requiredAmount);
                console.log('Yeterli XP?:', hasEnough);

                if (isMounted) {
                    setUserXP(currentXP);
                    setRequiredXP(requiredAmount);
                    setHasEnoughXP(hasEnough);
                    setLoading(false);
                }

                console.log('7. State güncellendi');

            } catch (error) {
                console.error('XP kontrolü yapılırken hata:', error);
                if (isMounted) {
                    setError('XP kontrolü yapılırken bir hata oluştu');
                    setLoading(false);
                }
            }
        };

        checkXPRequirement();

        return () => {
            isMounted = false;
        };
    }, [userId, pagePath]);

    // Return değerlerini logla
    console.log('8. Hook return değerleri:', {
        hasEnoughXP,
        userXP: userXP || 0,
        requiredXP: requiredXP || 0,
        error,
        loading
    });

    return { 
        hasEnoughXP, 
        userXP: userXP || 0, 
        requiredXP: requiredXP || 0, 
        error, 
        loading 
    };
};