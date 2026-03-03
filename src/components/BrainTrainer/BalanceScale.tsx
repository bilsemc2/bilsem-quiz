import React from "react";
import { motion } from "framer-motion";
import { ShapeType, WeightMap, PanContent, calcWeight, ShapeIcon } from "./visualAlgebraTypes";

interface ScaleProps {
    left: PanContent;
    right: PanContent;
    weights: WeightMap;
    interactive?: boolean;
    showWeights?: boolean;
    feedbackState: unknown;
    onRemoveFromPan?: (s: ShapeType) => void;
}

const BalanceScale: React.FC<ScaleProps> = ({
    left, right, weights, interactive = false,
    showWeights = false, feedbackState, onRemoveFromPan,
}) => {
    const lw = calcWeight(left, weights);
    const rw = calcWeight(right, weights);
    const tilt = Math.max(Math.min((rw - lw) * 3, 15), -15);

    const renderContent = (c: PanContent, side: string) =>
        Object.entries(c).flatMap(([s, n]) =>
            Array.from({ length: n as number }).map((_, i) => (
                <motion.div
                    key={`${s}-${i}`}
                    whileTap={interactive && side === "right" && !feedbackState ? { scale: 0.9 } : {}}
                    onClick={() => interactive && side === "right" && onRemoveFromPan?.(s as ShapeType)}
                    className={interactive && side === "right" ? "cursor-pointer" : ""}
                >
                    <ShapeIcon
                        type={s as ShapeType}
                        size={32}
                        weight={showWeights ? weights[s as ShapeType] : undefined}
                        className="drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
                    />
                </motion.div>
            )),
        );

    const StringsSvg = () => (
        <svg
            className="absolute -top-[4rem] sm:-top-[5rem] w-full h-[4rem] sm:h-[5rem] pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
        >
            <line x1="10" y1="100" x2="50" y2="0" stroke="black" strokeWidth="3" />
            <line x1="90" y1="100" x2="50" y2="0" stroke="black" strokeWidth="3" />
        </svg>
    );

    return (
        <div className="relative w-full h-48 sm:h-56 flex justify-center items-end select-none mt-8">
            {/* Base */}
            <div className="absolute bottom-0 w-32 h-6 bg-cyber-pink border-2 border-black/10 rounded-xl shadow-neo-sm z-20" />
            {/* Stand */}
            <div className="absolute bottom-6 w-6 h-32 bg-slate-200 dark:bg-slate-700 border-x-4 border-t-4 border-black/10 rounded-t-xl z-10" />
            {/* Pivot */}
            <div className="absolute bottom-[8.5rem] w-8 h-8 rounded-full border-2 border-black/10 bg-cyber-yellow z-30 shadow-neo-sm">
                <div className="w-2 h-2 rounded-full bg-black mx-auto mt-2" />
            </div>

            {/* Beam */}
            <div
                className="absolute bottom-[8.5rem] w-full max-w-sm transition-transform duration-700 ease-in-out origin-center z-20"
                style={{ transform: `rotate(${tilt}deg)` }}
            >
                <div className="h-6 bg-cyber-blue border-2 border-black/10 rounded-xl shadow-neo-sm mx-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 w-1/2" />
                </div>

                {/* Left Pan */}
                <div
                    className="absolute left-[10%] top-6 flex flex-col items-center origin-top transition-transform duration-700 ease-in-out"
                    style={{ transform: `rotate(${-tilt}deg)` }}
                >
                    <div className="w-1.5 h-16 sm:h-20 bg-black" />
                    <div className="w-28 sm:w-32 min-h-[1.5rem] bg-white dark:bg-slate-800 border-2 border-black/10 rounded-b-3xl relative flex flex-wrap justify-center items-end gap-1 px-1 pb-2 shadow-neo-sm">
                        <StringsSvg />
                        <div className="relative z-10 flex flex-wrap justify-center items-end gap-1 px-1 w-full pt-4">
                            {renderContent(left, "left")}
                        </div>
                    </div>
                </div>

                {/* Right Pan */}
                <div
                    className="absolute right-[10%] top-6 flex flex-col items-center origin-top transition-transform duration-700 ease-in-out"
                    style={{ transform: `rotate(${-tilt}deg)` }}
                >
                    <div className="w-1.5 h-16 sm:h-20 bg-black" />
                    <div
                        className={`w-28 sm:w-32 min-h-[1.5rem] border-2 border-black/10 rounded-b-3xl relative flex flex-wrap justify-center items-end gap-1 px-1 pb-2 shadow-neo-sm ${interactive ? "bg-amber-100 dark:bg-amber-900/40 transition-colors" : "bg-white dark:bg-slate-800"}`}
                    >
                        <StringsSvg />
                        <div className="relative z-10 flex flex-wrap justify-center items-end gap-1 px-1 w-full pt-4 min-h-[40px]">
                            {renderContent(right, "right")}
                            {interactive && Object.keys(right).length === 0 && (
                                <span className="text-black/30 dark:text-white/30 font-nunito font-bold text-xs absolute bottom-3">
                                    Tıkla Ekle
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BalanceScale;
