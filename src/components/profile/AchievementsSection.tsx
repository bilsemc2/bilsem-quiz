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
        className="mt-8 bg-slate-800/50 border border-white/10 rounded-2xl p-6"
    >
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">Başarımlar</h2>
                    <p className="text-amber-300/60 text-sm">XP kazan, rozet aç!</p>
                </div>
            </div>
        </div>

        <div className="flex flex-wrap gap-4">
            {BADGES.map((badge, idx) => {
                const unlocked = currentLevel >= badge.level;
                return (
                    <div
                        key={idx}
                        className={`relative flex flex-col items-center p-4 rounded-xl ${unlocked
                            ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30'
                            : 'bg-slate-700/30 border border-white/5'
                            }`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${unlocked
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                            : 'bg-slate-600'
                            }`}>
                            {unlocked ? (
                                <badge.icon className="w-6 h-6 text-white" />
                            ) : (
                                <Lock className="w-5 h-5 text-white/30" />
                            )}
                        </div>
                        <span className={`text-xs mt-2 ${unlocked ? 'text-yellow-400' : 'text-white/30'}`}>
                            {badge.name}
                        </span>
                    </div>
                );
            })}
        </div>
    </motion.div>
);

export default AchievementsSection;
