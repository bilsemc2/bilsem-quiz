import React from "react";
import { motion } from "framer-motion";

/**
 * Standart soru kartı wrapper.
 * Soru metnini veya görsel ipucunu gösteren üst kart.
 * 
 * Header badge renkleri: accentColor prop ile belirlenebilir.
 */

interface GameQuestionCardProps {
    /** Soru metni */
    question?: string;
    /** Üst badge etiketi (ör. "Eş Anlamlısı Nedir?") */
    badge?: string;
    /** Badge accent rengi (Tailwind class ör. "cyber-pink") */
    badgeColor?: string;
    /** children — custom içerik (şekil, emoji, renk kutusu vb.) */
    children?: React.ReactNode;
    /** Extra className */
    className?: string;
    /** Animasyon key (level değişince yeniden animate) */
    animationKey?: string | number;
}

const GameQuestionCard: React.FC<GameQuestionCardProps> = ({
    question,
    badge,
    badgeColor = "cyber-pink",
    children,
    className = "",
    animationKey,
}) => {
    return (
        <div
            className={`
        bg-white dark:bg-slate-800
        rounded-2xl
        p-5 sm:p-6
        border-2 border-black/10
        shadow-neo-sm
        text-center
        relative
        ${className}
      `.trim()}
        >
            {/* Badge */}
            {badge && (
                <div
                    className={`
            absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
            bg-${badgeColor} text-black
            px-4 py-1.5
            rounded-full
            font-nunito font-black uppercase tracking-widest text-xs
            border-2 border-black/10
            shadow-neo-sm
            whitespace-nowrap
          `.trim()}
                >
                    {badge}
                </div>
            )}

            {/* Question Text */}
            {question && (
                <motion.h2
                    key={animationKey}
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-2xl sm:text-4xl font-black font-nunito text-center uppercase tracking-widest text-black dark:text-white mt-4 break-words"
                >
                    {question}
                </motion.h2>
            )}

            {/* Custom Content (shapes, colors, etc.) */}
            {children}
        </div>
    );
};

export default GameQuestionCard;
