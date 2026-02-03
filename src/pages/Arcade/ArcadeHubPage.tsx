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
import { supabase } from '../../lib/supabase';
import XPWarning from '../../components/XPWarning';
import { ARCADE_GAMES, CATEGORY_INFO, GameCategory, getGamesByCategory } from '../../data/arcade/games';

const CATEGORIES: GameCategory[] = ['memory', 'spatial', 'flexibility'];

const ArcadeHubPage: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [gameCosts, setGameCosts] = React.useState<Record<string, number>>({});
    const [warningData, setWarningData] = React.useState<{ required: number; current: number; title: string } | null>(null);

    React.useEffect(() => {
        const fetchCosts = async () => {
            const paths = ARCADE_GAMES.map(g => g.link);
            const { data, error } = await supabase
                .from('xp_requirements')
                .select('page_path, required_xp')
                .in('page_path', paths);

            if (!error && data) {
                const costsMap = data.reduce((acc, curr) => {
                    acc[curr.page_path] = curr.required_xp;
                    return acc;
                }, {} as Record<string, number>);
                setGameCosts(costsMap);
            }
        };

        fetchCosts();
    }, []);

    const getGameCost = (game: typeof ARCADE_GAMES[0]) => {
        return gameCosts[game.link] ?? game.cost;
    };

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 md:px-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/3 w-[30%] h-[30%] bg-cyan-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="container mx-auto max-w-6xl relative z-10">
                {/* Header Section - 3D Gummy Style */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10"
                >
                    <div className="text-center md:text-left">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-4 font-bold uppercase text-xs tracking-[0.15em]"
                        >
                            <ChevronLeft size={16} /> Ana Sayfa
                        </Link>

                        <div className="flex flex-col md:flex-row items-center gap-5">
                            {/* 3D Gummy Icon */}
                            <motion.div
                                className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Gamepad2 size={40} className="text-white" />
                            </motion.div>
                            <div>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                                    BİLSEM Zeka
                                </h1>
                                <p className="text-slate-400 font-bold mt-1 uppercase tracking-[0.2em] flex items-center gap-2 justify-center md:justify-start text-sm">
                                    <Sparkles size={14} className="text-amber-400" /> Arcade Oyun Salonu
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Card - Glassmorphism */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-3xl flex items-center gap-5"
                        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                    >
                        <div className="text-right">
                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Bakiye</div>
                            <div className="text-3xl font-black text-white flex items-center justify-end gap-1">
                                {profile?.experience || 0}
                                <span className="text-amber-500 text-sm">XP</span>
                            </div>
                        </div>
                        <div
                            className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[40%] flex items-center justify-center"
                            style={{ boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.3)' }}
                        >
                            <Trophy className="text-white" size={22} />
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
                            className="mb-12"
                        >
                            {/* Category Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div
                                    className={`w-10 h-10 bg-gradient-to-br ${categoryInfo.color} rounded-[40%] flex items-center justify-center text-xl`}
                                    style={{ boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.3)' }}
                                >
                                    {categoryInfo.icon}
                                </div>
                                <h2 className="text-2xl font-black text-white">{categoryInfo.title}</h2>
                                <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
                                <span className="text-slate-500 text-sm font-bold">{games.length} oyun</span>
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
                    className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center"
                >
                    <Gamepad2 size={48} className="text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-500 mb-2">Daha Fazla Oyun Geliyor!</h3>
                    <p className="text-slate-600 text-sm">Yeni zeka oyunları çok yakında...</p>
                </motion.div>
            </div>

            {/* XP Warning Overlay */}
            <AnimatePresence>
                {warningData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm"
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
