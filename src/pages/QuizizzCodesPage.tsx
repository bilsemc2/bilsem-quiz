import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Crown, Sparkles, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useQuizizzCodes, QuizizzCode } from '../hooks/useQuizizzCodes';
import { Progress } from '../components/quizizz/Progress';
import { VipUpsell } from '../components/quizizz/VipUpsell';
import { QrCodeModal } from '../components/quizizz/QrCodeModal';
import { QuizCodeCard } from '../components/quizizz/QuizCodeCard';

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
    const { codes, loading, userGrade, isVip, completedCodes, toggleCompletion } = useQuizizzCodes();
    const [selectedCode, setSelectedCode] = useState<QuizizzCode | null>(null);

    const groupedCodes = useMemo(() => {
        return codes.reduce((acc, code) => {
            if (!acc[code.subject]) {
                acc[code.subject] = [];
            }
            acc[code.subject].push(code);
            return acc;
        }, {} as Record<string, QuizizzCode[]>);
    }, [codes]);

    const { totalCodes, completedCount, completionPercentage } = useMemo(() => {
        const total = codes.length;
        const completed = codes.filter(c => completedCodes.has(c.id)).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { totalCodes: total, completedCount: completed, completionPercentage: percentage };
    }, [codes, completedCodes]);


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

                        <Progress
                            completedCount={completedCount}
                            totalCodes={totalCodes}
                            completionPercentage={completionPercentage}
                        />
                    </motion.div>
                )}

                {!isVip && <VipUpsell />}

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
                                        {subjectCodes.map((code) => (
                                            <QuizCodeCard
                                                key={code.id}
                                                code={code}
                                                isVip={isVip}
                                                isCompleted={completedCodes.has(code.id)}
                                                onSelectCode={setSelectedCode}
                                                toggleCompletion={(codeId) => toggleCompletion(codeId)}
                                                subjectColor={SUBJECT_COLORS[subject] || 'from-slate-600 to-slate-700'}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {selectedCode && isVip && (
                    <QrCodeModal
                        selectedCode={selectedCode}
                        completedCodes={completedCodes}
                        onClose={() => setSelectedCode(null)}
                        toggleCompletion={(codeId) => toggleCompletion(codeId)}
                    />
                )}
            </div>
        </div>
    );
};

export default QuizizzCodesPage;
