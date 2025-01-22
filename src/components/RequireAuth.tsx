import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import XPWarning from './XPWarning';

interface RequireAuthProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
    skipXPCheck?: boolean;
}

export default function RequireAuth({ children, requireAdmin = false, skipXPCheck = false }: RequireAuthProps) {
    const { user, loading: authLoading } = useAuth();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [userXP, setUserXP] = useState(0);
    const [requiredXP, setRequiredXP] = useState(0);
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            if (authLoading) return;

            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Kullanıcının XP'sini al
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('experience, is_admin')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profileError) {
                    console.error('Profil bilgisi alınırken hata:', profileError);
                    setLoading(false);
                    return;
                }

                if (!profile) {
                    console.error('Profil bulunamadı');
                    setLoading(false);
                    return;
                }

                setUserXP(profile.experience || 0);

                // Admin kontrolü
                if (requireAdmin && !profile.is_admin) {
                    setHasAccess(false);
                    setLoading(false);
                    return;
                }

                // Admin ise veya XP kontrolü atlanacaksa direkt erişim ver
                if (profile.is_admin || skipXPCheck) {
                    setHasAccess(true);
                    setLoading(false);
                    return;
                }

                // Sayfa için gereken XP'yi kontrol et
                const { data: xpRequirement, error: xpError } = await supabase
                    .from('xp_requirements')
                    .select('required_xp')
                    .eq('page_path', location.pathname)
                    .maybeSingle();

                if (xpError) {
                    console.error('XP gereksinimi kontrol edilirken hata:', xpError);
                    // XP gereksinimi yoksa erişime izin ver
                    setHasAccess(true);
                    setLoading(false);
                    return;
                }

                const requiredAmount = xpRequirement?.required_xp || 0;
                setRequiredXP(requiredAmount);

                // XP kontrolü
                setHasAccess(profile.experience >= requiredAmount);
                setLoading(false);

            } catch (error) {
                console.error('Erişim kontrolü sırasında hata:', error);
                setLoading(false);
            }
        };

        checkAccess();
    }, [user, location.pathname, requireAdmin, skipXPCheck, authLoading]);

    // Auth yükleniyorsa bekle
    if (authLoading || loading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Yükleniyor...</p>
            </div>
        </div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!hasAccess) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="flex items-center justify-center min-h-[80vh]">
                    <XPWarning
                        requiredXP={requiredXP}
                        currentXP={userXP}
                        title="Bu Sayfaya Erişmek için XP Yetersiz"
                    />
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
