import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';

const QuickAccessSection: React.FC = () => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
    >
        <Link
            to="/bilsem-zeka"
            className="group flex items-center gap-4 bg-gradient-to-br from-slate-800/90 to-slate-900/90 hover:from-slate-700/90 hover:to-slate-800/90 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all shadow-lg"
        >
            <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Gamepad2 className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-white text-lg">BİLSEM Zeka</h3>
                <p className="text-white/60 text-sm">Jeton at, oyununa başla!</p>
            </div>
            <ChevronRight className="w-6 h-6 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
        </Link>
    </motion.div>
);

export default QuickAccessSection;
