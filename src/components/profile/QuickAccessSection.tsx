import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Tablet, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';

const QUICK_ACCESS_BUTTONS = [
    {
        id: 'tablet',
        title: 'Tablet Değerlendirme',
        description: 'Hazırlık oyunları',
        icon: Tablet,
        color: 'from-blue-500 to-cyan-500',
        link: '/atolyeler/tablet-degerlendirme'
    },
    {
        id: 'arcade',
        title: 'BİLSEM Zeka',
        description: 'Jeton at, oyununa başla!',
        icon: Gamepad2,
        color: 'from-purple-500 to-indigo-500',
        link: '/bilsem-zeka'
    },
];

const QuickAccessSection: React.FC = () => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
    >
        {QUICK_ACCESS_BUTTONS.map((btn) => (
            <Link
                key={btn.id}
                to={btn.link}
                className="group flex items-center gap-4 bg-gradient-to-br from-slate-800/90 to-slate-900/90 hover:from-slate-700/90 hover:to-slate-800/90 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all shadow-lg"
            >
                <div className={`w-14 h-14 bg-gradient-to-r ${btn.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                    <btn.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-white text-lg">{btn.title}</h3>
                    <p className="text-white/60 text-sm">{btn.description}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
            </Link>
        ))}
    </motion.div>
);

export default QuickAccessSection;
