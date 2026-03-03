import React, { useState } from 'react';
import { useXPEconomy } from '../../hooks/useXPEconomy';
import { CoinToss } from './CoinToss';
import { Gamepad2, Coins, Play } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ═══════════════════════════════════════════════
// 🕹️ ArcadeMachine — Kid-UI Çocuk Dostu Tasarım
// ═══════════════════════════════════════════════

interface ArcadeMachineProps {
    gameId: string;
    title: string;
    description: string;
    cost: number;
    color: string;
    icon?: React.ReactNode;
    tuzo?: string;
    onPlay: () => void;
    onInsufficientXP?: (required: number) => void;
}

export const ArcadeMachine: React.FC<ArcadeMachineProps> = ({
    title,
    description,
    cost,
    color,
    icon,
    tuzo,
    onPlay,
    onInsufficientXP
}) => {
    const { checkBalance, deductXP, loading: transactionLoading } = useXPEconomy();
    const [isAnimating, setIsAnimating] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const { user } = useAuth();

    const handleInsertCoin = async () => {
        if (!user || isAnimating || transactionLoading) return;

        const hasBalance = await checkBalance(cost);
        if (!hasBalance) {
            onInsufficientXP?.(cost);
            return;
        }

        setIsAnimating(true);
    };

    const handleAnimationComplete = async () => {
        const result = await deductXP(cost, `Arcade: ${title}`);
        setIsAnimating(false);
        if (result.success) {
            setIsPaid(true);
        }
    };

    return (
        <div
            className="group relative overflow-hidden bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl transition-all hover:-translate-y-1
            shadow-neo-sm hover:shadow-neo-md"
        >
            {isAnimating && <CoinToss onComplete={handleAnimationComplete} />}

            <div className="relative h-full p-5 flex flex-col items-center text-center">

                {/* Icon */}
                <div
                    className={`w-16 h-16 border-2 border-black/10 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-4 
                    group-hover:scale-105 group-hover:-rotate-6 transition-transform`}
                >
                    {icon ? (
                        <div className="scale-[0.8] text-black dark:text-white mix-blend-plus-darker">{icon}</div>
                    ) : (
                        <Gamepad2 size={30} className="text-black dark:text-white" strokeWidth={2} />
                    )}
                </div>

                {/* Info */}
                <h3 className="text-base font-nunito font-extrabold text-black dark:text-white mb-1.5 uppercase tracking-tight line-clamp-2 leading-tight">{title}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-xs mb-3 line-clamp-2 min-h-[32px] leading-relaxed">{description}</p>

                {/* TUZÖ Badge */}
                {tuzo && (
                    <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <span className="text-[9px] font-nunito font-extrabold text-black dark:text-white uppercase tracking-widest">TUZÖ</span>
                        <span className="text-[9px] font-nunito font-bold text-cyber-blue dark:text-cyber-gold">{tuzo}</span>
                    </div>
                )}

                {/* Coin Slot / Button */}
                {!isPaid ? (
                    <button
                        onClick={handleInsertCoin}
                        disabled={isAnimating || transactionLoading}
                        className="mt-auto w-full bg-cyber-pink text-black font-nunito font-extrabold border-3 border-black/10 rounded-xl px-4 py-3 flex items-center justify-center gap-3 active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase shadow-neo-sm active:shadow-none"
                    >
                        <div className="w-7 h-7 border-2 border-black/20 bg-white/30 rounded-full flex items-center justify-center">
                            <Coins size={14} className="text-black" />
                        </div>
                        <div className="text-left">
                            <div className="text-[9px] uppercase tracking-widest font-extrabold leading-none mb-0.5 opacity-70">Jeton At</div>
                            <div className="text-sm font-extrabold leading-none">{cost} XP</div>
                        </div>
                    </button>
                ) : (
                    <button
                        onClick={onPlay}
                        className="mt-auto w-full bg-cyber-gold text-black font-nunito font-extrabold border-3 border-black/10 rounded-xl px-4 py-3.5 flex items-center justify-center gap-2 active:translate-y-0.5 transition-all animate-pulse uppercase shadow-neo-sm active:shadow-none"
                    >
                        <Play size={20} fill="currentColor" strokeWidth={3} />
                        <span className="text-base tracking-wider">BAŞLAT</span>
                    </button>
                )}
            </div>
        </div>
    );
};
