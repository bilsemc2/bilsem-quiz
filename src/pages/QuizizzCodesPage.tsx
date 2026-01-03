import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Lock, ExternalLink, Crown, BookOpen, Sparkles, QrCode, CheckCircle2, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface QuizizzCode {
    id: string;
    code: string;
    subject: string;
    grade: string;
    scheduled_time: string;
    is_active: boolean;
}

const SUBJECT_COLORS: Record<string, string> = {
    'Matris': 'from-blue-500 to-indigo-600',
    'Bütünden Parçaya': 'from-purple-500 to-pink-600',
    'Şifreleme': 'from-amber-500 to-orange-600',
    'Aynısı Bul': 'from-emerald-500 to-teal-600',
    'Farklısını Bul': 'from-red-500 to-rose-600',
    'Hafıza': 'from-cyan-500 to-blue-600',
    'Kodlama': 'from-violet-500 to-purple-600',
    'Küp': 'from-slate-500 to-gray-600',
    'Örüntü': 'from-green-500 to-emerald-600',
    'Analoji': 'from-pink-500 to-rose-600',
    'Kağıt Katlama': 'from-yellow-500 to-amber-600',
    'Kuşbakışı': 'from-sky-500 to-cyan-600',
    'Simetri': 'from-indigo-500 to-blue-600',
    'Gölge': 'from-gray-600 to-slate-700',
    'Benzerini Bul': 'from-teal-500 to-green-600',
};

const QuizizzCodesPage: React.FC = () => {
    const { user } = useAuth();
    const [codes, setCodes] = useState<QuizizzCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [userGrade, setUserGrade] = useState<string | null>(null);
    const [isVip, setIsVip] = useState(false);
    const [selectedCode, setSelectedCode] = useState<QuizizzCode | null>(null);
    const [completedCodes, setCompletedCodes] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchUserAndCodes = async () => {
            if (!user?.id) return;

            try {
                // Get user profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('grade, is_vip')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setUserGrade(profile.grade);
                    setIsVip(profile.is_vip || false);
                }

                // Get quizizz codes for user's grade
                if (profile?.grade) {
                    const { data: quizizzCodes } = await supabase
                        .from('quizizz_codes')
                        .select('id, code, subject, grade, scheduled_time, is_active')
                        .eq('grade', profile.grade)
                        .eq('is_active', true)
                        .order('subject', { ascending: true });

                    if (quizizzCodes) {
                        setCodes(quizizzCodes);
                    }
                }

                // Get user's completed codes
                const { data: completions } = await supabase
                    .from('user_quizizz_completions')
                    .select('quizizz_code_id')
                    .eq('user_id', user.id);

                if (completions) {
                    setCompletedCodes(new Set(completions.map(c => c.quizizz_code_id)));
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndCodes();
    }, [user]);

    const toggleCompletion = useCallback(async (codeId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user?.id || !isVip) return;

        const isCompleted = completedCodes.has(codeId);

        try {
            if (isCompleted) {
                // Remove completion
                await supabase
                    .from('user_quizizz_completions')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('quizizz_code_id', codeId);

                setCompletedCodes(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(codeId);
                    return newSet;
                });
                toast.success('İşaret kaldırıldı');
            } else {
                // Add completion
                await supabase
                    .from('user_quizizz_completions')
                    .insert({
                        user_id: user.id,
                        quizizz_code_id: codeId
                    });

                setCompletedCodes(prev => new Set([...prev, codeId]));
                toast.success('Tamamlandı olarak işaretlendi! ✅');
            }
        } catch (error) {
            console.error('Error toggling completion:', error);
            toast.error('Bir hata oluştu');
        }
    }, [user, isVip, completedCodes]);

    const getJoinUrl = (code: string) => `https://wayground.com/join?gc=${code}`;

    // Group codes by subject
    const groupedCodes = codes.reduce((acc, code) => {
        if (!acc[code.subject]) {
            acc[code.subject] = [];
        }
        acc[code.subject].push(code);
        return acc;
    }, {} as Record<string, QuizizzCode[]>);

    // Calculate completion stats
    const totalCodes = codes.length;
    const completedCount = codes.filter(c => completedCodes.has(c.id)).length;
    const completionPercentage = totalCodes > 0 ? Math.round((completedCount / totalCodes) * 100) : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 pt-24 pb-12 px-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <Link
                        to="/profile"
                        className="inline-flex items-center gap-2 text-purple-400 font-bold hover:text-purple-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Profil
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-2">
                        🎮 <span className="text-purple-400">Quizizz</span> Kodları
                    </h1>
                    <p className="text-slate-400">
                        {userGrade ? `${userGrade}. Sınıf için hazırlanmış quizler` : 'Quizizz testlerine katıl'}
                    </p>
                </motion.div>

                {/* VIP Badge + Progress */}
                {isVip && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-4 mb-8"
                    >
                        <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-full px-6 py-2 flex items-center gap-2">
                            <Crown className="w-5 h-5 text-amber-400" />
                            <span className="text-amber-400 font-bold">VIP Üye</span>
                            <Sparkles className="w-4 h-4 text-amber-400" />
                        </div>

                        {/* Progress Bar */}
                        {totalCodes > 0 && (
                            <div className="w-full max-w-md">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">İlerleme</span>
                                    <span className="text-emerald-400 font-bold">{completedCount}/{totalCodes} (%{completionPercentage})</span>
                                </div>
                                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completionPercentage}%` }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Non-VIP Warning */}
                {!isVip && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6 text-center"
                    >
                        <Lock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                        <h3 className="text-xl font-bold text-white mb-2">VIP Üyelik Gerekli</h3>
                        <p className="text-slate-400 mb-4">Quizizz kodlarına erişmek için VIP üye olmanız gerekmektedir.</p>
                        <Link
                            to="/profil"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all"
                        >
                            <Crown className="w-5 h-5" />
                            VIP Üye Ol
                        </Link>
                    </motion.div>
                )}

                {/* Codes Grid */}
                {codes.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">Henüz sınıfınız için quiz eklenmemiş.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedCodes).map(([subject, subjectCodes], groupIndex) => {
                            const subjectCompleted = subjectCodes.filter(c => completedCodes.has(c.id)).length;
                            return (
                                <motion.div
                                    key={subject}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: groupIndex * 0.1 }}
                                >
                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-purple-400" />
                                        {subject}
                                        <span className="text-sm text-slate-500 font-normal">
                                            ({subjectCompleted}/{subjectCodes.length} tamamlandı)
                                        </span>
                                    </h2>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {subjectCodes.map((code, index) => {
                                            const isCompleted = completedCodes.has(code.id);
                                            return (
                                                <motion.div
                                                    key={code.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className={`relative rounded-2xl overflow-hidden ${isVip
                                                        ? 'cursor-pointer hover:scale-105 transition-transform'
                                                        : 'cursor-not-allowed'
                                                        } ${isCompleted ? 'ring-2 ring-emerald-500' : ''}`}
                                                    onClick={() => isVip && setSelectedCode(code)}
                                                >
                                                    {/* Card Background */}
                                                    <div className={`absolute inset-0 bg-gradient-to-br ${SUBJECT_COLORS[subject] || 'from-slate-600 to-slate-700'
                                                        } ${!isVip ? 'opacity-30 grayscale' : isCompleted ? 'opacity-70' : 'opacity-100'}`} />

                                                    {/* Completed Overlay */}
                                                    {isCompleted && isVip && (
                                                        <div className="absolute inset-0 bg-emerald-500/10" />
                                                    )}

                                                    {/* Content */}
                                                    <div className={`relative p-5 ${!isVip ? 'opacity-50' : ''}`}>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className="text-white/80 text-sm font-medium">{subject}</span>
                                                            {isVip ? (
                                                                <button
                                                                    onClick={(e) => toggleCompletion(code.id, e)}
                                                                    className="p-1 rounded-full hover:bg-white/20 transition-colors"
                                                                    title={isCompleted ? 'İşareti kaldır' : 'Tamamlandı olarak işaretle'}
                                                                >
                                                                    {isCompleted ? (
                                                                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                                                    ) : (
                                                                        <Circle className="w-6 h-6 text-white/50 hover:text-white" />
                                                                    )}
                                                                </button>
                                                            ) : (
                                                                <Lock className="w-5 h-5 text-white/50" />
                                                            )}
                                                        </div>

                                                        <div className={`text-3xl font-black text-white mb-2 tracking-wider ${!isVip ? 'blur-sm select-none' : ''
                                                            } ${isCompleted ? 'line-through opacity-70' : ''}`}>
                                                            {isVip ? code.code : '********'}
                                                        </div>

                                                        {isVip && (
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-white/70 text-sm">
                                                                    <QrCode className="w-4 h-4" />
                                                                    <span>QR için tıkla</span>
                                                                </div>
                                                                {isCompleted && (
                                                                    <span className="text-emerald-400 text-xs font-bold">✓ Yapıldı</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Locked Overlay */}
                                                    {!isVip && (
                                                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                                                            <div className="text-center">
                                                                <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                                                <p className="text-slate-400 text-sm font-medium">VIP Gerekli</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* QR Modal */}
                {selectedCode && isVip && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={() => setSelectedCode(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <h3 className="text-2xl font-bold text-white">{selectedCode.subject}</h3>
                                    {completedCodes.has(selectedCode.id) && (
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                    )}
                                </div>
                                <p className="text-slate-400 mb-6">Quizizz Kodu</p>

                                {/* QR Code */}
                                <div className="bg-white rounded-2xl p-6 inline-block mb-6">
                                    <QRCodeSVG
                                        value={getJoinUrl(selectedCode.code)}
                                        size={200}
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>

                                {/* Code Display */}
                                <div className="bg-slate-700/50 rounded-xl p-4 mb-4">
                                    <p className="text-slate-400 text-sm mb-1">Kod</p>
                                    <p className="text-3xl font-black text-white tracking-widest">{selectedCode.code}</p>
                                </div>

                                {/* Completion Toggle */}
                                <button
                                    onClick={(e) => toggleCompletion(selectedCode.id, e)}
                                    className={`w-full mb-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${completedCodes.has(selectedCode.id)
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-slate-700 text-white hover:bg-slate-600'
                                        }`}
                                >
                                    {completedCodes.has(selectedCode.id) ? (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            Tamamlandı ✓
                                        </>
                                    ) : (
                                        <>
                                            <Circle className="w-5 h-5" />
                                            Yaptım Olarak İşaretle
                                        </>
                                    )}
                                </button>

                                {/* Link */}
                                <a
                                    href={getJoinUrl(selectedCode.code)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-400 hover:to-pink-400 transition-all"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    Quiz'e Katıl
                                </a>

                                <button
                                    onClick={() => setSelectedCode(null)}
                                    className="block w-full mt-4 text-slate-400 hover:text-white transition-colors"
                                >
                                    Kapat
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default QuizizzCodesPage;
