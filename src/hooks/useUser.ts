import { useEffect, useState } from 'react';
import { authRepository, type AuthProfileRecord } from '@/server/repositories/authRepository';

type UserProfile = AuthProfileRecord;

export const useUser = () => {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getCurrentUser = async () => {
            try {
                const user = await authRepository.getSessionUser();



                if (user) {
                    const profile = await authRepository.getProfileByUserId(user.id);

                    if (!profile) {
                        console.error('Profil bulunamadı');
                        return;
                    }

                    setCurrentUser(profile);
                } else {
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
        const subscription = authRepository.onAuthStateChange((authUser) => {
            if (authUser) {
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
