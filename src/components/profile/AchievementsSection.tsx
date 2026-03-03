import React from 'react';
import { motion } from 'framer-motion';
import { Star, Flame, Crown, Trophy, Lock } from 'lucide-react';

interface AchievementsSectionProps {
    currentLevel: number;
}

const BADGES = [
    { icon: Star, level: 1, name: 'İlk Adım' },
    { icon: Flame, level: 5, name: '5. Seviye' },
    { icon: Crown, level: 10, name: '10. Seviye' },
    { icon: Trophy, level: Infinity, name: 'Şampiyon' },
];

const AchievementsSection: React.FC<AchievementsSectionProps> = ({ currentLevel }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-md"
    >
        {/* Accent Strip */}
        <div className="h-2 bg-cyber-blue" />

        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyber-gold/10 border-2 border-cyber-gold/20 rounded-xl flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-cyber-gold" />
                    </div>
                    <div>
                        <h2 className="font-nunito text-xl font-extrabold text-black dark:text-white tracking-tight">Başarımlar</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-xs">XP kazan, rozet aç!</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-4">
                {BADGES.map((badge, idx) => {
                    const unlocked = currentLevel >= badge.level;
                    return (
                        <div
                            key={idx}
                            className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-transform hover:-translate-y-1 ${unlocked
                                ? 'bg-white dark:bg-slate-700 border-black/10 dark:border-white/10 shadow-neo-sm'
                                : 'bg-gray-100 dark:bg-slate-700/50 border-black/5 dark:border-white/5 opacity-50'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center ${unlocked
                                ? 'bg-cyber-pink/10 border-cyber-pink/20'
                                : 'bg-gray-200 dark:bg-slate-600 border-black/5 dark:border-white/5'
                                }`}>
                                {unlocked ? (
                                    <badge.icon className="w-6 h-6 text-cyber-pink" />
                                ) : (
                                    <Lock className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                            <span className={`text-[10px] uppercase tracking-wider font-nunito font-extrabold mt-2.5 text-center ${unlocked ? 'text-black dark:text-white' : 'text-slate-400'}`}>
                                {badge.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    </motion.div>
);

export default AchievementsSection;
