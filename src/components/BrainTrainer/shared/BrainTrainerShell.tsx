import React, { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
    ChevronLeft,
    RotateCcw,
    Play,
    Trophy,
    Sparkles,
    Heart,
    Star,
    Timer as TimerIcon,
    Zap,
    LucideIcon,
} from "lucide-react";
import GameFeedbackBanner from "./GameFeedbackBanner";
import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGameEngine, GamePhase } from "./useGameEngine";

export interface GameShellConfig {
    title: string;
    icon: LucideIcon;
    description: string;
    howToPlay: ReactNode[];
    tuzoCode?: string;
    maxLevel?: number;
    accentColor?: string;
    extraHudItems?: ReactNode;
    wideLayout?: boolean;
}

export interface GameRenderProps {
    level: number;
    score: number;
    lives: number;
    phase: GamePhase;
    timeLeft: number;
    feedbackState: ReturnType<typeof useGameFeedback>["feedbackState"];
    showFeedback: ReturnType<typeof useGameFeedback>["showFeedback"];
    dismissFeedback: ReturnType<typeof useGameFeedback>["dismissFeedback"];
}

interface BrainTrainerShellProps {
    config: GameShellConfig;
    engine: ReturnType<typeof useGameEngine>;
    feedback: ReturnType<typeof useGameFeedback>;
    children: (props: GameRenderProps) => ReactNode;
}

const BrainTrainerShell: React.FC<BrainTrainerShellProps> = ({ config, engine, feedback, children }) => {
    const {
        title,
        icon: Icon,
        description,
        howToPlay,
        tuzoCode,
        maxLevel = 20,
        accentColor = "cyber-pink",
        extraHudItems = null,
        wideLayout = false,
    } = config;

    const {
        phase,
        level,
        score,
        lives,
        timeLeft,
        examMode,
        handleStart,
    } = engine;

    const { feedbackState, showFeedback, dismissFeedback } = feedback;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const backLink = examMode
        ? "/atolyeler/sinav-simulasyonu/devam"
        : "/atolyeler/bireysel-degerlendirme";
    const backLabel = examMode ? "Sınavı Bitir" : "Geri Dön";

    const getAccentBgClass = () => `bg-${accentColor}`;

    if (phase === "welcome") {
        return (
            <div className="min-h-[100dvh] bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative">
                <div className="relative z-10 w-full max-w-xl">
                    <div className="w-full flex items-center justify-start mb-6 -ml-2">
                        <Link
                            to={backLink}
                            className="flex items-center gap-2 text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 border-4 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none font-syne font-bold"
                        >
                            <ChevronLeft size={20} className="stroke-[3]" />
                            <span>{backLabel}</span>
                        </Link>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center bg-white dark:bg-slate-800 p-8 rounded-[3rem] border-4 border-black shadow-[12px_12px_0_#000] rotate-1"
                    >
                        <motion.div
                            className={`w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 ${getAccentBgClass()} border-8 border-black shadow-[8px_8px_0_#000] rounded-[2.5rem] flex items-center justify-center -rotate-3`}
                            animate={{ y: [0, -8, 0], rotate: [-3, 2, -3] }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <Icon size={56} className="text-black" strokeWidth={2.5} />
                        </motion.div>

                        <h1 className="text-4xl sm:text-5xl font-syne font-black mb-4 uppercase text-black dark:text-white tracking-tight drop-shadow-sm">
                            {title}
                        </h1>

                        <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium mb-8 text-base sm:text-lg">
                            {description}
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-5 mb-8 border-4 border-black shadow-[8px_8px_0_#000] text-left -rotate-1">
                            <h3 className="text-xl font-syne font-black text-cyber-blue mb-4 flex items-center gap-2 uppercase">
                                <Sparkles size={24} className="stroke-[3]" /> Nasıl Oynanır?
                            </h3>
                            <ul className="space-y-4 text-sm sm:text-base font-chivo font-bold text-slate-700 dark:text-slate-300">
                                {howToPlay.map((step, i) => {
                                    const rotationClasses = ["rotate-2", "-rotate-3", "rotate-1", "-rotate-2", "rotate-3"];
                                    const colorClasses = ["bg-cyber-yellow", "bg-cyber-green", "bg-cyber-pink", "bg-cyber-blue", "bg-cyber-purple"];
                                    return (
                                        <li key={i} className="flex items-center gap-3">
                                            <span className={`flex-shrink-0 w-8 h-8 ${colorClasses[i % colorClasses.length]} text-black border-2 border-black rounded-lg flex items-center justify-center font-syne font-black text-sm shadow-[2px_2px_0_#000] ${rotationClasses[i % rotationClasses.length]}`}>
                                                {i + 1}
                                            </span>
                                            <span>{step}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {tuzoCode && (
                            <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-cyber-blue border-2 border-black text-white rounded-xl shadow-[4px_4px_0_#000] rotate-2">
                                <span className="text-xs font-syne font-black uppercase tracking-widest">
                                    {tuzoCode}
                                </span>
                            </div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStart}
                            className={`w-full sm:w-auto px-10 py-5 ${getAccentBgClass()} text-black font-syne font-black text-xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] rounded-2xl hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:translate-x-[2px] active:shadow-none transition-all flex items-center justify-center gap-3 mx-auto group`}
                        >
                            <Play
                                size={24}
                                className="fill-black group-hover:scale-110 transition-transform"
                            />
                            <span>Başla</span>
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col font-chivo tracking-tight relative overflow-hidden">
            <div className="relative z-10 p-4 pt-6 sm:pt-20">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Link
                        to={backLink}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border-4 border-black rounded-xl shadow-[4px_4px_0_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] transition-all font-syne font-bold text-black dark:text-white"
                    >
                        <ChevronLeft size={20} className="stroke-[3]" />
                        <span>{backLabel}</span>
                    </Link>

                    {phase !== "game_over" && phase !== "victory" && (
                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center sm:justify-end">
                            {extraHudItems}

                            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-yellow border-4 border-black rounded-xl shadow-[4px_4px_0_#000] -rotate-1">
                                <Star
                                    className="text-black fill-black drop-shadow-sm"
                                    size={18}
                                />
                                <span className="font-syne font-black text-black">{score}</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-cyber-pink border-4 border-black rounded-xl shadow-[4px_4px_0_#000] rotate-1">
                                {Array.from({ length: Math.max(lives, 3, 5) }).map((_, i) => (
                                    <Heart
                                        key={`life-${i}`}
                                        size={18}
                                        className={
                                            i < lives
                                                ? "text-black fill-black"
                                                : "text-black/20 fill-black/20"
                                        }
                                        strokeWidth={2.5}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-blue border-4 border-black rounded-xl shadow-[4px_4px_0_#000] -rotate-2">
                                <TimerIcon
                                    className={
                                        timeLeft < 30 ? "text-white animate-pulse" : "text-white"
                                    }
                                    size={18}
                                />
                                <span
                                    className={`font-syne font-black ${timeLeft < 30 ? "text-white drop-shadow-[0_0_8px_white]" : "text-white"}`}
                                >
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-green border-4 border-black rounded-xl shadow-[4px_4px_0_#000] rotate-2">
                                <Zap className="text-black fill-black/50" size={18} />
                                <span className="font-syne font-black text-black text-sm whitespace-nowrap">
                                    Seviye {level}/{maxLevel}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-160px)] flex-1">
                <AnimatePresence mode="wait">
                    {(phase === "playing" || phase === "feedback") && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`flex flex-col items-center gap-12 w-full ${wideLayout ? "max-w-6xl" : "max-w-xl"}`}
                        >
                            {children({
                                level,
                                score,
                                lives,
                                phase,
                                timeLeft,
                                feedbackState,
                                showFeedback,
                                dismissFeedback,
                            })}
                        </motion.div>
                    )}

                    {(phase === "game_over" || phase === "victory") && (
                        <motion.div
                            key="finished"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="text-center bg-white dark:bg-slate-800 p-8 sm:p-12 rounded-[3.5rem] border-4 border-black shadow-[16px_16px_0_#000] max-w-xl w-full -rotate-1 relative"
                        >
                            <div className="absolute top-6 left-6 text-4xl transform -rotate-12">
                                {phase === "victory" ? "🏆" : "🎮"}
                            </div>
                            <div className="absolute bottom-6 right-6 text-4xl transform rotate-12">
                                {phase === "victory" ? "✨" : "💡"}
                            </div>

                            <motion.div
                                className={`w-32 h-32 mx-auto mb-8 ${getAccentBgClass()} border-8 border-black shadow-[8px_8px_0_#000] rounded-[2rem] flex items-center justify-center rotate-3`}
                                animate={{ y: [0, -10, 0], rotate: [3, -5, 3] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Trophy size={64} className="text-black" strokeWidth={2.5} />
                            </motion.div>

                            <h2 className="text-4xl sm:text-5xl font-syne font-black text-black dark:text-white mb-4 uppercase tracking-tight">
                                {phase === "victory" ? "MÜKEMMEL!" : "OYUN BİTTİ!"}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium mb-8 text-lg">
                                {phase === "victory"
                                    ? "Tüm seviyeleri başarıyla tamamladın! Harika bir performans gösterdin."
                                    : "Daha fazla pratik yaparak reflekslerini ve bellek yeteneğini geliştirebilirsin."}
                            </p>

                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-3xl p-6 sm:p-8 mb-8 border-4 border-black shadow-[8px_8px_0_#000] rotate-1">
                                <div className="grid grid-cols-2 gap-6 relative">
                                    <div className="absolute inset-y-0 left-1/2 w-1 bg-black/10 dark:bg-white/10 -translate-x-1/2 rounded-full" />
                                    <div className="text-center">
                                        <p className="text-sm font-syne font-bold text-slate-500 uppercase tracking-widest mb-1">
                                            TOPLAM SKOR
                                        </p>
                                        <p className="text-4xl sm:text-5xl font-syne font-black text-cyber-green drop-shadow-sm">
                                            {score}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-syne font-bold text-slate-500 uppercase tracking-widest mb-1">
                                            SEVİYE
                                        </p>
                                        <p className="text-4xl sm:text-5xl font-syne font-black text-cyber-blue drop-shadow-sm">
                                            {level}/{maxLevel}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {!examMode && (
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -4 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleStart}
                                    className={`w-full px-10 py-5 ${getAccentBgClass()} text-black font-syne font-black text-2xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] rounded-2xl hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:translate-x-[2px] active:shadow-none transition-all flex items-center justify-center gap-3`}
                                >
                                    <RotateCcw size={28} className="stroke-[3]" />
                                    Tekrar Oyna
                                </motion.button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default BrainTrainerShell;
