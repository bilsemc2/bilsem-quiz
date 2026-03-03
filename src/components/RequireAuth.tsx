import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import XPWarning from './XPWarning';
import { showXPDeduct } from './XPToast';
import { checkUserAccessForPath, deductXPForPageVisit } from '@/features/auth/model/accessGateUseCases';

interface RequireAuthProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
    requireTeacher?: boolean;
    skipXPCheck?: boolean;
    requiredTalent?: string;
}

export default function RequireAuth({ children, requireAdmin = false, requireTeacher = false, skipXPCheck = false, requiredTalent }: RequireAuthProps) {
    const { user, loading: authLoading } = useAuth();
    const location = useLocation();
    const isArcadeMode = Boolean((location.state as { arcadeMode?: boolean } | null)?.arcadeMode);
    const [loading, setLoading] = useState(true);
    const [userXP, setUserXP] = useState(0);
    const [requiredXP, setRequiredXP] = useState(0);
    const [hasAccess, setHasAccess] = useState(false);
    const [accessDeniedReason, setAccessDeniedReason] = useState<'xp' | 'talent' | 'role' | null>(null);
    const [userTalent, setUserTalent] = useState<string | string[] | null>(null);

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
                const accessResult = await checkUserAccessForPath({
                    userId: user.id,
                    pagePath: location.pathname,
                    requireAdmin,
                    requireTeacher,
                    requiredTalent,
                    skipXPCheck: skipXPCheck || isArcadeMode
                });

                setUserXP(accessResult.userXP);
                setRequiredXP(accessResult.requiredXP);
                setHasAccess(accessResult.hasAccess);
                setAccessDeniedReason(accessResult.reason);

                if (accessResult.reason === 'talent') {
                    setUserTalent(accessResult.userTalent);
                } else {
                    setUserTalent(null);
                }

                // XP düşürme işlemi — Server-side Edge Function ile atomik
                if (accessResult.hasAccess && accessResult.requiredXP > 0 && !xpDeductionAttemptedRef.current) {
                    xpDeductionAttemptedRef.current = true;

                    try {
                        const result = await deductXPForPageVisit({
                            pagePath: location.pathname,
                            requiredXP: accessResult.requiredXP
                        });

                        if (result.success && result.change !== 0) {
                            showXPDeduct(accessResult.requiredXP, 'Oyun erişimi');
                            setUserXP(result.newXP);
                        }
                    } catch {
                        // Edge Function erişim hatası — sessizce devam et
                    }
                }

                setLoading(false);

            } catch (error) {
                console.error('Erişim kontrolü sırasında hata:', error);
                setLoading(false);
            }
        };

        checkAccess();
    }, [user, location.pathname, requireAdmin, requireTeacher, skipXPCheck, requiredTalent, isArcadeMode, authLoading]);

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
        if (accessDeniedReason === 'talent') {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-rose-900 to-slate-900 p-4">
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 max-w-md w-full text-center">
                        <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-10 h-10 text-rose-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-4">Bu Atölye Profilinize Uygun Değil</h1>
                        <p className="text-white/70 mb-8 leading-relaxed">
                            Müzik Atölyesi sadece yetenek alanı <strong>Müzik</strong> olan öğrencilerimiz içindir.
                            Sizin yetenek alanınız: <strong>{Array.isArray(userTalent) ? userTalent.join(', ') : (userTalent || 'Belirtilmemiş')}</strong>.
                        </p>
                        <button
                            onClick={() => window.history.back()}
                            className="w-full py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/10"
                        >
                            Geri Dön
                        </button>
                    </div>
                </div>
            );
        }

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
