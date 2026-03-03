import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gamepad2,
    ChevronLeft,
    Sparkles,
    Trophy
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ArcadeMachine } from '../../components/Arcade/ArcadeMachine';
import { useAuth } from '../../contexts/AuthContext';
import XPWarning from '../../components/XPWarning';
import { ARCADE_GAMES, CATEGORY_INFO, GameCategory, getGamesByCategory } from '../../data/arcade/games';
import { loadXPRequirementsMap } from '@/features/xp/model/xpUseCases';

// ═══════════════════════════════════════════════
// 🎮 ArcadeHubPage — Kid-UI Çocuk Dostu Tasarım
// ═══════════════════════════════════════════════

const CATEGORIES: GameCategory[] = ['memory', 'spatial', 'flexibility'];

const ArcadeHubPage: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [gameCosts, setGameCosts] = React.useState<Record<string, number>>({});
    const [warningData, setWarningData] = React.useState<{ required: number; current: number; title: string } | null>(null);

    React.useEffect(() => {
        let isActive = true;

        const fetchCosts = async () => {
            const paths = ARCADE_GAMES.map((game) => game.link);
            const costsMap = await loadXPRequirementsMap(paths);
            if (isActive) {
                setGameCosts(costsMap);
            }
        };

        fetchCosts();

        return () => {
            isActive = false;
        };
    }, []);

    const getGameCost = (game: typeof ARCADE_GAMES[0]) => {
        return gameCosts[game.link] ?? game.cost;
    };

    return (
        <div className="min-h-screen overflow-hidden transition-colors duration-300">
            {/* Background pattern — dots */}
            <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="container mx-auto max-w-6xl relative z-10 pt-24 pb-12 px-4 md:px-6">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row items-center justify-between gap-6 mb-14"
                >
                    <div className="text-center md:text-left">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-black dark:text-white font-nunito font-extrabold uppercase text-xs tracking-widest bg-white dark:bg-slate-800 border-3 border-black/10 rounded-xl px-4 py-2 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all mb-6"
                        >
                            <ChevronLeft size={14} strokeWidth={3} /> Ana Sayfa
                        </Link>

                        <div className="flex flex-col md:flex-row items-center gap-5">
                            {/* Icon Container */}
                            <motion.div
                                className="w-16 h-16 md:w-20 md:h-20 bg-cyber-pink/10 border-3 border-cyber-pink/30 rounded-2xl flex items-center justify-center"
                                animate={{ rotate: [-3, 3, -3] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Gamepad2 size={36} className="text-cyber-pink" strokeWidth={2} />
                            </motion.div>
                            <div>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-nunito font-black text-black dark:text-white uppercase tracking-tight leading-none mb-2">
                                    BİLSEM Zeka
                                </h1>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyber-gold/10 border-2 border-cyber-gold/30 rounded-lg font-nunito font-extrabold text-cyber-gold text-xs uppercase tracking-widest">
                                    <Sparkles size={12} /> Arcade Oyun Salonu
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-5 shadow-neo-md flex items-center gap-4"
                    >
                        <div className="text-right">
                            <div className="text-slate-400 font-nunito font-extrabold text-xs uppercase tracking-widest mb-1">Bakiye</div>
                            <div className="text-3xl font-nunito font-black text-black dark:text-white flex items-baseline justify-end gap-1">
                                {profile?.experience || 0}
                                <span className="text-cyber-pink text-lg ml-1">XP</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-cyber-gold/10 border-2 border-cyber-gold/30 rounded-xl flex items-center justify-center">
                            <Trophy className="text-cyber-gold" size={24} strokeWidth={2} />
                        </div>
                    </motion.div>
                </motion.div>

                {/* Category Sections */}
                {CATEGORIES.map((category, catIndex) => {
                    const categoryInfo = CATEGORY_INFO[category];
                    const games = getGamesByCategory(category);

                    return (
                        <motion.section
                            key={category}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: catIndex * 0.15 }}
                            className="mb-14"
                        >
                            {/* Category Header */}
                            <div className="flex items-center gap-3 mb-6 overflow-hidden">
                                <div
                                    className={`shrink-0 w-10 h-10 border-2 border-black/10 ${categoryInfo.color} rounded-xl flex items-center justify-center text-lg`}
                                >
                                    <span className="text-black dark:text-white font-black mix-blend-plus-darker">
                                        {categoryInfo.icon}
                                    </span>
                                </div>
                                <h2 className="shrink-0 text-xl md:text-2xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight">{categoryInfo.title}</h2>
                                <div className="flex-1 h-px bg-black/5 dark:bg-white/5 hidden sm:block" />
                                <span className="shrink-0 bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-nunito font-extrabold px-3 py-1 text-xs tracking-wider rounded-lg uppercase">{games.length} Oyun</span>
                            </div>

                            {/* Games Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {games.map((game, index) => (
                                    <motion.div
                                        key={game.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: catIndex * 0.15 + index * 0.05 }}
                                    >
                                        <ArcadeMachine
                                            gameId={game.id}
                                            title={game.title}
                                            description={game.description}
                                            cost={getGameCost(game)}
                                            color={game.color}
                                            icon={game.icon}
                                            tuzo={game.tuzo}
                                            onPlay={() => navigate(game.link, { state: { arcadeMode: true, autoStart: true } })}
                                            onInsufficientXP={(required) => setWarningData({
                                                required,
                                                current: profile?.experience || 0,
                                                title: game.title
                                            })}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.section>
                    );
                })}

                {/* Coming Soon Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8"
                >
                    <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-lg">
                        <div className="h-2.5 bg-cyber-gold" />
                        <div className="p-8 text-center">
                            <div className="w-14 h-14 bg-cyber-gold/10 border-2 border-cyber-gold/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Gamepad2 size={28} className="text-cyber-gold" strokeWidth={2} />
                            </div>
                            <h3 className="text-2xl font-nunito font-extrabold text-black dark:text-white mb-2 uppercase tracking-tight">Daha Fazla Oyun Geliyor!</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm">Yeni zeka oyunları çok yakında...</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* XP Warning Overlay */}
            <AnimatePresence>
                {warningData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md"
                    >
                        <XPWarning
                            requiredXP={warningData.required}
                            currentXP={warningData.current}
                            title={warningData.title}
                            onBack={() => setWarningData(null)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ArcadeHubPage;
