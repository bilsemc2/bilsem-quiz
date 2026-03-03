import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Crown, ArrowLeft } from 'lucide-react';
import { showXPDeduct } from './XPToast';
import { checkVipAccessForPath, deductVipXPForPageVisit } from '@/features/auth/model/vipAccessUseCases';
import { authRepository } from '@/server/repositories/authRepository';
import { xpRepository } from '@/server/repositories/xpRepository';

interface RequireVipProps {
    children: React.ReactNode;
}

export default function RequireVip({ children }: RequireVipProps) {
    const { user, loading: authLoading } = useAuth();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [isVip, setIsVip] = useState(false);

    // XP düşürme işleminin bu ziyaret için yapılıp yapılmadığını takip et
    const xpDeductionAttemptedRef = useRef(false);

    useEffect(() => {
        // Sayfa değiştiğinde ref'i sıfırla
        xpDeductionAttemptedRef.current = false;
    }, [location.pathname]);

    useEffect(() => {
        const checkVipStatus = async () => {
            if (authLoading) return;

            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const accessResult = await checkVipAccessForPath({
                    userId: user.id,
                    pagePath: location.pathname
                }, {
                    auth: authRepository,
                    xp: xpRepository
                });

                setIsVip(accessResult.hasVipAccess);

                if (accessResult.shouldDeductXP && !xpDeductionAttemptedRef.current) {
                    xpDeductionAttemptedRef.current = true;

                    const transactionResult = await deductVipXPForPageVisit({
                        pagePath: location.pathname,
                        requiredXP: accessResult.requiredXP
                    }, {
                        auth: authRepository,
                        xp: xpRepository
                    });

                    if (transactionResult.success && transactionResult.change < 0) {
                        showXPDeduct(Math.abs(transactionResult.change), 'Atölye erişimi');
                    }
                }

                setLoading(false);
            } catch (error) {
                console.error('VIP kontrol hatası:', error);
                setLoading(false);
            }
        };

        checkVipStatus();
    }, [user, authLoading, location.pathname]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent mx-auto" />
                    <p className="mt-4 text-slate-400">Kontrol ediliyor...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isVip) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    {/* Lock Icon */}
                    <div className="relative inline-flex mb-8">
                        <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/30">
                            <Lock className="w-12 h-12 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-white mb-4">
                        VIP Üyelik Gerekli
                    </h1>

                    {/* Description */}
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Bu içeriğe erişmek için VIP üyeliğinizin olması gerekmektedir.
                        VIP üyelik ile tüm atölyelere ve özel içeriklere sınırsız erişim kazanın!
                    </p>

                    {/* Benefits */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8 text-left">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <Crown className="w-5 h-5 text-amber-400" />
                            VIP Avantajları
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-300">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                Yeteneğinize bağlı atölyeye sınırsız erişim
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                Özel içerikler ve oyunlar
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                PDF oluşturma özelliği
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                Öncelikli destek
                            </li>
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Link
                            to="/pricing"
                            className="block w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/30"
                        >
                            VIP Üyelik Al
                        </Link>
                        <Link
                            to="/bilsem"
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Geri Dön
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
