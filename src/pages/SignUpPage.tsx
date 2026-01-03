import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Mail, Lock, User, School, GraduationCap, Gift, AlertCircle, Loader2, Brain, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';

const INITIAL_XP = 50;

export default function SignUpPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        school: '',
        grade: '1',
        password: '',
        confirmPassword: '',
        referralCode: searchParams.get('ref') || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (formData.password !== formData.confirmPassword) {
                throw new Error('Şifreler eşleşmiyor');
            }

            if (formData.password.length < 6) {
                throw new Error('Şifre en az 6 karakter olmalıdır');
            }

            let referrerId = null;
            if (formData.referralCode) {
                const { data: referrer, error: refError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('referral_code', formData.referralCode)
                    .single();

                if (refError || !referrer) {
                    throw new Error('Geçersiz referans kodu');
                }
                referrerId = referrer.id;
            }

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name: formData.name,
                        school: formData.school,
                        grade: parseInt(formData.grade)
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        name: formData.name,
                        email: formData.email,
                        school: formData.school,
                        grade: parseInt(formData.grade),
                        referred_by: formData.referralCode || null,
                        avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${formData.name}&backgroundColor=b6e3f4,c0aede,d1d4f9&mood=happy`,
                        points: 0,
                        experience: INITIAL_XP
                    })
                    .eq('id', authData.user.id);

                if (profileError) throw profileError;

                if (referrerId) {
                    const { error: referrerError } = await supabase.rpc('increment_xp', {
                        user_id: referrerId,
                        amount: INITIAL_XP
                    });

                    if (referrerError) {
                        console.error('Referans XP hatası:', referrerError);
                    }
                }

                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password
                });

                if (signInError) throw signInError;

                const successMessage = formData.referralCode
                    ? `🎉 ${INITIAL_XP} XP ile başlıyorsun ve arkadaşın da ${INITIAL_XP} XP kazandı!`
                    : `🎉 Hoş geldin! ${INITIAL_XP} XP ile başlıyorsun!`;

                toast.success(successMessage);
                navigate('/bilsem');
            }
        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center px-6 py-12">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo & Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring' }}
                        className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/30"
                    >
                        <Brain className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-white mb-2">
                        Hesap Oluştur
                    </h1>
                    <p className="text-slate-400">
                        Ücretsiz kayıt ol ve öğrenmeye başla
                    </p>
                </motion.div>

                {/* Signup Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    placeholder="ornek@email.com"
                                />
                            </div>
                        </div>

                        {/* Ad Soyad */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Ad Soyad
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    placeholder="Adın ve soyadın"
                                />
                            </div>
                        </div>

                        {/* Okul ve Sınıf */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Okul
                                </label>
                                <div className="relative">
                                    <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="school"
                                        required
                                        value={formData.school}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        placeholder="Okul adı"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Sınıf
                                </label>
                                <div className="relative">
                                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <select
                                        name="grade"
                                        value={formData.grade}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                                            <option key={grade} value={grade} className="bg-slate-800">
                                                {grade}. Sınıf
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Şifreler */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Şifre
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        placeholder="••••••"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Tekrar
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        placeholder="••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Referans Kodu */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <span className="flex items-center gap-2">
                                    <Gift className="w-4 h-4 text-amber-400" />
                                    Referans Kodu (İsteğe bağlı)
                                </span>
                            </label>
                            <input
                                type="text"
                                name="referralCode"
                                value={formData.referralCode}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                placeholder="Arkadaşının kodu"
                            />
                            {formData.referralCode && (
                                <p className="mt-1 text-xs text-amber-400 flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    Sen ve arkadaşın {INITIAL_XP} XP kazanacaksınız!
                                </p>
                            )}
                        </div>

                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    <p className="text-red-400 text-sm">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Kayıt Yapılıyor...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Kayıt Ol
                                </>
                            )}
                        </motion.button>

                        {/* Login Link */}
                        <div className="text-center text-slate-400">
                            Zaten hesabın var mı?{' '}
                            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                                Giriş Yap
                            </Link>
                        </div>
                    </form>
                </motion.div>

                {/* Features */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 flex justify-center gap-6 text-sm text-slate-400"
                >
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{INITIAL_XP} XP Başlangıç</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span>Ücretsiz Kayıt</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
