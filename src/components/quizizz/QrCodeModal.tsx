import React from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { ExternalLink, CheckCircle2, Circle } from 'lucide-react';
import { QuizizzCode } from '../../hooks/useQuizizzCodes';

interface QrCodeModalProps {
    selectedCode: QuizizzCode;
    completedCodes: Set<string>;
    onClose: () => void;
    toggleCompletion: (codeId: string) => void;
}

const getJoinUrl = (code: string) => `https://wayground.com/join?gc=${code}`;

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ selectedCode, completedCodes, onClose, toggleCompletion }) => {
    
    const handleToggleCompletion = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleCompletion(selectedCode.id);
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={onClose}
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
                        onClick={handleToggleCompletion}
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
                        onClick={onClose}
                        className="block w-full mt-4 text-slate-400 hover:text-white transition-colors"
                    >
                        Kapat
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
