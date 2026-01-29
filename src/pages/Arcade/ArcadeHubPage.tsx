import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gamepad2,
    ChevronLeft,
    Sparkles,
    Zap,
    Trophy
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ArcadeMachine } from '../../components/Arcade/ArcadeMachine';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import XPWarning from '../../components/XPWarning';
import { ARCADE_GAMES } from '../../data/bilsem-zeka/games';


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
        <div className="min-h-screen bg-[#020617] pt-24 pb-12 px-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
            </div>

            <div className="container mx-auto max-w-6xl relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-left"
                    >
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 font-bold uppercase text-xs tracking-[0.2em]"
                        >
                            <ChevronLeft size={16} /> Ana Sayfa
                        </Link>

                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-3">
                                <Gamepad2 size={40} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter">
                                    Zeka <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500">Arcade</span>
                                </h1>
                                <p className="text-slate-400 font-bold mt-2 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <Sparkles size={16} className="text-amber-400" /> Jetonunu At, Oyununu Seç!
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-6 shadow-2xl"
                    >
                        <div className="text-right">
                            <div className="text-slate-500 text-xs font-black uppercase tracking-widest">Mevcut Bakiyen</div>
                            <div className="text-3xl font-black text-white flex items-center justify-end gap-2">
                                {profile?.experience || 0}
                                <span className="text-amber-500 text-sm">XP</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                            <Trophy className="text-amber-500" size={24} />
                        </div>
                    </motion.div>
                </div>

                {/* Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-3xl p-8 mb-16 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={120} className="text-white" />
                    </div>

                    <div className="text-center md:text-left flex-1 relative z-10">
                        <h2 className="text-2xl font-black text-white mb-2">XP'lerini Jeton'a Dönüştür</h2>
                        <p className="text-indigo-200 text-sm max-w-xl font-medium">
                            Kazandığın tecrübe puanlarını (XP) burada eğlenceli zeka oyunları oynamak için kullanabilirsin.
                        </p>
                    </div>

                    <div className="flex gap-4 relative z-10">
                        <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 text-white font-bold text-sm">
                            🕹️ Profesyonel Seviye
                        </div>
                    </div>
                </motion.div>

                {/* Arcade Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {ARCADE_GAMES.map((game, index) => (
                        <motion.div
                            key={game.id}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <ArcadeMachine
                                gameId={game.id}
                                title={game.title}
                                description={game.description}
                                cost={getGameCost(game)}
                                color={game.color}
                                icon={game.icon}
                                onPlay={() => navigate(game.link, { state: { arcadeMode: true, autoStart: true } })}
                                onInsufficientXP={(required) => setWarningData({
                                    required,
                                    current: profile?.experience || 0,
                                    title: game.title
                                })}
                            />
                        </motion.div>
                    ))}

                    {/* Coming Soon machine */}
                    <div className="opacity-40 grayscale pointer-events-none">
                        <div className="relative rounded-3xl bg-slate-800 p-1 border border-slate-700 h-full">
                            <div className="bg-slate-900 rounded-[22px] p-6 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                                <Gamepad2 size={64} className="text-slate-700 mb-6" />
                                <h3 className="text-xl font-bold text-slate-500 mb-2">Çok Yakında</h3>
                                <p className="text-slate-600 text-sm">Yeni oyunlar yolda!</p>
                            </div>
                        </div>
                    </div>
                </div>
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

            {/* Floating particles or decor could be added here */}
        </div>
    );
};

export default ArcadeHubPage;
