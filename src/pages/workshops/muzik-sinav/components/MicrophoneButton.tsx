/**
 * MicrophoneButton — Animated microphone toggle with audio level indicator.
 * Tactile Cyber-Pop aesthetic with dark/light mode.
 */

import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';

interface MicrophoneButtonProps {
    isListening: boolean;
    audioLevel: number;
    onClick: () => void;
    statusText?: string;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
    isListening, audioLevel, onClick, statusText
}) => {
    return (
        <div className="flex flex-col items-center gap-4">
            <motion.button
                onClick={onClick}
                whileTap={{ scale: 0.9 }}
                className={`relative w-24 h-24 rounded-2xl border-3 flex items-center justify-center transition-all ${isListening
                        ? 'bg-cyber-pink/10 border-cyber-pink/40 text-cyber-pink shadow-neo-md'
                        : 'bg-gray-100 dark:bg-slate-700 border-black/10 text-slate-500 dark:text-slate-400 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md'
                    }`}
            >
                {/* Audio level ring */}
                {isListening && (
                    <motion.div
                        className="absolute inset-0 border-4 border-cyber-pink/30 rounded-2xl"
                        animate={{ scale: 1 + audioLevel * 0.15, opacity: 0.4 + audioLevel * 0.3 }}
                        transition={{ duration: 0.1 }}
                    />
                )}

                {isListening ? (
                    <MicOff className="w-8 h-8 relative z-10" strokeWidth={2.5} />
                ) : (
                    <Mic className="w-8 h-8 relative z-10" strokeWidth={2.5} />
                )}
            </motion.button>

            <span className={`text-xs font-nunito font-extrabold uppercase tracking-widest ${isListening ? 'text-cyber-pink' : 'text-slate-400'
                }`}>
                {statusText || (isListening ? 'Dinliyor... Kapatmak için Dokun' : 'Mikrofonu Aç')}
            </span>
        </div>
    );
};
