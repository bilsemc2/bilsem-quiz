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
    extraGameOverActions?: ReactNode;
    customWelcome?: ReactNode;
    /** Override the default back link (defaults to /atolyeler/bireysel-degerlendirme) */
    backLink?: string;
    /** Override the default back label (defaults to 'Geri Dön') */
    backLabel?: string;
    /** Override the default restart behavior (useful for games that need custom pre-game phases) */
    onRestart?: () => void;
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
        extraGameOverActions = null,
        customWelcome,
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
        : (config.backLink || "/atolyeler/bireysel-degerlendirme");
    const backLabel = examMode ? "Sınavı Bitir" : (config.backLabel || "Geri Dön");

    const getAccentBgClass = () => `bg-${accentColor}`;

    if (phase === "welcome") {
        if (customWelcome) {
            return <>{customWelcome}</>;
        }
        return (
            <div className="min-h-[100dvh] bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-hidden overflow-y-auto overscroll-none relative">
                <div className="relative z-10 w-full max-w-xl">
                    <div className="w-full flex items-center justify-start mb-6 -ml-2">
                        <Link
                            to={backLink}
                            className="flex items-center gap-2 text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-all bg-white dark:bg-slate-800 border-2 border-black/10 px-4 py-2 rounded-xl shadow-neo-xs hover:-translate-y-1 hover:shadow-neo-sm font-nunito font-bold"
                        >
                            <ChevronLeft size={20} className="stroke-[3]" />
                            <span>{backLabel}</span>
                        </Link>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center bg-white dark:bg-slate-800 p-8 rounded-[3rem] border-2 border-black/10 shadow-neo-lg"
                    >
                        <motion.div
                            className={`w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 ${getAccentBgClass()} border-2 border-black/10 shadow-neo-md rounded-[2.5rem] flex items-center justify-center`}
                            animate={{ y: [0, -8, 0], rotate: [-3, 2, -3] }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <Icon size={56} className="text-white" strokeWidth={2.5} />
                        </motion.div>

                        <h1 className="text-4xl sm:text-5xl font-nunito font-black mb-4 uppercase text-black dark:text-white tracking-tight drop-shadow-sm">
                            {title}
                        </h1>

                        <p className="text-slate-600 dark:text-slate-300 font-nunito font-medium mb-8 text-base sm:text-lg">
                            {description}
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-5 mb-8 border-2 border-black/10 shadow-neo-sm text-left">
                            <h3 className="text-xl font-nunito font-black text-cyber-blue mb-4 flex items-center gap-2 uppercase">
                                <Sparkles size={24} className="stroke-[3]" /> Nasıl Oynanır?
                            </h3>
                            <ul className="space-y-4 text-sm sm:text-base font-nunito font-bold text-slate-700 dark:text-slate-300">
                                {howToPlay.map((step, i) => {
                                    const colorClasses = ["bg-cyber-yellow", "bg-cyber-green", "bg-cyber-pink", "bg-cyber-blue", "bg-cyber-purple"];
                                    return (
                                        <li key={i} className="flex items-center gap-3">
                                            <span className={`flex-shrink-0 w-8 h-8 ${colorClasses[i % colorClasses.length]} text-white border-2 border-black/10 rounded-lg flex items-center justify-center font-nunito font-black text-sm shadow-neo-xs`}>
                                                {i + 1}
                                            </span>
                                            <span>{step}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {tuzoCode && (
                            <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-cyber-blue border-2 border-black/10 text-white rounded-xl shadow-neo-xs">
                                <span className="text-xs font-nunito font-black uppercase tracking-widest">
                                    {tuzoCode}
                                </span>
                            </div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStart}
                            className={`w-full sm:w-auto px-10 py-5 ${getAccentBgClass()} text-white font-nunito font-black text-xl uppercase tracking-widest border-2 border-black/10 shadow-neo-md rounded-2xl hover:-translate-y-1 hover:shadow-neo-lg transition-all flex items-center justify-center gap-3 mx-auto group`}
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
        <div className="h-[100dvh] bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col font-nunito tracking-tight relative overflow-hidden">
            <div className="relative z-10 p-4 pt-6 sm:pt-20">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Link
                        to={backLink}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl shadow-neo-xs hover:-translate-y-1 hover:shadow-neo-sm transition-all font-nunito font-bold text-black dark:text-white"
                    >
                        <ChevronLeft size={20} className="stroke-[3]" />
                        <span>{backLabel}</span>
                    </Link>

                    {phase !== "game_over" && phase !== "victory" && (
                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center sm:justify-end">
                            {extraHudItems}

                            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-yellow border-2 border-black/10 rounded-xl shadow-neo-xs">
                                <Star
                                    className="text-black fill-black drop-shadow-sm"
                                    size={18}
                                />
                                <span className="font-nunito font-black text-black">{score}</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-cyber-pink border-2 border-black/10 rounded-xl shadow-neo-xs">
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
                            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-blue border-2 border-black/10 rounded-xl shadow-neo-xs">
                                <TimerIcon
                                    className={
                                        timeLeft < 30 ? "text-white animate-pulse" : "text-white"
                                    }
                                    size={18}
                                />
                                <span
                                    className={`font-nunito font-black ${timeLeft < 30 ? "text-white drop-shadow-[0_0_8px_white]" : "text-white"}`}
                                >
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-green border-2 border-black/10 rounded-xl shadow-neo-xs">
                                <Zap className="text-black fill-black/50" size={18} />
                                <span className="font-nunito font-black text-black text-sm whitespace-nowrap">
                                    Seviye {level}/{maxLevel}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center p-4 pb-8 flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {(phase === "playing" || phase === "feedback") && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`flex flex-col items-center gap-12 w-full ${wideLayout ? "max-w-6xl" : "max-w-3xl"}`}
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
                        examMode ? (
                            <motion.div
                                key="exam-finished"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-3xl border-2 border-black/10 shadow-neo-lg max-w-sm w-full"
                            >
                                <div className="text-5xl mb-4">{phase === "victory" ? "🏆" : "✅"}</div>
                                <h2 className="text-2xl font-nunito font-black text-black dark:text-white mb-2 uppercase tracking-tight">
                                    {phase === "victory" ? "Mükemmel!" : "Modül Tamamlandı"}
                                </h2>
                                <p className="text-slate-500 font-nunito font-bold text-sm mb-6">
                                    Skor: {score} • Seviye: {level}/{maxLevel}
                                </p>
                                <div className="flex items-center justify-center gap-3 text-slate-400">
                                    <div className="w-5 h-5 border-3 border-cyber-emerald border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm font-nunito font-bold uppercase tracking-widest">Sıradaki modüle yönlendiriliyorsunuz...</span>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="finished"
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="text-center bg-white dark:bg-slate-800 p-8 sm:p-12 rounded-[3.5rem] border-2 border-black/10 shadow-neo-lg max-w-xl w-full relative"
                            >
                                <div className="absolute top-6 left-6 text-4xl transform -rotate-12">
                                    {phase === "victory" ? "🏆" : "🎮"}
                                </div>
                                <div className="absolute bottom-6 right-6 text-4xl transform rotate-12">
                                    {phase === "victory" ? "✨" : "💡"}
                                </div>

                                <motion.div
                                    className={`w-32 h-32 mx-auto mb-8 ${getAccentBgClass()} border-2 border-black/10 shadow-neo-md rounded-[2rem] flex items-center justify-center`}
                                    animate={{ y: [0, -10, 0], rotate: [3, -5, 3] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <Trophy size={64} className="text-white" strokeWidth={2.5} />
                                </motion.div>

                                <h2 className="text-4xl sm:text-5xl font-nunito font-black text-black dark:text-white mb-4 uppercase tracking-tight">
                                    {phase === "victory" ? "MÜKEMMEL!" : "OYUN BİTTİ!"}
                                </h2>
                                <p className="text-slate-600 dark:text-slate-300 font-nunito font-medium mb-8 text-lg">
                                    {phase === "victory"
                                        ? "Tüm seviyeleri başarıyla tamamladın! Harika bir performans gösterdin."
                                        : "Daha fazla pratik yaparak reflekslerini ve bellek yeteneğini geliştirebilirsin."}
                                </p>

                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-3xl p-6 sm:p-8 mb-8 border-2 border-black/10 shadow-neo-sm">
                                    <div className="grid grid-cols-2 gap-6 relative">
                                        <div className="absolute inset-y-0 left-1/2 w-1 bg-black/10 dark:bg-white/10 -translate-x-1/2 rounded-full" />
                                        <div className="text-center">
                                            <p className="text-sm font-nunito font-bold text-slate-500 uppercase tracking-widest mb-1">
                                                TOPLAM SKOR
                                            </p>
                                            <p className="text-4xl sm:text-5xl font-nunito font-black text-cyber-green drop-shadow-sm">
                                                {score}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-nunito font-bold text-slate-500 uppercase tracking-widest mb-1">
                                                SEVİYE
                                            </p>
                                            <p className="text-4xl sm:text-5xl font-nunito font-black text-cyber-blue drop-shadow-sm">
                                                {level}/{maxLevel}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {extraGameOverActions}

                                <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
                                    <motion.button
                                        whileHover={{ scale: 1.05, y: -4 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={config.onRestart || handleStart}
                                        className={`w-full px-10 py-5 ${getAccentBgClass()} text-white font-nunito font-black text-2xl uppercase tracking-widest border-2 border-black/10 shadow-neo-md rounded-2xl hover:-translate-y-1 hover:shadow-neo-lg transition-all flex items-center justify-center gap-3`}
                                    >
                                        <RotateCcw size={28} className="stroke-[3]" />
                                        Tekrar Oyna
                                    </motion.button>
                                </div>
                            </motion.div>
                        )
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default BrainTrainerShell;
