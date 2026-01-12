import React, { useState } from 'react';
import { useXPEconomy } from '../../hooks/useXPEconomy';
import { CoinToss } from './CoinToss';
import { Gamepad2, Coins } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ArcadeMachineProps {
    gameId: string;
    title: string;
    description: string;
    cost: number;
    color: string;
    icon?: React.ReactNode;
    onPlay: () => void;
    onInsufficientXP?: (required: number) => void;
}

export const ArcadeMachine: React.FC<ArcadeMachineProps> = ({
    title,
    description,
    cost,
    color,
    icon,
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

        // Bakiye var, animasyonu başlat
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
        <div className={`relative group overflow-hidden rounded-3xl bg-gradient-to-br ${color} p-1 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl`}>
            {isAnimating && <CoinToss onComplete={handleAnimationComplete} />}

            <div className="relative h-full bg-slate-900/90 rounded-[22px] p-6 flex flex-col items-center text-center backdrop-blur-sm">

                {/* Header / Screen */}
                <div className="w-full h-32 bg-slate-950 rounded-xl mb-6 flex items-center justify-center border-4 border-slate-800 shadow-inner group-hover:border-slate-700 transition-colors relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />
                    {icon || <Gamepad2 size={48} className="text-white/20" />}
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-green-400 font-mono">
                        READY
                    </div>
                </div>

                {/* Info */}
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm mb-6 line-clamp-2">{description}</p>

                {/* Coin Slot / Button */}
                {!isPaid ? (
                    <button
                        onClick={handleInsertCoin}
                        disabled={isAnimating || transactionLoading}
                        className="mt-auto w-full group/btn relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 p-[1px] shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="relative flex items-center justify-center gap-3 bg-slate-900/50 hover:bg-transparent transition-colors rounded-[11px] px-4 py-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-500 group-hover/btn:scale-110 transition-transform">
                                <Coins size={18} />
                            </div>
                            <div className="text-left">
                                <div className="text-[10px] text-amber-200 uppercase tracking-wider font-bold">Jeton At</div>
                                <div className="text-white font-bold leading-none">{cost} XP</div>
                            </div>
                        </div>
                    </button>
                ) : (
                    <button
                        onClick={onPlay}
                        className="mt-auto w-full group/btn relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 p-[1px] shadow-lg active:scale-95 transition-all animate-pulse"
                    >
                        <div className="relative flex items-center justify-center gap-3 bg-slate-900/50 hover:bg-transparent transition-colors rounded-[11px] px-4 py-4">
                            <div className="flex flex-col items-center">
                                <div className="text-[10px] text-emerald-200 uppercase tracking-wider font-black">HAZIR!</div>
                                <div className="text-white font-black text-lg leading-none tracking-tighter">OYUNU BAŞLAT</div>
                            </div>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
};
