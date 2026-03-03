import React from "react";
import { motion } from "framer-motion";
import { Delete } from "lucide-react";

/**
 * Standart sayısal giriş numpad'i.
 * Akışkan Toplam, Matematik Grid, Sayısal Dizi vb. oyunlarda kullanılır.
 * 
 * İçerir: 0-9 grid + giriş alanı + silme butonu.
 */

interface GameNumpadProps {
    /** Mevcut input değeri */
    value: string;
    /** Tuşa basıldığında çağrılır */
    onDigit: (digit: string) => void;
    /** Sil butonuna basıldığında çağrılır */
    onDelete?: () => void;
    /** Gönder (Enter) action — null ise görünmez */
    onSubmit?: () => void;
    /** Submit buton label */
    submitLabel?: string;
    /** Disabled durumu (feedback veya preview sırasında) */
    disabled?: boolean;
    /** Placeholder (boş input durumunda) */
    placeholder?: string;
    /** Feedback state — ring rengi */
    feedbackState?: { correct: boolean } | null;
    /** Feedback display text — feedback sırasında gösterilecek metin */
    feedbackText?: string;
    /** Max input length */
    maxLength?: number;
    /** Üst display alanını gizle (oyunun kendi display'i varsa) */
    hideDisplay?: boolean;
    /** Extra className for container */
    className?: string;
}

const GameNumpad: React.FC<GameNumpadProps> = ({
    value,
    onDigit,
    onDelete,
    onSubmit,
    submitLabel = "GÖNDER",
    disabled = false,
    placeholder = "?",
    feedbackState = null,
    feedbackText,
    maxLength = 4,
    hideDisplay = false,
    className = "",
}) => {
    const handleDigit = (d: string) => {
        if (disabled || value.length >= maxLength) return;
        onDigit(d);
    };

    const inputRingClass = feedbackState
        ? feedbackState.correct
            ? "bg-cyber-green/15 border-cyber-green ring-2 ring-cyber-green"
            : "bg-cyber-pink/15 border-cyber-pink ring-2 ring-cyber-pink"
        : "bg-white dark:bg-slate-800 border-black/10";

    return (
        <div className={`w-full flex flex-col items-center gap-3 ${className}`}>
            {/* Input Display */}
            {!hideDisplay && (
                <div
                    className={`
          w-full max-w-[360px]
          h-16 sm:h-20
          border-2 rounded-xl
          flex items-center justify-center
          transition-colors
          shadow-neo-sm
          ${inputRingClass}
        `.trim()}
                >
                    {feedbackState && feedbackText ? (
                        <span
                            className={`text-3xl sm:text-4xl font-nunito font-black uppercase tracking-widest drop-shadow-sm ${feedbackState.correct ? "text-cyber-green" : "text-cyber-pink"
                                }`}
                        >
                            {feedbackText}
                        </span>
                    ) : value ? (
                        <span className="text-4xl sm:text-5xl font-nunito font-black text-black dark:text-white drop-shadow-sm tracking-widest">
                            {value}
                        </span>
                    ) : (
                        <span className="text-3xl font-nunito font-black text-slate-300 dark:text-slate-600 animate-pulse">
                            {placeholder}
                        </span>
                    )}
                </div>
            )}

            {/* Numpad Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-[280px] sm:max-w-[360px] w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <motion.button
                        key={num}
                        whileTap={!disabled ? { scale: 0.95 } : undefined}
                        onClick={() => handleDigit(num.toString())}
                        disabled={disabled}
                        className="h-14 sm:h-[72px] bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl shadow-neo-sm flex items-center justify-center text-3xl sm:text-4xl font-nunito font-black text-black dark:text-white active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                    >
                        {num}
                    </motion.button>
                ))}

                {/* Delete button */}
                <motion.button
                    whileTap={!disabled ? { scale: 0.95 } : undefined}
                    onClick={onDelete}
                    disabled={disabled || !value}
                    className="h-14 sm:h-[72px] bg-slate-100 dark:bg-slate-700 border-2 border-black/10 rounded-xl shadow-neo-sm flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-30"
                >
                    <Delete size={24} className="text-black dark:text-white" strokeWidth={2.5} />
                </motion.button>

                {/* Zero */}
                <motion.button
                    whileTap={!disabled ? { scale: 0.95 } : undefined}
                    onClick={() => handleDigit("0")}
                    disabled={disabled}
                    className="h-14 sm:h-[72px] bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl shadow-neo-sm flex items-center justify-center text-3xl sm:text-4xl font-nunito font-black text-black dark:text-white active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                >
                    0
                </motion.button>

                {/* Submit button */}
                {onSubmit ? (
                    <motion.button
                        whileTap={!disabled && value ? { scale: 0.95 } : undefined}
                        onClick={onSubmit}
                        disabled={disabled || !value}
                        className="h-14 sm:h-[72px] bg-cyber-green border-2 border-black/10 rounded-xl shadow-neo-sm flex items-center justify-center text-sm sm:text-base font-nunito font-black text-black uppercase tracking-widest active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-30"
                    >
                        {submitLabel}
                    </motion.button>
                ) : (
                    <div />
                )}
            </div>
        </div>
    );
};

export default GameNumpad;
