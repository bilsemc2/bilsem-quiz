import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

/**
 * Standart oyun seçenek butonu.
 * Tüm BrainTrainer oyunlarında tutarlı buton stili sağlar.
 * 
 * Variants:
 *  - "text"   → Metin seçenekli (Eş Anlam, Deyimler, vb.)
 *  - "binary" → İkili büyük buton (Aynı/Farklı, Doğru/Yanlış)
 *  - "visual" → Görsel içerikli (emoji, şekil, resim)
 *  - "color"  → Renk seçimi (Stroop, Çift Mod vb.)
 */

export type OptionVariant = "text" | "binary" | "visual" | "color";
export type FeedbackResult = "correct" | "wrong" | "dimmed" | null;

interface GameOptionButtonProps {
    /** Buton metni veya içeriği */
    label: string;
    /** Tıklama handler */
    onClick: () => void;
    /** Seçenek harfi (A, B, C, D) — sadece text variant'ında gösterilir */
    optionLetter?: string;
    /** Buton tipi */
    variant?: OptionVariant;
    /** Disabled durumu */
    disabled?: boolean;
    /** Feedback sonucu: correct=yeşil ring, wrong=pembe ring, dimmed=soluk */
    feedbackResult?: FeedbackResult;
    /** Custom renk (color variant'ında arka plan rengi) */
    colorHex?: string;
    /** children — visual variant'ta custom içerik */
    children?: React.ReactNode;
    /** Animasyon gecikmesi */
    animationDelay?: number;
    /** Extra className */
    className?: string;
}

const GameOptionButton: React.FC<GameOptionButtonProps> = ({
    label,
    onClick,
    optionLetter,
    variant = "text",
    disabled = false,
    feedbackResult = null,
    colorHex,
    children,
    animationDelay = 0,
    className = "",
}) => {
    // ═══ Feedback ring classes ═══
    const feedbackClasses = (() => {
        if (!feedbackResult) return "";
        switch (feedbackResult) {
            case "correct":
                return "ring-2 ring-cyber-green bg-cyber-green/10";
            case "wrong":
                return "ring-2 ring-cyber-pink bg-cyber-pink/10";
            case "dimmed":
                return "opacity-40 grayscale";
        }
    })();

    // ═══ Variant-specific styles ═══
    const variantClasses = (() => {
        switch (variant) {
            case "binary":
                return "min-h-[80px] sm:min-h-[96px] flex-col gap-1 text-xl sm:text-2xl uppercase tracking-widest";
            case "visual":
                return "min-h-[70px] sm:min-h-[80px] text-3xl sm:text-4xl";
            case "color":
                return "min-h-[60px] sm:min-h-[70px] text-base sm:text-lg font-black uppercase tracking-wider";
            case "text":
            default:
                return "min-h-[52px] sm:min-h-[56px] text-base sm:text-lg gap-3";
        }
    })();

    const isInteractive = !disabled && !feedbackResult;

    return (
        <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: animationDelay, duration: 0.2 }}
            whileTap={isInteractive ? { scale: 0.96 } : undefined}
            onClick={onClick}
            disabled={disabled || !!feedbackResult}
            className={`
        w-full px-4 py-3 sm:py-4
        rounded-xl border-2 border-black/10
        shadow-neo-sm
        font-nunito font-black
        flex items-center justify-center
        transition-all duration-150
        ${isInteractive
                    ? "bg-white dark:bg-slate-800 text-black dark:text-white active:translate-y-0.5 active:shadow-none"
                    : "cursor-default"
                }
        ${feedbackClasses}
        ${variantClasses}
        ${className}
      `.trim()}
            style={
                variant === "color" && colorHex && !feedbackResult
                    ? { backgroundColor: colorHex, color: "#000", borderColor: `${colorHex}40` }
                    : undefined
            }
        >
            {/* Option letter badge (text variant) */}
            {variant === "text" && optionLetter && (
                <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-100 dark:bg-slate-700 border-2 border-black/10 flex items-center justify-center text-sm font-nunito font-black text-black dark:text-white">
                    {optionLetter}
                </span>
            )}

            {/* Content */}
            {children ?? (
                <span className={`${variant === "text" ? "flex-1 text-left truncate" : ""}`}>
                    {label}
                </span>
            )}

            {/* Correct check icon (text variant) */}
            {variant === "text" && feedbackResult === "correct" && (
                <CheckCircle2 className="text-cyber-green stroke-[3] flex-shrink-0" size={22} />
            )}
        </motion.button>
    );
};

export default GameOptionButton;
