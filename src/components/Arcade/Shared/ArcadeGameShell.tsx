import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, Trophy, Target, Heart, Play, RefreshCw, ChevronRight } from 'lucide-react';

export interface ArcadeGameShellProps {
    gameState: {
        score: number;
        level: number;
        lives: number;
        status: 'START' | 'PLAYING' | 'GAME_OVER' | 'SUCCESS';
    };
    gameMetadata: {
        id: string;
        title: string;
        description: React.ReactNode;
        tuzoCode: string;
        icon: React.ReactNode;
        iconBgColor: string;
        containerBgColor?: string;
    };
    onStart: () => void;
    onRestart: () => void;
    onNextLevel?: () => void;
    /** Seviye badge'ı HUD'da gösterilsin mi? (varsayılan: true) */
    showLevel?: boolean;
    /** Can göstergesi HUD'da gösterilsin mi? (varsayılan: true) */
    showLives?: boolean;
    /** HUD'a oyuna özgü ekstra içerik (ör: süre sayacı) */
    hudExtras?: React.ReactNode;
    /** Mobilde sayfa kaydırmaya izin ver */
    allowMobileScroll?: boolean;
    children: React.ReactNode;
}

const ArcadeGameShell: React.FC<ArcadeGameShellProps> = ({
    gameState,
    gameMetadata,
    onStart,
    onRestart,
    onNextLevel,
    showLevel = true,
    showLives = true,
    hudExtras,
    allowMobileScroll = false,
    children
}) => {
    const mobileInteractionClasses = allowMobileScroll
        ? 'overflow-y-auto touch-auto'
        : 'overflow-hidden md:overflow-y-auto touch-none md:touch-auto';

    const heightClass = allowMobileScroll ? 'h-[100dvh]' : 'min-h-[100dvh]';
    const overscrollClass = allowMobileScroll ? '' : 'overscroll-none';

    return (
        <div className={`relative w-full font-nunito ${heightClass} ${mobileInteractionClasses} ${overscrollClass} select-none flex flex-col items-center pt-16 [-webkit-tap-highlight-color:transparent] transition-colors duration-300 ${gameMetadata.containerBgColor || 'bg-sky-200 dark:bg-slate-900'}`}>

            {/* Header / HUD Overlay (Visible only when playing) */}
            <AnimatePresence>
                {(gameState.status === 'PLAYING' || gameState.status === 'SUCCESS') && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute top-16 sm:top-20 left-2 right-2 sm:left-4 sm:right-4 z-40 flex flex-wrap gap-2 sm:gap-4 justify-between items-center pointer-events-none"
                    >
                        <div className="flex flex-wrap gap-2 sm:gap-4 pointer-events-auto">
                            <Link to="/bilsem-zeka" className="bg-white dark:bg-slate-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-neo-xs flex items-center gap-1.5 sm:gap-2 border-2 border-black/10 dark:border-slate-700 hover:-translate-y-1 hover:shadow-neo-sm transition-all">
                                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-white" strokeWidth={3} />
                                <span className="font-black text-black dark:text-white text-xs sm:text-sm uppercase tracking-widest transition-colors duration-300">BİLSEM</span>
                            </Link>
                            <div className="bg-yellow-300 px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl shadow-neo-xs flex items-center gap-1.5 sm:gap-2 border-2 border-black/10">
                                <Trophy className="text-black w-4 h-4 sm:w-6 sm:h-6" strokeWidth={3} />
                                <span className="text-base sm:text-lg font-black text-black dark:text-white leading-none bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border-2 border-black/10 dark:border-slate-700 transition-colors duration-300">{gameState.score}</span>
                            </div>
                            {showLevel && (
                                <div className="bg-emerald-300 px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl shadow-neo-xs flex items-center gap-1.5 sm:gap-2 border-2 border-black/10">
                                    <Target className="text-black w-4 h-4 sm:w-6 sm:h-6" strokeWidth={3} />
                                    <span className="text-base sm:text-lg font-black text-black dark:text-white leading-none bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border-2 border-black/10 dark:border-slate-700 transition-colors duration-300">Lv {gameState.level}</span>
                                </div>
                            )}
                            {hudExtras}
                        </div>
                        {showLives && (
                            <div className="bg-rose-200 px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl shadow-neo-xs flex items-center gap-1 sm:gap-2 border-2 border-black/10 pointer-events-auto">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Heart
                                        key={i}
                                        className={`w-4 h-4 sm:w-5 sm:h-5 stroke-[3px] stroke-black transition-all duration-300 ${i < gameState.lives ? 'fill-rose-500 line-scale-pulse-out' : 'fill-rose-200/50'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Game Content ( injected via children ) */}
            {children}

            {/* Start Overlay */}
            <AnimatePresence>
                {gameState.status === 'START' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
                    >
                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8 max-w-lg w-full text-center border-2 border-black/10 dark:border-slate-700 shadow-neo-lg transition-colors duration-300 max-h-[90dvh] overflow-y-auto">
                            <div className={`w-16 h-16 sm:w-20 sm:h-20 border-2 border-black/10 shadow-neo-sm rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 ${gameMetadata.iconBgColor}`}>
                                {gameMetadata.icon}
                            </div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl text-black dark:text-white mb-3 sm:mb-4 tracking-tighter font-black uppercase drop-shadow-[3px_3px_0_#fff] dark:drop-shadow-neo-sm transition-colors duration-300">
                                {gameMetadata.title}
                            </h1>
                            <div className="space-y-2 text-black dark:text-white mb-3 sm:mb-4 text-xs sm:text-sm font-black bg-rose-100 dark:bg-slate-700 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-black/10 dark:border-slate-800 shadow-neo-xs text-left transition-colors duration-300">
                                {gameMetadata.description}
                            </div>
                            <div className="bg-white dark:bg-slate-800 text-black dark:text-white text-[10px] sm:text-xs px-3 py-1.5 rounded-lg sm:rounded-xl mb-3 sm:mb-4 inline-block border-2 border-black/10 dark:border-slate-700 shadow-neo-xs font-black transition-colors duration-300">
                                TUZÖ {gameMetadata.tuzoCode}
                            </div>
                            <button
                                onClick={onStart}
                                className="w-full bg-yellow-400 border-2 border-black/10 shadow-neo-md text-black text-lg sm:text-2xl py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:-translate-y-1 hover:shadow-neo-lg transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest"
                            >
                                <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-black stroke-black stroke-[3px]" /> BAŞLA!
                            </button>
                            <Link
                                to="/bilsem-zeka"
                                className="block mt-3 sm:mt-4 inline-flex items-center justify-center gap-2 text-black dark:text-white hover:opacity-70 transition-colors font-black text-xs sm:text-sm uppercase"
                            >
                                <ChevronLeft size={14} strokeWidth={3} className="inline mr-1 -mt-0.5" />Arcade'e Dön
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game Over Overlay */}
            <AnimatePresence>
                {gameState.status === 'GAME_OVER' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
                    >
                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8 max-w-lg w-full text-center border-2 border-black/10 dark:border-slate-700 shadow-neo-lg transition-colors duration-300 max-h-[90dvh] overflow-y-auto">
                            <h2 className="text-3xl sm:text-5xl text-rose-500 mb-3 font-black tracking-tighter uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)]">OYUN BİTTİ</h2>

                            <div className="bg-sky-100 dark:bg-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-black/10 dark:border-slate-800 shadow-neo-sm transition-colors duration-300 mt-3">
                                <p className="text-black dark:text-white uppercase text-[10px] sm:text-xs font-black tracking-[0.2em] mb-1 transition-colors duration-300">TOPLAM PUANIN</p>
                                <p className="text-4xl sm:text-6xl font-black text-rose-500 tabular-nums tracking-tighter drop-shadow-neo-sm">{gameState.score}</p>
                                <div className="flex justify-center gap-3 mt-3">
                                    <div className="bg-white dark:bg-slate-600 px-4 py-1.5 rounded-lg sm:rounded-xl border-2 border-black/10 dark:border-slate-800 text-black dark:text-white font-black uppercase shadow-neo-xs flex items-center gap-2 text-sm transition-colors duration-300">
                                        <Target size={16} strokeWidth={3} /> Seviye {gameState.level}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Link to="/bilsem-zeka" className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border-2 border-black/10 dark:border-slate-800 text-black dark:text-white text-base sm:text-lg py-3 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-1.5 transition-all shadow-neo-xs uppercase tracking-wider hover:-translate-y-1 hover:shadow-neo-sm">
                                    <ChevronLeft strokeWidth={3} size={20} /> Arcade
                                </Link>
                                <button
                                    onClick={onRestart}
                                    className="bg-emerald-400 border-2 border-black/10 text-black text-base sm:text-lg py-3 rounded-xl sm:rounded-2xl hover:-translate-y-1 hover:shadow-neo-sm transition-all flex items-center justify-center gap-1.5 font-black uppercase tracking-wider shadow-neo-xs"
                                >
                                    <RefreshCw className="w-5 h-5 stroke-[3px]" /> Tekrar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success Overlay (Used in level-based games) */}
            <AnimatePresence>
                {gameState.status === 'SUCCESS' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm pointer-events-none"
                    >
                        <div className="pointer-events-auto bg-white dark:bg-slate-800 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border-2 border-black/10 dark:border-slate-700 shadow-neo-lg text-center space-y-4 sm:space-y-6 max-w-sm transition-colors duration-300 max-h-[90dvh] overflow-y-auto">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-400 text-black rounded-2xl sm:rounded-3xl mx-auto flex items-center justify-center border-2 border-black/10 shadow-neo-sm">
                                <Trophy size={48} strokeWidth={3} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl sm:text-4xl font-black text-black dark:text-white tracking-tighter uppercase drop-shadow-[2px_2px_0_#fff] dark:drop-shadow-neo-sm transition-colors duration-300">BAŞARILI!</h2>
                            </div>
                            {onNextLevel && (
                                <button
                                    onClick={onNextLevel}
                                    className="w-full py-3 sm:py-4 bg-sky-400 text-black font-black uppercase tracking-widest rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-neo-sm transition-all shadow-neo-xs border-2 border-black/10 text-lg sm:text-xl"
                                >
                                    SONRAKİ SEVİYE <ChevronRight size={20} strokeWidth={3} className="fill-black" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ArcadeGameShell;
