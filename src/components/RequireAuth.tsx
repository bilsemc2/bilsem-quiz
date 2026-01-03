import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import XPWarning from './XPWarning';
import { showXPDeduct } from './XPToast';

interface RequireAuthProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
    requireTeacher?: boolean;
    skipXPCheck?: boolean;
}

export default function RequireAuth({ children, requireAdmin = false, requireTeacher = false, skipXPCheck = false }: RequireAuthProps) {
    const { user, loading: authLoading } = useAuth();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [userXP, setUserXP] = useState(0);
    const [requiredXP, setRequiredXP] = useState(0);
    const [hasAccess, setHasAccess] = useState(false);

    // XP düşürme işleminin bu ziyaret için yapılıp yapılmadığını takip et
    const xpDeductionAttemptedRef = useRef(false);

    useEffect(() => {
        // Sayfa değiştiğinde ref'i sıfırla
        xpDeductionAttemptedRef.current = false;
    }, [location.pathname]);

    useEffect(() => {
        const checkAccess = async () => {
            if (authLoading) return;

            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Kullanıcının XP'sini ve rolünü al
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('experience, is_admin, role')
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

                // Admin veya öğretmen kontrolü
                if (requireAdmin && !profile.is_admin && profile.role !== 'teacher') {
                    setHasAccess(false);
                    setLoading(false);
                    return;
                }

                // Sadece öğretmen gerektiren sayfalar için kontrol
                if (requireTeacher && !profile.is_admin && profile.role !== 'teacher') {
                    setHasAccess(false);
                    setLoading(false);
                    return;
                }

                // Admin ise veya XP kontrolü atlanacaksa direkt erişim ver
                if (profile.is_admin || profile.role === 'teacher' || skipXPCheck) {
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
                const userHasAccess = profile.experience >= requiredAmount;
                setHasAccess(userHasAccess);

                // XP düşürme işlemi (sadece erişim varsa ve gereksinim > 0 ise)
                if (userHasAccess && requiredAmount > 0 && !xpDeductionAttemptedRef.current) {
                    xpDeductionAttemptedRef.current = true;

                    // Son 5 dakika içinde bu sayfa için XP düşürülmüş mü kontrol et
                    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
                    const reasonForVisit = `Sayfa ziyareti: ${location.pathname}`;

                    const { count: recentLogCount, error: recentLogError } = await supabase
                        .from('experience_log')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', user.id)
                        .eq('change_reason', reasonForVisit)
                        .gte('changed_at', fiveMinutesAgo);

                    if (recentLogError) {
                        console.warn('Recent log check failed:', recentLogError.message);
                    } else if (recentLogCount === null || recentLogCount === 0) {
                        // XP düşür
                        const newExperience = profile.experience - requiredAmount;

                        const { error: updateErr } = await supabase
                            .from('profiles')
                            .update({ experience: newExperience })
                            .eq('id', user.id);

                        if (!updateErr) {
                            // Log kaydet
                            await supabase.from('experience_log').insert({
                                user_id: user.id,
                                change_amount: -requiredAmount,
                                old_experience: profile.experience,
                                new_experience: newExperience,
                                change_reason: reasonForVisit
                            });

                            // Modern toast göster
                            showXPDeduct(requiredAmount, 'Oyun erişimi');
                            setUserXP(newExperience);
                        } else {
                            console.error('XP güncelleme hatası:', updateErr);
                        }
                    }
                }

                setLoading(false);

            } catch (error) {
                console.error('Erişim kontrolü sırasında hata:', error);
                setLoading(false);
            }
        };

        checkAccess();
    }, [user, location.pathname, requireAdmin, requireTeacher, skipXPCheck, authLoading]);

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
            <XPWarning
                requiredXP={requiredXP}
                currentXP={userXP}
                title="Bu Sayfaya Erişmek için XP Yetersiz"
            />
        );
    }

    return <>{children}</>;
}

