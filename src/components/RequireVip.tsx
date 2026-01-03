import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Lock, Crown, ArrowLeft } from 'lucide-react';
import { showXPDeduct } from './XPToast';

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
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('is_vip, is_admin, role, experience')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('VIP kontrol hatası:', error);
                    setLoading(false);
                    return;
                }

                // Admin ve öğretmenler de VIP olarak kabul edilir
                const hasVipAccess = profile?.is_vip || profile?.is_admin || profile?.role === 'teacher';
                setIsVip(hasVipAccess);

                // XP düşürme işlemi (VIP erişimi varsa ve admin/öğretmen değilse)
                if (hasVipAccess && !profile?.is_admin && profile?.role !== 'teacher' && !xpDeductionAttemptedRef.current) {
                    xpDeductionAttemptedRef.current = true;

                    // Bu sayfa için XP gereksinimi var mı?
                    const { data: xpRequirement } = await supabase
                        .from('xp_requirements')
                        .select('required_xp')
                        .eq('page_path', location.pathname)
                        .maybeSingle();

                    const requiredAmount = xpRequirement?.required_xp || 0;

                    if (requiredAmount > 0 && (profile.experience || 0) >= requiredAmount) {
                        // Son 5 dakika içinde bu sayfa için XP düşürülmüş mü kontrol et
                        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
                        const reasonForVisit = `Sayfa ziyareti: ${location.pathname}`;

                        const { count: recentLogCount, error: recentLogError } = await supabase
                            .from('experience_log')
                            .select('*', { count: 'exact', head: true })
                            .eq('user_id', user.id)
                            .eq('change_reason', reasonForVisit)
                            .gte('changed_at', fiveMinutesAgo);

                        if (!recentLogError && (recentLogCount === null || recentLogCount === 0)) {
                            // XP düşür
                            const currentXP = profile.experience || 0;
                            const newExperience = currentXP - requiredAmount;

                            const { error: updateErr } = await supabase
                                .from('profiles')
                                .update({ experience: newExperience })
                                .eq('id', user.id);

                            if (!updateErr) {
                                // Log kaydet
                                await supabase.from('experience_log').insert({
                                    user_id: user.id,
                                    change_amount: -requiredAmount,
                                    old_experience: currentXP,
                                    new_experience: newExperience,
                                    change_reason: reasonForVisit
                                });

                                // Modern toast göster
                                showXPDeduct(requiredAmount, 'Atölye erişimi');
                            }
                        }
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

