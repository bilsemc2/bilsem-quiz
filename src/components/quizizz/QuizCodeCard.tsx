import React from 'react';
import { motion } from 'framer-motion';
import { Lock, QrCode, CheckCircle2, Circle } from 'lucide-react';
import { QuizizzCode } from '../../hooks/useQuizizzCodes';

interface QuizCodeCardProps {
    code: QuizizzCode;
    isVip: boolean;
    isCompleted: boolean;
    onSelectCode: (code: QuizizzCode) => void;
    toggleCompletion: (codeId: string) => void;
    subjectColor: string;
}

export const QuizCodeCard: React.FC<QuizCodeCardProps> = ({ code, isVip, isCompleted, onSelectCode, toggleCompletion, subjectColor }) => {
    
    const handleToggleCompletion = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleCompletion(code.id);
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className={`relative rounded-2xl overflow-hidden ${isVip
                    ? 'cursor-pointer hover:scale-105 transition-transform'
                    : 'cursor-not-allowed'
                } ${isCompleted ? 'ring-2 ring-emerald-500' : ''}`}
            onClick={() => isVip && onSelectCode(code)}
        >
            {/* Card Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${subjectColor} ${!isVip ? 'opacity-30 grayscale' : isCompleted ? 'opacity-70' : 'opacity-100'}`} />

            {/* Completed Overlay */}
            {isCompleted && isVip && (
                <div className="absolute inset-0 bg-emerald-500/10" />
            )}

            {/* Content */}
            <div className={`relative p-5 ${!isVip ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                    <span className="text-white/80 text-sm font-medium">{code.subject}</span>
                    {isVip ? (
                        <button
                            onClick={handleToggleCompletion}
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
};
