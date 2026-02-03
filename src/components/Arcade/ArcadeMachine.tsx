import React, { useState } from 'react';
import { useXPEconomy } from '../../hooks/useXPEconomy';
import { CoinToss } from './CoinToss';
import { Gamepad2, Coins, Play } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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
        <div
            className="relative group overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 transition-all hover:scale-[1.02] hover:border-white/30"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        >
            {isAnimating && <CoinToss onComplete={handleAnimationComplete} />}

            <div className="relative h-full p-5 flex flex-col items-center text-center">

                {/* 3D Gummy Icon Container */}
                <div
                    className={`w-16 h-16 bg-gradient-to-br ${color} rounded-[40%] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.3), 0 6px 16px rgba(0,0,0,0.3)' }}
                >
                    {icon ? (
                        <div className="scale-[0.6]">{icon}</div>
                    ) : (
                        <Gamepad2 size={28} className="text-white" />
                    )}
                </div>

                {/* Info */}
                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{title}</h3>
                <p className="text-slate-400 text-xs mb-3 line-clamp-2 min-h-[32px]">{description}</p>

                {/* TUZÖ Badge */}
                {tuzo && (
                    <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
                        <span className="text-[8px] font-black text-indigo-300 uppercase tracking-wider">TUZÖ</span>
                        <span className="text-[8px] font-bold text-indigo-400">{tuzo}</span>
                    </div>
                )}

                {/* Coin Slot / Button - 3D Gummy Style */}
                {!isPaid ? (
                    <button
                        onClick={handleInsertCoin}
                        disabled={isAnimating || transactionLoading}
                        className="mt-auto w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-2xl px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)' }}
                    >
                        <div
                            className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center"
                        >
                            <Coins size={16} />
                        </div>
                        <div className="text-left">
                            <div className="text-[9px] text-amber-100 uppercase tracking-wider font-bold">Jeton At</div>
                            <div className="text-sm font-black leading-none">{cost} XP</div>
                        </div>
                    </button>
                ) : (
                    <button
                        onClick={onPlay}
                        className="mt-auto w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black rounded-2xl px-4 py-4 flex items-center justify-center gap-2 active:scale-95 transition-all animate-pulse"
                        style={{ boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)' }}
                    >
                        <Play size={20} fill="white" />
                        <span className="text-lg tracking-tight">BAŞLAT</span>
                    </button>
                )}
            </div>
        </div>
    );
};
