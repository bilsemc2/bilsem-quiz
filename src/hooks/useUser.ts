import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface UserProfile {
    id: string;
    email: string;
    name: string;
    experience: number;
    [key: string]: unknown;
}

export const useUser = () => {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getCurrentUser = async () => {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError) {
                    console.error('Auth hatası:', authError);
                    throw authError;
                }

                console.log('Auth user:', user);

                if (user) {
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (profileError) {
                        console.error('Profil hatası:', profileError);
                        throw profileError;
                    }

                    if (!profile) {
                        console.error('Profil bulunamadı');
                        return;
                    }

                    console.log('Kullanıcı profili:', profile);
                    setCurrentUser(profile);
                } else {
                    console.log('Kullanıcı oturum açmamış');
                    setCurrentUser(null);
                }
            } catch (error) {
                console.error('Kullanıcı bilgileri alınırken hata:', error);
                setCurrentUser(null);
            } finally {
                setLoading(false);
            }
        };

        getCurrentUser();

        // Auth durumu değiştiğinde yeniden kontrol et
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                getCurrentUser();
            } else {
                setCurrentUser(null);
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return { currentUser, loading };
};